/**
 * Interface: POST /api/media/upload  
 * Tests with mocking - testing controller logic with mocked dependencies
 */

import { Request, Response, NextFunction } from 'express';
import { MediaController } from '../../src/features/media/media.controller';
import { MediaService } from '../../src/features/media/media.service';
import { UploadImageRequest, UploadImageResponse } from '../../src/features/media/media.types';
import logger from '../../src/utils/logger.util';

// Mock dependencies
jest.mock('../../src/features/media/media.service');
jest.mock('../../src/utils/logger.util');
jest.mock('../../src/utils/sanitizeInput.util', () => ({
  sanitizeInput: jest.fn((input: string) => input) // Return input as-is for tests
}));

describe('Mocked: POST /api/media/upload', () => {
  let mediaController: MediaController;
  let mockRequest: Partial<Request<unknown, unknown, UploadImageRequest>>;
  let mockResponse: Partial<Response<UploadImageResponse>>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockUser = {
    _id: { toString: () => 'test-user-id-123' },
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User'
  } as any;

  const mockFile = {
    path: '/uploads/temp/test-image.png',
    filename: 'test-image.png',
    originalname: 'test-image.png',
    mimetype: 'image/png',
    size: 1024
  } as Express.Multer.File;

  beforeEach(() => {
    mediaController = new MediaController();
    
    mockRequest = {
      user: mockUser,
      file: mockFile
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should upload image successfully', async () => {
      // Arrange
      const savedImagePath = '/uploads/images/test-user-id-123-1234567890.png';
      (MediaService.saveImage as jest.Mock).mockResolvedValue(savedImagePath);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).toHaveBeenCalledWith('/uploads/temp/test-image.png', 'test-user-id-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Image uploaded successfully',
        data: {
          image: savedImagePath
        }
      });
    });

    it('should handle different file types', async () => {
      // Arrange
      const jpgFile = { ...mockFile, path: '/uploads/temp/test.jpg', originalname: 'test.jpg' };
      mockRequest.file = jpgFile;
      const savedPath = '/uploads/images/test-user-id-123-1234567890.jpg';
      (MediaService.saveImage as jest.Mock).mockResolvedValue(savedPath);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).toHaveBeenCalledWith('/uploads/temp/test.jpg', 'test-user-id-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Image uploaded successfully',
        data: {
          image: savedPath
        }
      });
    });
  });

  describe('Validation Cases', () => {
    it('should return 400 when no file is uploaded', async () => {
      // Arrange
      mockRequest.file = undefined;

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No file uploaded'
      });
    });

    it('should handle null file', async () => {
      // Arrange
      mockRequest.file = null as any;

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No file uploaded'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle MediaService.saveImage errors', async () => {
      // Arrange
      const errorMessage = 'Failed to save image to disk';
      (MediaService.saveImage as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).toHaveBeenCalledWith('/uploads/temp/test-image.png', 'test-user-id-123');
      expect(logger.error).toHaveBeenCalledWith('Error uploading profile picture:', expect.any(Error));
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage
      });
    });

    it('should handle generic errors', async () => {
      // Arrange
      const errorMessage = 'Disk full';
      (MediaService.saveImage as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage
      });
    });

    it('should call next for non-Error exceptions', async () => {
      // Arrange
      const nonErrorException = 'String exception';
      (MediaService.saveImage as jest.Mock).mockRejectedValue(nonErrorException);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(nonErrorException);
    });

    it('should handle errors without message property', async () => {
      // Arrange
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';
      (MediaService.saveImage as jest.Mock).mockRejectedValue(errorWithoutMessage);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Failed to upload profile picture'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with special characters in path', async () => {
      // Arrange
      const specialFile = { ...mockFile, path: '/uploads/temp/test image & symbols!.png' };
      mockRequest.file = specialFile;
      const savedPath = '/uploads/images/test-user-id-123-1234567890.png';
      (MediaService.saveImage as jest.Mock).mockResolvedValue(savedPath);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).toHaveBeenCalledWith('/uploads/temp/test image & symbols!.png', 'test-user-id-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty file path', async () => {
      // Arrange
      const emptyPathFile = { ...mockFile, path: '' };
      mockRequest.file = emptyPathFile;
      const savedPath = '/uploads/images/test-user-id-123-1234567890.png';
      (MediaService.saveImage as jest.Mock).mockResolvedValue(savedPath);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).toHaveBeenCalledWith('', 'test-user-id-123');
    });

    it('should extract user ID as string', async () => {
      // Arrange
      const userWithObjectId = {
        _id: { toString: () => 'object-id-string' }
      };
      mockRequest.user = userWithObjectId as any;
      const savedPath = '/uploads/images/object-id-string-1234567890.png';
      (MediaService.saveImage as jest.Mock).mockResolvedValue(savedPath);

      // Act
      await mediaController.uploadImage(
        mockRequest as Request<unknown, unknown, UploadImageRequest>,
        mockResponse as Response<UploadImageResponse>,
        mockNext
      );

      // Assert
      expect(MediaService.saveImage).toHaveBeenCalledWith('/uploads/temp/test-image.png', 'object-id-string');
    });
  });
});