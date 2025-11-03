/**
 * Interface: POST /api/calendar/disable
 * Tests without mocking - testing calendar disable functionality with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/calendar/disable', () => {
  let app: any;
  let testUser: IUser;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // Create test user with calendar enabled
    const timestamp = Date.now();
    testUser = await userModel.create({
      googleId: `google_cal_disable_${timestamp}`,
      email: `caldisable_${timestamp}@test.com`,
      name: `Calendar Disable User ${timestamp}`,
      profilePicture: 'https://example.com/pic1.jpg'
    });

    // Update user to enable calendar initially
    await userModel.update(testUser._id, {
      calendarRefreshToken: 'mock_refresh_token_12345',
      calendarEnabled: true
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

  test('should successfully disable calendar sync', async () => {
    const response = await request(app)
      .post('/api/calendar/disable')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Calendar sync disabled');
    expect(response.body.enabled).toBe(false);

    // Verify calendar was disabled in database
    const updatedUser = await userModel.findById(testUser._id);
    expect(updatedUser!.calendarEnabled).toBe(false);
    // Refresh token should still exist (not cleared)
    expect(updatedUser!.calendarRefreshToken).toBe('mock_refresh_token_12345');
  });

  test('should return 401 when no token provided', async () => {
    const response = await request(app)
      .post('/api/calendar/disable');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  test('should work even when calendar is already disabled', async () => {
    // First disable it
    await request(app)
      .post('/api/calendar/disable')
      .set('Authorization', `Bearer ${userToken}`);

    // Try to disable again
    const response = await request(app)
      .post('/api/calendar/disable')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Calendar sync disabled');
    expect(response.body.enabled).toBe(false);
  });
});