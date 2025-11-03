/**
 * Interface: DELETE /api/chat/:projectId/messages/:messageId
 * Tests without mocking - testing actual message deletion from database
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';

describe('Unmocked: DELETE /api/chat/:projectId/messages/:messageId', () => {
  let app: any;
  let testUser: any;
  let otherUser: any;
  let testProject: any;
  let testProjectId: string;
  let validToken: string;
  let testMessage: any;
  let otherUserMessage: any;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();

    // Create test users
    testUser = await userModel.create({
      googleId: 'test_google_id_delete_message',
      email: 'testuser.deletemsg@example.com',
      name: 'Test User Delete Message',
      profilePicture: 'https://example.com/test-profile.jpg'
    });

    otherUser = await userModel.create({
      googleId: 'other_user_delete_message',
      email: 'otheruser.deletemsg@example.com',
      name: 'Other User',
      profilePicture: 'https://example.com/other-profile.jpg'
    });

    // Create a test project with both users as members
    testProject = await projectModel.create({
      name: 'Test Delete Message Project',
      description: 'Test project for delete message tests',
      ownerId: testUser._id,
      members: [
        {
          userId: testUser._id,
          role: 'user',
          admin: true,
          joinedAt: new Date(),
        },
        {
          userId: otherUser._id,
          role: 'user',
          admin: false,
          joinedAt: new Date(),
        }
      ],
      invitationCode: 'DELMSG123',
      isActive: true,
      createdAt: new Date(),
    });

    testProjectId = testProject._id.toString();

    // Create valid JWT token for testUser
    validToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test messages
    testMessage = await chatMessageModel.create({
      projectId: testProject._id,
      content: 'Message by test user - can be deleted',
      senderId: testUser._id,
      senderName: testUser.name,
      messageType: 'text',
      isDeleted: false
    });

    otherUserMessage = await chatMessageModel.create({
      projectId: testProject._id,
      content: 'Message by other user - cannot be deleted',
      senderId: otherUser._id,
      senderName: otherUser.name,
      messageType: 'text',
      isDeleted: false
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await mongoose.connection.db?.collection('chatmessages').deleteMany({
        projectId: testProject._id
      });
      if (testUser) await userModel.delete(testUser._id);
      if (otherUser) await userModel.delete(otherUser._id);
      if (testProject) await projectModel.delete(testProject._id);
    } catch (err) {
      // ignore cleanup errors in teardown
    }
  });

  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .delete(`/api/chat/${testProjectId}/messages/${testMessage._id}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  test('Invalid Message ID Format - Returns 500 Internal Server Error', async () => {
    const response = await request(app)
      .delete(`/api/chat/${testProjectId}/messages/invalid-id`)
      .set('Authorization', `Bearer ${validToken}`);

    // Invalid ObjectId format typically causes 500 error in mongoose operations
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });

  test('Message Not Found - Returns 404 Not Found', async () => {
    const nonExistentMessageId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/chat/${testProjectId}/messages/${nonExistentMessageId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Message not found');
  });

  test('User Not Message Owner - Returns 403 Forbidden', async () => {
    const response = await request(app)
      .delete(`/api/chat/${testProjectId}/messages/${otherUserMessage._id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You can only delete your own messages');
  });
});