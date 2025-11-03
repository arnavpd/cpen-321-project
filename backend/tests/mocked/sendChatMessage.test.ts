/**
 * Interface: POST /api/chat/:projectId/messages
 * Tests with mocking - testing controller logic with mocked dependencies
 */

import { Request, Response } from 'express';
import { ChatController } from '../../src/features/chat/chat.controller';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/chat/chatMessage.model');
jest.mock('../../src/features/projects/project.model');
jest.mock('../../src/features/users/user.model');

describe('Mocked: POST /api/chat/:projectId/messages', () => {
  let chatController: ChatController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();
  const mockMessageId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    chatController = new ChatController();

    mockRequest = {
      params: { projectId: mockProjectId.toString() },
      body: {},
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

  test('Successful Message Creation - Returns 201 with message data', async () => {
    const messageContent = 'Hello, this is a test message!';
    mockRequest.body = { content: messageContent };

    const mockProject = {
      _id: mockProjectId,
      ownerId: mockUserId,
      members: [
        { userId: mockUserId, role: 'user', admin: true }
      ]
    };

    const mockUser = {
      _id: mockUserId,
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockCreatedMessage = {
      _id: mockMessageId,
      projectId: mockProjectId,
      content: messageContent,
      senderId: mockUserId,
      senderName: mockUser.name,
      createdAt: new Date(),
      messageType: 'text'
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (chatMessageModel.create as jest.Mock).mockResolvedValue(mockCreatedMessage);

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message sent successfully',
      data: {
        id: mockMessageId.toString(),
        content: messageContent,
        senderName: mockUser.name,
        senderId: mockUserId.toString(),
        timestamp: mockCreatedMessage.createdAt.getTime(),
        projectId: mockProjectId.toString()
      }
    });
  });

  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    mockRequest.user = undefined;
    mockRequest.body = { content: 'Test message' };

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  test('Missing Content - Returns 400 Bad Request', async () => {
    mockRequest.body = {};

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message content is required'
    });
  });

  test('Empty Content - Returns 400 Bad Request', async () => {
    mockRequest.body = { content: '   ' }; // Only whitespace

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message content is required'
    });
  });

  test('Content Too Long - Returns 400 Bad Request', async () => {
    const longContent = 'a'.repeat(2001); // Exceeds 2000 character limit
    mockRequest.body = { content: longContent };

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message content must be less than 2000 characters'
    });
  });

  test('Project Not Found - Returns 404 Not Found', async () => {
    mockRequest.body = { content: 'Test message' };

    (projectModel.findById as jest.Mock).mockResolvedValue(null);

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Project not found'
    });
  });

  test('User Not Project Member - Returns 403 Access Denied', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    mockRequest.body = { content: 'Test message' };

    const mockProject = {
      _id: mockProjectId,
      ownerId: otherUserId, // Different from mockUserId
      members: [
        { userId: otherUserId, role: 'user', admin: true }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Access denied to this project'
    });
  });

  test('User Not Found - Returns 404 Not Found', async () => {
    mockRequest.body = { content: 'Test message' };

    const mockProject = {
      _id: mockProjectId,
      ownerId: mockUserId,
      members: [
        { userId: mockUserId, role: 'user', admin: true }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (userModel.findById as jest.Mock).mockResolvedValue(null);

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
  });

  test('Database Error During Message Creation - Returns 500 Internal Server Error', async () => {
    mockRequest.body = { content: 'Test message' };

    const mockProject = {
      _id: mockProjectId,
      ownerId: mockUserId,
      members: [
        { userId: mockUserId, role: 'user', admin: true }
      ]
    };

    const mockUser = {
      _id: mockUserId,
      name: 'Test User',
      email: 'test@example.com'
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (chatMessageModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
  });

  test('Project Access Check - User is Member but not Owner', async () => {
    const ownerUserId = new mongoose.Types.ObjectId();
    mockRequest.body = { content: 'Test message from member' };

    const mockProject = {
      _id: mockProjectId,
      ownerId: ownerUserId, // Different from mockUserId
      members: [
        { userId: ownerUserId, role: 'owner', admin: true },
        { userId: mockUserId, role: 'user', admin: false } // This user is a member
      ]
    };

    const mockUser = {
      _id: mockUserId,
      name: 'Member User',
      email: 'member@example.com'
    };

    const mockCreatedMessage = {
      _id: mockMessageId,
      projectId: mockProjectId,
      content: 'Test message from member',
      senderId: mockUserId,
      senderName: mockUser.name,
      createdAt: new Date(),
      messageType: 'text'
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (chatMessageModel.create as jest.Mock).mockResolvedValue(mockCreatedMessage);

    await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message sent successfully',
      data: expect.objectContaining({
        content: 'Test message from member',
        senderName: 'Member User'
      })
    });
  });
});