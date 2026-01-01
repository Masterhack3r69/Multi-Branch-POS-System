import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

// JWT payload type for type-safe token verification
interface JwtPayload {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  branchId?: string | null;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  branchId?: string;
}

export const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    socket.userId = decoded.id; // JWT payload uses 'id', not 'userId'
    socket.userRole = decoded.role;
    socket.branchId = decoded.branchId ?? undefined;

    console.log(`Socket authenticated: User ${socket.userId}, Role: ${socket.userRole}, Branch: ${socket.branchId}`);
    
    next();
  } catch (error) {
    console.error('Socket authentication failed:', error);
    next(new Error('Invalid authentication token'));
  }
};