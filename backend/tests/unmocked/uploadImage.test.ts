import request from 'supertest';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';

describe('POST /api/media/upload - Unmocked', () => {
  let app: any;
  let authToken: string;
  let testUserId: string;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'images');

  beforeAll(async () => {
    console.log('=== DEBUG: Starting beforeAll setup ===');
    
    // Create test app instance
    app = await createTestApp();
    console.log('DEBUG: Test app created');

    // Create test user
    const testUser = await userModel.create({
      googleId: 'test_google_id_media',
      name: 'Media Test User',
      email: 'mediatest@example.com',
      profilePicture: 'test-profile.jpg'
    });
    testUserId = testUser._id.toString();
    console.log('DEBUG: Test user created with ID:', testUserId);

    // Create test JWT token using the same secret as the auth middleware
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    
    authToken = jwt.sign(
      { id: testUser._id },
      jwtSecret
    );
    console.log('DEBUG: JWT token created:', authToken.substring(0, 20) + '...');
    console.log('DEBUG: Using JWT_SECRET from env:', jwtSecret.substring(0, 10) + '...');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    console.log('=== DEBUG: beforeAll setup complete ===');
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await userModel.delete(new mongoose.Types.ObjectId(testUserId));
    }

    // Clean up uploaded test files
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const testFiles = files.filter(file => file.includes(testUserId));
      testFiles.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  // Helper function to create a test image buffer
  const createTestImageBuffer = (): Buffer => {
    // Simple 1x1 PNG image (base64 encoded)
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return Buffer.from(base64PNG, 'base64');
  };

  // Success Cases
  it('should upload an image successfully', async () => {
    const imageBuffer = createTestImageBuffer();

    console.log('Debug Info:');
    console.log('Auth Token:', authToken);
    console.log('Test User ID:', testUserId);
    console.log('JWT_SECRET:', process.env.JWT_SECRET || 'test_secret');

    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', imageBuffer, 'test-image.png');

    console.log('Response Status:', response.status);
    console.log('Response Body:', response.body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Image uploaded successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('image');
    expect(typeof response.body.data.image).toBe('string');
    expect(response.body.data.image).toMatch(/\/uploads\/images\//);
  });

  it('should handle different image formats', async () => {
    const imageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', imageBuffer, 'test-image.jpg')
      .expect(200);

    expect(response.body.message).toBe('Image uploaded successfully');
    expect(response.body.data.image).toMatch(/\.jpg$/);
  });

  // Authentication
  it('should require authentication token', async () => {
    const imageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post('/api/media/upload')
      .attach('media', imageBuffer, 'test-image.png')
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  it('should reject invalid authentication token', async () => {
    const imageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer invalid_token')
      .attach('media', imageBuffer, 'test-image.png')
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  // File Validation
  it('should return error when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'No file uploaded');
  });

  // Edge Cases
  it('should handle files with special characters in filename', async () => {
    const imageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', imageBuffer, 'test-image with spaces & symbols!.png')
      .expect(200);

    expect(response.body.message).toBe('Image uploaded successfully');
    expect(response.body.data.image).toBeTruthy();
  });
});