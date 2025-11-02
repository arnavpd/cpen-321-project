/**
 * Interface: GET /api/chat/:projectId/messages
 * Tests with mocking - testing message retrieval with mocked dependencies
 */

import { Request, Response } from 'express';
import { ChatController } from '../../src/features/chat/chat.controller';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';
import { projectModel } from '../../src/features/projects/project.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/chat/chatMessage.model');
jest.mock('../../src/features/projects/project.model');

describe('Mocked: GET /api/chat/:projectId/messages', () => {
  let chatController: ChatController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();
  const mockMessageId1 = new mongoose.Types.ObjectId();
  const mockMessageId2 = new mongoose.Types.ObjectId();

  beforeEach(() => {
    chatController = new ChatController();

    mockRequest = {
      params: { projectId: mockProjectId.toString() },
      query: {},
      user: { 
        _id: mockUserId,
        googleId: 'test-google-id',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: 'https://example.com/pic.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  test('Successful Message Retrieval - Returns 200 with messages', async () => {
    const mockProject = {
      _id: mockProjectId,
      ownerId: mockUserId,
      members: [
        { userId: mockUserId, role: 'user', admin: true }
      ]
    };

    const mockMessages = [
      {
        _id: mockMessageId1,
        projectId: mockProjectId,
        content: 'Hello!',
        senderId: mockUserId,
        senderName: 'Test User',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        messageType: 'text'
      },
      {
        _id: mockMessageId2,
        projectId: mockProjectId,
        content: 'How are you?',
        senderId: mockUserId,
        senderName: 'Test User',
        createdAt: new Date('2024-01-01T10:01:00Z'),
        messageType: 'text'
      }
    ];

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (chatMessageModel.findByProjectIdChronological as jest.Mock).mockResolvedValue(mockMessages);

    await chatController.getMessages(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Messages retrieved successfully',
      data: [
        {
          id: mockMessageId1.toString(),
          content: 'Hello!',
          senderName: 'Test User',
          senderId: mockUserId.toString(),
          timestamp: new Date('2024-01-01T10:00:00Z').getTime(),
          projectId: mockProjectId.toString()
        },
        {
          id: mockMessageId2.toString(),
          content: 'How are you?',
          senderName: 'Test User',
          senderId: mockUserId.toString(),
          timestamp: new Date('2024-01-01T10:01:00Z').getTime(),
          projectId: mockProjectId.toString()
        }
      ]
    });
  });

  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    mockRequest.user = undefined;

    await chatController.getMessages(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  test('Project Not Found - Returns 404 Not Found', async () => {
    (projectModel.findById as jest.Mock).mockResolvedValue(null);

    await chatController.getMessages(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Project not found'
    });
  });
});