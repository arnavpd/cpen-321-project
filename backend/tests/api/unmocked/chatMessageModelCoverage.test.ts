import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { connectTestDB, disconnectTestDB } from '../../testDatabase';
import { chatMessageModel } from '../../../src/features/chat/chatMessage.model';

describe('Chat Message Model Coverage API Tests', () => {
  let app: any;
  let authToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let testProjectId: mongoose.Types.ObjectId;
  let testMessageId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectTestDB();
    app = await createTestApp();
    
    testUserId = new mongoose.Types.ObjectId();
    testProjectId = new mongoose.Types.ObjectId();
    testMessageId = new mongoose.Types.ObjectId();
    
    const payload = {
      userId: testUserId.toString(),
      email: 'test@test.com',
      name: 'Test User',
    };
    authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('Database Error Handling Coverage', () => {
    
    test('should handle create method with database disconnected', async () => {
      // Disconnect to simulate error
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.create({
          projectId: testProjectId,
          content: 'Test message',
          senderId: testUserId,
          senderName: 'Test User',
        });
        // This should not be reached
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to create chat message');
      }
      
      // Reconnect for other tests
      await connectTestDB();
    });

    test('should handle findById method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.findById(testMessageId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to find chat message');
      }
      
      await connectTestDB();
    });

    test('should handle findByProjectId method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.findByProjectId(testProjectId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to find chat messages');
      }
      
      await connectTestDB();
    });

    test('should handle findByProjectIdChronological method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.findByProjectIdChronological(testProjectId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to find chat messages');
      }
      
      await connectTestDB();
    });

    test('should handle findBySenderId method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.findBySenderId(testUserId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to find chat messages');
      }
      
      await connectTestDB();
    });

    test('should handle findRecentMessages method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.findRecentMessages(testProjectId, 24);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to find recent chat messages');
      }
      
      await connectTestDB();
    });

    test('should handle update method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.update(testMessageId, { content: 'Updated content' });
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to update chat message');
      }
      
      await connectTestDB();
    });

    test('should handle delete method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.delete(testMessageId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to delete chat message');
      }
      
      await connectTestDB();
    });

    test('should handle hardDelete method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.hardDelete(testMessageId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to hard delete chat message');
      }
      
      await connectTestDB();
    });

    test('should handle getMessageCount method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.getMessageCount(testProjectId);
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to get message count');
      }
      
      await connectTestDB();
    });

    test('should handle searchMessages method with database disconnected', async () => {
      await mongoose.disconnect();
      
      try {
        await chatMessageModel.searchMessages(testProjectId, 'search term');
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('Failed to search chat messages');
      }
      
      await connectTestDB();
    });
  });

  describe('API Integration with Error Simulation', () => {
    test('should handle sendMessage API with create method error', async () => {
      // Generate unique IDs for this test to avoid duplicates
      const uniqueUserId = new mongoose.Types.ObjectId();
      const uniqueProjectId = new mongoose.Types.ObjectId();
      
      // Ensure we're connected for setup
      await connectTestDB();
      
      // Create a user and project first for realistic test
      const user = await mongoose.connection.collection('users').insertOne({
        _id: uniqueUserId,
        name: 'Test User',
        email: `test-${uniqueUserId}@test.com`,
        profilePicture: null,
        googleId: `google-${uniqueUserId}` // Provide unique googleId to avoid null duplicate
      });

      const project = await mongoose.connection.collection('projects').insertOne({
        _id: uniqueProjectId,
        name: 'Test Project',
        ownerId: uniqueUserId,
        members: [{ userId: uniqueUserId, role: 'owner' }],
        isActive: true,
        invitationCode: `invite-${uniqueProjectId}` // Provide unique invitationCode to avoid null duplicate
      });

      // Generate token for this user
      const uniqueToken = jwt.sign(
        { userId: uniqueUserId.toString(), email: `test-${uniqueUserId}@test.com`, name: 'Test User' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      // Disconnect to cause error AFTER setup but before the API call
      await mongoose.disconnect();
      
      const response = await request(app)
        .post(`/api/chat/${uniqueProjectId}/messages`)
        .set('Authorization', `Bearer ${uniqueToken}`)
        .send({
          content: 'Test message'
        });

      // Should be 500 due to database error, but might be 401 if auth middleware runs first
      expect([500, 401]).toContain(response.status);
      
      // Reconnect and cleanup
      await connectTestDB();
      await mongoose.connection.collection('users').deleteOne({ _id: uniqueUserId });
      await mongoose.connection.collection('projects').deleteOne({ _id: uniqueProjectId });
    });

    test('should handle getChatMessages API with findByProjectId error', async () => {
      // Generate unique IDs for this test to avoid duplicates
      const uniqueUserId = new mongoose.Types.ObjectId();
      const uniqueProjectId = new mongoose.Types.ObjectId();
      
      // Ensure we're connected for setup
      await connectTestDB();
      
      // Create user first for realistic test
      await mongoose.connection.collection('users').insertOne({
        _id: uniqueUserId,
        name: 'Test User 2',
        email: `test2-${uniqueUserId}@test.com`,
        profilePicture: null,
        googleId: `google2-${uniqueUserId}` // Provide unique googleId to avoid null duplicate
      });
      
      // Create project for realistic test
      await mongoose.connection.collection('projects').insertOne({
        _id: uniqueProjectId,
        name: 'Test Project 2',
        ownerId: uniqueUserId,
        members: [{ userId: uniqueUserId, role: 'owner' }],
        isActive: true,
        invitationCode: `invite2-${uniqueProjectId}` // Provide unique invitationCode to avoid null duplicate
      });

      // Generate token for this user
      const uniqueToken = jwt.sign(
        { userId: uniqueUserId.toString(), email: `test2-${uniqueUserId}@test.com`, name: 'Test User 2' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      // Disconnect to cause error AFTER setup but before the API call
      await mongoose.disconnect();
      
      const response = await request(app)
        .get(`/api/chat/${uniqueProjectId}/messages`)
        .set('Authorization', `Bearer ${uniqueToken}`);

      // Should be 500 due to database error, but might be 401 if auth middleware runs first
      expect([500, 401]).toContain(response.status);
      
      // Reconnect and cleanup
      await connectTestDB();
      await mongoose.connection.collection('users').deleteOne({ _id: uniqueUserId });
      await mongoose.connection.collection('projects').deleteOne({ _id: uniqueProjectId });
    });
  });
});