import { Server as SocketIOServer } from 'socket.io';
import { authenticateSocket, AuthenticatedSocket } from './socketAuth';

let io: SocketIOServer;
const userSockets = new Map<string, string>(); // Map of userId to socketId

export const initializeSocket = (server: any) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    // Add connection limits to prevent spam
    maxHttpBufferSize: 1e6, // 1 MB
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Check if user already has an active connection
    const existingSocketId = userSockets.get(socket.userId!);
    if (existingSocketId && io.sockets.sockets.has(existingSocketId)) {
      console.log(`User ${socket.userId} already connected, disconnecting duplicate connection`);
      socket.disconnect(true);
      return;
    }

    // Store this socket as the active connection for this user
    userSockets.set(socket.userId!, socket.id);

    // Join appropriate rooms based on user role and branch
    if (socket.branchId) {
      socket.join(`branch:${socket.branchId}`);
      console.log(`User ${socket.userId} joined branch room: branch:${socket.branchId}`);
    }

    socket.join(`user:${socket.userId}`);
    console.log(`User ${socket.userId} joined personal room: user:${socket.userId}`);

    if (socket.userRole === 'ADMIN') {
      socket.join('admin');
      console.log(`Admin user ${socket.userId} joined admin room`);
    }

    // Handle basic events here for now
    socket.on('join-room', (roomName: string) => {
      socket.join(roomName);
      console.log(`User ${socket.userId} joined room: ${roomName}`);
    });

    socket.on('leave-room', (roomName: string) => {
      socket.leave(roomName);
      console.log(`User ${socket.userId} left room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      // Remove this user's socket from tracking
      if (userSockets.get(socket.userId!) === socket.id) {
        userSockets.delete(socket.userId!);
      }
    });
  });

  console.log('Socket.IO server initialized');
  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Utility functions for broadcasting events
export const broadcastToBranch = (branchId: string, event: string, data: any) => {
  if (io) {
    io.to(`branch:${branchId}`).emit(event, data);
  }
};

export const broadcastToAdmin = (event: string, data: any) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

export const broadcastToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};