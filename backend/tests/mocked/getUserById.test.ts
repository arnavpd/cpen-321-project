/**
 * Interface: GET /api/user/:userId
 * Tests with mocking - simulating user database lookups
 */

import { UserController } from '../../src/features/users/user.controller';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the user model
jest.mock('../../src/features/users/user.model');
const mockUserModel = userModel as jest.Mocked<typeof userModel>;

describe('Mocked: GET /api/user/:userId', () => {
  let userController: UserController;
  let testUser: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeAll(() => {
    userController = new UserController();

    // Mock test user data
    testUser = {
      _id: new mongoose.Types.ObjectId(),
      googleId: 'test-google-user-789',
      email: 'testuser@example.com',
      name: 'Test User',
      profilePicture: 'https://example.com/test-profile.jpg',
      ownedProjects: [],
      memberProjects: [],
      calendarEnabled: false,
    };
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  // Mocked behavior: userModel.findById returns user successfully
  // Input: Valid user ID in request params
  // Expected status code: 200
  // Expected behavior: User found and returned
  // Expected output: Success message with user data
  test('User Model Returns User - Returns 200 Success', async () => {
    const userId = testUser._id.toString();
    mockReq = {
      params: { userId }
    };
    
    // Mock successful user lookup
    mockUserModel.findById.mockResolvedValue(testUser);

    await userController.getUserById(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User fetched successfully',
      data: { user: testUser },
    });
    
    // Verify the model was called with correct ObjectId
    expect(mockUserModel.findById).toHaveBeenCalledWith(new mongoose.Types.ObjectId(userId));
  });

  // Mocked behavior: userModel.findById returns null (user not found)
  // Input: Valid user ID format but user doesn't exist
  // Expected status code: 404
  // Expected behavior: User not found in database
  // Expected output: User not found error message
  test('User Model Returns Null - Returns 404 Not Found', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    mockReq = {
      params: { userId }
    };
    
    // Mock user not found
    mockUserModel.findById.mockResolvedValue(null);

    await userController.getUserById(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
    
    // Verify the model was called
    expect(mockUserModel.findById).toHaveBeenCalledWith(new mongoose.Types.ObjectId(userId));
  });

  // Mocked behavior: Invalid user ID format
  // Input: Invalid user ID format in request params
  // Expected status code: 400
  // Expected behavior: User ID validation fails
  // Expected output: Invalid user ID format error message
  test('Invalid User ID Format - Returns 400 Bad Request', async () => {
    mockReq = {
      params: { userId: 'invalid-id-format' }
    };

    await userController.getUserById(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid user ID format',
    });
    
    // Should not call the database
    expect(mockUserModel.findById).not.toHaveBeenCalled();
  });
});