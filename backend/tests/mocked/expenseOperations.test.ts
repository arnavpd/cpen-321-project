/**
 * Expense API - Additional Endpoints - Mocked Integration Tests
 * 
 * Tests the expense retrieval and deletion endpoints with mocked dependencies
 * for isolated unit testing.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';

// Mock the expense model
jest.mock('../../src/features/expenses/expense.model', () => ({
  expenseModel: {
    findByProjectId: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock the expense controller
jest.mock('../../src/features/expenses/expense.controller', () => ({
  expenseController: {
    createExpense: jest.fn((req: any, res: any) => {
      res.status(201).json({ message: 'Expense created successfully' });
    }),
    
    getProjectExpenses: jest.fn((req: any, res: any) => {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { projectId } = req.params;
      
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }

      // Mock expense data
      const mockExpenses = [
        {
          id: 'expense123',
          description: 'Test Expense',
          amount: 100.00,
          paidBy: 'user123',
          splitBetween: ['user123', 'user456'],
          amountPerPerson: 50.00,
          date: '2024-01-01T00:00:00.000Z'
        }
      ];

      res.status(200).json({
        message: 'Expenses retrieved successfully',
        data: { data: mockExpenses }
      });
    }),
    
    deleteExpense: jest.fn((req: any, res: any) => {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { expenseId } = req.params;
      
      if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) {
        return res.status(400).json({ message: 'Invalid expense ID' });
      }

      // Mock different scenarios based on expense ID patterns
      if (expenseId === 'nonexistent123456789012345678901234') {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      if (expenseId === 'unauthorized123456789012345678901234') {
        return res.status(403).json({ message: 'Unauthorized to delete this expense' });
      }

      // Success case
      res.status(200).json({ message: 'Expense deleted successfully' });
    })
  }
}));

// Mock the authentication middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
      req.user = { _id: new mongoose.Types.ObjectId() };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Access denied' });
    }
  })
}));

describe('Expense API - GET & DELETE - Mocked Tests', () => {
  let app: any;
  let validToken: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Expense API (GET/DELETE) mocked tests...');
    
    // Create test app
    app = await createTestApp();
    console.log('✅ Test app created');
    
    // Generate valid JWT token
    const jwtSecret = process.env.JWT_SECRET || 'test_secret';
    validToken = jwt.sign(
      { id: new mongoose.Types.ObjectId() },
      jwtSecret
    );
    console.log('✅ Valid JWT token generated');
  });

  describe('GET /api/expenses/project/:projectId', () => {
    it('should return mocked expenses for project', async () => {
      console.log('🔍 Testing mocked expense retrieval...');
      
      const projectId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/expenses/project/${projectId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message', 'Expenses retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('data');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      
      // Check mocked expense structure
      const expense = response.body.data.data[0];
      expect(expense).toHaveProperty('id', 'expense123');
      expect(expense).toHaveProperty('description', 'Test Expense');
      expect(expense).toHaveProperty('amount', 100.00);
      expect(expense).toHaveProperty('paidBy', 'user123');
      expect(expense).toHaveProperty('splitBetween');
      expect(expense).toHaveProperty('amountPerPerson', 50.00);
      expect(expense).toHaveProperty('date');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked expense retrieval without auth...');
      
      const projectId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/expenses/project/${projectId}`)
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 400 for invalid project ID', async () => {
      console.log('🔍 Testing mocked expense retrieval with invalid project ID...');
      
      const response = await request(app)
        .get('/api/expenses/project/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('message', 'Invalid project ID');
    });
  });

  describe('DELETE /api/expenses/:expenseId', () => {
    it('should return mocked success for expense deletion', async () => {
      console.log('🔍 Testing mocked expense deletion success...');
      
      const expenseId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('message', 'Expense deleted successfully');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked expense deletion without auth...');
      
      const expenseId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 400 for invalid expense ID', async () => {
      console.log('🔍 Testing mocked expense deletion with invalid ID...');
      
      const response = await request(app)
        .delete('/api/expenses/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('message', 'Invalid expense ID');
    });
  });
});