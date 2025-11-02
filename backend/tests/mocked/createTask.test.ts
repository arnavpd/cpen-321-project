/**
 * Interface: POST /api/projects/:projectId/tasks
 * Tests with mocked dependencies - focusing on controller logic isolation
 */

import { Request, Response, NextFunction } from 'express';
import { taskController } from '../../src/features/tasks/task.controller';
import { taskModel } from '../../src/features/tasks/task.model';
import { userModel } from '../../src/features/users/user.model';
import { projectModel } from '../../src/features/projects/project.model';

// Mock the models
jest.mock('../../src/features/tasks/task.model');
jest.mock('../../src/features/users/user.model');
jest.mock('../../src/features/projects/project.model');

const mockedTaskModel = taskModel as jest.Mocked<typeof taskModel>;
const mockedUserModel = userModel as jest.Mocked<typeof userModel>;
const mockedProjectModel = projectModel as jest.Mocked<typeof projectModel>;

describe('Mocked: POST /api/projects/:projectId/tasks', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request object
    mockReq = {
      params: { projectId: new (require('mongoose')).Types.ObjectId().toString() },
      body: {
        name: 'Test Task',
        assignee: 'test-assignee-id',
        status: 'Not Started',
        deadline: '2025-12-31'
      },
      user: { _id: new (require('mongoose')).Types.ObjectId().toString() } as any
    };

    // Setup mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  // Input: Invalid assignee name (user not found by name)
  // Expected status code: 400
  // Expected behavior: Validation fails when assignee doesn't exist
  // Expected output: Error message about invalid assignee
  test('Invalid Assignee - Returns 400 when user not found', async () => {
    // Use an assignee name (not ObjectId) to trigger findByName path
    mockReq.body!.assignee = 'NonExistentUser';
    
    // Mock user lookup returning null
    mockedUserModel.findByName.mockResolvedValue(null);

    await taskController.createTask(mockReq as Request, mockRes as Response);

    expect(mockedUserModel.findByName).toHaveBeenCalledWith('NonExistentUser');
    expect(mockedTaskModel.create).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'User "NonExistentUser" not found'
    });
  });

  // Input: Database error during user lookup by name
  // Expected status code: 400
  // Expected behavior: Error handling for database failures during user lookup
  // Expected output: Error message about failed assignee lookup
  test('User Lookup Database Error - Returns 400 on database failure', async () => {
    // Use an assignee name to trigger findByName path
    mockReq.body!.assignee = 'TestUser';
    
    // Mock user lookup throwing error
    mockedUserModel.findByName.mockRejectedValue(new Error('Database connection failed'));

    await taskController.createTask(mockReq as Request, mockRes as Response);

    expect(mockedUserModel.findByName).toHaveBeenCalledWith('TestUser');
    expect(mockedTaskModel.create).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to find assignee'
    });
  });

  // Input: Database error during task creation
  // Expected status code: 500
  // Expected behavior: Error handling when task creation fails
  // Expected output: Server error message
  test('Task Creation Database Error - Returns 500 on creation failure', async () => {
    // Use valid ObjectId format for assignee to skip user lookup
    mockReq.body!.assignee = new (require('mongoose')).Types.ObjectId().toString();

    // Mock task creation throwing error
    mockedTaskModel.create.mockRejectedValue(new Error('Failed to create task'));

    await taskController.createTask(mockReq as Request, mockRes as Response);

    // Should not lookup user for valid ObjectId
    expect(mockedUserModel.findByName).not.toHaveBeenCalled();
    expect(mockedUserModel.findById).not.toHaveBeenCalled();
    expect(mockedTaskModel.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to create task'
    });
  });
});