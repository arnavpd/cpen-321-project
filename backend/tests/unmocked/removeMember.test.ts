/**
 * Interface: DELETE /api/projects/:projectId/members/:userId
 * Tests without mocking - testing member removal with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: DELETE /api/projects/:projectId/members/:userId', () => {
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
      name: `Test Project ${timestamp}`,
      description: 'Test project for member removal',
      invitationCode: `MEM${timestamp.toString().slice(-5)}`,
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

  test('should successfully remove member when user is admin', async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Member removed successfully');
    expect(response.body.data.members).toHaveLength(2);

    // Verify member was actually removed from project in database
    const updatedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(updatedProject!.members).toHaveLength(2);
    expect(updatedProject!.members.some(m => m.userId.toString() === memberUser._id.toString())).toBe(false);
  });

  test('should return 403 when user is not admin or owner', async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${adminUser._id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Only project owner or admin can remove members');
  });

  test('should return 400 when trying to remove project owner', async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${ownerUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Cannot remove project owner');

    // Verify owner still exists in project
    const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(project!.members.some(m => m.userId.toString() === ownerUser._id.toString())).toBe(true);
  });
});