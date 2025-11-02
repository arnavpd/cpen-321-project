/**
 * Chat WebSocket Service - Mocked Tests
 * Tests with mocking - testing WebSocket service functionality with mocked dependencies
 */

import { Server as HTTPServer } from 'http';
import { ChatWebSocketService } from '../../src/features/chat/chat-websocket.service';
import jwt from 'jsonwebtoken';

// Mock socket.io
jest.mock('socket.io', () => {
  const mockSocket = {
    userId: undefined,
    projectId: undefined,
    handshake: {
      auth: { token: 'valid_token' },
      headers: {}
    },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
  };

  const mockIO = {
    use: jest.fn(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  };

  return {
    Server: jest.fn().mockImplementation(() => mockIO)
  };
});

// Mock JWT
jest.mock('jsonwebtoken');

// Mock logger
jest.mock('../../src/utils/logger.util', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Mocked: Chat WebSocket Service', () => {
  let mockHttpServer: HTTPServer;
  let chatWebSocketService: ChatWebSocketService;
  let mockSocket: any;
  let mockIO: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockHttpServer = {} as HTTPServer;
    
    // Get the mocked socket.io Server constructor
    const { Server } = require('socket.io');
    mockIO = new Server();
    
    // Create mock socket
    mockSocket = {
      userId: 'test_user_id',
      projectId: undefined,
      handshake: {
        auth: { token: 'valid_token' },
        headers: {}
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn()
    };

    chatWebSocketService = new ChatWebSocketService(mockHttpServer);
  });

  test('should initialize WebSocket service with proper configuration', () => {
    const { Server } = require('socket.io');
    
    expect(Server).toHaveBeenCalledWith(mockHttpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    expect(mockIO.use).toHaveBeenCalled();
    expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  test('should authenticate socket with valid token', async () => {
    const mockDecoded = { id: 'test_user_123' };
    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    const middlewareCall = mockIO.use.mock.calls[0][0];
    const nextSpy = jest.fn();

    await middlewareCall(mockSocket, nextSpy);

    expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
    expect(mockSocket.userId).toBe('test_user_123');
    expect(nextSpy).toHaveBeenCalledWith();
  });

  test('should reject socket connection with invalid token', async () => {
    // Reset the socket userId for this test
    mockSocket.userId = undefined;
    
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const middlewareCall = mockIO.use.mock.calls[0][0];
    const nextSpy = jest.fn();

    await middlewareCall(mockSocket, nextSpy);

    expect(nextSpy).toHaveBeenCalledWith(new Error('Authentication error'));
    expect(mockSocket.userId).toBeUndefined();
  });

  test('should broadcast new message to project room', async () => {
    const mockMessage = {
      _id: 'msg_123',
      content: 'Test message',
      senderId: 'user_123'
    };

    await chatWebSocketService.broadcastNewMessage('project_456', mockMessage);

    expect(mockIO.to).toHaveBeenCalledWith('project_project_456');
    expect(mockIO.emit).toHaveBeenCalledWith('new_message', mockMessage);
  });

  test('should broadcast message deletion to project room', async () => {
    const messageId = 'msg_to_delete_123';
    const projectId = 'project_789';

    await chatWebSocketService.broadcastMessageDeleted(projectId, messageId);

    expect(mockIO.to).toHaveBeenCalledWith('project_project_789');
    expect(mockIO.emit).toHaveBeenCalledWith('message_deleted', { messageId });
  });

  test('should return socket.io instance', () => {
    const ioInstance = chatWebSocketService.getIO();
    expect(ioInstance).toBe(mockIO);
  });
});