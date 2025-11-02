/**
 * Interface: PUT /api/projects/:projectId
 * Tests with mocking - testing project updates with mocked dependencies
 */

import { Request, Response } from 'express';
import { ProjectController } from '../../src/features/projects/project.controller';
import { projectModel } from '../../src/features/projects/project.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/projects/project.model');

describe('Mocked: PUT /api/projects/:projectId', () => {
  let projectController: ProjectController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  const mockOwnerUserId = new mongoose.Types.ObjectId();
  const mockAdminUserId = new mongoose.Types.ObjectId();
  const mockMemberUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    projectController = new ProjectController();
    responseData = {};

    mockRequest = {
      params: { projectId: mockProjectId.toString() },
      body: { name: 'Updated Project Name', description: 'Updated description' },
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

  test('should successfully update project when user is owner', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Original Project',
      description: 'Original description',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true }
      ]
    };

    const mockUpdatedProject = {
      ...mockProject,
      name: 'Updated Project Name',
      description: 'Updated description',
      updatedAt: new Date()
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.isUserAdmin as jest.Mock).mockResolvedValue(false);
    (projectModel.update as jest.Mock).mockResolvedValue(mockUpdatedProject);

    await projectController.updateProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseData.message).toBe('Project updated successfully');
    expect(responseData.data.name).toBe('Updated Project Name');
    expect(responseData.data.description).toBe('Updated description');
    expect(projectModel.update).toHaveBeenCalledWith(mockProjectId, {
      name: 'Updated Project Name',
      description: 'Updated description'
    });
  });

  test('should successfully update project when user is admin', async () => {
    // Change request to admin user
    mockRequest.user = { id: mockAdminUserId.toString() } as any;

    const mockProject = {
      _id: mockProjectId,
      name: 'Original Project',
      description: 'Original description',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockAdminUserId, role: 'user', admin: true }
      ]
    };

    const mockUpdatedProject = {
      ...mockProject,
      name: 'Updated Project Name',
      description: 'Updated description'
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.isUserAdmin as jest.Mock).mockResolvedValue(true);
    (projectModel.update as jest.Mock).mockResolvedValue(mockUpdatedProject);

    await projectController.updateProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseData.message).toBe('Project updated successfully');
    expect(responseData.data.name).toBe('Updated Project Name');
  });

  test('should return 403 when user is not owner or admin', async () => {
    // Change request to regular member user
    mockRequest.user = { id: mockMemberUserId.toString() } as any;

    const mockProject = {
      _id: mockProjectId,
      name: 'Original Project',
      description: 'Original description',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockMemberUserId, role: 'user', admin: false }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.isUserAdmin as jest.Mock).mockResolvedValue(false);

    await projectController.updateProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(responseData.message).toBe('Only project owner or admin can update project');
  });
});