/**
 * Interface: POST /api/calendar/enable
 * Tests without mocking - testing calendar enable functionality with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/calendar/enable', () => {
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
    
    // User with calendar refresh token
    testUser = await userModel.create({
      googleId: `google_cal_enable_${timestamp}`,
      email: `calenable_${timestamp}@test.com`,
      name: `Calendar Enable User ${timestamp}`,
      profilePicture: 'https://example.com/pic1.jpg'
    });

    // Update user to add calendar fields after creation
    await userModel.update(testUser._id, {
      calendarRefreshToken: 'mock_refresh_token_12345',
      calendarEnabled: false
    });

    // User without calendar refresh token
    userWithoutToken = await userModel.create({
      googleId: `google_no_token_${timestamp}`,
      email: `notoken_${timestamp}@test.com`,
      name: `No Token User ${timestamp}`,
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

  test('should successfully enable calendar when user has refresh token', async () => {
    const response = await request(app)
      .post('/api/calendar/enable')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Calendar sync enabled');
    expect(response.body.enabled).toBe(true);

    // Verify calendar was enabled in database
    const updatedUser = await userModel.findById(testUser._id);
    expect(updatedUser!.calendarEnabled).toBe(true);
  });

  test('should return 400 when user has no refresh token', async () => {
    const response = await request(app)
      .post('/api/calendar/enable')
      .set('Authorization', `Bearer ${userWithoutTokenJWT}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Calendar not connected. Please authorize first.');

    // Verify calendar was NOT enabled in database
    const unchangedUser = await userModel.findById(userWithoutToken._id);
    expect(unchangedUser!.calendarEnabled).toBe(false);
  });

  test('should return 401 when no token provided', async () => {
    const response = await request(app)
      .post('/api/calendar/enable');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });
});