/**
 * Interface: POST /api/projects/join
 * Tests with mocking - testing project joining with mocked dependencies
 */

import { Request, Response } from 'express';
import { ProjectController } from '../../src/features/projects/project.controller';
import { projectModel } from '../../src/features/projects/project.model';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/features/projects/project.model');

describe('Mocked: POST /api/projects/join', () => {
  let projectController: ProjectController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockProjectId = new mongoose.Types.ObjectId();
  const mockOwnerId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    projectController = new ProjectController();
    responseData = {};

    mockRequest = {
      body: { invitationCode: 'TEST1234' },
      user: { id: mockUserId.toString() } as any
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

  test('should successfully join project with valid invitation code', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      description: 'Test Description',
      invitationCode: 'TEST1234',
      ownerId: mockOwnerId,
      members: [
        { userId: mockOwnerId, role: 'owner', admin: true, joinedAt: new Date() }
      ]
    };

    const mockUpdatedProject = {
      ...mockProject,
      members: [
        { userId: mockOwnerId, role: 'owner', admin: true, joinedAt: new Date() },
        { userId: mockUserId, role: 'user', admin: false, joinedAt: new Date() }
      ]
    };

    (projectModel.findByInvitationCode as jest.Mock).mockResolvedValue(mockProject);
    (projectModel.addMember as jest.Mock).mockResolvedValue(mockUpdatedProject);

    await projectController.joinProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseData.message).toBe('Successfully joined project');
    expect(responseData.data.id).toBe(mockProjectId);
    expect(projectModel.findByInvitationCode).toHaveBeenCalledWith('TEST1234');
    expect(projectModel.addMember).toHaveBeenCalledWith(mockProjectId, expect.objectContaining({
      userId: mockUserId,
      role: 'user',
      admin: false
    }));
  });

  test('should return 404 when invitation code does not exist', async () => {
    (projectModel.findByInvitationCode as jest.Mock).mockResolvedValue(null);

    await projectController.joinProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(responseData.message).toBe('Error, no project exists with this code');
  });

  test('should return 400 when user is already a member', async () => {
    const mockProject = {
      _id: mockProjectId,
      name: 'Test Project',
      description: 'Test Description',
      invitationCode: 'TEST1234',
      ownerId: mockOwnerId,
      members: [
        { userId: mockOwnerId, role: 'owner', admin: true, joinedAt: new Date() },
        { userId: mockUserId, role: 'user', admin: false, joinedAt: new Date() } // User already member
      ]
    };

    (projectModel.findByInvitationCode as jest.Mock).mockResolvedValue(mockProject);

    await projectController.joinProject(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseData.message).toBe('You are already a member of this project');
  });
});