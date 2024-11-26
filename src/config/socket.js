const socketIo = require('socket.io');

const configureSocket = (server) => {
  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Additional socket event handlers can be added here
  });

  return io;
};

module.exports = configureSocket;
