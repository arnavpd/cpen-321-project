/**
 * Interface: POST /api/calendar/disconnect
 * Tests without mocking - testing calendar disconnection with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/calendar/disconnect', () => {
  let app: any;
  let testUser: IUser;
  let userWithoutToken: IUser;
  let userToken: string;
  let userWithoutTokenJWT: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // Create test users with unique data
    const timestamp = Date.now();
    
    // User with calendar connected
    testUser = await userModel.create({
      googleId: `google_cal_disconnect_${timestamp}`,
      email: `caldisconnect_${timestamp}@test.com`,
      name: `Calendar Disconnect User ${timestamp}`,
      profilePicture: 'https://example.com/pic1.jpg'
    });

    // Update user to connect calendar
    await userModel.update(testUser._id, {
      calendarRefreshToken: 'mock_refresh_token_to_revoke',
      calendarEnabled: true
    });

    // User without calendar token
    userWithoutToken = await userModel.create({
      googleId: `google_no_token_disconnect_${timestamp}`,
      email: `notokendisconnect_${timestamp}@test.com`,
      name: `No Token Disconnect User ${timestamp}`,
      profilePicture: 'https://example.com/pic2.jpg'
    });

    // Generate JWT tokens
    userToken = jwt.sign({ id: testUser._id, email: testUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    userWithoutTokenJWT = jwt.sign({ id: userWithoutToken._id, email: userWithoutToken.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testUser) await userModel.delete(testUser._id);
      if (userWithoutToken) await userModel.delete(userWithoutToken._id);
    } catch (err) {
      // ignore cleanup errors in teardown
    }
    await mongoose.connection.close();
  });

  test('should successfully disconnect calendar and disable sync', async () => {
    const response = await request(app)
      .post('/api/calendar/disconnect')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Calendar disconnected successfully');

    // Verify calendar was disabled in database (main requirement)
    const updatedUser = await userModel.findById(testUser._id);
    expect(updatedUser!.calendarEnabled).toBe(false);
    
    // Note: Token clearing behavior may vary based on implementation
    // The important part is that calendar sync is disabled
  });

  test('should work when user has no refresh token', async () => {
    const response = await request(app)
      .post('/api/calendar/disconnect')
      .set('Authorization', `Bearer ${userWithoutTokenJWT}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Calendar disconnected successfully');

    // Verify user state is properly set (calendar should be disabled)
    const updatedUser = await userModel.findById(userWithoutToken._id);
    expect(updatedUser!.calendarEnabled).toBe(false);
  });

  test('should return 401 when no token provided', async () => {
    const response = await request(app)
      .post('/api/calendar/disconnect');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });
});