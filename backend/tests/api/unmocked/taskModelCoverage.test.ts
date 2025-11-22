/**
 * Task Model Coverage API Tests
 * 
 * Tests designed to improve branch coverage for task.model.ts from 0% to higher percentage
 * by testing error handling paths and edge cases that aren't covered by normal API operations.
 * 
 * Target: Lines 88-93,101-105,118-174,182-186,194-230,243-247 (0% -> higher branch coverage)
 * 
 * Uses a simple approach to test error branches by creating scenarios that trigger database errors
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { userModel } from '../../../src/features/users/user.model';
import { projectModel } from '../../../src/features/projects/project.model';
import { taskModel } from '../../../src/features/tasks/task.model';

describe('Task Model Coverage API Tests', () => {
  let app: any;
  let testUser: any;
  let testProject: any;
  let validToken: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Task Model Coverage tests...');
    
    // Verify JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    
    // Create test app
    app = await createTestApp();
    
    // Create test user
    testUser = await userModel.create({
      googleId: 'test-task-coverage-user-' + Date.now(),
      name: 'Task Coverage Test User',
      email: 'task-coverage-test-' + Date.now() + '@example.com',
      profilePicture: 'test-coverage.jpg'
    });
    console.log(`✅ Test user created with ID: ${testUser._id}`);

    // Create test project
    testProject = await projectModel.create({
      name: 'Task Coverage Test Project ' + Date.now(),
      description: 'A project for testing task model coverage',
      invitationCode: 'COVERAGE' + Date.now(),
      ownerId: testUser._id,
      members: [{
        userId: testUser._id,
        role: 'owner',
        admin: true,
        joinedAt: new Date()
      }],
      resources: []
    });
    console.log(`✅ Test project created with ID: ${testProject._id}`);
    
    // Generate JWT token
    validToken = jwt.sign({ id: testUser._id }, jwtSecret);
    console.log('✅ Valid JWT token generated');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Task Model Coverage tests...');
    
    try {
      // Clean up test data
      if (testProject) {
        // Clean up any tasks in the project
        const allTasks = await taskModel.getAllTasks();
        const projectTasks = allTasks.filter(task => 
          task.projectId && task.projectId.toString() === testProject._id.toString());
        for (const task of projectTasks) {
          await taskModel.delete(task._id);
        }
        
        await projectModel.delete(testProject._id);
        console.log('✅ Test project cleaned up');
      }
      if (testUser) {
        await userModel.delete(testUser._id);
        console.log('✅ Test user cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error);
    }
  });

  describe('Direct TaskModel Method Testing for Branch Coverage', () => {
    let originalTaskModel: any;

    beforeEach(() => {
      // Store original for restoration
      originalTaskModel = taskModel['task'];
    });

    afterEach(() => {
      // Restore original after each test
      if (originalTaskModel) {
        taskModel['task'] = originalTaskModel;
      }
    });

    it('should test TaskModel.create() error branches (Lines 88-93)', async () => {
      console.log('🔍 Testing TaskModel.create() error handling...');
      
      try {
        // Test with invalid data that will cause MongoDB error
        const invalidTaskData = {
          // Missing required projectId
          title: 'Test Task Without Required Fields',
          assignees: ['invalid-object-id'],
          status: 'invalid_status',
          createdBy: 'another-invalid-id'
        };

        await taskModel.create(invalidTaskData as any);
        
        // Should not reach here if error handling works
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in create():', error.message);
        // This should trigger the error handling branch that throws "Failed to create task"
        expect(error.message).toBe('Failed to create task');
      }
    });

    it('should test TaskModel.findById() error branches (Lines 101-105)', async () => {
      console.log('🔍 Testing TaskModel.findById() error handling...');
      
      try {
        // Test with malformed ObjectId that will cause database error
        const malformedId = 'definitely-not-a-valid-objectid-that-will-cause-error';
        await taskModel.findById(malformedId as any);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in findById():', error.message);
        expect(error.message).toBe('Failed to find task');
      }
    });

    it('should test TaskModel.findByProjectId() error branches (Lines 118-124)', async () => {
      console.log('🔍 Testing TaskModel.findByProjectId() error handling...');
      
      // Mock the underlying MongoDB task model to throw an error
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Simulated database error'))
      });
      
      taskModel['task'] = { find: mockFind };
      
      try {
        await taskModel.findByProjectId(testProject._id);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in findByProjectId():', error.message);
        expect(error.message).toBe('Failed to find tasks');
      }
    });

    it('should test TaskModel.findByAssignee() error branches (Lines 126-134)', async () => {
      console.log('🔍 Testing TaskModel.findByAssignee() error handling...');
      
      // Mock to throw error in the populate/sort chain
      const mockSort = jest.fn().mockRejectedValue(new Error('Database error in sort'));
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });
      
      taskModel['task'] = { find: mockFind };
      
      try {
        await taskModel.findByAssignee(testUser._id);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in findByAssignee():', error.message);
        expect(error.message).toBe('Failed to find tasks');
      }
    });

    it('should test TaskModel.findByStatus() error branches (Lines 136-148)', async () => {
      console.log('🔍 Testing TaskModel.findByStatus() error handling...');
      
      // Mock to throw error
      const mockSort = jest.fn().mockRejectedValue(new Error('Database error in findByStatus'));
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
      
      taskModel['task'] = { find: mockFind };
      
      try {
        await taskModel.findByStatus('not_started', testProject._id);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in findByStatus():', error.message);
        expect(error.message).toBe('Failed to find tasks');
      }
    });

    it('should test TaskModel.findByStatus() without projectId', async () => {
      console.log('🔍 Testing TaskModel.findByStatus() without projectId...');
      
      // Test the branch where projectId is not provided
      const mockSort = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
      
      taskModel['task'] = { find: mockFind };
      
      try {
        await taskModel.findByStatus('completed');
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in findByStatus() without projectId:', error.message);
        expect(error.message).toBe('Failed to find tasks');
      }
    });

    it('should test TaskModel.findUpcomingDeadlines() error branches (Lines 150-166)', async () => {
      console.log('🔍 Testing TaskModel.findUpcomingDeadlines() error handling...');
      
      // Mock to throw error in the populate/sort chain
      const mockSort = jest.fn().mockRejectedValue(new Error('Database error in deadline query'));
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });
      
      taskModel['task'] = { find: mockFind };
      
      try {
        await taskModel.findUpcomingDeadlines(14);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in findUpcomingDeadlines():', error.message);
        expect(error.message).toBe('Failed to find upcoming deadlines');
      }
    });

    it('should test TaskModel.update() error branches (Lines 182-186)', async () => {
      console.log('🔍 Testing TaskModel.update() error handling...');
      
      // Mock findByIdAndUpdate to throw error
      const mockFindByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database update error'));
      
      taskModel['task'] = { findByIdAndUpdate: mockFindByIdAndUpdate };
      
      try {
        await taskModel.update(testUser._id, { title: 'Updated Title' });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in update():', error.message);
        expect(error.message).toBe('Failed to update task');
      }
    });

    it('should test TaskModel.delete() error branches (Lines 194-200)', async () => {
      console.log('🔍 Testing TaskModel.delete() error handling...');
      
      // Mock findByIdAndDelete to throw error
      const mockFindByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database delete error'));
      
      taskModel['task'] = { findByIdAndDelete: mockFindByIdAndDelete };
      
      try {
        await taskModel.delete(testUser._id);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in delete():', error.message);
        expect(error.message).toBe('Failed to delete task');
      }
    });

    it('should test TaskModel.addAssignee() error branches (Lines 202-212)', async () => {
      console.log('🔍 Testing TaskModel.addAssignee() error handling...');
      
      // Mock findByIdAndUpdate to throw error
      const mockFindByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database addAssignee error'));
      
      taskModel['task'] = { findByIdAndUpdate: mockFindByIdAndUpdate };
      
      try {
        await taskModel.addAssignee(testUser._id, testUser._id);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in addAssignee():', error.message);
        expect(error.message).toBe('Failed to add assignee to task');
      }
    });

    it('should test TaskModel.removeAssignee() error branches (Lines 220-230)', async () => {
      console.log('🔍 Testing TaskModel.removeAssignee() error handling...');
      
      // Mock findByIdAndUpdate to throw error
      const mockFindByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database removeAssignee error'));
      
      taskModel['task'] = { findByIdAndUpdate: mockFindByIdAndUpdate };
      
      try {
        await taskModel.removeAssignee(testUser._id, testUser._id);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in removeAssignee():', error.message);
        expect(error.message).toBe('Failed to remove assignee from task');
      }
    });

    it('should test TaskModel.getAllTasks() error branches (Lines 243-247)', async () => {
      console.log('🔍 Testing TaskModel.getAllTasks() error handling...');
      
      // Mock the chain to throw error
      const mockSort = jest.fn().mockRejectedValue(new Error('Database getAllTasks error'));
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });
      
      taskModel['task'] = { find: mockFind };
      
      try {
        await taskModel.getAllTasks();
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Error caught in getAllTasks():', error.message);
        expect(error.message).toBe('Failed to get all tasks');
      }
    });
  });

  describe('Error instanceof testing for branch coverage', () => {
    let originalTaskModel: any;

    beforeEach(() => {
      originalTaskModel = taskModel['task'];
    });

    afterEach(() => {
      if (originalTaskModel) {
        taskModel['task'] = originalTaskModel;
      }
    });

    it('should test Error instance detection in catch blocks', async () => {
      console.log('🔍 Testing Error instance detection...');
      
      // Mock to throw a proper Error instance with stack trace
      const errorWithStack = new Error('Database connection lost');
      errorWithStack.stack = 'Error: Database connection lost\n    at Object.test';
      
      const mockCreate = jest.fn().mockRejectedValue(errorWithStack);
      taskModel['task'] = { create: mockCreate };
      
      try {
        await taskModel.create({ title: 'Test Task' } as any);
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Caught Error instance:', error.message);
        expect(error.message).toBe('Failed to create task');
      }
    });

    it('should test non-Error exception handling', async () => {
      console.log('🔍 Testing non-Error exception handling...');
      
      // Mock to throw a non-Error object
      const nonErrorException = { code: 'CONNECTION_FAILED', details: 'Database unreachable' };
      
      const mockFindById = jest.fn().mockRejectedValue(nonErrorException);
      taskModel['task'] = { findById: mockFindById };
      
      try {
        await taskModel.findById(testUser._id);
        expect(true).toBe(false);
      } catch (error: any) {
        console.log('📝 Caught non-Error exception:', error.message);
        expect(error.message).toBe('Failed to find task');
      }
    });
  });

  describe('API Integration Tests for Coverage', () => {
    it('should trigger error branches through API calls', async () => {
      console.log('🔍 Testing API calls that trigger task model errors...');
      
      // Test with invalid task ID format in API call
      const response1 = await request(app)
        .get('/api/tasks/invalid-task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response1.body).toHaveProperty('message', 'Failed to get task');

      // Test with non-existent task ID
      const nonExistentId = new mongoose.Types.ObjectId();
      const response2 = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response2.body).toHaveProperty('message', 'Task not found');
    });

    it('should test API endpoints that use task model methods', async () => {
      console.log('🔍 Testing various API endpoints for task model coverage...');
      
      // Test GET all tasks (triggers getAllTasks)
      const response1 = await request(app)
        .get('/api/tasks/debug/all')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response1.body).toHaveProperty('success', true);
      expect(response1.body).toHaveProperty('data');

      // Test GET tasks by project (triggers findByProjectId)
      const response2 = await request(app)
        .get(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response2.body).toHaveProperty('success', true);
      expect(response2.body).toHaveProperty('data');

      // Create a task for further testing
      const testTask = await taskModel.create({
        projectId: testProject._id,
        title: 'API Integration Test Task',
        assignees: [testUser._id],
        status: 'not_started',
        createdBy: testUser._id
      });

      // Test task update (triggers update method)
      const response3 = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Task Title' })
        .expect(200);

      expect(response3.body).toHaveProperty('success', true);
      expect(response3.body.data).toHaveProperty('title', 'Updated Task Title');

      // Test task deletion (triggers delete method)
      const response4 = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response4.body).toHaveProperty('success', true);
      expect(response4.body).toHaveProperty('message', 'Task deleted successfully');
    });
  });
});