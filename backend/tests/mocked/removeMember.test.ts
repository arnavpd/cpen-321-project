/**
 * Interface: DELETE /api/projects/:projectId/members/:userId
 * Tests with mocking - testing member removal with mocked dependencies
 */

import { Request, Response } from 'express';
import { ProjectController } from '../../src/features/projects/project.controller';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/projects/project.model');
jest.mock('../../src/features/users/user.model');

describe('Mocked: DELETE /api/projects/:projectId/members/:userId', () => {
  let projectController: ProjectController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  const mockAdminUserId = new mongoose.Types.ObjectId();
  const mockMemberUserId = new mongoose.Types.ObjectId();
  const mockOwnerUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    projectController = new ProjectController();
    responseData = {};

    mockRequest = {
      params: { 
        projectId: mockProjectId.toString(),
        userId: mockMemberUserId.toString()
      },
      user: { id: mockAdminUserId.toString() } as any
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

  test('should successfully remove member when user is admin', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockAdminUserId, role: 'user', admin: true },
        { userId: mockMemberUserId, role: 'user', admin: false }
      ]
    };

    const mockUpdatedProject = {
      ...mockProject,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockAdminUserId, role: 'user', admin: true }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.isUserAdmin as jest.Mock).mockResolvedValue(true);
    (projectModel.removeMember as jest.Mock).mockResolvedValue(mockUpdatedProject);
    (userModel.removeMemberProject as jest.Mock).mockResolvedValue(true);

    await projectController.removeMember(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseData.message).toBe('Member removed successfully');
    expect(projectModel.findById).toHaveBeenCalledWith(mockProjectId);
    expect(projectModel.removeMember).toHaveBeenCalledWith(mockProjectId, mockMemberUserId);
    expect(userModel.removeMemberProject).toHaveBeenCalledWith(mockMemberUserId, mockProjectId);
  });

  test('should return 403 when user is not admin or owner', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockMemberUserId, role: 'user', admin: false }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.isUserAdmin as jest.Mock).mockResolvedValue(false);

    await projectController.removeMember(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(responseData.message).toBe('Only project owner or admin can remove members');
  });

  test('should return 400 when trying to remove project owner', async () => {
    // Set request to remove owner
    mockRequest.params!.userId = mockOwnerUserId.toString();

    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockAdminUserId, role: 'user', admin: true }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.isUserAdmin as jest.Mock).mockResolvedValue(true);

    await projectController.removeMember(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseData.message).toBe('Cannot remove project owner');
  });
});