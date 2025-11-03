/**
 * Interface: GET /api/chat/:projectId/messages
 * Tests without mocking - testing actual message retrieval from database
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';

describe('Unmocked: GET /api/chat/:projectId/messages', () => {
  let app: any;
  let testUser: any;
  let testProject: any;
  let testProjectId: string;
  let validToken: string;
  let otherProject: any;
  let otherUser: any;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();

    // Create a test user with unique identifiers
    const timestamp = Date.now();
    testUser = await userModel.create({
      googleId: `test_google_id_get_messages_${timestamp}`,
      email: `testuser.getmessages.${timestamp}@example.com`,
      name: 'Test User Get Messages',
      profilePicture: 'https://example.com/test-profile.jpg'
    });

    // Create a test project with the user as owner
    testProject = await projectModel.create({
      name: 'Test Get Messages Project',
      description: 'Test project for get messages tests',
      ownerId: testUser._id,
      members: [
        {
          userId: testUser._id,
          role: 'user',
          admin: true,
          joinedAt: new Date(),
        }
      ],
      invitationCode: `GETMSG${timestamp}`,
      isActive: true,
      createdAt: new Date(),
    });

    testProjectId = testProject._id.toString();

    // Create valid JWT token for testUser
    validToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create another project that user doesn't have access to
    otherUser = await userModel.create({
      googleId: `other_user_get_messages_${timestamp}`,
      email: `otheruser.getmessages.${timestamp}@example.com`,
      name: 'Other User',
      profilePicture: 'https://example.com/other-profile.jpg'
    });

    otherProject = await projectModel.create({
      name: 'Other Project',
      description: 'Project user cannot access',
      ownerId: otherUser._id,
      members: [
        {
          userId: otherUser._id,
          role: 'user',
          admin: true,
          joinedAt: new Date(),
        }
      ],
      invitationCode: `OTHER${timestamp}`,
      isActive: true,
      createdAt: new Date(),
    });

    // Create some test messages
    await chatMessageModel.create({
      projectId: testProject._id,
      content: 'First test message',
      senderId: testUser._id,
      senderName: testUser.name,
      messageType: 'text',
      isDeleted: false
    });

    await chatMessageModel.create({
      projectId: testProject._id,
      content: 'Second test message',
      senderId: testUser._id,
      senderName: testUser.name,
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
      if (otherProject) await projectModel.delete(otherProject._id);
    } catch (err) {
      // ignore cleanup errors in teardown
    }
  });

  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .get(`/api/chat/${testProjectId}/messages`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  test('Successful Message Retrieval - Returns 200 with messages', async () => {
    const response = await request(app)
      .get(`/api/chat/${testProjectId}/messages`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Messages retrieved successfully');
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    
    // Check message structure
    const firstMessage = response.body.data[0];
    expect(firstMessage).toHaveProperty('id');
    expect(firstMessage).toHaveProperty('content');
    expect(firstMessage).toHaveProperty('senderName', testUser.name);
    expect(firstMessage).toHaveProperty('senderId', testUser._id.toString());
    expect(firstMessage).toHaveProperty('timestamp');
    expect(firstMessage).toHaveProperty('projectId', testProjectId);
  });

  test('Project Not Found - Returns 404 Not Found', async () => {
    const nonExistentProjectId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/chat/${nonExistentProjectId}/messages`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Project not found');
  });
});