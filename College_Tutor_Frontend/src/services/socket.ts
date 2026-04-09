import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(BACKEND_URL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('🔌 Persistent socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Persistent socket disconnected');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
