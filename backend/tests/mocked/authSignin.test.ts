/**
 * Interface: POST /api/auth/signin
 * Tests with mocking - simulating Google OAuth and database behaviors
 */

import { AuthController } from '../../src/features/auth/auth.controller';
import { authService } from '../../src/features/auth/auth.service';
import mongoose from 'mongoose';

// Mock the auth service
jest.mock('../../src/features/auth/auth.service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Mocked: POST /api/auth/signin', () => {
  let authController: AuthController;
  let testUser: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeAll(() => {
    authController = new AuthController();

    // Mock test user data
    testUser = {
      _id: new mongoose.Types.ObjectId(),
      googleId: 'test-google-signin-id-456',
      email: 'signin-test@example.com',
      name: 'Signin Test User',
      profilePicture: 'https://example.com/signin-profile.jpg',
      ownedProjects: [],
      memberProjects: [],
      calendarEnabled: false,
    };
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = {
      body: {
        idToken: 'valid-google-id-token'
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  // Mocked behavior: authService.signInWithGoogle returns user and token successfully
  // Input: Valid Google ID token in request body
  // Expected status code: 200
  // Expected behavior: User signs in successfully
  // Expected output: Success message with JWT token and user data
  test('Auth Service Returns Success - Returns 200 Success', async () => {
    const mockAuthResult = {
      token: 'jwt-token-12345',
      user: testUser
    };
    
    // Mock successful signin
    mockAuthService.signInWithGoogle.mockResolvedValue(mockAuthResult);

    await authController.signIn(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User signed in successfully',
      data: mockAuthResult,
    });
    
    // Verify the service was called with correct parameters
    expect(mockAuthService.signInWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });

  // Mocked behavior: authService.signInWithGoogle throws 'Invalid Google token' error
  // Input: Invalid Google ID token
  // Expected status code: 401
  // Expected behavior: Google token verification fails
  // Expected output: Invalid token error message
  test('Auth Service Throws Invalid Token Error - Returns 401 Unauthorized', async () => {
    // Mock service throwing invalid token error
    mockAuthService.signInWithGoogle.mockRejectedValue(new Error('Invalid Google token'));

    await authController.signIn(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid Google token',
    });
    
    // Verify the service was called
    expect(mockAuthService.signInWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });

  // Mocked behavior: authService.signInWithGoogle throws 'User not found' error
  // Input: Valid Google token but user doesn't exist in database
  // Expected status code: 404
  // Expected behavior: User lookup fails
  // Expected output: User not found error message
  test('Auth Service Throws User Not Found Error - Returns 404 Not Found', async () => {
    // Mock service throwing user not found error
    mockAuthService.signInWithGoogle.mockRejectedValue(new Error('User not found'));

    await authController.signIn(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User not found, please sign up first.',
    });
    
    // Verify the service was called
    expect(mockAuthService.signInWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });

  // Mocked behavior: authService.signInWithGoogle throws 'Failed to process user' error
  // Input: Valid Google token but internal processing fails
  // Expected status code: 500
  // Expected behavior: Internal server error due to processing failure
  // Expected output: Internal server error message
  test('Auth Service Throws Processing Error - Returns 500 Internal Server Error', async () => {
    // Mock service throwing processing error
    mockAuthService.signInWithGoogle.mockRejectedValue(new Error('Failed to process user'));

    await authController.signIn(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Failed to process user information',
    });
    
    // Verify the service was called
    expect(mockAuthService.signInWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });

  // Mocked behavior: authService.signInWithGoogle throws unexpected error
  // Input: Valid request but service throws unknown error
  // Expected status code: No response (error passed to next middleware)
  // Expected behavior: Error is passed to error handling middleware
  // Expected output: next() is called with the error
  test('Auth Service Throws Unexpected Error - Calls Next Middleware', async () => {
    const unexpectedError = new Error('Database connection lost');
    
    // Mock service throwing unexpected error
    mockAuthService.signInWithGoogle.mockRejectedValue(unexpectedError);

    await authController.signIn(mockReq, mockRes, mockNext);

    // Should not have called res.status or res.json
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    
    // Should have called next with the error
    expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    
    // Verify the service was called
    expect(mockAuthService.signInWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });
});