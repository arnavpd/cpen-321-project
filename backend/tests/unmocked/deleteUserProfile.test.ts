/**
 * Interface: DELETE /api/user/profile
 * Tests without mocking - testing actual user profile deletion from database
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: DELETE /api/user/profile', () => {
  let app: any;
  let testUser: any;
  let validToken: string;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();
  });

  beforeEach(async () => {
    // Create a fresh test user for each test
    const timestamp = Date.now();
    testUser = await userModel.create({
      googleId: `test-google-delete-profile-${timestamp}`,
      email: `deleteprofile.test.${timestamp}@example.com`,
      name: 'Delete Profile Test User',
      profilePicture: 'https://example.com/delete-profile.jpg',
    });

    // Generate auth token for requests
    validToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test_secret'
    );
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  // Input: Valid authenticated request
  // Expected status code: 200
  // Expected behavior: User deleted from database
  // Expected output: Success message
  test('Valid User Deletion - Returns 200 Success', async () => {
    const response = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'User deleted successfully');

    // Verify user is actually deleted from database
    const deletedUser = await userModel.findById(testUser._id);
    expect(deletedUser).toBeNull();
  });

  // Input: Missing authentication token
  // Expected status code: 401
  // Expected behavior: Request blocked due to missing auth
  // Expected output: Authentication error message
  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .delete('/api/user/profile')
      .expect(401);

    expect(response.body.message).toBe('No token provided');

    // Verify user still exists in database
    const existingUser = await userModel.findById(testUser._id);
    expect(existingUser).not.toBeNull();
  });

  // Input: Invalid authentication token
  // Expected status code: 401
  // Expected behavior: Request blocked due to invalid token
  // Expected output: Authentication error message
  test('Invalid Authentication Token - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', 'Bearer invalid-token-123')
      .expect(401);

    expect(response.body.message).toBe('Token is malformed or expired');

    // Verify user still exists in database
    const existingUser = await userModel.findById(testUser._id);
    expect(existingUser).not.toBeNull();
  });
});