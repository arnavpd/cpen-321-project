/**
 * Auth Service Branch Coverage Tests
 * 
 * Tests designed to increase branch coverage for auth.service.ts
 * by testing service methods directly with proper mocking.
 * 
 * Target: Lines 23-32,45,55-66,78-85 (0% -> higher branch coverage)
 */

// Mock dependencies before importing
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

jest.mock('../../../src/features/users/user.model', () => ({
  userModel: {
    findByGoogleId: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.util', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { AuthService } from '../../../src/features/auth/auth.service';
import { userModel } from '../../../src/features/users/user.model';
import logger from '../../../src/utils/logger.util';

const mockedOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedUserModel = userModel as jest.Mocked<typeof userModel>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('Auth Service Branch Coverage Tests', () => {
  let authService: AuthService;
  let mockOAuth2ClientInstance: jest.Mocked<OAuth2Client>;

  beforeAll(() => {
    // Set up environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Create mock OAuth2Client instance
    mockOAuth2ClientInstance = {
      verifyIdToken: jest.fn(),
    } as any;
    
    // Mock OAuth2Client constructor to return our mock instance
    mockedOAuth2Client.mockImplementation(() => mockOAuth2ClientInstance);
    
    // Create fresh AuthService instance
    authService = new AuthService();
  });

  describe('verifyGoogleToken Error Branches (Lines 23-32)', () => {
    it('should handle null payload from Google token', async () => {
      console.log('🔍 Testing verifyGoogleToken with null payload...');
      
      // Mock verifyIdToken to return ticket with null payload
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => null,
      } as any);
      
      await expect(authService.signInWithGoogle('token-with-null-payload')).rejects.toThrow('Invalid Google token');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign in failed:', expect.any(Error));
      console.log('✅ Null payload branch covered');
    });

    it('should handle missing email in token payload', async () => {
      console.log('🔍 Testing verifyGoogleToken with missing email...');
      
      // Mock verifyIdToken to return payload without email
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-id-123',
          name: 'Test User',
          // email is missing
          picture: 'https://example.com/pic.jpg',
        }),
      } as any);
      
      await expect(authService.signInWithGoogle('token-missing-email')).rejects.toThrow('Invalid Google token');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign in failed:', expect.any(Error));
      console.log('✅ Missing email branch covered');
    });

    it('should handle missing name in token payload', async () => {
      console.log('🔍 Testing verifyGoogleToken with missing name...');
      
      // Mock verifyIdToken to return payload without name
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-id-123',
          email: 'test@example.com',
          // name is missing
          picture: 'https://example.com/pic.jpg',
        }),
      } as any);
      
      await expect(authService.signUpWithGoogle('token-missing-name')).rejects.toThrow('Invalid Google token');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign up failed:', expect.any(Error));
      console.log('✅ Missing name branch covered');
    });

    it('should handle Google OAuth verification failure', async () => {
      console.log('🔍 Testing verifyGoogleToken with OAuth verification failure...');
      
      // Mock verifyIdToken to throw error
      mockOAuth2ClientInstance.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));
      
      await expect(authService.signInWithGoogle('invalid-google-token')).rejects.toThrow('Invalid Google token');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign in failed:', expect.any(Error));
      console.log('✅ OAuth verification failure branch covered');
    });
  });

  describe('generateAccessToken Coverage (Line 45)', () => {
    it('should generate JWT token correctly', async () => {
      console.log('🔍 Testing generateAccessToken functionality...');
      
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        googleId: 'test-google-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      // Mock successful token verification
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'test-google-id',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
        }),
      } as any);
      
      // Mock user found
      mockedUserModel.findByGoogleId.mockResolvedValue(mockUser as any);
      
      // Mock JWT generation
      mockedJwt.sign.mockReturnValue('generated-jwt-token' as any);
      
      const result = await authService.signInWithGoogle('valid-token');
      
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id },
        'test-jwt-secret',
        { expiresIn: '19h' }
      );
      
      expect(result.token).toBe('generated-jwt-token');
      console.log('✅ generateAccessToken method covered');
    });
  });

  describe('signUpWithGoogle Error Branches (Lines 55-66)', () => {
    beforeEach(() => {
      // Mock successful token verification for signup tests
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'signup-google-id',
          email: 'signup@example.com',
          name: 'Signup User',
          picture: 'https://example.com/signup.jpg',
        }),
      } as any);
    });

    it('should handle user already exists error', async () => {
      console.log('🔍 Testing signUpWithGoogle with existing user...');
      
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        googleId: 'signup-google-id',
        email: 'signup@example.com',
        name: 'Existing User',
      };
      
      // Mock existing user found
      mockedUserModel.findByGoogleId.mockResolvedValue(existingUser as any);
      
      await expect(authService.signUpWithGoogle('valid-token')).rejects.toThrow('User already exists');
      
      expect(mockedUserModel.findByGoogleId).toHaveBeenCalledWith('signup-google-id');
      console.log('✅ User already exists branch covered');
    });

    it('should handle user creation database error', async () => {
      console.log('🔍 Testing signUpWithGoogle with database error...');
      
      // Mock no existing user
      mockedUserModel.findByGoogleId.mockResolvedValue(null);
      
      // Mock user creation failure
      const dbError = new Error('Database connection failed');
      mockedUserModel.create.mockRejectedValue(dbError);
      
      await expect(authService.signUpWithGoogle('valid-token')).rejects.toThrow('Database connection failed');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign up failed:', dbError);
      console.log('✅ Database error during signup covered');
    });

    it('should handle token verification error during signup', async () => {
      console.log('🔍 Testing signUpWithGoogle with invalid token...');
      
      // Override mock to throw error for this test
      mockOAuth2ClientInstance.verifyIdToken.mockRejectedValue(new Error('Invalid token signature'));
      
      await expect(authService.signUpWithGoogle('invalid-signature-token')).rejects.toThrow('Invalid Google token');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign up failed:', expect.any(Error));
      console.log('✅ Token verification error during signup covered');
    });

    it('should successfully create new user', async () => {
      console.log('🔍 Testing signUpWithGoogle success path...');
      
      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        googleId: 'signup-google-id',
        email: 'signup@example.com',
        name: 'Signup User',
      };
      
      // Mock no existing user
      mockedUserModel.findByGoogleId.mockResolvedValue(null);
      
      // Mock successful user creation
      mockedUserModel.create.mockResolvedValue(newUser as any);
      
      // Mock JWT generation
      mockedJwt.sign.mockReturnValue('new-user-jwt-token' as any);
      
      const result = await authService.signUpWithGoogle('valid-token');
      
      expect(result).toEqual({
        token: 'new-user-jwt-token',
        user: newUser,
      });
      
      expect(mockedUserModel.create).toHaveBeenCalledWith({
        googleId: 'signup-google-id',
        email: 'signup@example.com',
        name: 'Signup User',
        profilePicture: 'https://example.com/signup.jpg',
      });
      
      console.log('✅ Successful signup path covered');
    });
  });

  describe('signInWithGoogle Error Branches (Lines 78-85)', () => {
    beforeEach(() => {
      // Mock successful token verification for signin tests
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'signin-google-id',
          email: 'signin@example.com',
          name: 'Signin User',
          picture: 'https://example.com/signin.jpg',
        }),
      } as any);
    });

    it('should handle user not found error', async () => {
      console.log('🔍 Testing signInWithGoogle with user not found...');
      
      // Mock user not found
      mockedUserModel.findByGoogleId.mockResolvedValue(null);
      
      await expect(authService.signInWithGoogle('valid-token')).rejects.toThrow('User not found');
      
      expect(mockedUserModel.findByGoogleId).toHaveBeenCalledWith('signin-google-id');
      console.log('✅ User not found branch covered');
    });

    it('should handle database error during user lookup', async () => {
      console.log('🔍 Testing signInWithGoogle with database lookup error...');
      
      // Mock database error during user lookup
      const dbError = new Error('Database query timeout');
      mockedUserModel.findByGoogleId.mockRejectedValue(dbError);
      
      await expect(authService.signInWithGoogle('valid-token')).rejects.toThrow('Database query timeout');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign in failed:', dbError);
      console.log('✅ Database error during signin covered');
    });

    it('should handle token verification error during signin', async () => {
      console.log('🔍 Testing signInWithGoogle with expired token...');
      
      // Override mock to throw error for this test
      mockOAuth2ClientInstance.verifyIdToken.mockRejectedValue(new Error('Token has expired'));
      
      await expect(authService.signInWithGoogle('expired-token')).rejects.toThrow('Invalid Google token');
      
      expect(mockedLogger.error).toHaveBeenCalledWith('Sign in failed:', expect.any(Error));
      console.log('✅ Token verification error during signin covered');
    });

    it('should successfully sign in existing user', async () => {
      console.log('🔍 Testing signInWithGoogle success path...');
      
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        googleId: 'signin-google-id',
        email: 'signin@example.com',
        name: 'Signin User',
      };
      
      // Mock user found
      mockedUserModel.findByGoogleId.mockResolvedValue(existingUser as any);
      
      // Mock JWT generation
      mockedJwt.sign.mockReturnValue('existing-user-jwt-token' as any);
      
      const result = await authService.signInWithGoogle('valid-token');
      
      expect(result).toEqual({
        token: 'existing-user-jwt-token',
        user: existingUser,
      });
      
      expect(mockedUserModel.findByGoogleId).toHaveBeenCalledWith('signin-google-id');
      console.log('✅ Successful signin path covered');
    });
  });

  describe('Edge Cases and Integration Tests', () => {
    it('should handle profile picture being undefined', async () => {
      console.log('🔍 Testing with undefined profile picture...');
      
      // Mock token verification with undefined picture
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'edge-case-id',
          email: 'edge@example.com',
          name: 'Edge Case User',
          // picture is undefined
        }),
      } as any);
      
      // Mock no existing user
      mockedUserModel.findByGoogleId.mockResolvedValue(null);
      
      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        googleId: 'edge-case-id',
        email: 'edge@example.com',
        name: 'Edge Case User',
      };
      
      mockedUserModel.create.mockResolvedValue(newUser as any);
      mockedJwt.sign.mockReturnValue('edge-case-jwt' as any);
      
      await authService.signUpWithGoogle('valid-token');
      
      expect(mockedUserModel.create).toHaveBeenCalledWith({
        googleId: 'edge-case-id',
        email: 'edge@example.com',
        name: 'Edge Case User',
        profilePicture: undefined,
      });
      
      console.log('✅ Undefined profile picture edge case covered');
    });

    it('should handle complete signup followed by signin workflow', async () => {
      console.log('🔍 Testing complete signup to signin workflow...');
      
      const userData = {
        sub: 'workflow-user-id',
        email: 'workflow@example.com',
        name: 'Workflow User',
        picture: 'https://example.com/workflow.jpg',
      };
      
      // Mock token verification for both calls
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => userData,
      } as any);
      
      const createdUser = {
        _id: new mongoose.Types.ObjectId(),
        googleId: 'workflow-user-id',
        email: 'workflow@example.com',
        name: 'Workflow User',
      };
      
      // First signup - no existing user
      mockedUserModel.findByGoogleId.mockResolvedValueOnce(null);
      mockedUserModel.create.mockResolvedValue(createdUser as any);
      mockedJwt.sign.mockReturnValue('workflow-jwt' as any);
      
      // Signup
      const signupResult = await authService.signUpWithGoogle('valid-token');
      expect(signupResult.user).toEqual(createdUser);
      
      // Then signin - user now exists
      mockedUserModel.findByGoogleId.mockResolvedValueOnce(createdUser as any);
      
      // Signin
      const signinResult = await authService.signInWithGoogle('valid-token');
      expect(signinResult.user).toEqual(createdUser);
      
      console.log('✅ Complete workflow successfully covered');
    });
  });
});