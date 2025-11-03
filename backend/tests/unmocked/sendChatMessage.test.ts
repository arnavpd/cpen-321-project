import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';

describe('Unmocked: POST /api/chat/:projectId/messages', () => {
  let app: any;
  let testUser: any;
  let testProject: any;
  let testProjectId: string;
  let validToken: string;
  let otherUser: any;
  let otherProject: any;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();

    // Create a test user
    testUser = await userModel.create({
      googleId: 'test_google_id_chat_message',
      email: 'testuser.chatmessage@example.com',
      name: 'Test User Chat Message',
      profilePicture: 'https://example.com/test-profile.jpg'
    });

    // Create a test project with the user as owner
    testProject = await projectModel.create({
      name: 'Test Chat Project',
      description: 'Test project for chat message tests',
      ownerId: testUser._id,
      members: [
        {
          userId: testUser._id,
          role: 'user',
          admin: true,
          joinedAt: new Date(),
        }
      ],
      invitationCode: 'TESTCHAT123',
      isActive: true,
      createdAt: new Date(),
    });

    testProjectId = testProject._id.toString();

    // Create valid JWT token for testUser
    validToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create another user and a project they own (for access-denied test)
    otherUser = await userModel.create({
      googleId: 'other_user_chat',
      email: 'otheruser.chat@example.com',
      name: 'Other User',
      profilePicture: 'https://example.com/other-profile.jpg'
    });

    otherProject = await projectModel.create({
      name: 'Other Project',
      description: 'Project owned by other user',
      ownerId: otherUser._id,
      members: [
        {
          userId: otherUser._id,
          role: 'user',
          admin: true,
          joinedAt: new Date(),
        }
      ],
      invitationCode: 'OTHER123',
      isActive: true,
      createdAt: new Date(),
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testUser) await userModel.delete(testUser._id);
      if (testProject) await projectModel.delete(testProject._id);
      if (otherUser) await userModel.delete(otherUser._id);
      if (otherProject) await projectModel.delete(otherProject._id);

      // Clean up any chat messages created during tests
      if (testProjectId) {
        await mongoose.connection.db?.collection('chatmessages').deleteMany({
          projectId: new mongoose.Types.ObjectId(testProjectId)
        });
      }

      if (otherProject) {
        await mongoose.connection.db?.collection('chatmessages').deleteMany({
          projectId: otherProject._id
        });
      }
    } catch (err) {
      // ignore cleanup errors in teardown
    }
  });

  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .post(`/api/chat/${testProjectId}/messages`)
      .send({
        content: 'Test message without auth'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  test('Successful Message Creation - Returns 201 and stores message', async () => {
    const content = 'Hello from unmocked test!';

    const response = await request(app)
      .post(`/api/chat/${testProjectId}/messages`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Message sent successfully');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.content).toBe(content);
    expect(response.body.data.projectId).toBe(testProjectId);

    // Verify message exists in DB
    const messages = await chatMessageModel.findByProjectIdChronological(new mongoose.Types.ObjectId(testProjectId));
    const found = messages.find((m: any) => m.content === content && m.senderName === testUser.name);
    expect(found).toBeDefined();
  });

  test('Empty Content (whitespace) - Returns 400 Bad Request', async () => {
    const response = await request(app)
      .post(`/api/chat/${testProjectId}/messages`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Message content is required');
  });

  test('Content Too Long - Returns 400 Bad Request', async () => {
    const longContent = 'a'.repeat(2001);

    const response = await request(app)
      .post(`/api/chat/${testProjectId}/messages`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: longContent });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid input data');
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'content',
          message: 'Message content must be less than 2000 characters'
        })
      ])
    );
  });

  test('Project Not Found - Returns 404 Not Found', async () => {
    const nonExistentProjectId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post(`/api/chat/${nonExistentProjectId}/messages`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: 'Hello' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Project not found');
  });

  test('User Not Member - Returns 403 Access Denied', async () => {
    // testUser is not a member of otherProject
    const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'test-secret');

    const response = await request(app)
      .post(`/api/chat/${otherProject._id.toString()}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Should be blocked' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Access denied to this project');
  });
});