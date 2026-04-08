const { Server } = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: '*'
      }
    });

    // 🔑 Socket authentication (optional now)
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));
      next();
    });

    io.on('connection', (socket) => {
      console.log('🔌 User connected:', socket.id);

      socket.on('join-room', (roomId) => {
        socket.join(`room_${roomId}`);
      });

      // WebRTC signaling
      socket.on('webrtc-offer', (data) => {
        socket.to(`room_${data.roomId}`).emit('webrtc-offer', data.offer);
      });

      socket.on('webrtc-answer', (data) => {
        socket.to(`room_${data.roomId}`).emit('webrtc-answer', data.answer);
      });

      socket.on('webrtc-ice-candidate', (data) => {
        socket.to(`room_${data.roomId}`).emit(
          'webrtc-ice-candidate',
          data.candidate
        );
      });

      socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
  }
};
