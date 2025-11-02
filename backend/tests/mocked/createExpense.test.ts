/**
 * Interface: POST /api/expenses
 * Tests with mocked dependencies - focusing on controller logic isolation
 */

import { Request, Response, NextFunction } from 'express';
import { expenseController } from '../../src/features/expenses/expense.controller';
import { expenseModel } from '../../src/features/expenses/expense.model';

// Mock the expense model
jest.mock('../../src/features/expenses/expense.model');

const mockedExpenseModel = expenseModel as jest.Mocked<typeof expenseModel>;

describe('Mocked: POST /api/expenses', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request object with consistent user IDs
    const userId = new (require('mongoose')).Types.ObjectId().toString();
    mockReq = {
      body: {
        projectId: new (require('mongoose')).Types.ObjectId().toString(),
        description: 'Test Expense',
        amount: 100.00,
        paidBy: userId, // Same as the authenticated user
        splitBetween: [userId] // Same user is both payer and in split
      },
      user: { _id: userId } as any
    };

    // Setup mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  // Input: Valid request data with user authentication
  // Expected status code: 201
  // Expected behavior: Expense created successfully with split calculation
  // Expected output: Success response with expense data
  test('Successful Expense Creation - Returns 201 with expense data', async () => {
    // Mock expense creation
    const mockExpense = {
      _id: 'mock-expense-id',
      projectId: mockReq.body!.projectId,
      title: 'Test Expense',
      description: 'Test Expense',
      amount: 100.00,
      createdBy: mockReq.body!.paidBy,
      splits: [{
        userId: mockReq.body!.splitBetween[0],
        amount: 100.00,
        isPaid: true
      }],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;
    mockedExpenseModel.create.mockResolvedValue(mockExpense);

    await expenseController.createExpense(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedExpenseModel.create).toHaveBeenCalledWith(expect.objectContaining({
      projectId: expect.any(Object), // mongoose ObjectId
      title: 'Test Expense',
      description: 'Test Expense',
      amount: 100.00,
      createdBy: expect.any(Object), // mongoose ObjectId
      splits: expect.arrayContaining([
        expect.objectContaining({
          userId: expect.any(Object), // mongoose ObjectId
          amount: 100.00,
          isPaid: true
        })
      ]),
      status: 'pending'
    }));
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Expense created successfully',
      data: expect.objectContaining({
        id: 'mock-expense-id',
        projectId: mockReq.body!.projectId,
        description: 'Test Expense',
        amount: 100.00,
        amountPerPerson: 100.00,
        status: 'pending'
      })
    });
  });

  // Input: Missing required fields
  // Expected status code: 400
  // Expected behavior: Validation fails due to missing required fields
  // Expected output: Error message about missing fields
  test('Missing Required Fields - Returns 400 Bad Request', async () => {
    // Remove required fields
    mockReq.body = {
      projectId: mockReq.body!.projectId,
      description: 'Test Expense'
      // Missing amount, paidBy, splitBetween
    };

    await expenseController.createExpense(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedExpenseModel.create).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Missing required fields'
    });
  });

  // Input: Missing user authentication
  // Expected status code: 401
  // Expected behavior: Authentication check fails
  // Expected output: Authentication error message
  test('Missing Authentication - Returns 401 Unauthorized', async () => {
    // Remove user from request
    mockReq.user = undefined;

    await expenseController.createExpense(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedExpenseModel.create).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  // Input: Database error during expense creation
  // Expected status code: 500
  // Expected behavior: Error handling when expense creation fails
  // Expected output: Server error message
  test('Expense Creation Database Error - Returns 500 on creation failure', async () => {
    // Mock expense creation throwing error
    mockedExpenseModel.create.mockRejectedValue(new Error('Database connection failed'));

    await expenseController.createExpense(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedExpenseModel.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
  });

  // Input: Multiple users in split calculation
  // Expected status code: 201
  // Expected behavior: Amount is split equally among users
  // Expected output: Correct split calculation in response
  test('Multiple User Split - Calculates amount per person correctly', async () => {
    // Update request to have multiple users
    const user1 = new (require('mongoose')).Types.ObjectId().toString();
    const user2 = new (require('mongoose')).Types.ObjectId().toString();
    const user3 = new (require('mongoose')).Types.ObjectId().toString();
    
    mockReq.body!.amount = 150.00;
    mockReq.body!.splitBetween = [user1, user2, user3];
    mockReq.body!.paidBy = user1;

    // Mock expense creation
    const mockExpense = {
      _id: 'mock-expense-id',
      projectId: mockReq.body!.projectId,
      title: 'Test Expense',
      description: 'Test Expense',
      amount: 150.00,
      createdBy: user1,
      splits: [
        { userId: user1, amount: 50.00, isPaid: true },
        { userId: user2, amount: 50.00, isPaid: false },
        { userId: user3, amount: 50.00, isPaid: false }
      ],
      status: 'pending',
      createdAt: new Date()
    } as any;
    mockedExpenseModel.create.mockResolvedValue(mockExpense);

    await expenseController.createExpense(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Expense created successfully',
      data: expect.objectContaining({
        amount: 150.00,
        amountPerPerson: 50.00 // 150 / 3 users = 50 each
      })
    });
  });
});