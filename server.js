const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const errorMiddleware = require('./src/middleware/error');
const authMiddleware = require('./src/middleware/auth');
const User = require('./src/models/User');
const Room = require('./src/models/Room');
const Message = require('./src/models/Message'); // Assuming Message model is defined in this file

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Make io accessible to our routes
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static Files
app.use(express.static('src/public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling
app.use(errorMiddleware);

// Socket.io middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new Error('User not found'));
        }
        
        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);

    // Join user's rooms
    socket.on('joinRoom', async (roomId) => {
        try {
            socket.join(roomId);
            
            // Add isOnline flag to user
            const user = { ...socket.user, isOnline: true };
            
            // Notify others in the room
            socket.to(roomId).emit('userJoined', user);
            
            // Get all users in the room with online status
            const room = await Room.findById(roomId).populate('users', 'username');
            const onlineUsers = room.users.map(u => ({
                ...u.toObject(),
                isOnline: true // We'll assume all users are online for now
            }));
            
            // Send the updated user list to all clients in the room
            io.to(roomId).emit('updateUsers', onlineUsers);
        } catch (error) {
            console.error('Error joining room:', error);
        }
    });

    // Leave room
    socket.on('leaveRoom', async (roomId) => {
        try {
            socket.leave(roomId);
            socket.to(roomId).emit('userLeft', socket.user._id);
            
            // Get remaining users and update their status
            const room = await Room.findById(roomId).populate('users', 'username');
            const remainingUsers = room.users.map(u => ({
                ...u.toObject(),
                isOnline: true // We'll assume remaining users are online
            }));
            
            // Send the updated user list to all clients in the room
            io.to(roomId).emit('updateUsers', remainingUsers);
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    });

    // Typing indicator
    socket.on('typing', (roomId) => {
        socket.to(roomId).emit('userTyping', {
            user: socket.user.username
        });
    });

    socket.on('stopTyping', (roomId) => {
        socket.to(roomId).emit('userStoppedTyping', {
            user: socket.user.username
        });
    });

    // Handle messages
    socket.on('sendMessage', async ({ roomId, content }) => {
        try {
            const message = new Message({
                content,
                room: roomId,
                sender: socket.user._id
            });
            await message.save();

            // Broadcast the message to everyone else in the room
            socket.to(roomId).emit('message', {
                _id: message._id,
                content: message.content,
                username: socket.user.username,
                timestamp: message.createdAt,
                isCurrentUser: false
            });

            // Send back to sender with isCurrentUser flag
            socket.emit('message', {
                _id: message._id,
                content: message.content,
                username: socket.user.username,
                timestamp: message.createdAt,
                isCurrentUser: true
            });
        } catch (error) {
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.username);
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Environment Variables
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
