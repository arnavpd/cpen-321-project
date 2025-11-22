/**
 * Task Routes API - Unmocked Integration Tests
 * Tests for src/task.routes.ts specifically
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { createTestApp } from '../../testApp';
import { userModel } from '../../../src/features/users/user.model';
import { taskModel } from '../../../src/features/tasks/task.model';
import { projectModel } from '../../../src/features/projects/project.model';

describe('Task Routes - Direct Routes Tests', () => {
  let app: any;
  let testUser: any;
  let testProject: any;
  let testTask: any;
  let validToken: string;
  const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  beforeAll(async () => {
    console.log('🔧 Setting up Task Routes tests...');
    
    // Create test app - it already includes database connection
    app = await createTestApp();
    
    // Import and mount the task router
    const taskRouter = require('../../../src/task.routes').default;
    app.use('/api/tasks', taskRouter);

    // Create test user with correct structure  
    const uniqueId = `taskroutes-test-${Date.now()}`;
    try {
      testUser = await userModel.create({
        googleId: `test-task-routes-${uniqueId}`,
        email: `${uniqueId}@test.com`, 
        name: 'Task Routes Test User',
        profilePicture: 'https://example.com/taskroutes-profile.jpg'
      });
      console.log('✅ Test user created:', testUser._id);
    } catch (error) {
      console.error('❌ Failed to create test user:', error);
      throw error;
    }

    // Generate valid JWT token with improved error handling
    const envPath = path.join(__dirname, '../../../.env.test');
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

    // Create test project
    testProject = await projectModel.create({
      name: 'Task Routes Test Project',
      description: 'Test project for task routes testing',
      ownerId: testUser._id,
      members: [{
        userId: testUser._id,
        role: 'owner',
        admin: true,
        joinedAt: new Date()
      }],
      invitationCode: `TSK${uniqueId.slice(-5)}`,
      isActive: true,
      resources: []
    });
    console.log('✅ Test project created:', testProject._id);

    // Create test task
    testTask = await taskModel.create({
      title: 'Test Task for Routes',
      description: 'A test task for routes testing',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignees: [testUser._id],
      projectId: testProject._id,
      status: 'not_started',
      createdBy: testUser._id
    });
    console.log('✅ Test task created:', testTask._id);
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Task Routes tests...');
    
    // Clean up test data using the correct methods
    if (testUser) await userModel.delete(testUser._id);
    if (testProject) await projectModel.delete(testProject._id);
    if (testTask) await taskModel.delete(testTask._id);

    // Close database connection
    await mongoose.connection.close();
  });

  describe('GET /api/tasks/debug/all', () => {
    it('should get all tasks successfully with authentication', async () => {
      const response = await request(app)
        .get('/api/tasks/debug/all')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      // Find our test task
      const ourTask = response.body.data.find((task: any) => 
        task.title === 'Test Task for Routes'
      );
      expect(ourTask).toBeDefined();
      expect(ourTask.title).toBe('Test Task for Routes');
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .get('/api/tasks/debug/all')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/tasks/debug/all')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return tasks with proper structure', async () => {
      const response = await request(app)
        .get('/api/tasks/debug/all')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        const firstTask = response.body.data[0];
        expect(firstTask).toHaveProperty('_id');
        expect(firstTask).toHaveProperty('title');
        expect(firstTask).toHaveProperty('status');
        expect(firstTask).toHaveProperty('createdAt');
      }
    });
  });

  describe('GET /api/tasks/debug/users', () => {
    it('should get all users successfully with authentication', async () => {
      const response = await request(app)
        .get('/api/tasks/debug/users')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      // Find our test user
      const ourUser = response.body.data.find((user: any) => 
        user.email.includes('taskroutes-test-')
      );
      expect(ourUser).toBeDefined();
      expect(ourUser.email).toMatch(/taskroutes-test-\d+@test\.com/);
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .get('/api/tasks/debug/users')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/tasks/debug/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    it('should get task by ID successfully with authentication', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', 'Test Task for Routes');
      expect(response.body.data).toHaveProperty('_id', testTask._id.toString());
      expect(response.body.data).toHaveProperty('status', 'not_started');
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .expect(401);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });

    it('should return 500 for invalid task ID format', async () => {
      await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update task successfully with authentication', async () => {
      const updateData = {
        title: 'Updated Test Task',
        description: 'Updated description',
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', 'Updated Test Task');
      expect(response.body.data).toHaveProperty('status', 'in_progress');
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .send({ title: 'Updated Task' })
        .expect(401);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Task' })
        .expect(404);
    });

    it('should return 500 for invalid task ID format', async () => {
      await request(app)
        .put('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Task' })
        .expect(500);
    });

    it('should successfully update task with minimal data', async () => {
      const updateData = {
        description: 'Updated description only'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('description', 'Updated description only');
    });

    it('should handle empty update data gracefully', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      // Should return the task with whatever state it's currently in
      expect(response.body.data).toHaveProperty('_id', testTask._id.toString());
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    let taskToDelete: any;

    beforeEach(async () => {
      // Create a fresh task for each delete test
      taskToDelete = await taskModel.create({
        title: 'Task to Delete',
        description: 'This task will be deleted',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignees: [testUser._id],
        projectId: testProject._id,
        status: 'not_started',
        createdBy: testUser._id
      });
    });

    it('should delete task successfully with authentication', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify task is deleted
      const deletedTask = await taskModel.findById(taskToDelete._id);
      expect(deletedTask).toBeNull();
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .delete(`/api/tasks/${taskToDelete._id}`)
        .expect(401);
    });

    it('should return 200 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('should return 500 for invalid task ID format', async () => {
      await request(app)
        .delete('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
    });

    afterEach(async () => {
      // Clean up the task if it still exists
      if (taskToDelete && taskToDelete._id) {
        await taskModel.delete(taskToDelete._id).catch(() => {});
      }
    });
  });
});