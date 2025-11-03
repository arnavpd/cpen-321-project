/**
 * Interface: GET /api/user/:userId
 * Tests without mocking - testing actual database integration
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: GET /api/user/:userId', () => {
  let app: any;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();
    
    // Create a test user in the database
    testUser = await userModel.create({
      googleId: 'test-google-getuser-456',
      email: 'getuser-test@example.com',
      name: 'GetUser Test User',
      profilePicture: 'https://example.com/getuser-profile.jpg',
    });

    // Generate auth token for requests
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test_secret'
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await userModel.delete(testUser._id);
    }
    // Close database connection
    await mongoose.connection.close();
  });

  // Input: Valid existing user ID
  // Expected status code: 200
  // Expected behavior: User found and returned from database
  // Expected output: Success message with user data
  test('Valid Existing User ID - Returns 200 Success', async () => {
    const response = await request(app)
      .get(`/api/user/${testUser._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'User fetched successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('email', 'getuser-test@example.com');
    expect(response.body.data.user).toHaveProperty('name', 'GetUser Test User');
  });

  // Input: Valid user ID format but user doesn't exist
  // Expected status code: 404
  // Expected behavior: User not found in database
  // Expected output: User not found error message
  test('Valid ID Format But User Not Found - Returns 404 Not Found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const response = await request(app)
      .get(`/api/user/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('message', 'User not found');
  });

  // Input: Invalid user ID format
  // Expected status code: 400
  // Expected behavior: Request validation fails due to invalid ID format
  // Expected output: Invalid user ID format error message
  test('Invalid User ID Format - Returns 400 Bad Request', async () => {
    const response = await request(app)
      .get('/api/user/invalid-id-format')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Invalid user ID format');
  });
});