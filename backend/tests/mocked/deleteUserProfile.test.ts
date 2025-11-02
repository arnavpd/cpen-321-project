/**
 * Interface: DELETE /api/user/profile
 * Tests with mocking - testing user profile deletion with mocked dependencies
 */

import { UserController } from '../../src/features/users/user.controller';
import { userModel } from '../../src/features/users/user.model';
import { MediaService } from '../../src/features/media/media.service';
import mongoose from 'mongoose';

// Mock the dependencies
jest.mock('../../src/features/users/user.model');
jest.mock('../../src/features/media/media.service');

const mockUserModel = userModel as jest.Mocked<typeof userModel>;
const mockMediaService = MediaService as jest.Mocked<typeof MediaService>;

describe('Mocked: DELETE /api/user/profile', () => {
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
      googleId: 'test-google-delete-789',
      email: 'delete-test@example.com',
      name: 'Delete Test User',
      profilePicture: 'https://example.com/delete-profile.jpg',
      ownedProjects: [],
      memberProjects: [],
      calendarEnabled: false,
    };
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    mockReq = {
      user: testUser
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  // Mocked behavior: User deletion succeeds with media cleanup
  // Input: Authenticated user request
  // Expected status code: 200
  // Expected behavior: User deleted successfully with media cleanup
  // Expected output: Success message
  test('Successful User Deletion - Returns 200 Success', async () => {
    // Mock successful media deletion
    mockMediaService.deleteAllUserImages.mockResolvedValue(undefined);
    // Mock successful user deletion
    mockUserModel.delete.mockResolvedValue(undefined);

    await userController.deleteProfile(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User deleted successfully',
    });
    
    // Verify media cleanup was called
    expect(mockMediaService.deleteAllUserImages).toHaveBeenCalledWith(testUser._id.toString());
    // Verify user deletion was called
    expect(mockUserModel.delete).toHaveBeenCalledWith(testUser._id);
  });

  // Mocked behavior: Media service throws error during deletion
  // Input: Authenticated user request but media service fails
  // Expected status code: 500
  // Expected behavior: Media deletion fails
  // Expected output: Internal server error message
  test('Media Service Throws Error - Returns 500 Internal Server Error', async () => {
    // Mock media service error
    mockMediaService.deleteAllUserImages.mockRejectedValue(new Error('Failed to delete media files'));

    await userController.deleteProfile(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Failed to delete media files',
    });
    
    // Verify media cleanup was attempted
    expect(mockMediaService.deleteAllUserImages).toHaveBeenCalledWith(testUser._id.toString());
    // User deletion should not be called if media cleanup fails
    expect(mockUserModel.delete).not.toHaveBeenCalled();
  });

  // Mocked behavior: User model throws error during deletion
  // Input: Authenticated user request but user deletion fails
  // Expected status code: 500
  // Expected behavior: User deletion fails after successful media cleanup
  // Expected output: Internal server error message
  test('User Model Throws Error - Returns 500 Internal Server Error', async () => {
    // Mock successful media deletion
    mockMediaService.deleteAllUserImages.mockResolvedValue(undefined);
    // Mock user deletion error
    mockUserModel.delete.mockRejectedValue(new Error('Database deletion failed'));

    await userController.deleteProfile(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Database deletion failed',
    });
    
    // Verify both operations were attempted
    expect(mockMediaService.deleteAllUserImages).toHaveBeenCalledWith(testUser._id.toString());
    expect(mockUserModel.delete).toHaveBeenCalledWith(testUser._id);
  });
});