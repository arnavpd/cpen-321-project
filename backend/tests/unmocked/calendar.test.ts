/**
 * Calendar API - Unmocked Integration Tests
 * 
 * Tests the calendar integration endpoints with real authentication
 * and database interactions (no mocks).
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('Calendar API - Unmocked Tests', () => {
  let app: any;
  let testUserId: string;
  let validToken: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Calendar API unmocked tests...');
    
    // Verify JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    console.log('✅ JWT_SECRET loaded for tests');
    
    // Create test app
    app = await createTestApp();
    console.log('✅ Test app created');
    
    // Create a test user with proper GoogleUserInfo structure
    const testUser = await userModel.create({
      googleId: 'test_google_id_calendar',
      name: 'Calendar Test User',
      email: 'calendar.test@example.com',
      profilePicture: 'test-calendar-profile.jpg'
    });
    testUserId = testUser._id.toString();
    console.log(`✅ Test user created with ID: ${testUserId}`);
    
    // Generate valid JWT token (match pattern from uploadImage.test.ts)
    validToken = jwt.sign(
      { id: testUser._id },
      jwtSecret
    );
    console.log('✅ Valid JWT token generated');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up calendar tests...');
    
    try {
      // Clean up test user
      if (testUserId) {
        await userModel.delete(new mongoose.Types.ObjectId(testUserId));
        console.log('✅ Test user cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error);
    }
  });

  describe('GET /api/calendar/status', () => {
    it('should return calendar status for authenticated user - initially disabled', async () => {
      console.log('🔍 Testing calendar status endpoint...');
      
      const response = await request(app)
        .get('/api/calendar/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('enabled');
      expect(response.body.enabled).toBe(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing calendar status without auth...');
      
      const response = await request(app)
        .get('/api/calendar/status')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('POST /api/calendar/dev/enable-calendar-test', () => {
    it('should enable calendar in dev mode for authenticated user', async () => {
      console.log('🔍 Testing dev calendar enable...');
      
      const response = await request(app)
        .post('/api/calendar/dev/enable-calendar-test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('enabled', true);
      expect(response.body).toHaveProperty('warning');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing dev calendar enable without auth...');
      
      const response = await request(app)
        .post('/api/calendar/dev/enable-calendar-test')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/calendar/status (after enabling)', () => {
    it('should return enabled status after dev enable', async () => {
      console.log('🔍 Testing calendar status after enabling...');
      
      const response = await request(app)
        .get('/api/calendar/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('enabled');
      expect(response.body.enabled).toBe(true);
    });
  });

  describe('POST /api/calendar/disable', () => {
    it('should disable calendar for authenticated user', async () => {
      console.log('🔍 Testing calendar disable...');
      
      const response = await request(app)
        .post('/api/calendar/disable')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('enabled', false);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing calendar disable without auth...');
      
      const response = await request(app)
        .post('/api/calendar/disable')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('POST /api/calendar/dev/disable-calendar-test', () => {
    it('should disable calendar in dev mode for authenticated user', async () => {
      console.log('🔍 Testing dev calendar disable...');
      
      const response = await request(app)
        .post('/api/calendar/dev/disable-calendar-test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('enabled', false);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing dev calendar disable without auth...');
      
      const response = await request(app)
        .post('/api/calendar/dev/disable-calendar-test')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('POST /api/calendar/disconnect', () => {
    beforeEach(async () => {
      // Re-enable calendar for disconnect tests
      await request(app)
        .post('/api/calendar/dev/enable-calendar-test')
        .set('Authorization', `Bearer ${validToken}`);
    });

    it('should disconnect calendar for authenticated user', async () => {
      console.log('🔍 Testing calendar disconnect...');
      
      const response = await request(app)
        .post('/api/calendar/disconnect')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message');
      // Note: disconnect endpoint only returns message, not enabled status
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing calendar disconnect without auth...');
      
      const response = await request(app)
        .post('/api/calendar/disconnect')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/calendar/oauth/authorize', () => {
    it('should initiate OAuth flow for authenticated user', async () => {
      console.log('🔍 Testing OAuth authorize endpoint...');
      
      const response = await request(app)
        .get('/api/calendar/oauth/authorize')
        .set('Authorization', `Bearer ${validToken}`);

      console.log('📝 Response status:', response.status);
      console.log('📝 Response body:', response.body);
      
      // This might redirect or return OAuth URL
      // The exact behavior depends on the implementation
      expect([200, 302]).toContain(response.status);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing OAuth authorize without auth...');
      
      const response = await request(app)
        .get('/api/calendar/oauth/authorize')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });
});