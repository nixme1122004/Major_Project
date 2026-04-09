const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: '*'
      }
    });

    // 🔑 Socket authentication & Identity mapping
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.student_id;
        socket.userEmail = decoded.email;
        next();
      } catch (err) {
        return next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userId} (Socket: ${socket.id})`);

      // Automatically join personal room for notifications/calls
      socket.join(`user_${socket.userId}`);

      socket.on('join-room', (roomId) => {
        socket.join(`room_${roomId}`);
        console.log(`📡 User ${socket.userId} joined room: room_${roomId}`);
      });

      socket.on('leave-room', (roomId) => {
        socket.leave(`room_${roomId}`);
        console.log(`📡 User ${socket.userId} left room: room_${roomId}`);
      });

      // --- WebRTC Multi-Step Signaling ---

      // 1. Caller initiates a call
      socket.on('call-user', (data) => {
        console.log(`📞 Call from ${socket.userId} to ${data.to} (Mode: ${data.mode})`);
        socket.to(`user_${data.to}`).emit('incoming-call', {
          from: socket.userId,
          name: data.callerName,
          avatar: data.callerAvatar,
          offer: data.offer,
          mode: data.mode
        });
      });

      // 2. Receiver answers a call
      socket.on('answer-call', (data) => {
        console.log(`✅ Call answered by ${socket.userId} for ${data.to} (Socket: ${socket.id})`);
        
        // Notify the caller
        socket.to(`user_${data.to}`).emit('call-answered', {
          from: socket.userId,
          answer: data.answer
        });

        // 🛡️ Multi-tab sync: Tell other sockets of THIS user to stop ringing
        socket.to(`user_${socket.userId}`).emit('stop-ringing', {
          reason: 'answered_elsewhere'
        });
      });

      // 3. ICE Candidate exchange
      socket.on('ice-candidate', (data) => {
        socket.to(`user_${data.to}`).emit('ice-candidate', {
          from: socket.userId,
          candidate: data.candidate
        });
      });

      // 4. End call / Hangup
      socket.on('hangup', (data) => {
        console.log(`📵 Hangup from ${socket.userId} (Socket: ${socket.id}) to ${data.to}`);
        socket.to(`user_${data.to}`).emit('call-ended', {
          from: socket.userId
        });
      });

      // Legacy support for basic room-based signaling (if needed)
      socket.on('webrtc-offer', (data) => {
        socket.to(`room_${data.roomId}`).emit('webrtc-offer', data.offer);
      });
      socket.on('webrtc-answer', (data) => {
        socket.to(`room_${data.roomId}`).emit('webrtc-answer', data.answer);
      });
      socket.on('webrtc-ice-candidate', (data) => {
        socket.to(`room_${data.roomId}`).emit('webrtc-ice-candidate', data.candidate);
      });

      socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.userId);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
  }
};

