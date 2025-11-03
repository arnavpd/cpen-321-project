/**
 * Task Management Operations API - Unmocked Integration Tests
 * 
 * Tests the task management endpoints (GET, PUT, DELETE) with real authentication
 * and database interactions (no mocks).
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';
import { taskModel } from '../../src/features/tasks/task.model';

describe('Task Management Operations API - Unmocked Tests', () => {
  let app: any;
  let testUser: any;
  let testUser2: any;
  let testProject: any;
  let testTask: any;
  let validToken: string;
  let validToken2: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Task Management Operations unmocked tests...');
    
    // Verify JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    console.log('✅ JWT_SECRET loaded for tests');
    
    // Create test app
    app = await createTestApp();
    console.log('✅ Test app created');
    
    try {
      // Create first test user
      testUser = await userModel.create({
        googleId: 'test-task-mgmt-user-' + Date.now(),
        name: 'Task Mgmt Test User 1',
        email: 'task-mgmt-test1-' + Date.now() + '@example.com',
        profilePicture: 'test-task-mgmt-profile.jpg'
      });
      console.log(`✅ Test user 1 created with ID: ${testUser._id}`);

      // Create second test user
      testUser2 = await userModel.create({
        googleId: 'test-task-mgmt-user2-' + Date.now(),
        name: 'Task Mgmt Test User 2',
        email: 'task-mgmt-test2-' + Date.now() + '@example.com',
        profilePicture: 'test-task-mgmt-profile2.jpg'
      });
      console.log(`✅ Test user 2 created with ID: ${testUser2._id}`);
      
      // Create a test project
      testProject = await projectModel.create({
        name: 'Task Management Test Project ' + Date.now(),
        description: 'A project for testing task management operations',
        invitationCode: 'TASK' + Date.now(),
        ownerId: testUser._id,
        members: [
          {
            userId: testUser._id,
            role: 'owner',
            admin: true,
            joinedAt: new Date()
          },
          {
            userId: testUser2._id,
            role: 'user',
            admin: false,
            joinedAt: new Date()
          }
        ],
        resources: []
      });
      console.log(`✅ Test project created with ID: ${testProject._id}`);

      // Create a test task
      testTask = await taskModel.create({
        projectId: testProject._id,
        title: 'Test Task for Management',
        description: 'A test task for management operations',
        assignees: [testUser._id],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        status: 'not_started',
        createdBy: testUser._id
      });
      console.log(`✅ Test task created with ID: ${testTask._id}`);
      
    } catch (error) {
      console.error('❌ Failed to create test data:', error);
      throw error;
    }
    
    // Generate valid JWT tokens
    validToken = jwt.sign(
      { id: testUser._id },
      jwtSecret
    );
    validToken2 = jwt.sign(
      { id: testUser2._id },
      jwtSecret
    );
    console.log('✅ Valid JWT tokens generated');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up task management tests...');
    
    try {
      // Clean up test data
      if (testTask) {
        await taskModel.delete(testTask._id);
        console.log('✅ Test task cleaned up');
      }
      if (testProject) {
        // Clean up any remaining tasks in the project
        const allTasks = await taskModel.getAllTasks();
        const projectTasks = allTasks.filter(task => task.projectId && task.projectId.toString() === testProject._id.toString());
        for (const task of projectTasks) {
          await taskModel.delete(task._id);
        }
        
        await projectModel.delete(testProject._id);
        console.log('✅ Test project cleaned up');
      }
      if (testUser) {
        await userModel.delete(testUser._id);
        console.log('✅ Test user 1 cleaned up');
      }
      if (testUser2) {
        await userModel.delete(testUser2._id);
        console.log('✅ Test user 2 cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error);
    }
  });

  describe('GET /api/projects/:projectId/tasks', () => {
    it('should retrieve tasks for authenticated user in project', async () => {
      console.log('🔍 Testing task retrieval for project...');
      
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check task structure
      const task = response.body.data[0];
      expect(task).toHaveProperty('_id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('assignees');
      expect(task).toHaveProperty('projectId');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing task retrieval without auth...');
      
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/tasks`)
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return empty array for project with no tasks', async () => {
      console.log('🔍 Testing task retrieval for project with no tasks...');
      
      // Create a new project with no tasks
      const emptyProject = await projectModel.create({
        name: 'Empty Project ' + Date.now(),
        description: 'A project with no tasks',
        invitationCode: 'EMPTY' + Date.now(),
        ownerId: testUser._id,
        members: [{
          userId: testUser._id,
          role: 'owner',
          admin: true,
          joinedAt: new Date()
        }],
        resources: []
      });

      const response = await request(app)
        .get(`/api/projects/${emptyProject._id}/tasks`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      expect(response.body.data).toHaveLength(0);

      // Clean up empty project
      await projectModel.delete(emptyProject._id);
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    it('should retrieve task by ID for authenticated user', async () => {
      console.log('🔍 Testing task retrieval by ID...');
      
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', testTask._id.toString());
      expect(response.body.data).toHaveProperty('title', 'Test Task for Management');
      expect(response.body.data).toHaveProperty('status', 'not_started');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing task retrieval by ID without auth...');
      
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent task', async () => {
      console.log('🔍 Testing task retrieval for non-existent task...');
      
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('message', 'Task not found');
    });

    it('should return 500 for invalid task ID', async () => {
      console.log('🔍 Testing task retrieval with invalid ID...');
      
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    let updateTestTask: any;

    beforeEach(async () => {
      // Create a fresh task for each update test
      updateTestTask = await taskModel.create({
        projectId: testProject._id,
        title: 'Update Test Task',
        description: 'A task to be updated in tests',
        assignees: [testUser._id],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'not_started',
        createdBy: testUser._id
      });
      console.log(`✅ Update test task created: ${updateTestTask._id}`);
    });

    afterEach(async () => {
      // Clean up any remaining test task
      try {
        if (updateTestTask) {
          const exists = await taskModel.findById(updateTestTask._id);
          if (exists) {
            await taskModel.delete(updateTestTask._id);
            console.log('✅ Update test task cleaned up');
          }
        }
      } catch (error) {
        // Task might already be deleted, that's okay
      }
    });

    it('should update task successfully', async () => {
      console.log('🔍 Testing task update...');
      
      const updateData = {
        title: 'Updated Task Name',
        status: 'in_progress',
        description: 'Updated task description'
      };

      const response = await request(app)
        .put(`/api/tasks/${updateTestTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', 'Updated Task Name');
      expect(response.body.data).toHaveProperty('status', 'in_progress');
      expect(response.body.data).toHaveProperty('description', 'Updated task description');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing task update without auth...');
      
      const response = await request(app)
        .put(`/api/tasks/${updateTestTask._id}`)
        .send({ title: 'Updated Name' })
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent task', async () => {
      console.log('🔍 Testing task update for non-existent task...');
      
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Name' })
        .expect(404);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('message', 'Task not found');
    });

    it('should return 500 for invalid task ID', async () => {
      console.log('🔍 Testing task update with invalid ID...');
      
      const response = await request(app)
        .put('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Name' })
        .expect(500);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    let deleteTestTask: any;

    beforeEach(async () => {
      // Create a fresh task for each delete test
      deleteTestTask = await taskModel.create({
        projectId: testProject._id,
        title: 'Delete Test Task',
        description: 'A task to be deleted in tests',
        assignees: [testUser._id],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'not_started',
        createdBy: testUser._id
      });
      console.log(`✅ Delete test task created: ${deleteTestTask._id}`);
    });

    afterEach(async () => {
      // Clean up any remaining test task
      try {
        if (deleteTestTask) {
          const exists = await taskModel.findById(deleteTestTask._id);
          if (exists) {
            await taskModel.delete(deleteTestTask._id);
            console.log('✅ Delete test task cleaned up');
          }
        }
      } catch (error) {
        // Task might already be deleted, that's okay
      }
    });

    it('should delete task successfully', async () => {
      console.log('🔍 Testing task deletion...');
      
      const response = await request(app)
        .delete(`/api/tasks/${deleteTestTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task deleted successfully');

      // Verify task is actually deleted
      const deletedTask = await taskModel.findById(deleteTestTask._id);
      expect(deletedTask).toBeNull();
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing task deletion without auth...');
      
      const response = await request(app)
        .delete(`/api/tasks/${deleteTestTask._id}`)
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');

      // Verify task still exists
      const stillExists = await taskModel.findById(deleteTestTask._id);
      expect(stillExists).toBeTruthy();
    });

    it('should return 200 for non-existent task (silently succeeds)', async () => {
      console.log('🔍 Testing task deletion for non-existent task...');
      
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task deleted successfully');
    });

    it('should return 500 for invalid task ID', async () => {
      console.log('🔍 Testing task deletion with invalid ID...');
      
      const response = await request(app)
        .delete('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/tasks/debug/all', () => {
    it('should retrieve all tasks for authenticated user (debug endpoint)', async () => {
      console.log('🔍 Testing debug all tasks endpoint...');
      
      const response = await request(app)
        .get('/api/tasks/debug/all')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing debug all tasks without auth...');
      
      const response = await request(app)
        .get('/api/tasks/debug/all')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/tasks/debug/users', () => {
    it('should retrieve all users for authenticated user (debug endpoint)', async () => {
      console.log('🔍 Testing debug all users endpoint...');
      
      const response = await request(app)
        .get('/api/tasks/debug/users')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing debug all users without auth...');
      
      const response = await request(app)
        .get('/api/tasks/debug/users')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });
});