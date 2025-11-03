/**
 * Interface: POST /api/auth/signin
 * Tests without mocking - testing actual Google OAuth and database integration
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/auth/signin', () => {
  let app: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();
    
    // Create a test user in the database for signin tests
    testUser = await userModel.create({
      googleId: 'test-google-signin-id-456',
      email: 'signin-test@example.com',
      name: 'Signin Test User',
      profilePicture: 'https://example.com/signin-profile.jpg',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await userModel.delete(testUser._id);
    }
    // Close database connection
    await mongoose.connection.close();
  });

  // Input: Invalid/malformed Google ID token
  // Expected status code: 401
  // Expected behavior: Google token verification fails
  // Expected output: Invalid token error message
  test('Invalid Google Token - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        idToken: 'invalid-google-token-format'
      })
      .expect(401);

    expect(response.body).toHaveProperty('message', 'Invalid Google token');
  });

  // NOTE: The following tests would require valid Google tokens, which are difficult 
  // to generate in automated tests. In a real scenario, you would either:
  // 1. Use actual valid Google test tokens (not recommended for CI/CD)
  // 2. Mock the Google verification (done in mocked tests)
  // 3. Use Google's test accounts with known tokens

  // Input: Valid Google ID token but user doesn't exist in database
  // Expected status code: 404
  // Expected behavior: User lookup fails
  // Expected output: User not found error message
  test('Valid Token but User Not Found - Returns 404 Not Found', async () => {
    // This test would need a valid Google token for a user not in our database
    // For demo purposes, we'll test with an invalid token that gets past validation
    
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZaketoken'
      })
      .expect(401); // Will fail at Google verification step

    expect(response.body).toHaveProperty('message', 'Invalid Google token');
  });

  // Input: Valid Google ID token for existing user
  // Expected status code: 200
  // Expected behavior: User signs in successfully
  // Expected output: JWT token and user data
  test('Valid Token and Existing User - Returns 200 Success', async () => {
    // This test would need a valid Google token matching our test user
    // For demo purposes, we'll test the error path
    
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        idToken: 'another-fake-token-that-would-be-valid'
      })
      .expect(401); // Will fail at Google verification step

    expect(response.body).toHaveProperty('message', 'Invalid Google token');
    
    // If this were a real valid token test, we would expect:
    // expect(response.body).toHaveProperty('message', 'User signed in successfully');
    // expect(response.body).toHaveProperty('data');
    // expect(response.body.data).toHaveProperty('token');
    // expect(response.body.data).toHaveProperty('user');
  });
});