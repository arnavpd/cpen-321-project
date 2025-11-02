import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { projectModel } from './project.model';
import { userModel } from '../users/user.model';
import logger from '../../utils/logger.util';

export class ProjectController {
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      const userId = req.user?._id;

      logger.info(`Project creation request: name="${name}", userId=${userId}`);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (!name || name.trim().length === 0) {
        res.status(400).json({ message: 'Project name is required' });
        return;
      }

      // Check if user already has a project with this name
      const existingProjects = await projectModel.findByOwnerId(userId);
      const duplicateProject = existingProjects.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
      if (duplicateProject) {
        logger.warn(`User ${userId} attempted to create duplicate project: ${name}`);
        res.status(400).json({ message: 'You already have a project with this name' });
        return;
      }

      // Generate unique invitation code
      let invitationCode: string = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        invitationCode = await projectModel.generateInvitationCode();
        const existingProject = await projectModel.findByInvitationCode(invitationCode);
        if (!existingProject) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        res.status(500).json({ message: 'Failed to generate unique invitation code' });
        return;
      }

      // Create project
      const projectData = {
        name: name.trim(),
        description: description?.trim() || '',
        invitationCode,
        ownerId: userId,
        members: [{
          userId,
          role: 'owner' as const,
          admin: true,
          joinedAt: new Date()
        }]
      };

      const project = await projectModel.create(projectData);

      // Update user's owned projects
      await userModel.addOwnedProject(userId, project._id);

      logger.info(`Project created: ${project._id} by user: ${userId}`);

      res.status(201).json({
        message: 'Project created successfully',
        data: {
          id: project._id,
          name: project.name,
          description: project.description,
          invitationCode: project.invitationCode,
          ownerId: project.ownerId.toString(), // Convert to string
          members: project.members,
          resources: project.resources || [], // Include resources
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error creating project:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getUserProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Get projects where user is owner
      const ownedProjects = await projectModel.findByOwnerId(userId);

      // Get projects where user is a member
      const memberProjects = await projectModel.findByMemberId(userId);

      // Combine and deduplicate projects
      const allProjects = [...ownedProjects];
      memberProjects.forEach(memberProject => {
        if (!allProjects.find(p => p._id.toString() === memberProject._id.toString())) {
          allProjects.push(memberProject);
        }
      });

      // Sort by creation date (newest first)
      allProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      logger.info(`Retrieved ${allProjects.length} projects for user: ${userId}`);

      // Get admin status for each project
      const projectsWithAdminStatus = await Promise.all(
        allProjects.map(async (project) => {
          const isAdmin = await projectModel.isUserAdmin(project._id, new mongoose.Types.ObjectId(userId));
          return {
            id: project._id,
            name: project.name,
            description: project.description,
            invitationCode: project.invitationCode,
            ownerId: project.ownerId.toString(), // Convert to string
            members: project.members,
            resources: project.resources || [], // Include resources
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            isOwner: project.ownerId.toString() === userId,
            isAdmin
          };
        })
      );

      res.status(200).json({
        message: 'Projects retrieved successfully',
        data: projectsWithAdminStatus
      });
    } catch (error) {
      logger.error('Error retrieving user projects:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user has access to this project
      const isOwner = project.ownerId.toString() === userId;
      const isMember = project.members.some(member => member.userId.toString() === userId);
      const isAdmin = await projectModel.isUserAdmin(new mongoose.Types.ObjectId(projectId), new mongoose.Types.ObjectId(userId));

      if (!isOwner && !isMember) {
        res.status(403).json({ message: 'Access denied to this project' });
        return;
      }

      logger.info(`Project retrieved: ${project._id}, resources count: ${project.resources?.length || 0}`);
      if (project.resources && project.resources.length > 0) {
        logger.info(`Resources: ${project.resources.map(r => r.resourceName)}`);
      }

      res.status(200).json({
        message: 'Project retrieved successfully',
        data: {
          id: project._id,
          name: project.name,
          description: project.description,
          invitationCode: project.invitationCode,
          ownerId: project.ownerId.toString(), // Convert to string
          members: project.members,
          resources: project.resources || [],
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          isOwner,
          isAdmin
        }
      });
    } catch (error) {
      logger.error('Error retrieving project:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user is the owner or admin
      const isOwner = project.ownerId.toString() === userId;
      const isAdmin = await projectModel.isUserAdmin(new mongoose.Types.ObjectId(projectId), new mongoose.Types.ObjectId(userId));
      
      if (!isOwner && !isAdmin) {
        res.status(403).json({ message: 'Only project owner or admin can update project' });
        return;
      }

      const updateData: any = {};
      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          res.status(400).json({ message: 'Project name cannot be empty' });
          return;
        }
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        updateData.description = description?.trim() || '';
      }

      const updatedProject = await projectModel.update(new mongoose.Types.ObjectId(projectId), updateData);

      if (!updatedProject) {
        res.status(500).json({ message: 'Failed to update project' });
        return;
      }

      logger.info(`Project updated: ${projectId} by user: ${userId}`);

      res.status(200).json({
        message: 'Project updated successfully',
        data: {
          id: updatedProject._id,
          name: updatedProject.name,
          description: updatedProject.description,
          invitationCode: updatedProject.invitationCode,
          ownerId: updatedProject.ownerId.toString(), // Convert to string
          members: updatedProject.members,
          resources: updatedProject.resources || [], // Include resources
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          isOwner,
          isAdmin
        }
      });
    } catch (error) {
      logger.error('Error updating project:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      logger.info(`Delete project request: projectId=${projectId}, userId=${userId}`);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user is the owner
      if (project.ownerId.toString() !== userId) {
        res.status(403).json({ message: 'Only project owner can delete project' });
        return;
      }

      await projectModel.delete(new mongoose.Types.ObjectId(projectId));

      // Remove from user's owned projects (cleanup)
      await userModel.removeOwnedProject(new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(projectId));

      logger.info(`Project permanently deleted from database: ${projectId} by user: ${userId}`);

      res.status(200).json({
        message: 'Project deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async joinProject(req: Request, res: Response): Promise<void> {
    try {
      const { invitationCode } = req.body;
      const userId = req.user?.id;

      logger.info(`Join project request: invitationCode="${invitationCode}", userId=${userId}`);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (!invitationCode || invitationCode.trim().length === 0) {
        res.status(400).json({ message: 'Invitation code is required' });
        return;
      }

      // Find project by invitation code
      const project = await projectModel.findByInvitationCode(invitationCode.trim());

      if (!project) {
        logger.warn(`User ${userId} attempted to join project with invalid code: ${invitationCode}`);
        res.status(404).json({ message: 'Error, no project exists with this code' });
        return;
      }

      // Check if user is already a member
      const isAlreadyMember = project.members.some(member => member.userId.toString() === userId);
      if (isAlreadyMember) {
        logger.warn(`User ${userId} attempted to join project they are already a member of: ${project._id}`);
        res.status(400).json({ message: 'You are already a member of this project' });
        return;
      }

      // Add user as a member
      const memberData = {
        userId: new mongoose.Types.ObjectId(userId),
        role: 'user' as const,
        admin: false,
        joinedAt: new Date()
      };

      const updatedProject = await projectModel.addMember(project._id, memberData);

      if (!updatedProject) {
        res.status(500).json({ message: 'Failed to join project' });
        return;
      }

      logger.info(`User ${userId} joined project: ${project._id}`);

      res.status(200).json({
        message: 'Successfully joined project',
        data: {
          id: updatedProject._id,
          name: updatedProject.name,
          description: updatedProject.description,
          invitationCode: updatedProject.invitationCode,
          ownerId: updatedProject.ownerId.toString(), // Convert to string
          members: updatedProject.members,
          resources: updatedProject.resources || [], // Include resources
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          isOwner: false
        }
      });
    } catch (error) {
      logger.error('Error joining project:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async addResource(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { resourceName, link } = req.body;
      const userId = req.user?.id;

      logger.info(`=== ADD RESOURCE REQUEST ===`);
      logger.info(`projectId: ${projectId}`);
      logger.info(`resourceName: "${resourceName}"`);
      logger.info(`link: "${link}"`);
      logger.info(`userId: ${userId}`);
      logger.info(`Request body: ${JSON.stringify(req.body)}`);
      logger.info(`Request params: ${JSON.stringify(req.params)}`);

      if (!userId) {
        logger.warn('User not authenticated for add resource request');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (!resourceName || resourceName.trim().length === 0) {
        res.status(400).json({ message: 'Resource name is required' });
        return;
      }

      if (!link || link.trim().length === 0) {
        res.status(400).json({ message: 'Resource link is required' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user has access to this project
      const isOwner = project.ownerId.toString() === userId;
      const isMember = project.members.some(member => member.userId.toString() === userId);

      if (!isOwner && !isMember) {
        res.status(403).json({ message: 'Access denied to this project' });
        return;
      }

      const resource = {
        resourceName: resourceName.trim(),
        link: link.trim()
      };

      const updatedProject = await projectModel.addResource(new mongoose.Types.ObjectId(projectId), resource);

      if (!updatedProject) {
        res.status(500).json({ message: 'Failed to add resource' });
        return;
      }

      logger.info(`Resource added to project: ${projectId} by user: ${userId}`);
      logger.info(`Updated project now has ${updatedProject.resources.length} resources: ${updatedProject.resources.map(r => r.resourceName)}`);

      res.status(200).json({
        message: 'Resource added successfully',
        data: {
          id: updatedProject._id,
          name: updatedProject.name,
          description: updatedProject.description,
          invitationCode: updatedProject.invitationCode,
          ownerId: updatedProject.ownerId.toString(), // Convert to string
          members: updatedProject.members,
          resources: updatedProject.resources,
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error adding resource:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, userId: memberId } = req.params;
      const userId = req.user?.id;

      logger.info(`Remove member request: projectId=${projectId}, memberId=${memberId}, adminId=${userId}`);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user is admin or owner
      const isOwner = project.ownerId.toString() === userId;
      const isAdmin = await projectModel.isUserAdmin(new mongoose.Types.ObjectId(projectId), new mongoose.Types.ObjectId(userId));

      if (!isOwner && !isAdmin) {
        res.status(403).json({ message: 'Only project owner or admin can remove members' });
        return;
      }

      // Check if trying to remove the owner
      if (project.ownerId.toString() === memberId) {
        res.status(400).json({ message: 'Cannot remove project owner' });
        return;
      }

      // Check if member exists in project
      const memberExists = project.members.some(member => member.userId.toString() === memberId);
      if (!memberExists) {
        res.status(404).json({ message: 'Member not found in project' });
        return;
      }

      // Remove member from project
      const updatedProject = await projectModel.removeMember(new mongoose.Types.ObjectId(projectId), new mongoose.Types.ObjectId(memberId));

      if (!updatedProject) {
        res.status(500).json({ message: 'Failed to remove member' });
        return;
      }

      // Remove project from user's member projects
      await userModel.removeMemberProject(new mongoose.Types.ObjectId(memberId), new mongoose.Types.ObjectId(projectId));

      // Calculate admin and owner status for the response
      const userIsOwner = updatedProject.ownerId.toString() === userId;
      const userIsAdmin = await projectModel.isUserAdmin(new mongoose.Types.ObjectId(projectId), new mongoose.Types.ObjectId(userId));

      logger.info(`Member removed from project: ${projectId}, memberId: ${memberId} by admin: ${userId}`);

      res.status(200).json({
        message: 'Member removed successfully',
        data: {
          id: updatedProject._id,
          name: updatedProject.name,
          description: updatedProject.description,
          invitationCode: updatedProject.invitationCode,
          ownerId: updatedProject.ownerId.toString(),
          members: updatedProject.members,
          resources: updatedProject.resources || [],
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          isOwner: userIsOwner,
          isAdmin: userIsAdmin
        }
      });
    } catch (error) {
      logger.error('Error removing member:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
