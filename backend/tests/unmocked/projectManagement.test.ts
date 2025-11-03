/**
 * Project Management Operations API - Unmocked Integration Tests
 * 
 * Focused test suite with less than 4 tests for core project CRUD operations.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';

describe('Project Management Operations - Unmocked Tests', () => {
  let app: any;
  let testUser: any;
  let validToken: string;
  let testProjectId: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Project Management Operations tests...');
    
    app = await createTestApp();
    console.log('✅ Test app created');

    // Create test user with correct structure
    testUser = await userModel.create({
      googleId: 'test-project-mgmt-user-456',
      email: 'projectmanagement@test.com',
      name: 'Project Management Test User',
      profilePicture: 'https://example.com/project-mgmt-profile.jpg'
    });
    console.log('✅ Test user created:', testUser._id);

    // Create JWT token with improved error handling
    const envPath = path.join(__dirname, '../../.env.test');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const jwtSecretMatch = envContent.match(/JWT_SECRET\s*=\s*(.+)/);
    const jwtSecret = jwtSecretMatch?.[1]?.trim() || 'test-secret';
    
    if (!jwtSecretMatch) {
      throw new Error('JWT_SECRET not found in .env.test file');
    }
    
    validToken = jwt.sign(
      { id: testUser._id },
      jwtSecret
    );
    console.log('✅ Valid JWT token generated');
  });

  afterAll(async () => {
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    if (testUser?._id) {
      await userModel.delete(testUser._id);
      console.log('✅ Test user deleted');
    }
    if (testProjectId) {
      await projectModel.delete(new mongoose.Types.ObjectId(testProjectId));
      console.log('✅ Test project deleted');
    }
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      console.log('🔍 Testing project creation...');
      
      const projectData = {
        name: 'Test Project Management',
        description: 'Test project for project management API testing'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send(projectData)
        .expect(201);

      console.log('📝 Create response:', response.body);

      expect(response.body).toHaveProperty('message', 'Project created successfully');
      expect(response.body.data).toHaveProperty('name', projectData.name);
      expect(response.body.data).toHaveProperty('description', projectData.description);
      expect(response.body.data).toHaveProperty('invitationCode');
      expect(response.body.data.invitationCode).toHaveLength(8);

      // Store project ID for later tests
      testProjectId = response.body.data._id;
      console.log('✅ Project created with ID:', testProjectId);
    });
  });

  describe('GET /api/projects', () => {
    it('should retrieve user projects', async () => {
      console.log('🔍 Testing project list retrieval...');
      
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 List response:', response.body);

      expect(response.body).toHaveProperty('message', 'Projects retrieved successfully');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const project = response.body.data.find((p: any) => p.name === 'Test Project Management');
      expect(project).toBeDefined();
      expect(project).toHaveProperty('members');
    });
  });
});
