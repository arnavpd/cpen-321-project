import request from 'supertest';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { connectTestDB, disconnectTestDB } from '../../testDatabase';
import { MediaService } from '../../../src/features/media/media.service';
import { userModel } from '../../../src/features/users/user.model';
import jwt from 'jsonwebtoken';
import { Application } from 'express';

describe('Media Service Coverage API Tests', () => {
  let app: Application;
  let testUserId: mongoose.Types.ObjectId;
  let authToken: string;
  let uploadsDir: string;

  beforeAll(async () => {
    await connectTestDB();
    app = await createTestApp();
    
    // Create test user
    const testUser = await userModel.create({
      googleId: 'test_google_id_media_coverage',
      name: 'Media Coverage Test User',
      email: 'mediacoveragetest@example.com',
      profilePicture: 'test-profile.jpg'
    });
    testUserId = testUser._id as mongoose.Types.ObjectId;

    // Create test JWT token using the correct format
    const jwtSecret = process.env.JWT_SECRET || 'test_secret';
    authToken = jwt.sign({ id: testUser._id }, jwtSecret);

    uploadsDir = path.join(process.cwd(), 'uploads', 'images');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await userModel.delete(testUserId);
    }

    // Clean up test files
    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.filter(file => file.startsWith(testUserId.toString())).forEach(file => {
          fs.unlinkSync(path.join(uploadsDir, file));
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    await disconnectTestDB();
  });

  describe('MediaService Direct Coverage Tests', () => {
    test('should cover path validation error (line 18)', () => {
      // Test file outside allowed directory
      expect(() => {
        MediaService.saveImage('/outside/directory/file.png', testUserId.toString());
      }).toThrow('Invalid file path: outside allowed directory');
    });

    test('should cover error handling in saveImage', () => {
      const testFilePath = path.join(uploadsDir, 'test-source.png');
      
      try {
        // Create a test file
        fs.writeFileSync(testFilePath, 'test data');
        
        // Mock fs.renameSync to throw an error
        const mockRenameSync = jest.spyOn(fs, 'renameSync').mockImplementation(() => {
          throw new Error('Simulated file system error');
        });
        
        const mockUnlinkSync = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
        
        expect(() => {
          MediaService.saveImage(testFilePath, testUserId.toString());
        }).toThrow('Failed to save profile picture');
        
        // Verify cleanup was attempted
        expect(mockUnlinkSync).toHaveBeenCalled();
      } finally {
        jest.restoreAllMocks();
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should cover file exists check in deleteImage', () => {
      const testFileName = 'test-delete-file.png';
      const testFilePath = path.join(uploadsDir, testFileName);
      
      try {
        // Create a test file
        fs.writeFileSync(testFilePath, 'test data');
        
        // The deleteImage method expects a URL that starts with IMAGES_DIR
        // Looking at the implementation: url.startsWith(IMAGES_DIR) and then url.substring(1)
        // So we need to pass the full path starting with IMAGES_DIR
        MediaService.deleteImage(uploadsDir + '/' + testFileName);
        
        // The actual implementation checks if url.startsWith(IMAGES_DIR) but our path doesn't match
        // Let's test the method correctly - it won't delete because the condition fails
        expect(fs.existsSync(testFilePath)).toBe(true);
        
        // Now test with a proper URL format that the method expects
        const mockUnlinkSync = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
        const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        
        // Call with correct format that matches the startsWith condition
        MediaService.deleteImage(uploadsDir);
        
        expect(mockExistsSync).toHaveBeenCalled();
      } finally {
        jest.restoreAllMocks();
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should cover error handling in deleteImage', () => {
      try {
        // Mock console.error to capture the error logging
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock fs.unlinkSync to throw error when file exists
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
          throw new Error('File system error');
        });
        
        MediaService.deleteImage(uploadsDir + '/test-file.png');
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Failed to delete old profile picture:', 
          expect.any(Error)
        );
        
      } finally {
        jest.restoreAllMocks();
      }
    });

    test('should cover error handling in deleteAllUserImages', async () => {
      try {
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock fs.readdirSync to throw an error
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
          throw new Error('Directory read error');
        });
        
        await MediaService.deleteAllUserImages(testUserId.toString());
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Failed to delete user images:',
          expect.any(Error)
        );
      } finally {
        jest.restoreAllMocks();
      }
    });

    test('should cover non-image directory URL in deleteImage', () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Test with URL that doesn't start with IMAGES_DIR
        MediaService.deleteImage('/some/other/path/file.png');
        
        // Should not log any errors since it doesn't match the condition
        expect(mockConsoleError).not.toHaveBeenCalled();
      } finally {
        jest.restoreAllMocks();
      }
    });
  });

  describe('API Integration with MediaService Coverage', () => {
    const createTestImageBuffer = (): Buffer => {
      const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      return Buffer.from(base64PNG, 'base64');
    };

    test('should handle successful upload through API', async () => {
      const imageBuffer = createTestImageBuffer();
      
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('media', imageBuffer, 'test-image.png');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Image uploaded successfully');
    });

    test('should handle missing file in upload', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No file uploaded');
    });

    test('should trigger MediaService error through API upload', async () => {
      try {
        // Mock MediaService.saveImage to throw an error
        jest.spyOn(MediaService, 'saveImage').mockImplementation(() => {
          throw new Error('Simulated MediaService error');
        });

        const imageBuffer = createTestImageBuffer();
        
        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('media', imageBuffer, 'test-image.png');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Simulated MediaService error');

      } finally {
        jest.restoreAllMocks();
      }
    });
  });
});