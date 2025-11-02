/**
 * Interface: GET /api/user/profile
 * Tests without mocking - testing actual database and middleware integration
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: GET /api/user/profile', () => {
  let app: any;
  let testUser: any;
  let validToken: string;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();
    
    // Create a test user in the database
    testUser = await userModel.create({
      googleId: 'test-google-id-123',
      email: 'test@example.com',
      name: 'Test User',
      profilePicture: 'https://example.com/profile.jpg',
    });

    // Create a valid JWT token for the test user
    validToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-secret'
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

  // Input: No Authorization header
  // Expected status code: 401
  // Expected behavior: Request is rejected due to missing token
  // Expected output: Error message about missing token
  test('No Token - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Access denied');
    expect(response.body).toHaveProperty('message', 'No token provided');
  });

  // Input: Invalid JWT token format
  // Expected status code: 401
  // Expected behavior: Request is rejected due to malformed token
  // Expected output: Error message about invalid token
  test('Invalid Token Format - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer invalid-token-format')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid token');
    expect(response.body).toHaveProperty('message', 'Token is malformed or expired');
  });

  // Input: Valid JWT token format but with wrong secret
  // Expected status code: 401
  // Expected behavior: Request is rejected due to invalid signature
  // Expected output: Error message about invalid token
  test('Valid Format but Wrong Secret - Returns 401 Unauthorized', async () => {
    const invalidToken = jwt.sign(
      { id: testUser._id },
      'wrong-secret'
    );

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid token');
    expect(response.body).toHaveProperty('message', 'Token is malformed or expired');
  });
});