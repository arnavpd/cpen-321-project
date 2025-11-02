/**
 * Interface: POST /api/projects/:projectId/resources
 * Tests with mocking - testing resource addition with mocked dependencies
 */

import { Request, Response } from 'express';
import { ProjectController } from '../../src/features/projects/project.controller';
import { projectModel } from '../../src/features/projects/project.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/projects/project.model');

describe('Mocked: POST /api/projects/:projectId/resources', () => {
  let projectController: ProjectController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  const mockOwnerUserId = new mongoose.Types.ObjectId();
  const mockMemberUserId = new mongoose.Types.ObjectId();
  const mockNonMemberUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    projectController = new ProjectController();
    responseData = {};

    mockRequest = {
      params: { projectId: mockProjectId.toString() },
      body: { 
        resourceName: 'Test Resource',
        link: 'https://example.com/resource'
      },
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

  test('should successfully add resource when user is project member', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockMemberUserId, role: 'user', admin: false }
      ],
      resources: []
    };

    const mockUpdatedProject = {
      ...mockProject,
      resources: [
        {
          resourceName: 'Test Resource',
          link: 'https://example.com/resource'
        }
      ]
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.addResource as jest.Mock).mockResolvedValue(mockUpdatedProject);

    await projectController.addResource(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseData.message).toBe('Resource added successfully');
    expect(responseData.data.resources).toHaveLength(1);
    expect(responseData.data.resources[0].resourceName).toBe('Test Resource');
    expect(responseData.data.resources[0].link).toBe('https://example.com/resource');
    expect(projectModel.addResource).toHaveBeenCalledWith(mockProjectId, {
      resourceName: 'Test Resource',
      link: 'https://example.com/resource'
    });
  });

  test('should return 403 when user is not project member', async () => {
    // Change request to non-member user
    mockRequest.user = { id: mockNonMemberUserId.toString() } as any;

    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      ownerId: mockOwnerUserId,
      members: [
        { userId: mockOwnerUserId, role: 'owner', admin: true },
        { userId: mockMemberUserId, role: 'user', admin: false }
      ],
      resources: []
    };

    (projectModel.findById as jest.Mock).mockResolvedValue(mockProject);

    await projectController.addResource(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(responseData.message).toBe('Access denied to this project');
  });

  test('should return 400 when resource name is missing', async () => {
    // Remove resourceName from request
    mockRequest.body = { link: 'https://example.com/resource' };

    await projectController.addResource(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseData.message).toBe('Resource name is required');
  });
});