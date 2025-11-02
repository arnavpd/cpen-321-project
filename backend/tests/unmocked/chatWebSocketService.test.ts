/**
 * Chat WebSocket Service - Unmocked Tests  
 * Tests without mocking - testing WebSocket service functionality directly
 */

import { Server as HTTPServer } from 'http';
import { ChatWebSocketService } from '../../src/features/chat/chat-websocket.service';
import jwt from 'jsonwebtoken';

describe('Unmocked: Chat WebSocket Service', () => {
  let httpServer: HTTPServer;
  let chatWebSocketService: ChatWebSocketService;
  let validToken: string;

  beforeAll(async () => {
    // Generate valid token for testing
    const testUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
    validToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    // Create HTTP server  
    httpServer = new HTTPServer();

    // Initialize WebSocket service
    chatWebSocketService = new ChatWebSocketService(httpServer);
  });

  afterAll(async () => {
    // Clean up
    try {
      if (httpServer) {
        httpServer.close();
      }
    } catch (err) {
      // ignore cleanup errors
    }
  });

  test('should initialize WebSocket service successfully', () => {
    expect(chatWebSocketService).toBeDefined();
    expect(chatWebSocketService.getIO()).toBeDefined();
    expect(typeof chatWebSocketService.broadcastNewMessage).toBe('function');
    expect(typeof chatWebSocketService.broadcastMessageDeleted).toBe('function');
  });

  test('should broadcast new message without errors', async () => {
    const testMessage = {
      _id: 'test_msg_123',
      content: 'Test broadcast message',
      senderId: '507f1f77bcf86cd799439011',
      senderName: 'Test User',
      projectId: 'test_project_123',
      messageType: 'text',
      createdAt: new Date()
    };

    const projectId = 'test_project_123';

    // This should not throw an error
    await expect(chatWebSocketService.broadcastNewMessage(projectId, testMessage))
      .resolves.not.toThrow();
  });

  test('should broadcast message deletion without errors', async () => {
    const projectId = 'test_project_456';
    const messageId = 'msg_to_delete_123';

    // This should not throw an error
    await expect(chatWebSocketService.broadcastMessageDeleted(projectId, messageId))
      .resolves.not.toThrow();
  });

  test('should verify JWT token validation works', async () => {
    // Test valid token verification
    const decoded = jwt.verify(validToken, process.env.JWT_SECRET || 'test-secret') as any;
    expect(decoded.id).toBe('507f1f77bcf86cd799439011');

    // Test invalid token throws error
    expect(() => {
      jwt.verify('invalid_token', process.env.JWT_SECRET || 'test-secret');
    }).toThrow();
  });

  test('should handle socket.io instance retrieval', () => {
    const io = chatWebSocketService.getIO();
    
    expect(io).toBeDefined();
    expect(typeof io.emit).toBe('function');
    expect(typeof io.to).toBe('function');
    expect(typeof io.on).toBe('function');
    expect(typeof io.use).toBe('function');
  });

  test('should handle broadcast operations with various project IDs', async () => {
    const testCases = [
      'project_123',
      'project_with_special_chars_!@#',
      'project_with_numbers_789',
      'project_with_underscores_and_dashes_-_-',
      ''  // Edge case: empty project ID
    ];

    const testMessage = {
      _id: 'test_msg_456',
      content: 'Test message for various project IDs',
      senderId: '507f1f77bcf86cd799439011',
      senderName: 'Test User'
    };

    for (const projectId of testCases) {
      await expect(chatWebSocketService.broadcastNewMessage(projectId, testMessage))
        .resolves.not.toThrow();
      
      await expect(chatWebSocketService.broadcastMessageDeleted(projectId, 'msg_789'))
        .resolves.not.toThrow();
    }
  });
});