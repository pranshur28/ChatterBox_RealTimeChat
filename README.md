# ChatterBox - Real-Time Chat Application

ChatterBox is a modern, real-time chat application built with React, Node.js, and Socket.IO. It features a sleek user interface, secure authentication, and real-time messaging capabilities.

![ChatterBox Logo](client/src/assets/logo.png)

## 🌟 Features

- **User Authentication**
  - Secure login and registration
  - JWT-based authentication
  - Password reset functionality
  - Input validation and error handling

- **Real-Time Chat**
  - Instant message delivery
  - Room-based chat system
  - User online/offline status
  - Message timestamps
  - User avatars
  - Room member list

- **Modern UI/UX**
  - Responsive design
  - Material-UI components
  - Gradient color scheme
  - Clean and intuitive interface
  - Mobile-friendly layout

- **Security**
  - Password hashing
  - Token-based authentication
  - Protected routes
  - Input sanitization

## 🛠️ Tech Stack

- **Frontend**
  - React
  - Material-UI
  - Socket.IO Client
  - Axios
  - React Router

- **Backend**
  - Node.js
  - Express.js
  - MongoDB
  - Socket.IO
  - JWT
  - Bcrypt

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/pranshur28/ChatterBox_RealTimeChat.git
   cd ChatterBox_RealTimeChat
   ```

2. Install backend dependencies
   ```bash
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd client
   npm install
   ```

4. Create a .env file in the root directory with the following variables:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/chatapp
   PORT=3001
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   CLIENT_URL=http://localhost:3000
   ```

### Running the Application

1. Start the backend server
   ```bash
   # From the root directory
   npm start
   ```

2. Start the frontend development server
   ```bash
   # From the client directory
   cd client
   npm start
   ```

3. Access the application at `http://localhost:3000`

## 📱 Usage

1. **Register/Login**
   - Create a new account or login with existing credentials
   - Passwords must be at least 8 characters with numbers and special characters

2. **Chat Rooms**
   - Create new chat rooms
   - Join existing rooms
   - View active members in each room

3. **Messaging**
   - Send real-time messages
   - See message timestamps
   - View user avatars
   - Check member online status

## 🔒 Security Features

- Password hashing using bcrypt
- JWT for secure authentication
- Protected API endpoints
- Input validation and sanitization
- Secure session management

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Modern gradient color scheme
- Intuitive navigation
- Real-time status updates
- Clean message layout
- User-friendly forms

## 🙏 Acknowledgments

- Material-UI for the beautiful components
- Socket.IO for real-time capabilities
- MongoDB for reliable data storage
- The open-source community for inspiration and support


