/**
 * Interface: POST /api/projects
 * Tests with mocking - simulating database and service layer behaviors
 */

import { ProjectController } from '../../src/features/projects/project.controller';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the project and user models
jest.mock('../../src/features/projects/project.model');
jest.mock('../../src/features/users/user.model');

const mockProjectModel = projectModel as jest.Mocked<typeof projectModel>;
const mockUserModel = userModel as jest.Mocked<typeof userModel>;

describe('Mocked: POST /api/projects', () => {
  let projectController: ProjectController;
  let testUser: any;
  let mockReq: any;
  let mockRes: any;

  beforeAll(() => {
    projectController = new ProjectController();

    // Mock test user data
    testUser = {
      _id: new mongoose.Types.ObjectId(),
      googleId: 'test-project-user-789',
      email: 'project-test@example.com',
      name: 'Project Test User',
    };
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = {
      body: {
        name: 'Test Project',
        description: 'Test project description'
      },
      user: testUser
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Mocked behavior: All database operations succeed
  // Input: Valid project data with authenticated user
  // Expected status code: 201
  // Expected behavior: Project is created successfully
  // Expected output: Project data with invitation code
  test('Database Operations Succeed - Returns 201 Created', async () => {
    const mockProject = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Project',
      description: 'Test project description',
      invitationCode: 'ABC12345',
      ownerId: testUser._id,
      members: [{
        userId: testUser._id,
        role: 'owner',
        admin: true,
        joinedAt: new Date()
      }],
      resources: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock successful database operations
    mockProjectModel.findByOwnerId.mockResolvedValue([]);
    mockProjectModel.generateInvitationCode.mockResolvedValue('ABC12345');
    mockProjectModel.findByInvitationCode.mockResolvedValue(null);
    mockProjectModel.create.mockResolvedValue(mockProject as any);
    mockUserModel.addOwnedProject.mockResolvedValue(testUser as any);

    await projectController.createProject(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Project created successfully',
      data: expect.objectContaining({
        name: 'Test Project',
        description: 'Test project description',
        invitationCode: 'ABC12345'
      })
    });

    // Verify database operations were called
    expect(mockProjectModel.findByOwnerId).toHaveBeenCalledWith(testUser._id);
    expect(mockProjectModel.create).toHaveBeenCalled();
    expect(mockUserModel.addOwnedProject).toHaveBeenCalledWith(testUser._id, mockProject._id);
  });

  // Mocked behavior: Database throws error during project creation
  // Input: Valid project data but database fails
  // Expected status code: 500
  // Expected behavior: Error is handled gracefully
  // Expected output: Internal server error message
  test('Database Create Throws Error - Returns 500 Internal Server Error', async () => {
    // Mock database operations that lead to error
    mockProjectModel.findByOwnerId.mockResolvedValue([]);
    mockProjectModel.generateInvitationCode.mockResolvedValue('ABC12345');
    mockProjectModel.findByInvitationCode.mockResolvedValue(null);
    mockProjectModel.create.mockRejectedValue(new Error('Database connection failed'));

    await projectController.createProject(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });

    // Verify database operations were attempted
    expect(mockProjectModel.findByOwnerId).toHaveBeenCalled();
    expect(mockProjectModel.create).toHaveBeenCalled();
  });
  
  // Mocked behavior: Invitation code generation fails repeatedly
  // Input: Valid project data but invitation code generation fails
  // Expected status code: 500
  // Expected behavior: Fails to generate unique invitation code after max attempts
  // Expected output: Invitation code generation error message
  test('Invitation Code Generation Fails - Returns 500 Internal Server Error', async () => {
    const existingProject = { _id: new mongoose.Types.ObjectId() };

    // Mock database operations
    mockProjectModel.findByOwnerId.mockResolvedValue([]);
    mockProjectModel.generateInvitationCode.mockResolvedValue('ABC12345');
    // Mock that invitation code is always taken
    mockProjectModel.findByInvitationCode.mockResolvedValue(existingProject as any);

    await projectController.createProject(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Failed to generate unique invitation code'
    });

    // Verify multiple attempts were made
    expect(mockProjectModel.generateInvitationCode).toHaveBeenCalledTimes(10); // max attempts
    expect(mockProjectModel.findByInvitationCode).toHaveBeenCalledTimes(10);
    // Should not attempt to create project
    expect(mockProjectModel.create).not.toHaveBeenCalled();
  });
});