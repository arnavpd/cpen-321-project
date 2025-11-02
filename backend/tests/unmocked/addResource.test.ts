/**
 * Interface: POST /api/projects/:projectId/resources
 * Tests without mocking - testing resource addition with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/projects/:projectId/resources', () => {
  let app: any;
  let ownerUser: IUser;
  let memberUser: IUser;
  let nonMemberUser: IUser;
  let projectId: string;
  let ownerToken: string;
  let memberToken: string;
  let nonMemberToken: string;

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

    memberUser = await userModel.create({
      googleId: `google_member_${timestamp}`,
      email: `member_${timestamp}@test.com`,
      name: `Member User ${timestamp}`,
      profilePicture: 'https://example.com/pic2.jpg'
    });

    nonMemberUser = await userModel.create({
      googleId: `google_nonmember_${timestamp}`,
      email: `nonmember_${timestamp}@test.com`,
      name: `NonMember User ${timestamp}`,
      profilePicture: 'https://example.com/pic3.jpg'
    });

    // Create project with owner and member
    const project = await projectModel.create({
      name: `Resource Project ${timestamp}`,
      description: 'Test project for resource addition',
      invitationCode: `RES${timestamp.toString().slice(-5)}`,
      ownerId: ownerUser._id,
      members: [
        {
          userId: ownerUser._id,
          role: 'owner' as const,
          admin: true,
          joinedAt: new Date()
        },
        {
          userId: memberUser._id,
          role: 'user' as const,
          admin: false,
          joinedAt: new Date()
        }
      ],
      resources: []
    });

    projectId = project._id.toString();

    // Generate JWT tokens
    ownerToken = jwt.sign({ id: ownerUser._id, email: ownerUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    memberToken = jwt.sign({ id: memberUser._id, email: memberUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    nonMemberToken = jwt.sign({ id: nonMemberUser._id, email: nonMemberUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (ownerUser) await userModel.delete(ownerUser._id);
      if (memberUser) await userModel.delete(memberUser._id);
      if (nonMemberUser) await userModel.delete(nonMemberUser._id);
      if (projectId) await projectModel.delete(new mongoose.Types.ObjectId(projectId));
    } catch (err) {
      // ignore cleanup errors in teardown
    }
    await mongoose.connection.close();
  });

  test('should successfully add resource when user is project member', async () => {
    const resourceData = {
      resourceName: 'Test Documentation',
      link: 'https://docs.example.com/api'
    };

    const response = await request(app)
      .post(`/api/projects/${projectId}/resources`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send(resourceData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Resource added successfully');
    expect(response.body.data.resources).toHaveLength(1);
    expect(response.body.data.resources[0].resourceName).toBe('Test Documentation');
    expect(response.body.data.resources[0].link).toBe('https://docs.example.com/api');

    // Verify resource was actually added to project in database
    const updatedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(updatedProject!.resources).toHaveLength(1);
    expect(updatedProject!.resources[0].resourceName).toBe('Test Documentation');
    expect(updatedProject!.resources[0].link).toBe('https://docs.example.com/api');
  });

  test('should return 403 when user is not project member', async () => {
    const resourceData = {
      resourceName: 'Unauthorized Resource',
      link: 'https://malicious.com/resource'
    };

    const response = await request(app)
      .post(`/api/projects/${projectId}/resources`)
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send(resourceData);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Access denied to this project');

    // Verify resource was NOT added to project
    const unchangedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(unchangedProject!.resources).toHaveLength(0);
  });

  test('should return 400 when resource name is missing', async () => {
    const invalidResourceData = {
      link: 'https://example.com/resource'
      // missing resourceName
    };

    const response = await request(app)
      .post(`/api/projects/${projectId}/resources`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(invalidResourceData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid input data');

    // Verify no resource was added
    const unchangedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(unchangedProject!.resources).toHaveLength(0);
  });
});