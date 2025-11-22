/**
 * Comprehensive User Model Tests - Targeting Branch Coverage Improvement
 * Focus: Error handling, validation failures, null returns, edge cases
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { userModel } from '../../../src/features/users/user.model';
import { z } from 'zod';

describe('User Model Comprehensive Coverage Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      const users = await userModel.getAllUsers();
      for (const user of users) {
        if (user.email?.includes('testcoverage')) {
          await userModel.delete(user._id);
        }
      }
    } catch (err) {
      // ignore cleanup errors
    }
  });

  describe('Error Handling and Validation Branches', () => {
    test('create should handle Zod validation errors', async () => {
      // Test invalid data that will trigger Zod validation error
      const invalidUserData = {
        googleId: '', // empty string should fail validation
        email: 'invalid-email', // invalid email format
        name: '', // empty name should fail
      };

      await expect(userModel.create(invalidUserData as any)).rejects.toThrow('Invalid update data');
    });

    test('create should handle general database errors', async () => {
      // Create a user first
      const validUserData = {
        googleId: 'test_coverage_google_1',
        email: 'testcoverage1@example.com',
        name: 'Test Coverage User 1'
      };
      
      await userModel.create(validUserData);

      // Try to create another user with the same googleId (should cause duplicate key error)
      await expect(userModel.create(validUserData)).rejects.toThrow('Failed to update user');
    });

    test('update should handle Zod validation errors in user data', async () => {
      // Create a valid user first
      const validUserData = {
        googleId: 'test_coverage_google_2',
        email: 'testcoverage2@example.com',
        name: 'Test Coverage User 2'
      };
      
      const createdUser = await userModel.create(validUserData);

      // Test invalid update data
      const invalidUpdateData = {
        name: '', // empty name should fail validation
        bio: 'x'.repeat(501), // bio too long (max 500)
      };

      await expect(userModel.update(createdUser._id, invalidUpdateData as any)).rejects.toThrow('Failed to update user');
    });

    test('update should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Name' };
      
      const result = await userModel.update(nonExistentId, updateData);
      expect(result).toBeNull();
    });

    test('findById should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await userModel.findById(nonExistentId);
      expect(result).toBeNull();
    });

    test('findByGoogleId should return null for non-existent googleId', async () => {
      const result = await userModel.findByGoogleId('non-existent-google-id-12345');
      expect(result).toBeNull();
    });

    test('findByName should return null for non-existent name', async () => {
      const result = await userModel.findByName('NonExistentUserName12345');
      expect(result).toBeNull();
    });

    test('findByName should handle case-insensitive search', async () => {
      // Create a user
      const userData = {
        googleId: 'test_coverage_google_3',
        email: 'testcoverage3@example.com',
        name: 'TestCaseUser'
      };
      
      const createdUser = await userModel.create(userData);
      
      // Search with different case
      const foundUser = await userModel.findByName('testcaseuser');
      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe('TestCaseUser');
      
      // Clean up
      await userModel.delete(createdUser._id);
    });

    test('addOwnedProject should return null for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      
      const result = await userModel.addOwnedProject(nonExistentUserId, projectId);
      expect(result).toBeNull();
    });

    test('addMemberProject should return null for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      
      const result = await userModel.addMemberProject(nonExistentUserId, projectId);
      expect(result).toBeNull();
    });

    test('removeOwnedProject should return null for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      
      const result = await userModel.removeOwnedProject(nonExistentUserId, projectId);
      expect(result).toBeNull();
    });

    test('removeMemberProject should return null for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      
      const result = await userModel.removeMemberProject(nonExistentUserId, projectId);
      expect(result).toBeNull();
    });

    test('getUserProjects should return null for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      const result = await userModel.getUserProjects(nonExistentUserId);
      expect(result).toBeNull();
    });

    test('getUserProjects should return projects for existing user', async () => {
      // Create a user
      const userData = {
        googleId: 'test_coverage_google_4',
        email: 'testcoverage4@example.com',
        name: 'Test Coverage User 4'
      };
      
      const createdUser = await userModel.create(userData);
      
      // Get user projects (should be empty arrays initially)
      const result = await userModel.getUserProjects(createdUser._id);
      expect(result).toBeDefined();
      expect(result?.ownedProjects).toEqual([]);
      expect(result?.memberProjects).toEqual([]);
      
      // Clean up
      await userModel.delete(createdUser._id);
    });

    test('project management workflow with addToSet behavior', async () => {
      // Create a user
      const userData = {
        googleId: 'test_coverage_google_5',
        email: 'testcoverage5@example.com',
        name: 'Test Coverage User 5'
      };
      
      const createdUser = await userModel.create(userData);
      const projectId1 = new mongoose.Types.ObjectId();
      const projectId2 = new mongoose.Types.ObjectId();

      // Add owned projects
      let updatedUser = await userModel.addOwnedProject(createdUser._id, projectId1);
      expect(updatedUser?.ownedProjects).toHaveLength(1);

      // Add same project again (should not duplicate due to $addToSet)
      updatedUser = await userModel.addOwnedProject(createdUser._id, projectId1);
      expect(updatedUser?.ownedProjects).toHaveLength(1);

      // Add different project
      updatedUser = await userModel.addOwnedProject(createdUser._id, projectId2);
      expect(updatedUser?.ownedProjects).toHaveLength(2);

      // Add member projects
      updatedUser = await userModel.addMemberProject(createdUser._id, projectId1);
      expect(updatedUser?.memberProjects).toHaveLength(1);

      // Remove owned project
      updatedUser = await userModel.removeOwnedProject(createdUser._id, projectId1);
      expect(updatedUser?.ownedProjects).toHaveLength(1);

      // Remove member project
      updatedUser = await userModel.removeMemberProject(createdUser._id, projectId1);
      expect(updatedUser?.memberProjects).toHaveLength(0);

      // Clean up
      await userModel.delete(createdUser._id);
    });

    test('getAllUsers should handle empty database', async () => {
      // Clean all test users first
      const users = await userModel.getAllUsers();
      for (const user of users) {
        if (user.email?.includes('testcoverage')) {
          await userModel.delete(user._id);
        }
      }

      // Should return array (might be empty or have other users)
      const result = await userModel.getAllUsers();
      expect(Array.isArray(result)).toBe(true);
    });

    test('create user with minimal data vs full data', async () => {
      // Test minimal data
      const minimalData = {
        googleId: 'test_coverage_google_6',
        email: 'testcoverage6@example.com',
        name: 'Minimal User'
      };
      
      const minimalUser = await userModel.create(minimalData);
      expect(minimalUser).toBeDefined();
      expect(minimalUser.calendarEnabled).toBe(false); // default value
      expect(Array.isArray(minimalUser.ownedProjects)).toBe(true);
      expect(Array.isArray(minimalUser.memberProjects)).toBe(true);

      // Test full data
      const fullData = {
        googleId: 'test_coverage_google_7',
        email: 'testcoverage7@example.com',
        name: 'Full User',
        profilePicture: 'https://example.com/pic.jpg',
        bio: 'This is a test bio',
        calendarEnabled: true
      };
      
      const fullUser = await userModel.create(fullData);
      expect(fullUser).toBeDefined();
      expect(fullUser.bio).toBe('This is a test bio');
      expect(fullUser.profilePicture).toBe('https://example.com/pic.jpg');

      // Clean up
      await userModel.delete(minimalUser._id);
      await userModel.delete(fullUser._id);
    });

    test('update with valid data should succeed', async () => {
      // Create a user
      const userData = {
        googleId: 'test_coverage_google_8',
        email: 'testcoverage8@example.com',
        name: 'Update Test User'
      };
      
      const createdUser = await userModel.create(userData);

      // Update with valid data
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        profilePicture: 'https://example.com/new-pic.jpg',
        calendarEnabled: true
      };

      const updatedUser = await userModel.update(createdUser._id, updateData);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.bio).toBe('Updated bio');
      expect(updatedUser?.calendarEnabled).toBe(true);

      // Clean up
      await userModel.delete(createdUser._id);
    });

    test('delete should handle non-existent user gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Should not throw error even if user doesn't exist
      await expect(userModel.delete(nonExistentId)).resolves.not.toThrow();
    });

    test('complex search and manipulation workflow', async () => {
      // Create multiple users for testing
      const users = [
        {
          googleId: 'test_coverage_google_9',
          email: 'testcoverage9@example.com',
          name: 'Search Test User 1'
        },
        {
          googleId: 'test_coverage_google_10',
          email: 'testcoverage10@example.com',
          name: 'Search Test User 2'
        }
      ];

      const createdUsers = [];
      for (const userData of users) {
        const user = await userModel.create(userData);
        createdUsers.push(user);
      }

      // Test findById with both users
      for (const user of createdUsers) {
        const foundUser = await userModel.findById(user._id);
        expect(foundUser).toBeDefined();
        expect(foundUser?._id.toString()).toBe(user._id.toString());
      }

      // Test findByGoogleId with both users
      for (let i = 0; i < createdUsers.length; i++) {
        const foundUser = await userModel.findByGoogleId(users[i].googleId);
        expect(foundUser).toBeDefined();
        expect(foundUser?.googleId).toBe(users[i].googleId);
      }

      // Test findByName with both users
      for (let i = 0; i < createdUsers.length; i++) {
        const foundUser = await userModel.findByName(users[i].name);
        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe(users[i].name);
      }

      // Clean up
      for (const user of createdUsers) {
        await userModel.delete(user._id);
      }
    });
  });
});