/**
 * Interface: POST /api/user/profile
 * Tests without mocking - testing actual user profile update from database
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/user/profile', () => {
  let app: any;
  let testUser: any;
  let validToken: string;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();
    
    // Create a test user in the database
    const timestamp = Date.now();
    testUser = await userModel.create({
      googleId: `test-google-update-profile-${timestamp}`,
      email: `updateprofile.test.${timestamp}@example.com`,
      name: 'Update Profile Test User',
      profilePicture: 'https://example.com/original-profile.jpg',
    });

    // Generate auth token for requests
    validToken = jwt.sign(
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

  // Input: Valid profile update data
  // Expected status code: 200
  // Expected behavior: User profile updated in database
  // Expected output: Success message with updated user data
  test('Valid Profile Update - Returns 200 Success', async () => {
    const updateData = {
      name: 'Updated Test Name',
      bio: 'This is my updated bio for testing'
    };

    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'User info updated successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('name', 'Updated Test Name');
    expect(response.body.data.user).toHaveProperty('bio', 'This is my updated bio for testing');
    expect(response.body.data.user).toHaveProperty('email', testUser.email); // Should remain unchanged

    // Verify changes persisted in database
    const updatedUser = await userModel.findById(testUser._id);
    expect(updatedUser?.name).toBe('Updated Test Name');
    expect(updatedUser?.bio).toBe('This is my updated bio for testing');
  });

  // Input: Missing authentication token
  // Expected status code: 401
  // Expected behavior: Request blocked due to missing auth
  // Expected output: Authentication error message
  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/user/profile')
      .send({ name: 'Should be blocked' })
      .expect(401);

    expect(response.body.message).toBe('No token provided');
  });

  // Input: Empty request body
  // Expected status code: 200
  // Expected behavior: No changes made but request succeeds
  // Expected output: Success message with unchanged user data
  test('Empty Update Data - Returns 200 Success with No Changes', async () => {
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({})
      .expect(200);

    expect(response.body).toHaveProperty('message', 'User info updated successfully');
    expect(response.body.data.user).toHaveProperty('name'); // Should still have existing data
  });
});