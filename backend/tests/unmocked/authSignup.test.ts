/**
 * Interface: POST /api/auth/signup
 * Tests without mocking - testing actual Google OAuth and database integration
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';

describe('Unmocked: POST /api/auth/signup', () => {
  let app: any;

  beforeAll(async () => {
    // Create test app instance
    app = await createTestApp();
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  // Input: Invalid/malformed Google ID token
  // Expected status code: 401
  // Expected behavior: Google token verification fails
  // Expected output: Invalid token error message
  test('Invalid Google Token - Returns 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        idToken: 'invalid-google-token-format'
      })
      .expect(401);

    expect(response.body).toHaveProperty('message', 'Invalid Google token');
  });

  // Input: Missing idToken in request body
  // Expected status code: 400
  // Expected behavior: Request validation fails due to missing required field
  // Expected output: Validation error message
  test('Missing ID Token - Returns 400 Bad Request', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({})
      .expect(400);

    // Should receive validation error for missing required field
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Invalid input data');
  });

  // Input: Empty request body
  // Expected status code: 400
  // Expected behavior: Request validation fails
  // Expected output: Validation error message
  test('Empty Request Body - Returns 400 Bad Request', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .expect(400);

    // Should receive validation error
    expect(response.body).toHaveProperty('message');
  });
});