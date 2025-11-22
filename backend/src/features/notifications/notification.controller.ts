import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { notificationModel } from './notification.model';
import logger from '../../utils/logger.util';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get notifications for the authenticated user
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const { limit = 20, skip = 0 } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const skipNum = parseInt(skip as string, 10);

      const notifications = await notificationModel.findByUserId(
        new mongoose.Types.ObjectId(userId),
        limitNum,
        skipNum
      );

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to get notifications' });
    }
  }

  /**
   * GET /api/notifications/unread
   * Get unread notifications for the authenticated user
   */
  async getUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const notifications = await notificationModel.findUnreadByUserId(
        new mongoose.Types.ObjectId(userId)
      );

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      logger.error('Error getting unread notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to get unread notifications' });
    }
  }

  /**
   * GET /api/notifications/count
   * Get unread notification count for the authenticated user
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const count = await notificationModel.getUnreadCount(
        new mongoose.Types.ObjectId(userId)
      );

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      res.status(500).json({ success: false, message: 'Failed to get notification count' });
    }
  }

  /**
   * PUT /api/notifications/:notificationId/read
   * Mark a notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        res.status(400).json({ success: false, message: 'Invalid notification ID' });
        return;
      }

      const notification = await notificationModel.markAsRead(
        new mongoose.Types.ObjectId(notificationId)
      );

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      // Verify the notification belongs to the user
      if (notification.userId.toString() !== userId.toString()) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  /**
   * PUT /api/notifications/mark-all-read
   * Mark all notifications as read for the authenticated user
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      await notificationModel.markAllAsRead(new mongoose.Types.ObjectId(userId));

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Delete a notification
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        res.status(400).json({ success: false, message: 'Invalid notification ID' });
        return;
      }

      // First check if notification exists and belongs to user
      const notification = await notificationModel.findById(
        new mongoose.Types.ObjectId(notificationId)
      );

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      // Store the comparison values for debugging
      // Handle both ObjectId and full user object cases for backward compatibility
      const notificationUserId = notification.userId._id ? 
        notification.userId._id.toString() : 
        notification.userId.toString();
      const currentUserId = (userId._id || userId).toString();
      const isMatch = notificationUserId === currentUserId;

      if (!isMatch) {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied'
        });
        return;
      }

      await notificationModel.delete(new mongoose.Types.ObjectId(notificationId));

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
  }

  /**
   * POST /api/notifications
   * Create a new notification (for testing)
   */
  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const { projectId, type, title, message } = req.body;

      if (!projectId || !type || !title || !message) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: projectId, type, title, message' 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ success: false, message: 'Invalid project ID' });
        return;
      }

      const validTypes = ['task_deadline', 'expense_added', 'chat_message', 'task_assigned', 'project_invitation', 'task_completed', 'expense_paid'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ 
          success: false, 
          message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` 
        });
        return;
      }

      const notification = await notificationModel.create({
        userId: userId._id || userId,
        projectId: new mongoose.Types.ObjectId(projectId),
        type,
        title,
        message,
      });

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      res.status(500).json({ success: false, message: 'Failed to create notification' });
    }
  }
}

export const notificationController = new NotificationController();