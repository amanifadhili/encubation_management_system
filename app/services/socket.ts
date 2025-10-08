/**
 * Socket.io client service for real-time communication
 */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.attemptReconnect();
    });

    // Message events
    this.socket.on('message_received', (data) => {
      console.log('Message received:', data);
      // Emit custom event for components to listen
      window.dispatchEvent(new CustomEvent('socket:message_received', { detail: data }));
    });

    // Notification events
    this.socket.on('notification_received', (data) => {
      console.log('Notification received:', data);
      window.dispatchEvent(new CustomEvent('socket:notification_received', { detail: data }));
    });

    // Announcement events
    this.socket.on('announcement_created', (data) => {
      console.log('Announcement created:', data);
      window.dispatchEvent(new CustomEvent('socket:announcement_created', { detail: data }));
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      window.dispatchEvent(new CustomEvent('socket:user_typing', { detail: data }));
    });

    this.socket.on('user_stopped_typing', (data) => {
      window.dispatchEvent(new CustomEvent('socket:user_stopped_typing', { detail: data }));
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Message methods
  sendMessage(conversationId: string, content: string, recipientId?: number): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        recipientId,
      });
    }
  }

  sendFileMessage(conversationId: string, file: FormData): void {
    if (this.socket) {
      this.socket.emit('send_file_message', {
        conversationId,
        file,
      });
    }
  }

  joinConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('start_typing', { conversationId });
    }
  }

  stopTyping(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('stop_typing', { conversationId });
    }
  }

  // Notification methods
  sendNotification(recipientId: number, title: string, message: string, type: string = 'info'): void {
    if (this.socket) {
      this.socket.emit('send_notification', {
        recipientId,
        title,
        message,
        type,
      });
    }
  }

  // Announcement methods
  createAnnouncement(title: string, content: string): void {
    if (this.socket) {
      this.socket.emit('create_announcement', {
        title,
        content,
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;