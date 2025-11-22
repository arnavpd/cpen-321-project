/**
 * Expense Model Coverage Tests
 * 
 * Comprehensive API tests specifically designed to increase branch coverage
 * for expense.model.ts by exercising all methods and error conditions.
 * 
 * Target: Lines 99-100,110-111,122-169,177-241 (25.71% -> higher coverage)
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { userModel } from '../../../src/features/users/user.model';
import { projectModel } from '../../../src/features/projects/project.model';
import { expenseModel } from '../../../src/features/expenses/expense.model';

describe('Expense Model Coverage Tests - Branch & Line Coverage', () => {
  let app: any;
  let testUser: any;
  let testUser2: any;
  let testUser3: any;
  let testProject: any;
  let testProject2: any;
  let userToken: string;
  let user2Token: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Expense Model Coverage tests...');
    
    // Verify JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    
    app = await createTestApp();
    console.log('✅ Test app created');
    
    try {
      // Create test users
      testUser = await userModel.create({
        googleId: 'coverage-user-' + Date.now(),
        name: 'Coverage Test User 1',
        email: 'coverage-test1-' + Date.now() + '@example.com',
        profilePicture: 'coverage-profile1.jpg'
      });
      
      testUser2 = await userModel.create({
        googleId: 'coverage-user2-' + Date.now(),
        name: 'Coverage Test User 2', 
        email: 'coverage-test2-' + Date.now() + '@example.com',
        profilePicture: 'coverage-profile2.jpg'
      });
      
      testUser3 = await userModel.create({
        googleId: 'coverage-user3-' + Date.now(),
        name: 'Coverage Test User 3',
        email: 'coverage-test3-' + Date.now() + '@example.com',
        profilePicture: 'coverage-profile3.jpg'
      });
      
      // Create test projects
      testProject = await projectModel.create({
        name: 'Coverage Project 1',
        description: 'Project for expense coverage tests',
        invitationCode: 'COV1' + Date.now(),
        ownerId: testUser._id,
        members: [
          { userId: testUser._id, role: 'owner', admin: true, joinedAt: new Date() },
          { userId: testUser2._id, role: 'user', admin: false, joinedAt: new Date() }
        ],
        resources: []
      });
      
      testProject2 = await projectModel.create({
        name: 'Coverage Project 2',
        description: 'Second project for testing',
        invitationCode: 'COV2' + Date.now(),
        ownerId: testUser._id,
        members: [
          { userId: testUser._id, role: 'owner', admin: true, joinedAt: new Date() },
          { userId: testUser3._id, role: 'user', admin: false, joinedAt: new Date() }
        ],
        resources: []
      });
      
      console.log(`✅ Test data created`);
      
    } catch (error) {
      console.error('❌ Failed to create test data:', error);
      throw error;
    }
    
    // Generate JWT tokens
    userToken = jwt.sign({ id: testUser._id }, jwtSecret);
    user2Token = jwt.sign({ id: testUser2._id }, jwtSecret);
    console.log('✅ JWT tokens generated');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up coverage tests...');
    
    try {
      // Clean up expenses first
      const allExpenses = await expenseModel.findByProjectId(testProject._id);
      for (const expense of allExpenses) {
        await expenseModel.delete(expense._id);
      }
      
      const allExpenses2 = await expenseModel.findByProjectId(testProject2._id);
      for (const expense of allExpenses2) {
        await expenseModel.delete(expense._id);
      }
      
      // Clean up projects and users
      if (testProject) await projectModel.delete(testProject._id);
      if (testProject2) await projectModel.delete(testProject2._id);
      if (testUser) await userModel.delete(testUser._id);
      if (testUser2) await userModel.delete(testUser2._id);
      if (testUser3) await userModel.delete(testUser3._id);
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error);
    }
  });

  describe('Lines 122-169: findByProjectId, findByUserId, findByStatus methods', () => {
    it('should cover findByProjectId with multiple expenses and error cases', async () => {
      console.log('🔍 Testing findByProjectId coverage...');
      
      // Create multiple expenses to test findByProjectId
      const expense1 = await expenseModel.create({
        projectId: testProject._id,
        title: 'Coverage Test Expense 1',
        description: 'First expense for findByProjectId coverage',
        amount: 100.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 50.00, isPaid: false },
          { userId: testUser2._id, amount: 50.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      const expense2 = await expenseModel.create({
        projectId: testProject._id,
        title: 'Coverage Test Expense 2',
        description: 'Second expense for findByProjectId coverage',
        amount: 75.00,
        createdBy: testUser2._id,
        splits: [
          { userId: testUser._id, amount: 25.00, isPaid: true },
          { userId: testUser2._id, amount: 50.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Test findByProjectId through API
      const response = await request(app)
        .get(`/api/expenses/project/${testProject._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.data.length).toBeGreaterThanOrEqual(2);
      
      // Test with invalid project ID to cover error paths
      await request(app)
        .get('/api/expenses/project/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
      
      console.log('✅ findByProjectId method covered');
      
      // Cleanup
      await expenseModel.delete(expense1._id);
      await expenseModel.delete(expense2._id);
    });

    it('should cover findByUserId method with different user scenarios', async () => {
      console.log('🔍 Testing findByUserId coverage...');
      
      // Create expense where user is creator
      const creatorExpense = await expenseModel.create({
        projectId: testProject._id,
        title: 'User as Creator',
        amount: 60.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 30.00, isPaid: false },
          { userId: testUser2._id, amount: 30.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Create expense where user is only in splits
      const splitExpense = await expenseModel.create({
        projectId: testProject._id,
        title: 'User in Splits Only',
        amount: 80.00,
        createdBy: testUser2._id,
        splits: [
          { userId: testUser._id, amount: 40.00, isPaid: false },
          { userId: testUser2._id, amount: 40.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Directly test the model method
      const userExpenses = await expenseModel.findByUserId(testUser._id);
      expect(userExpenses.length).toBeGreaterThanOrEqual(2);
      
      console.log('✅ findByUserId method covered');
      
      // Cleanup
      await expenseModel.delete(creatorExpense._id);
      await expenseModel.delete(splitExpense._id);
    });

    it('should cover findByStatus method with different status types', async () => {
      console.log('🔍 Testing findByStatus coverage...');
      
      // Create pending expense
      const pendingExpense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Pending Status Test',
        amount: 50.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 25.00, isPaid: false },
          { userId: testUser2._id, amount: 25.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Create fully paid expense
      const paidExpense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Fully Paid Status Test',
        amount: 40.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 20.00, isPaid: true },
          { userId: testUser2._id, amount: 20.00, isPaid: true }
        ],
        status: 'fully_paid'
      });
      
      // Test findByStatus method directly
      const pendingExpenses = await expenseModel.findByStatus('pending');
      expect(pendingExpenses.length).toBeGreaterThan(0);
      
      const paidExpenses = await expenseModel.findByStatus('fully_paid');
      expect(paidExpenses.length).toBeGreaterThan(0);
      
      // Test with project filter
      const projectPendingExpenses = await expenseModel.findByStatus('pending', testProject._id);
      expect(projectPendingExpenses.length).toBeGreaterThan(0);
      
      console.log('✅ findByStatus method covered');
      
      // Cleanup
      await expenseModel.delete(pendingExpense._id);
      await expenseModel.delete(paidExpense._id);
    });
  });

  describe('Lines 177-241: update, addSplit, updateSplit, calculateTotalOwed, updateExpenseStatus', () => {
    it('should cover update method via direct model calls', async () => {
      console.log('🔍 Testing update method coverage...');
      
      const expense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Update Test',
        description: 'Original description',
        amount: 100.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 50.00, isPaid: false },
          { userId: testUser2._id, amount: 50.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Test update method directly (since API endpoint doesn't exist yet)
      const updatedExpense = await expenseModel.update(expense._id, {
        title: 'Updated Title',
        description: 'Updated description',
        amount: 120.00
      });

      expect(updatedExpense?.title).toBe('Updated Title');
      expect(updatedExpense?.description).toBe('Updated description');
      expect(updatedExpense?.amount).toBe(120.00);
      
      // Test error case - non-existent expense
      const fakeId = new mongoose.Types.ObjectId();
      const result = await expenseModel.update(fakeId, { title: 'Updated Title' });
      expect(result).toBeNull();
      
      console.log('✅ update method covered');
      
      // Cleanup
      await expenseModel.delete(expense._id);
    });

    it('should cover addSplit method functionality', async () => {
      console.log('🔍 Testing addSplit coverage...');
      
      const expense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Add Split Test',
        amount: 90.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 45.00, isPaid: false },
          { userId: testUser2._id, amount: 45.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Test addSplit method directly
      const updatedExpense = await expenseModel.addSplit(expense._id, {
        userId: testUser3._id,
        amount: 30.00,
        isPaid: false
      });
      
      expect(updatedExpense?.splits.length).toBe(3);
      console.log('✅ addSplit method covered');
      
      // Cleanup
      await expenseModel.delete(expense._id);
    });

    it('should cover updateSplit method functionality', async () => {
      console.log('🔍 Testing updateSplit coverage...');
      
      const expense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Update Split Test',
        amount: 80.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 40.00, isPaid: false },
          { userId: testUser2._id, amount: 40.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Test updateSplit method directly
      const updatedExpense = await expenseModel.updateSplit(expense._id, testUser2._id, true);
      
      const user2Split = updatedExpense?.splits.find(split => split.userId.equals(testUser2._id));
      expect(user2Split?.isPaid).toBe(true);
      
      console.log('✅ updateSplit method covered');
      
      // Cleanup
      await expenseModel.delete(expense._id);
    });

    it('should cover calculateTotalOwed method with multiple scenarios', async () => {
      console.log('🔍 Testing calculateTotalOwed coverage...');
      
      // Clean any existing expenses for testUser2 first
      const existingExpenses = await expenseModel.findByUserId(testUser2._id);
      for (const expense of existingExpenses) {
        await expenseModel.delete(expense._id);
      }
      
      // Create multiple expenses across different projects
      const expense1 = await expenseModel.create({
        projectId: testProject._id,
        title: 'Owed Test 1',
        amount: 60.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser2._id, amount: 30.00, isPaid: false },
          { userId: testUser._id, amount: 30.00, isPaid: true }
        ],
        status: 'pending'
      });
      
      const expense2 = await expenseModel.create({
        projectId: testProject._id,
        title: 'Owed Test 2',
        amount: 40.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser2._id, amount: 20.00, isPaid: false },
          { userId: testUser._id, amount: 20.00, isPaid: true }
        ],
        status: 'pending'
      });
      
      const expense3 = await expenseModel.create({
        projectId: testProject2._id,
        title: 'Owed Test 3',
        amount: 30.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser2._id, amount: 15.00, isPaid: false },
          { userId: testUser3._id, amount: 15.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Test calculateTotalOwed method directly
      const totalOwedAll = await expenseModel.calculateTotalOwed(testUser2._id);
      expect(totalOwedAll).toBe(65.00); // 30 + 20 + 15
      
      // Test with project filter
      const totalOwedProject1 = await expenseModel.calculateTotalOwed(testUser2._id, testProject._id);
      expect(totalOwedProject1).toBe(50.00); // 30 + 20
      
      console.log('✅ calculateTotalOwed method covered');
      
      // Cleanup
      await expenseModel.delete(expense1._id);
      await expenseModel.delete(expense2._id);
      await expenseModel.delete(expense3._id);
    });

    it('should cover updateExpenseStatus method with status transitions', async () => {
      console.log('🔍 Testing updateExpenseStatus coverage...');
      
      const expense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Status Update Test',
        amount: 70.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 35.00, isPaid: false },
          { userId: testUser2._id, amount: 35.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Test status update when not all splits are paid
      let updatedExpense = await expenseModel.updateExpenseStatus(expense._id);
      expect(updatedExpense?.status).toBe('pending');
      
      // Mark all splits as paid
      await expenseModel.updateSplit(expense._id, testUser._id, true);
      await expenseModel.updateSplit(expense._id, testUser2._id, true);
      
      // Test status update when all splits are paid
      updatedExpense = await expenseModel.updateExpenseStatus(expense._id);
      expect(updatedExpense?.status).toBe('fully_paid');
      
      // Test with non-existent expense
      const fakeId = new mongoose.Types.ObjectId();
      const result = await expenseModel.updateExpenseStatus(fakeId);
      expect(result).toBeNull();
      
      console.log('✅ updateExpenseStatus method covered');
      
      // Cleanup
      await expenseModel.delete(expense._id);
    });
  });

  describe('Lines 99-100,110-111: Error handling in create and findById', () => {
    it('should cover error handling paths in create and findById', async () => {
      console.log('🔍 Testing error handling coverage...');
      
      // Test findById with non-existent ID
      const fakeId = new mongoose.Types.ObjectId('000000000000000000000000');
      const result = await expenseModel.findById(fakeId);
      expect(result).toBeNull();
      
      // Test API error paths
      await request(app)
        .get(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
      
      console.log('✅ Error handling paths covered');
    });
  });

  describe('Complex integration scenarios', () => {
    it('should test complete expense lifecycle covering multiple methods', async () => {
      console.log('🔍 Testing complete expense lifecycle...');
      
      // Create expense
      const expense = await expenseModel.create({
        projectId: testProject._id,
        title: 'Lifecycle Test',
        amount: 150.00,
        createdBy: testUser._id,
        splits: [
          { userId: testUser._id, amount: 50.00, isPaid: false },
          { userId: testUser2._id, amount: 100.00, isPaid: false }
        ],
        status: 'pending'
      });
      
      // Add split (covers addSplit)
      await expenseModel.addSplit(expense._id, {
        userId: testUser3._id,
        amount: 25.00,
        isPaid: false
      });
      
      // Update payments (covers updateSplit)
      await expenseModel.updateSplit(expense._id, testUser._id, true);
      await expenseModel.updateSplit(expense._id, testUser2._id, true);
      
      // Calculate debt (covers calculateTotalOwed)
      const totalOwed = await expenseModel.calculateTotalOwed(testUser3._id);
      expect(totalOwed).toBeGreaterThan(0);
      
      // Update expense (covers update)
      await expenseModel.update(expense._id, {
        title: 'Updated Lifecycle Test',
        description: 'Updated after lifecycle operations'
      });
      
      // Update status (covers updateExpenseStatus)
      await expenseModel.updateExpenseStatus(expense._id);
      
      // Find by various criteria (covers findByUserId, findByStatus, findByProjectId)
      await expenseModel.findByUserId(testUser._id);
      await expenseModel.findByStatus('pending');
      await expenseModel.findByProjectId(testProject._id);
      
      console.log('✅ Complete lifecycle test completed');
      
      // Cleanup
      await expenseModel.delete(expense._id);
    });
  });
});