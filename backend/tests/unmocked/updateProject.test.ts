/**
 * Interface: PUT /api/projects/:projectId
 * Tests without mocking - testing project updates with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: PUT /api/projects/:projectId', () => {
  let app: any;
  let ownerUser: IUser;
  let adminUser: IUser;
  let memberUser: IUser;
  let projectId: string;
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // Create test users with unique data
    const timestamp = Date.now();
    ownerUser = await userModel.create({
      googleId: `google_owner_${timestamp}`,
      email: `owner_${timestamp}@test.com`,
      name: `Owner User ${timestamp}`,
      profilePicture: 'https://example.com/pic1.jpg'
    });

    adminUser = await userModel.create({
      googleId: `google_admin_${timestamp}`,
      email: `admin_${timestamp}@test.com`,
      name: `Admin User ${timestamp}`,
      profilePicture: 'https://example.com/pic2.jpg'
    });

    memberUser = await userModel.create({
      googleId: `google_member_${timestamp}`,
      email: `member_${timestamp}@test.com`,
      name: `Member User ${timestamp}`,
      profilePicture: 'https://example.com/pic3.jpg'
    });

    // Create project with all users as members
    const project = await projectModel.create({
      name: `Original Project ${timestamp}`,
      description: 'Original description for testing',
      invitationCode: `UPD${timestamp.toString().slice(-5)}`,
      ownerId: ownerUser._id,
      members: [
        {
          userId: ownerUser._id,
          role: 'owner' as const,
          admin: true,
          joinedAt: new Date()
        },
        {
          userId: adminUser._id,
          role: 'user' as const,
          admin: true,
          joinedAt: new Date()
        },
        {
          userId: memberUser._id,
          role: 'user' as const,
          admin: false,
          joinedAt: new Date()
        }
      ]
    });

    projectId = project._id.toString();

    // Generate JWT tokens
    ownerToken = jwt.sign({ id: ownerUser._id, email: ownerUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    adminToken = jwt.sign({ id: adminUser._id, email: adminUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    memberToken = jwt.sign({ id: memberUser._id, email: memberUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (ownerUser) await userModel.delete(ownerUser._id);
      if (adminUser) await userModel.delete(adminUser._id);
      if (memberUser) await userModel.delete(memberUser._id);
      if (projectId) await projectModel.delete(new mongoose.Types.ObjectId(projectId));
    } catch (err) {
      // ignore cleanup errors in teardown
    }
    await mongoose.connection.close();
  });

  test('should successfully update project when user is owner', async () => {
    const updateData = {
      name: 'Updated Project Name',
      description: 'Updated project description'
    };

    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Project updated successfully');
    expect(response.body.data.name).toBe('Updated Project Name');
    expect(response.body.data.description).toBe('Updated project description');

    // Verify project was actually updated in database
    const updatedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(updatedProject!.name).toBe('Updated Project Name');
    expect(updatedProject!.description).toBe('Updated project description');
  });

  test('should successfully update project when user is admin', async () => {
    const updateData = {
      name: 'Admin Updated Name',
      description: 'Admin updated description'
    };

    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Project updated successfully');
    expect(response.body.data.name).toBe('Admin Updated Name');
    expect(response.body.data.description).toBe('Admin updated description');
  });

  test('should return 403 when user is not owner or admin', async () => {
    const updateData = {
      name: 'Unauthorized Update',
      description: 'This should not work'
    };

    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send(updateData);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Only project owner or admin can update project');

    // Verify project was NOT updated in database
    const unchangedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(unchangedProject!.name).not.toBe('Unauthorized Update');
  });
});