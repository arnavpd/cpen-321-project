/**
 * Interface: DELETE /api/chat/:projectId/messages/:messageId
 * Tests with mocking - testing message deletion with mocked dependencies
 */

import { Request, Response } from 'express';
import { ChatController } from '../../src/features/chat/chat.controller';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/chat/chatMessage.model');

describe('Mocked: DELETE /api/chat/:projectId/messages/:messageId', () => {
  let chatController: ChatController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockOtherUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();
  const mockMessageId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    chatController = new ChatController();

    mockRequest = {
      params: { 
        projectId: mockProjectId.toString(),
        messageId: mockMessageId.toString()
      },
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

  test('Successful Message Deletion - Returns 200 Success', async () => {
    const mockMessage = {
      _id: mockMessageId,
      projectId: mockProjectId,
      content: 'Test message to delete',
      senderId: mockUserId, // Same as requesting user
      senderName: 'Test User',
      createdAt: new Date(),
      messageType: 'text'
    };

    (chatMessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);
    (chatMessageModel.delete as jest.Mock).mockResolvedValue(true);

    await chatController.deleteMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message deleted successfully'
    });
    
    // Verify the model was called with correct parameters
    expect(chatMessageModel.findById).toHaveBeenCalledWith(mockMessageId);
    expect(chatMessageModel.delete).toHaveBeenCalledWith(mockMessageId);
  });

  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    mockRequest.user = undefined;

    await chatController.deleteMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  test('Message Not Found - Returns 404 Not Found', async () => {
    (chatMessageModel.findById as jest.Mock).mockResolvedValue(null);

    await chatController.deleteMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Message not found'
    });
  });

  test('User Not Message Owner - Returns 403 Forbidden', async () => {
    const mockMessage = {
      _id: mockMessageId,
      projectId: mockProjectId,
      content: 'Someone else\'s message',
      senderId: mockOtherUserId, // Different from requesting user
      senderName: 'Other User',
      createdAt: new Date(),
      messageType: 'text'
    };

    (chatMessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

    await chatController.deleteMessage(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'You can only delete your own messages'
    });
  });
});