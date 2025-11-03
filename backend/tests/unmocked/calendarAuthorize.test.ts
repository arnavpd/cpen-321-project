/**
 * Interface: GET /api/calendar/oauth/authorize
 * Tests without mocking - testing calendar OAuth authorization with actual service integration
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: GET /api/calendar/oauth/authorize', () => {
  let app: any;
  let testUser: IUser;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // Create test user with unique data
    const timestamp = Date.now();
    testUser = await userModel.create({
      googleId: `google_cal_auth_${timestamp}`,
      email: `calauth_${timestamp}@test.com`,
      name: `Calendar Auth User ${timestamp}`,
      profilePicture: 'https://example.com/pic1.jpg'
    });

    // Generate JWT token
    userToken = jwt.sign({ id: testUser._id, email: testUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testUser) await userModel.delete(testUser._id);
    } catch (err) {
      // ignore cleanup errors in teardown
    }
    await mongoose.connection.close();
  });

  test('should generate authorization URL when user is authenticated', async () => {
    const response = await request(app)
      .get('/api/calendar/oauth/authorize')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.authUrl).toBeDefined();
    expect(typeof response.body.authUrl).toBe('string');
    expect(response.body.authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(response.body.authUrl).toContain(`state=${testUser._id}`);
    expect(response.body.authUrl).toContain('client_id');
    expect(response.body.authUrl).toContain('redirect_uri');
    expect(response.body.authUrl).toContain('scope');
  });

  test('should return 401 when no token provided', async () => {
    const response = await request(app)
      .get('/api/calendar/oauth/authorize');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  test('should return 401 when invalid token provided', async () => {
    const response = await request(app)
      .get('/api/calendar/oauth/authorize')
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token is malformed or expired');
  });
});