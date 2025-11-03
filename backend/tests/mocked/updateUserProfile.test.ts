/**
 * Interface: POST /api/user/profile
 * Tests with mocking - testing user profile update with mocked dependencies
 */

import { UserController } from '../../src/features/users/user.controller';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the user model
jest.mock('../../src/features/users/user.model');
const mockUserModel = userModel as jest.Mocked<typeof userModel>;

describe('Mocked: POST /api/user/profile', () => {
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
      googleId: 'test-google-update-456',
      email: 'update-test@example.com',
      name: 'Update Test User',
      bio: 'Original bio',
      profilePicture: 'https://example.com/original-profile.jpg',
      ownedProjects: [],
      memberProjects: [],
      calendarEnabled: false,
    };
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    mockReq = {
      user: testUser,
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  // Mocked behavior: userModel.update returns updated user successfully
  // Input: Valid profile update data in request body
  // Expected status code: 200
  // Expected behavior: User profile updated successfully
  // Expected output: Success message with updated user data
  test('User Model Returns Updated User - Returns 200 Success', async () => {
    const updateData = {
      name: 'Updated Name',
      bio: 'Updated bio text'
    };
    mockReq.body = updateData;

    const updatedUser = {
      ...testUser,
      ...updateData
    };
    
    // Mock successful update
    mockUserModel.update.mockResolvedValue(updatedUser);

    await userController.updateProfile(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User info updated successfully',
      data: { user: updatedUser },
    });
    
    // Verify the model was called with correct parameters
    expect(mockUserModel.update).toHaveBeenCalledWith(testUser._id, updateData);
  });

  // Mocked behavior: userModel.update returns null (user not found)
  // Input: Valid update data but user doesn't exist
  // Expected status code: 404
  // Expected behavior: User not found in database
  // Expected output: User not found error message
  test('User Model Returns Null - Returns 404 Not Found', async () => {
    mockReq.body = { name: 'New Name' };
    
    // Mock user not found
    mockUserModel.update.mockResolvedValue(null);

    await userController.updateProfile(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
    
    // Verify the model was called
    expect(mockUserModel.update).toHaveBeenCalledWith(testUser._id, { name: 'New Name' });
  });

  // Mocked behavior: userModel.update throws error
  // Input: Valid request but database error occurs
  // Expected status code: 500
  // Expected behavior: Database error during update
  // Expected output: Internal server error message
  test('User Model Throws Error - Returns 500 Internal Server Error', async () => {
    mockReq.body = { name: 'New Name' };
    
    // Mock database error
    mockUserModel.update.mockRejectedValue(new Error('Database connection failed'));

    await userController.updateProfile(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Database connection failed',
    });
    
    // Verify the model was called
    expect(mockUserModel.update).toHaveBeenCalledWith(testUser._id, { name: 'New Name' });
  });
});