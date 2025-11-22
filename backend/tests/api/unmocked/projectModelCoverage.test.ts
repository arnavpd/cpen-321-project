/**
 * Project Model coverage tests focused on improving branch coverage
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { projectModel } from '../../../src/features/projects/project.model';

describe('Project Model Coverage Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Error Handling Branches', () => {
    test('findById should handle non-existent project', async () => {
      const result = await projectModel.findById(new mongoose.Types.ObjectId());
      expect(result).toBeNull();
    });

    test('findByInvitationCode should handle non-existent code', async () => {
      const result = await projectModel.findByInvitationCode('NONEXIST');
      expect(result).toBeNull();
    });

    test('findByOwnerId should return empty array for non-existent owner', async () => {
      const result = await projectModel.findByOwnerId(new mongoose.Types.ObjectId());
      expect(result).toEqual([]);
    });

    test('findByMemberId should return empty array for non-existent member', async () => {
      const result = await projectModel.findByMemberId(new mongoose.Types.ObjectId());
      expect(result).toEqual([]);
    });

    test('addMember should return null for non-existent project', async () => {
      const memberData = {
        userId: new mongoose.Types.ObjectId(),
        role: 'user' as const,
        admin: false,
        joinedAt: new Date()
      };

      const result = await projectModel.addMember(new mongoose.Types.ObjectId(), memberData);
      expect(result).toBeNull();
    });

    test('removeMember should return null for non-existent project', async () => {
      const result = await projectModel.removeMember(
        new mongoose.Types.ObjectId(), 
        new mongoose.Types.ObjectId()
      );
      expect(result).toBeNull();
    });

    test('addResource should return null for non-existent project', async () => {
      const resource = {
        resourceName: 'Test Resource',
        link: 'https://example.com'
      };

      const result = await projectModel.addResource(new mongoose.Types.ObjectId(), resource);
      expect(result).toBeNull();
    });

    test('removeResource should return null for non-existent project', async () => {
      const result = await projectModel.removeResource(new mongoose.Types.ObjectId(), 0);
      expect(result).toBeNull();
    });

    test('update should return null for non-existent project', async () => {
      const result = await projectModel.update(new mongoose.Types.ObjectId(), {
        name: 'Updated Name'
      });
      expect(result).toBeNull();
    });

    test('isUserAdmin should return false for non-existent project', async () => {
      const result = await projectModel.isUserAdmin(
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      );
      expect(result).toBe(false);
    });

    test('isUserAdmin should return false for non-member user', async () => {
      // Create a test project first
      const invitationCode = await projectModel.generateInvitationCode();
      const ownerId = new mongoose.Types.ObjectId();
      
      const projectData = {
        name: 'Test Admin Project',
        description: 'Test project for admin check',
        invitationCode,
        ownerId,
        members: [{
          userId: ownerId,
          role: 'owner' as const,
          admin: true,
          joinedAt: new Date()
        }],
        resources: [],
        isActive: true
      };

      const createdProject = await projectModel.create(projectData);
      
      // Check admin status for a user who is not a member
      const nonMemberId = new mongoose.Types.ObjectId();
      const result = await projectModel.isUserAdmin(createdProject._id, nonMemberId);
      expect(result).toBe(false);

      // Clean up
      await projectModel.delete(createdProject._id);
    });

    test('generateInvitationCode should create 8-character codes', async () => {
      const code1 = await projectModel.generateInvitationCode();
      const code2 = await projectModel.generateInvitationCode();
      
      expect(code1).toHaveLength(8);
      expect(code2).toHaveLength(8);
      expect(code1).not.toBe(code2); // Should be different
      expect(/^[A-Z0-9]+$/.test(code1)).toBe(true); // Should only contain uppercase letters and numbers
    });

    test('removeResource should handle resource removal properly', async () => {
      // Create a test project with resources
      const invitationCode = await projectModel.generateInvitationCode();
      const ownerId = new mongoose.Types.ObjectId();
      
      const projectData = {
        name: 'Test Resource Project',
        description: 'Test project for resource removal',
        invitationCode,
        ownerId,
        members: [{
          userId: ownerId,
          role: 'owner' as const,
          admin: true,
          joinedAt: new Date()
        }],
        resources: [
          { resourceName: 'Resource 1', link: 'https://example1.com' },
          { resourceName: 'Resource 2', link: 'https://example2.com' }
        ],
        isActive: true
      };

      const createdProject = await projectModel.create(projectData);
      
      // Remove the first resource (index 0)
      const updatedProject = await projectModel.removeResource(createdProject._id, 0);
      
      expect(updatedProject).toBeDefined();
      expect(updatedProject?.resources).toHaveLength(1);
      expect(updatedProject?.resources[0].resourceName).toBe('Resource 2');

      // Clean up
      await projectModel.delete(createdProject._id);
    });

    test('project creation and member management workflow', async () => {
      // Create project
      const invitationCode = await projectModel.generateInvitationCode();
      const ownerId = new mongoose.Types.ObjectId();
      
      const projectData = {
        name: 'Test Workflow Project',
        description: 'Complete workflow test',
        invitationCode,
        ownerId,
        members: [{
          userId: ownerId,
          role: 'owner' as const,
          admin: true,
          joinedAt: new Date()
        }],
        resources: [],
        isActive: true
      };

      const createdProject = await projectModel.create(projectData);
      expect(createdProject).toBeDefined();

      // Add a member
      const memberId = new mongoose.Types.ObjectId();
      const memberData = {
        userId: memberId,
        role: 'user' as const,
        admin: false,
        joinedAt: new Date()
      };

      const projectWithMember = await projectModel.addMember(createdProject._id, memberData);
      expect(projectWithMember?.members).toHaveLength(2);

      // Check admin status for non-admin member
      const isUserAdmin = await projectModel.isUserAdmin(createdProject._id, memberId);
      expect(isUserAdmin).toBe(false);

      // Check admin status for owner
      const isOwnerAdmin = await projectModel.isUserAdmin(createdProject._id, ownerId);
      expect(isOwnerAdmin).toBe(true);

      // Add resource
      const resource = {
        resourceName: 'Test Resource',
        link: 'https://testlink.com'
      };

      const projectWithResource = await projectModel.addResource(createdProject._id, resource);
      expect(projectWithResource?.resources).toHaveLength(1);

      // Update project
      const updateData = {
        description: 'Updated description'
      };

      const updatedProject = await projectModel.update(createdProject._id, updateData);
      expect(updatedProject?.description).toBe('Updated description');

      // Remove member
      const projectWithoutMember = await projectModel.removeMember(createdProject._id, memberId);
      expect(projectWithoutMember?.members).toHaveLength(1);

      // Clean up
      await projectModel.delete(createdProject._id);
    });
  });
});