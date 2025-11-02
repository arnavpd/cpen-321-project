/**
 * Interface: POST /api/auth/signup
 * Tests with mocking - simulating Google OAuth and database behaviors
 */

import { AuthController } from '../../src/features/auth/auth.controller';
import { authService } from '../../src/features/auth/auth.service';
import mongoose from 'mongoose';

// Mock the auth service
jest.mock('../../src/features/auth/auth.service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Mocked: POST /api/auth/signup', () => {
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
      googleId: 'test-google-signup-id-123',
      email: 'signup-test@example.com',
      name: 'Signup Test User',
      profilePicture: 'https://example.com/signup-profile.jpg',
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

  // Mocked behavior: authService.signUpWithGoogle returns user and token successfully
  // Input: Valid Google ID token in request body
  // Expected status code: 201
  // Expected behavior: New user signs up successfully
  // Expected output: Success message with JWT token and user data
  test('Auth Service Returns Success - Returns 201 Created', async () => {
    const mockAuthResult = {
      token: 'jwt-token-67890',
      user: testUser
    };
    
    // Mock successful signup
    mockAuthService.signUpWithGoogle.mockResolvedValue(mockAuthResult);

    await authController.signUp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User signed up successfully',
      data: mockAuthResult,
    });
    
    // Verify the service was called with correct parameters
    expect(mockAuthService.signUpWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });

  // Mocked behavior: authService.signUpWithGoogle throws 'User already exists' error
  // Input: Valid Google token but user already exists in database
  // Expected status code: 409
  // Expected behavior: User already exists
  // Expected output: User already exists error message
  test('Auth Service Throws User Exists Error - Returns 409 Conflict', async () => {
    // Mock service throwing user exists error
    mockAuthService.signUpWithGoogle.mockRejectedValue(new Error('User already exists'));

    await authController.signUp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User already exists, please sign in instead.',
    });
    
    // Verify the service was called
    expect(mockAuthService.signUpWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });

  // Mocked behavior: authService.signUpWithGoogle throws 'Invalid Google token' error
  // Input: Invalid Google ID token
  // Expected status code: 401
  // Expected behavior: Google token verification fails
  // Expected output: Invalid token error message
  test('Auth Service Throws Invalid Token Error - Returns 401 Unauthorized', async () => {
    // Mock service throwing invalid token error
    mockAuthService.signUpWithGoogle.mockRejectedValue(new Error('Invalid Google token'));

    await authController.signUp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid Google token',
    });
    
    // Verify the service was called
    expect(mockAuthService.signUpWithGoogle).toHaveBeenCalledWith('valid-google-id-token');
  });
});