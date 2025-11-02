import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { taskModel } from './task.model';
import { userModel } from '../users/user.model';
import { calendarService } from '../calendar/calendar.service';
import logger from '../../utils/logger.util';

export class TaskController {
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { name, assignee, status, deadline } = req.body;
      const userId = req.user?._id;

      logger.info('=== CREATE TASK REQUEST ===');
      logger.info('Project ID:', projectId);
      logger.info('User ID:', userId);
      logger.info('Task Data:', { name, assignee, status, deadline });
      logger.info('Request headers:', req.headers);
      logger.info('Request body:', JSON.stringify(req.body, null, 2));

      if (!userId) {
        logger.error('❌ User not authenticated');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Validate required fields
      if (!name || !assignee || !status) {
        logger.error('❌ Missing required fields:', { name, assignee, status });
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Validate ObjectId formats
      try {
        const projectObjectId = new mongoose.Types.ObjectId(projectId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        logger.info('✅ Project and User ObjectIds validated successfully');
        logger.info('Project ObjectId:', projectObjectId.toString());
        logger.info('User ObjectId:', userObjectId.toString());
      } catch (objectIdError) {
        logger.error('❌ Invalid ObjectId format:', objectIdError);
        res.status(400).json({ success: false, message: 'Invalid ID format' });
        return;
      }

      // Find assignee by ID (since frontend sends user ID)
      let assigneeObjectId: mongoose.Types.ObjectId;
      try {
        logger.info('🔍 Looking up assignee by ID:', assignee);

        // First try to parse as ObjectId to see if it's already an ID
        try {
          assigneeObjectId = new mongoose.Types.ObjectId(assignee);
          logger.info('✅ Assignee ID parsed successfully:', assigneeObjectId.toString());
        } catch (objectIdError) {
          // If not a valid ObjectId, try to find by name (fallback)
          logger.info('🔍 Not a valid ObjectId, trying to find by name:', assignee);
          const assigneeUser = await userModel.findByName(assignee);

          if (!assigneeUser) {
            logger.error('❌ Assignee not found by name:', assignee);
            res.status(400).json({ success: false, message: `User "${assignee}" not found` });
            return;
          }

          assigneeObjectId = assigneeUser._id;
          logger.info('✅ Assignee found by name:', assigneeUser.name, 'ID:', assigneeObjectId.toString());
        }
      } catch (userLookupError) {
        logger.error('❌ Error looking up assignee:', userLookupError);
        res.status(400).json({ success: false, message: 'Failed to find assignee' });
        return;
      }

      // Map frontend status values to backend schema values
      const statusMapping: { [key: string]: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'backlog' } = {
        'Not Started': 'not_started',
        'In Progress': 'in_progress',
        'Done': 'completed',
        'Blocked': 'blocked',
        'Backlog': 'backlog'
      };

      const mappedStatus = statusMapping[status] || 'not_started';
      logger.info('📝 Status mapping:', status, '->', mappedStatus);

      const taskData = {
        projectId: new mongoose.Types.ObjectId(projectId),
        title: name,
        assignees: [assigneeObjectId],
        status: mappedStatus,
        createdBy: new mongoose.Types.ObjectId(userId),
        deadline: deadline ? new Date(deadline) : undefined,
      };

      logger.info('📝 Creating task with data:', JSON.stringify(taskData, null, 2));

      const task = await taskModel.create(taskData);

      logger.info('✅ Task created successfully in database');
      logger.info('Task ID:', task._id.toString());
      logger.info('Task Project ID:', task.projectId.toString());
      logger.info('Task details:', JSON.stringify(task, null, 2));
      
      // Verify the task was created with the correct project ID
      if (task.projectId.toString() !== projectId) {
        logger.error('❌ CRITICAL: Task created with wrong project ID!');
        logger.error('Expected project ID:', projectId);
        logger.error('Actual project ID:', task.projectId.toString());
      } else {
        logger.info('✅ Task created with correct project ID');
      }

      // Sync with Google Calendar for all assignees who have calendar enabled
      if (task.deadline) {
        await this.syncTaskToCalendars(task);
      }

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      logger.error('❌ Error creating task:', error);
      if (error instanceof Error) {
        logger.error('Error stack:', error.stack);
      }
      res.status(500).json({ success: false, message: 'Failed to create task' });
    }
  }

  async getTasksByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?._id;

      logger.info('=== GET TASKS BY PROJECT REQUEST ===');
      logger.info('Project ID (string):', projectId);
      logger.info('User ID:', userId);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Convert to ObjectId and log the conversion
      const projectObjectId = new mongoose.Types.ObjectId(projectId);
      logger.info('Project ID (ObjectId):', projectObjectId.toString());
      
      // First, let's check what tasks exist in the database for debugging
      const allTasks = await taskModel.getAllTasks();
      logger.info('🔍 DEBUG: All tasks in database:', allTasks.length);
      allTasks.forEach((task, index) => {
        logger.info(`📋 Task ${index + 1}: ID=${task._id}, ProjectID=${task.projectId}, Title=${task.title}`);
      });

      const tasks = await taskModel.findByProjectId(projectObjectId);

      logger.info('✅ Tasks retrieved for project:', tasks.length);
      tasks.forEach((task, index) => {
        logger.info(`📋 Retrieved Task ${index + 1}: ID=${task._id}, ProjectID=${task.projectId}, Title=${task.title}`);
      });
      
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      logger.error('❌ Error getting tasks:', error);
      res.status(500).json({ success: false, message: 'Failed to get tasks' });
    }
  }

  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = req.user?._id;

      logger.info('=== GET TASK BY ID REQUEST ===');
      logger.info('Task ID:', taskId);
      logger.info('User ID:', userId);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const task = await taskModel.findById(new mongoose.Types.ObjectId(taskId));

      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      logger.info('✅ Task retrieved:', task._id.toString());
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      logger.error('❌ Error getting task:', error);
      res.status(500).json({ success: false, message: 'Failed to get task' });
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { title, description, status, deadline, assignees } = req.body;
      const userId = req.user?._id;

      logger.info('=== UPDATE TASK REQUEST ===');
      logger.info('Task ID:', taskId);
      logger.info('User ID:', userId);
      logger.info('Update Data:', { title, description, status, deadline, assignees });

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (deadline) updateData.deadline = new Date(deadline);
      if (assignees) updateData.assignees = assignees.map((id: string) => new mongoose.Types.ObjectId(id));

      const task = await taskModel.update(new mongoose.Types.ObjectId(taskId), updateData);

      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      // Sync with Google Calendar if deadline changed
      if (task.deadline && (deadline !== undefined || assignees !== undefined)) {
        await this.syncTaskToCalendars(task);
      }

      logger.info('✅ Task updated:', task._id.toString());
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      logger.error('❌ Error updating task:', error);
      res.status(500).json({ success: false, message: 'Failed to update task' });
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = req.user?._id;

      logger.info('=== DELETE TASK REQUEST ===');
      logger.info('Task ID:', taskId);
      logger.info('User ID:', userId);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Get task before deleting to access calendar event ID
      const task = await taskModel.findById(new mongoose.Types.ObjectId(taskId));
      
      if (task) {
        // Remove from calendars before deleting
        await this.removeTaskFromCalendars(task);
      }

      await taskModel.delete(new mongoose.Types.ObjectId(taskId));

      logger.info('✅ Task deleted:', taskId);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      logger.error('❌ Error deleting task:', error);
      res.status(500).json({ success: false, message: 'Failed to delete task' });
    }
  }

  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      logger.info('=== GET ALL TASKS DEBUG REQUEST ===');
      logger.info('User ID:', userId);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Get all tasks from database (for debugging)
      const allTasks = await taskModel.getAllTasks();

      logger.info('🔍 All tasks in database:', allTasks.length);
      logger.info('📋 Tasks details:', JSON.stringify(allTasks, null, 2));

      res.status(200).json({ success: true, data: allTasks, count: allTasks.length });
    } catch (error) {
      logger.error('❌ Error getting all tasks:', error);
      res.status(500).json({ success: false, message: 'Failed to get all tasks' });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      logger.info('=== GET ALL USERS DEBUG REQUEST ===');
      logger.info('User ID:', userId);

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Get all users from database (for debugging)
      const allUsers = await userModel.getAllUsers();

      logger.info('🔍 All users in database:', allUsers.length);
      logger.info('👥 Users details:', JSON.stringify(allUsers, null, 2));

      res.status(200).json({ success: true, data: allUsers, count: allUsers.length });
    } catch (error) {
      logger.error('❌ Error getting all users:', error);
      res.status(500).json({ success: false, message: 'Failed to get all users' });
    }
  }

  /**
   * Helper method: Sync task to Google Calendar for all assignees with calendar enabled
   */
  private async syncTaskToCalendars(task: any): Promise<void> {
    try {
      logger.info('📅 Syncing task to calendars for assignees:', task.assignees);

      for (const assigneeId of task.assignees) {
        const assignee = await userModel.findById(assigneeId);
        
        if (!assignee) {
          logger.warn(`Assignee ${assigneeId} not found`);
          continue;
        }

        if (!assignee.calendarEnabled || !assignee.calendarRefreshToken) {
          logger.info(`Calendar not enabled for user ${assignee.name}`);
          continue;
        }

        try {
          // Format status for display
          const statusDisplay = this.formatStatusForDisplay(task.status);
          
          // Build description with status
          const description = this.buildCalendarDescription(task, statusDisplay);
          
          // Create or update calendar event
          if (task.calendarEventId) {
            // Update existing event
            await calendarService.updateEvent(
              assignee.calendarRefreshToken,
              task.calendarEventId,
              {
                summary: `${task.title} [${statusDisplay}]`,
                description: description,
                start: task.deadline,
                end: task.deadline,
              }
            );
            logger.info(`✅ Calendar event updated for ${assignee.name}`);
          } else {
            // Create new event
            const eventId = await calendarService.createEvent(
              assignee.calendarRefreshToken,
              {
                summary: `${task.title} [${statusDisplay}]`,
                description: description,
                start: task.deadline,
                end: task.deadline,
              }
            );
            
            // Store event ID in task
            await taskModel.update(task._id, { calendarEventId: eventId });
            logger.info(`✅ Calendar event created for ${assignee.name}: ${eventId}`);
          }
        } catch (error) {
          logger.error(`Failed to sync calendar for user ${assignee.name}:`, error);
          // Continue with other assignees even if one fails
        }
      }
    } catch (error) {
      logger.error('Error syncing task to calendars:', error);
      // Don't throw error - calendar sync is optional
    }
  }

  /**
   * Helper method: Format status for display in calendar
   */
  private formatStatusForDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'not_started': 'Not Started',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'blocked': 'Blocked',
      'backlog': 'Backlog'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Helper method: Build calendar event description with status and task details
   */
  private buildCalendarDescription(task: any, statusDisplay: string): string {
    const parts: string[] = [];
    
    // Add status
    parts.push(`Status: ${statusDisplay}`);
    
    // Add task description if available
    if (task.description) {
      parts.push(`\nDescription: ${task.description}`);
    }
    
    // Add assignees info if multiple
    if (task.assignees && task.assignees.length > 1) {
      parts.push(`\nAssignees: ${task.assignees.length} team members`);
    }
    
    // Add default message
    if (!task.description) {
      parts.push(`\nTask assigned in project`);
    }
    
    return parts.join('');
  }

  /**
   * Helper method: Remove task from Google Calendar for all assignees
   */
  private async removeTaskFromCalendars(task: any): Promise<void> {
    try {
      if (!task.calendarEventId) {
        return;
      }

      logger.info('📅 Removing task from calendars for assignees:', task.assignees);

      for (const assigneeId of task.assignees) {
        const assignee = await userModel.findById(assigneeId);
        
        if (!assignee || !assignee.calendarRefreshToken) {
          continue;
        }

        try {
          await calendarService.deleteEvent(
            assignee.calendarRefreshToken,
            task.calendarEventId
          );
          logger.info(`✅ Calendar event deleted for ${assignee.name}`);
        } catch (error) {
          logger.error(`Failed to delete calendar event for user ${assignee.name}:`, error);
          // Continue with other assignees even if one fails
        }
      }
    } catch (error) {
      logger.error('Error removing task from calendars:', error);
      // Don't throw error - calendar sync is optional
    }
  }
}

export const taskController = new TaskController();
