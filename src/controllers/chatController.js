const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

// Room Controllers
const createRoom = async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;
        const owner = req.user._id;

        const room = new Room({
            name,
            description,
            isPrivate,
            owner,
            members: [owner]
        });

        await room.save();
        res.status(201).json({ message: 'Room created successfully', room });
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
};

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            $or: [
                { isPrivate: false },
                { members: req.user._id }
            ]
        }).populate('owner', 'username');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.isPrivate && !room.members.includes(userId)) {
            return res.status(403).json({ message: 'Cannot join private room' });
        }

        if (!room.members.includes(userId)) {
            room.members.push(userId);
            await room.save();
        }

        res.json({ message: 'Joined room successfully', room });
    } catch (error) {
        res.status(500).json({ message: 'Error joining room', error: error.message });
    }
};

const leaveRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Remove user from room members
        room.members = room.members.filter(memberId => !memberId.equals(userId));
        await room.save();

        // Emit user left event
        req.app.get('io').to(roomId).emit('userLeft', {
            userId: userId,
            username: req.user.username
        });

        res.json({ message: 'Successfully left the room' });
    } catch (error) {
        res.status(500).json({ message: 'Error leaving room', error: error.message });
    }
};

// Message Controllers
const sendMessage = async (req, res) => {
    try {
        const { content, roomId } = req.body;
        const sender = req.user._id;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.isPrivate && !room.members.includes(sender)) {
            return res.status(403).json({ message: 'Not authorized to send messages in this room' });
        }

        const message = new Message({
            content,
            sender,
            room: roomId
        });

        await message.save();

        // Populate sender information before sending response
        await message.populate('sender', 'username');

        // Emit the message through Socket.IO
        req.app.get('io').to(roomId).emit('newMessage', message);

        res.status(201).json({ message: 'Message sent successfully', data: message });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50, before } = req.query;

        const query = { room: roomId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('sender', 'username')
            .exec();

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

module.exports = {
    createRoom,
    getRooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    getMessages
};
