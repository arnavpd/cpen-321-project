/**
 * Interface: POST /api/projects/join
 * Tests without mocking - testing project joining with actual database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../testApp';
import { IUser } from '../../src/features/users/user.types';
import { projectModel } from '../../src/features/projects/project.model';
import { userModel } from '../../src/features/users/user.model';

describe('Unmocked: POST /api/projects/join', () => {
  let app: any;
  let ownerUser: IUser;
  let joinerUser: IUser;
  let projectId: string;
  let invitationCode: string;
  let joinerToken: string;

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

    joinerUser = await userModel.create({
      googleId: `google_joiner_${timestamp}`,
      email: `joiner_${timestamp}@test.com`,
      name: `Joiner User ${timestamp}`,
      profilePicture: 'https://example.com/pic2.jpg'
    });

    // Create project owned by ownerUser
    invitationCode = `INV${timestamp.toString().slice(-5)}`;
    const project = await projectModel.create({
      name: `Test Project ${timestamp}`,
      description: 'Test project for joining',
      invitationCode,
      ownerId: ownerUser._id,
      members: [{
        userId: ownerUser._id,
        role: 'owner' as const,
        admin: true,
        joinedAt: new Date()
      }]
    });

    projectId = project._id.toString();

    // Generate JWT token for joiner
    joinerToken = jwt.sign({ id: joinerUser._id, email: joinerUser.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (ownerUser) await userModel.delete(ownerUser._id);
      if (joinerUser) await userModel.delete(joinerUser._id);
      if (projectId) await projectModel.delete(new mongoose.Types.ObjectId(projectId));
    } catch (err) {
      // ignore cleanup errors in teardown
    }
    await mongoose.connection.close();
  });

  test('should successfully join project with valid invitation code', async () => {
    const response = await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ invitationCode });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Successfully joined project');
    expect(response.body.data.id).toBe(projectId);
    expect(response.body.data.members).toHaveLength(2);

    // Verify user was actually added to project in database
    const updatedProject = await projectModel.findById(new mongoose.Types.ObjectId(projectId));
    expect(updatedProject!.members).toHaveLength(2);
    expect(updatedProject!.members.some(m => m.userId.toString() === joinerUser._id.toString())).toBe(true);
  });

  test('should return 404 when invitation code does not exist', async () => {
    const response = await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ invitationCode: 'INVALID' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Error, no project exists with this code');
  });

  test('should return 400 when user tries to join project they are already in', async () => {
    // First join
    await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ invitationCode });

    // Try to join again
    const response = await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ invitationCode });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('You are already a member of this project');
  });
});