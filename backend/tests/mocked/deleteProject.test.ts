/**
 * Interface: DELETE /api/projects/:projectId
 * Tests with mocking - testing project deletion with mocked dependencies
 */

import { Request, Response } from 'express';
import { ProjectController } from '../../src/features/projects/project.controller';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/projects/project.model');
jest.mock('../../src/features/users/user.model');

describe('Mocked: DELETE /api/projects/:projectId', () => {
  let projectController: ProjectController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  const mockOwnerUserId = new mongoose.Types.ObjectId();
  const mockOtherUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    projectController = new ProjectController();
    responseData = {};

    mockRequest = {
      params: { projectId: mockProjectId.toString() },
      user: { id: mockOwnerUserId.toString() } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };

    jest.clearAllMocks();
  });

  test('should delete project when user is owner', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      description: 'Test Description',
      invitationCode: 'TEST123',
      ownerId: mockOwnerUserId,
      members: [{ userId: mockOwnerUserId, role: 'owner', admin: true, joinedAt: new Date() }]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.delete as jest.Mock).mockResolvedValue(true);
    (userModel.removeOwnedProject as jest.Mock).mockResolvedValue(true);

    await projectController.deleteProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseData.message).toBe('Project deleted successfully');
    expect(projectModel.findById).toHaveBeenCalledWith(mockProjectId);
    expect(projectModel.delete).toHaveBeenCalledWith(mockProjectId);
    expect(userModel.removeOwnedProject).toHaveBeenCalledWith(mockOwnerUserId, mockProjectId);
  });

  test('should return 404 when project not found', async () => {
    (projectModel.findById as jest.Mock).mockResolvedValue(null);

    await projectController.deleteProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(responseData.message).toBe('Project not found');
  });

  test('should return 403 when user is not project owner', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      description: 'Test Description',
      invitationCode: 'TEST123',
      ownerId: mockOtherUserId, // Different user owns the project
      members: [{ userId: mockOtherUserId, role: 'owner', admin: true, joinedAt: new Date() }]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);

    await projectController.deleteProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(responseData.message).toBe('Only project owner can delete project');
  });
});