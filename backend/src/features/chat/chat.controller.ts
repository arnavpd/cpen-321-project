import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { chatMessageModel } from './chatMessage.model';
import { projectModel } from '../projects/project.model';
import { userModel } from '../users/user.model';
import logger from '../../utils/logger.util';

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { content } = req.body;
      const userId = req.user?._id;

      logger.info(`=== SEND CHAT MESSAGE REQUEST ===`);
      logger.info(`projectId: ${projectId}`);
      logger.info(`content: "${content}"`);
      logger.info(`senderId: ${userId}`);
      logger.info(`Request body: ${JSON.stringify(req.body)}`);
      logger.info(`Request params: ${JSON.stringify(req.params)}`);

      if (!userId) {
        logger.warn('User not authenticated for send message request');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({ message: 'Message content is required' });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(400).json({ message: 'Message content must be less than 2000 characters' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user has access to this project
      const isOwner = project.ownerId.toString() === userId.toString();
      const isMember = project.members.some(member => member.userId.toString() === userId.toString());

      if (!isOwner && !isMember) {
        res.status(403).json({ message: 'Access denied to this project' });
        return;
      }

      // Get user information for sender name
      const user = await userModel.findById(new mongoose.Types.ObjectId(userId));
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const messageData = {
        projectId: new mongoose.Types.ObjectId(projectId),
        content: content.trim(),
        senderId: new mongoose.Types.ObjectId(userId),
        senderName: user.name,
        messageType: 'text' as const,
        isDeleted: false
      };

      const message = await chatMessageModel.create(messageData);

      logger.info(`Message sent to project: ${projectId} by user: ${userId}`);
      logger.info(`Message ID: ${message._id}, Content: "${message.content}"`);

      const messageResponse = {
        id: message._id.toString(),
        content: message.content,
        senderName: message.senderName,
        senderId: message.senderId.toString(),
        timestamp: message.createdAt.getTime(),
        projectId: message.projectId.toString()
      };

      // Broadcast new message via WebSocket
      if (global.chatWebSocketService) {
        await global.chatWebSocketService.broadcastNewMessage(projectId, messageResponse);
      }

      res.status(201).json({
        message: 'Message sent successfully',
        data: messageResponse
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { limit = 50, skip = 0 } = req.query;
      const userId = req.user?._id;

      logger.info(`=== GET MESSAGES REQUEST ===`);
      logger.info(`projectId: ${projectId}`);
      logger.info(`limit: ${limit}, skip: ${skip}`);
      logger.info(`userId: ${userId}`);

      if (!userId) {
        logger.warn('User not authenticated for get messages request');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const project = await projectModel.findById(new mongoose.Types.ObjectId(projectId));

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user has access to this project
      const isOwner = project.ownerId.toString() === userId.toString();
      const isMember = project.members.some(member => member.userId.toString() === userId.toString());

      if (!isOwner && !isMember) {
        res.status(403).json({ message: 'Access denied to this project' });
        return;
      }

      const messages = await chatMessageModel.findByProjectIdChronological(
        new mongoose.Types.ObjectId(projectId),
        parseInt(limit as string),
        parseInt(skip as string)
      );

      logger.info(`Messages retrieved for project: ${projectId}, count: ${messages.length}`);

      res.status(200).json({
        message: 'Messages retrieved successfully',
        data: messages.map(message => ({
          id: message._id.toString(),
          content: message.content,
          senderName: message.senderName,
          senderId: message.senderId.toString(),
          timestamp: message.createdAt.getTime(),
          projectId: message.projectId.toString()
        }))
      });
    } catch (error) {
      logger.error('Error retrieving messages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, messageId } = req.params;
      const userId = req.user?._id;

      logger.info(`=== DELETE MESSAGE REQUEST ===`);
      logger.info(`projectId: ${projectId}`);
      logger.info(`messageId: ${messageId}`);
      logger.info(`userId: ${userId}`);

      if (!userId) {
        logger.warn('User not authenticated for delete message request');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const message = await chatMessageModel.findById(new mongoose.Types.ObjectId(messageId));

      if (!message) {
        res.status(404).json({ message: 'Message not found' });
        return;
      }

      // Check if user is the sender of the message
      if (message.senderId.toString() !== userId.toString()) {
        res.status(403).json({ message: 'You can only delete your own messages' });
        return;
      }

      // Check if message belongs to the project
      if (message.projectId.toString() !== projectId) {
        res.status(400).json({ message: 'Message does not belong to this project' });
        return;
      }

      await chatMessageModel.delete(new mongoose.Types.ObjectId(messageId));

      logger.info(`Message deleted: ${messageId} by user: ${userId}`);

      // Broadcast message deletion via WebSocket
      if (global.chatWebSocketService) {
        await global.chatWebSocketService.broadcastMessageDeleted(projectId, messageId);
      }

      res.status(200).json({
        message: 'Message deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
