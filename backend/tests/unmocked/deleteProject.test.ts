/**
 * Interface: DELETE /api/projects/:projectId
 * Tests without mocking - testing project deletion with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: DELETE /api/projects/:projectId', () => {
  let app: any;
  let ownerUser: IUser;
  let otherUser: IUser; 
  let projectId: string;
  let ownerToken: string;
  let otherToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // No need for cleanup here since we create unique test data

    // Create test users with unique data
    const timestamp = Date.now();
    ownerUser = await userModel.create({
      googleId: `google_owner_${timestamp}`,
      email: `owner_${timestamp}@test.com`,
      name: `Owner User ${timestamp}`,
      profilePicture: 'https://example.com/pic1.jpg'
    });

    otherUser = await userModel.create({
      googleId: `google_other_${timestamp}`,
      email: `other_${timestamp}@test.com`, 
      name: `Other User ${timestamp}`,
      profilePicture: 'https://example.com/pic2.jpg'
    });

    // Create project owned by ownerUser
    const project = await projectModel.create({
      name: `Test Project ${timestamp}`,
      description: 'Test project for deletion',
      invitationCode: `TEST${timestamp.toString().slice(-4)}`, // Unique invitation code
      ownerId: ownerUser._id,
      members: [{
        userId: ownerUser._id,
        role: 'owner' as const,
        admin: true,
        joinedAt: new Date()
      }]
    });

    projectId = project._id.toString();

    // Generate JWT tokens
    ownerToken = jwt.sign({ id: ownerUser._id, email: ownerUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    otherToken = jwt.sign({ id: otherUser._id, email: otherUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (ownerUser) await userModel.delete(ownerUser._id);
      if (otherUser) await userModel.delete(otherUser._id);
      if (projectId) await projectModel.delete(new mongoose.Types.ObjectId(projectId));
    } catch (err) {
      // ignore cleanup errors in teardown
    }
    await mongoose.connection.close();
  });

  test('should successfully delete project when user is owner', async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Project deleted successfully');

    // Verify project was actually deleted from database
    const deletedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(deletedProject).toBeNull();
  });

  test('should return 404 when project does not exist', async () => {
    const nonExistentProjectId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/projects/${nonExistentProjectId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Project not found');
  });

  test('should return 403 when user is not the project owner', async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Only project owner can delete project');

    // Verify project still exists in database
    const existingProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(existingProject).not.toBeNull();
    expect(existingProject!.name).toContain('Test Project');
  });
});