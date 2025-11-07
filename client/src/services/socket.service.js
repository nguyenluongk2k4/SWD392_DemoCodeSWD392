import { io } from 'socket.io-client';
import API_CONFIG from '../config/api.config';

class SocketService {
  constructor() {
    this.socket = null;
  }

  getSocket() {
    if (!this.socket) {
      this.socket = io(API_CONFIG.BASE_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnectionAttempts: 5,
      });
    }
    return this.socket;
  }

  on(event, handler) {
    this.getSocket().on(event, handler);
  }

  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
