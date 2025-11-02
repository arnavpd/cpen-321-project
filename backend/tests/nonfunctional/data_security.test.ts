/**
 * Non-Functional Requirement Test: Data Security & Authorization
 * 
 * This test suite verifies that users can only access data they are authorized to view,
 * ensuring data privacy and security in the chat and project systems.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';
import { chatMessageModel } from '../../src/features/chat/chatMessage.model';

describe('NFR: Data Security & Authorization Tests', () => {
  let app: any;
  let authorizedUser: any;
  let unauthorizedUser: any;
  let privateProject: any;
  let privateChatMessage: any;
  let authorizedToken: string;
  let unauthorizedToken: string;

  beforeAll(async () => {
    console.log('🔒 Setting up Data Security & Authorization NFR tests...');
    
    // Verify JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    
    // Create test app
    app = await createTestApp();
    console.log('✅ Test app created for security testing');

    // Create test users
    const timestamp = Date.now();
    
    authorizedUser = await userModel.create({
      googleId: `authorized_user_${timestamp}`,
      email: `authorized_${timestamp}@example.com`,
      name: 'Authorized User',
      profilePicture: 'https://example.com/auth-profile.jpg'
    });

    unauthorizedUser = await userModel.create({
      googleId: `unauthorized_user_${timestamp}`,
      email: `unauthorized_${timestamp}@example.com`,
      name: 'Unauthorized User',
      profilePicture: 'https://example.com/unauth-profile.jpg'
    });

    // Create JWT tokens
    authorizedToken = jwt.sign({ id: authorizedUser._id }, jwtSecret);
    unauthorizedToken = jwt.sign({ id: unauthorizedUser._id }, jwtSecret);

    // Create a private project that only authorized user can access
    privateProject = await projectModel.create({
      name: 'Private Security Test Project',
      description: 'This project should only be accessible to authorized user',
      ownerId: authorizedUser._id,
      members: [{
        userId: authorizedUser._id,
        role: 'owner',
        admin: true,
        joinedAt: new Date()
      }],
      invitationCode: `SECURITY${timestamp}`,
      isActive: true,
      createdAt: new Date()
    });

    // Create a private chat message in the project
    privateChatMessage = await chatMessageModel.create({
      projectId: privateProject._id,
      content: 'This is sensitive private information',
      senderId: authorizedUser._id,
      senderName: authorizedUser.name,
      messageType: 'text',
      createdAt: new Date()
    });

    console.log('✅ Test security data created');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Data Security NFR tests...');
    
    try {
      if (privateChatMessage) await chatMessageModel.delete(privateChatMessage._id);
      if (privateProject) await projectModel.delete(privateProject._id);
      if (authorizedUser) await userModel.delete(authorizedUser._id);
      if (unauthorizedUser) await userModel.delete(unauthorizedUser._id);
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  /**
   * Test: Chat Message Access Control Security
   * Requirements: Users should not be able to access chat messages from projects they're not members of
   * This test ensures data isolation between different user groups
   */
  describe('Chat Message Access Control Security', () => {
    
    it('should deny access to chat messages from unauthorized project', async () => {
      console.log('🔐 Testing unauthorized chat message access...');
      
      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/chat/${privateProject._id}/messages`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`📊 Response time for access denial: ${responseTime}ms`);
      console.log(`🔒 Access denied as expected: ${response.body.message}`);
      
      // Assert proper access denial
      expect(response.body.message).toBe('Access denied to this project');
      
      // Assert reasonable response time for security check
      expect(responseTime).toBeLessThan(500);
    });

    it('should allow access to chat messages for authorized project member', async () => {
      console.log('✅ Testing authorized chat message access...');
      
      const response = await request(app)
        .get(`/api/chat/${privateProject._id}/messages`)
        .set('Authorization', `Bearer ${authorizedToken}`)
        .expect(200);
      
      console.log(`📊 Messages retrieved successfully for authorized user`);
      console.log(`📊 Message count: ${response.body.data.length}`);
      
      // Assert successful access to own data
      expect(response.body.message).toBe('Messages retrieved successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Assert the private message is accessible to authorized user
      const foundMessage = response.body.data.find((msg: any) => 
        msg.content === 'This is sensitive private information'
      );
      expect(foundMessage).toBeDefined();
    });

    it('should prevent unauthorized users from sending messages to private projects', async () => {
      console.log('🔐 Testing unauthorized message sending...');
      
      const maliciousContent = 'Attempting to inject unauthorized message';
      
      const response = await request(app)
        .post(`/api/chat/${privateProject._id}/messages`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ content: maliciousContent })
        .expect(403);
      
      console.log(`🔒 Message sending denied as expected: ${response.body.message}`);
      
      // Assert proper access denial
      expect(response.body.message).toBe('Access denied to this project');
    });
  });

  /**
   * Test: Project Access Security
   * Requirements: Users should not be able to access project information they're not authorized to see
   */
  describe('Project Access Security', () => {
    
    it('should deny unauthorized access to project information', async () => {
      console.log('🔐 Testing unauthorized project access...');
      
      // Test that unauthorized user cannot access project details
      const response = await request(app)
        .get(`/api/projects`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(200);
      
      console.log(`📊 Projects response for unauthorized user: ${response.body.data?.length || 0} projects`);
      
      // Assert unauthorized user doesn't see the private project
      const projects = response.body.data || [];
      const foundPrivateProject = projects.find((project: any) => 
        project.id === privateProject._id.toString()
      );
      
      expect(foundPrivateProject).toBeUndefined();
      console.log('✅ Private project properly hidden from unauthorized user');
    });

    it('should allow authorized access to own project information', async () => {
      console.log('✅ Testing authorized project access...');
      
      const response = await request(app)
        .get(`/api/projects`)
        .set('Authorization', `Bearer ${authorizedToken}`)
        .expect(200);
      
      console.log(`📊 Projects response for authorized user: ${response.body.data?.length || 0} projects`);
      
      // Assert authorized user can see their own project
      const projects = response.body.data || [];
      const foundPrivateProject = projects.find((project: any) => 
        project.id === privateProject._id.toString()
      );
      
      expect(foundPrivateProject).toBeDefined();
      console.log('✅ Private project accessible to authorized owner');
    });
  });

  /**
   * Test: Token Security Validation
   * Requirements: System should properly validate and reject invalid/malformed tokens
   */
  describe('Token Security Validation', () => {
    
    it('should reject requests with invalid JWT tokens', async () => {
      console.log('🔐 Testing invalid token rejection...');
      
      const invalidTokens = [
        'invalid.jwt.token',
        'Bearer invalid_token_format',
        'malformed_token_12345',
        ''
      ];
      
      for (const invalidToken of invalidTokens) {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${invalidToken}`)
          .expect(401);
        
        console.log(`🔒 Invalid token rejected: "${invalidToken.substring(0, 20)}..."`);
        expect(response.body.error).toMatch(/Access denied|Invalid token/);
      }
    });

    it('should reject requests without authentication tokens', async () => {
      console.log('🔐 Testing missing token rejection...');
      
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);
      
      console.log(`🔒 Missing token properly rejected: ${response.body.message}`);
      expect(response.body.message).toBe('No token provided');
    });

    it('should validate token performance under load', async () => {
      console.log('⏱️ Testing token validation performance under load...');
      
      const numberOfRequests = 10;
      const maxTimePerValidation = 100; // 100ms per token validation
      
      const validationTimes: number[] = [];
      
      for (let i = 0; i < numberOfRequests; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${authorizedToken}`)
          .expect(200);
        
        const validationTime = Date.now() - startTime;
        validationTimes.push(validationTime);
        
        console.log(`📊 Token validation ${i + 1} time: ${validationTime}ms`);
        
        // Each validation should be reasonably fast
        expect(validationTime).toBeLessThan(maxTimePerValidation);
      }
      
      const averageValidationTime = validationTimes.reduce((a, b) => a + b, 0) / validationTimes.length;
      console.log(`📊 Average token validation time: ${averageValidationTime}ms`);
      
      // Assert average validation time is efficient
      expect(averageValidationTime).toBeLessThan(50);
    });
  });
});