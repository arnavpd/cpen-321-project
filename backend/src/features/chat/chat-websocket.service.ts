import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../../utils/logger.util';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  projectId?: string;
}

interface TokenPayload {
  id: string;
}

// Helper function to verify JWT token
function verifySocketToken(token: string): TokenPayload {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || typeof jwtSecret !== 'string') {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export class ChatWebSocketService {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Allow all origins
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const authToken = socket.handshake.auth.token;
        const headerAuth = socket.handshake.headers.authorization;
        const rawToken = authToken || (typeof headerAuth === 'string' ? headerAuth.replace('Bearer ', '') : undefined);
        
        if (!rawToken || typeof rawToken !== 'string') {
          logger.warn('Socket connection attempted without token');
          next(new Error('Authentication error'));
          return;
        }

        const token: string = rawToken;
        const decoded = verifySocketToken(token);
        socket.userId = decoded.id;
        logger.info(`Socket authenticated for user: ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected to chat WebSocket`);

      // Join a project room
      socket.on('join_project', (projectId: string) => {
        try {
          logger.info(`User ${socket.userId} attempting to join project ${projectId}`);
          
          // Store the projectId on the socket
          socket.projectId = projectId;
          
          // Join the room
          socket.join(`project_${projectId}`);
          
          logger.info(`User ${socket.userId} joined project room: project_${projectId}`);
          
          // Notify the client
          socket.emit('joined_project', { projectId });
        } catch (error) {
          logger.error('Error joining project:', error);
          socket.emit('error', { message: 'Failed to join project' });
        }
      });

      // Leave a project room
      socket.on('leave_project', (projectId: string) => {
        try {
          logger.info(`User ${socket.userId} leaving project ${projectId}`);
          socket.leave(`project_${projectId}`);
          socket.projectId = undefined;
          socket.emit('left_project', { projectId });
        } catch (error) {
          logger.error('Error leaving project:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from chat WebSocket`);
      });
    });
  }

  // Broadcast a new message to all users in the project
  public broadcastNewMessage(projectId: string, message: unknown): void {
    try {
      logger.info(`Broadcasting new message to project: ${projectId}`);
      this.io.to(`project_${projectId}`).emit('new_message', message);
      logger.info(`Message broadcasted to project: ${projectId}`);
    } catch (error) {
      logger.error('Error broadcasting message:', error);
    }
  }

  // Broadcast message deletion
  public broadcastMessageDeleted(projectId: string, messageId: string): void {
    try {
      logger.info(`Broadcasting message deletion: ${messageId} to project: ${projectId}`);
      this.io.to(`project_${projectId}`).emit('message_deleted', { messageId });
      logger.info(`Message deletion broadcasted to project: ${projectId}`);
    } catch (error) {
      logger.error('Error broadcasting message deletion:', error);
    }
  }

  // Get the io instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

