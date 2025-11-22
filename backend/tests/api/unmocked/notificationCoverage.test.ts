/**
 * Comprehensive Notification Model Tests - Targeting Branch Coverage
 * Focus: Error handling, null returns, conditional logic, edge cases
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { notificationModel } from '../../../src/features/notifications/notification.model';
import { userModel } from '../../../src/features/users/user.model';
import { projectModel } from '../../../src/features/projects/project.model';

describe('Notification Model Comprehensive Coverage Tests', () => {
  let app: any;
  let testUserId1: mongoose.Types.ObjectId;
  let testUserId2: mongoose.Types.ObjectId;
  let testProjectId1: mongoose.Types.ObjectId;
  let testProjectId2: mongoose.Types.ObjectId;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      await notificationModel['notification'].deleteMany({});
      await userModel.deleteMany({});
      await projectModel['project'].deleteMany({});
    } catch (err) {
      // ignore cleanup errors
    }

    // Create test users - using simpler registration
    const userResponse1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser1@example.com',
        name: 'Test User 1',
        password: 'password123',
      });

    const userResponse2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser2@example.com',
        name: 'Test User 2', 
        password: 'password123',
      });

    testUserId1 = new mongoose.Types.ObjectId(userResponse1.body.id);
    testUserId2 = new mongoose.Types.ObjectId(userResponse2.body.id);

    // Create test projects
    const projectResponse1 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userResponse1.body.token}`)
      .send({
        name: 'Test Project 1',
        description: 'Test project description 1',
      });

    const projectResponse2 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userResponse2.body.token}`)
      .send({
        name: 'Test Project 2',
        description: 'Test project description 2',
      });

    testProjectId1 = new mongoose.Types.ObjectId(projectResponse1.body._id);
    testProjectId2 = new mongoose.Types.ObjectId(projectResponse2.body._id);
  });

  describe('Error Handling and Conditional Logic Branches', () => {
    test('findById should return null for non-existent notification', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await notificationModel.findById(nonExistentId);
      expect(result).toBeNull();
    });

    test('findByUserId should return empty array for user with no notifications', async () => {
      const result = await notificationModel.findByUserId(testUserId1);
      expect(result).toEqual([]);
    });

    test('findByUserId should handle pagination parameters', async () => {
      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await notificationModel.create({
          userId: testUserId1,
          projectId: testProjectId1,
          type: 'task_assigned',
          title: `Test Notification ${i}`,
          message: `Test message ${i}`,
        });
      }

      // Test pagination
      const result1 = await notificationModel.findByUserId(testUserId1, 2, 0);
      expect(result1).toHaveLength(2);

      const result2 = await notificationModel.findByUserId(testUserId1, 2, 2);
      expect(result2).toHaveLength(2);
    });

    test('findByProjectId should return empty array for project with no notifications', async () => {
      const result = await notificationModel.findByProjectId(testProjectId1);
      expect(result).toEqual([]);
    });

    test('findUnreadByUserId should return empty array for user with no unread notifications', async () => {
      const result = await notificationModel.findUnreadByUserId(testUserId1);
      expect(result).toEqual([]);
    });

    test('findUnreadByUserId should filter out read notifications', async () => {
      // Create read notification
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Read Notification',
        message: 'This is read',
        isRead: true,
      });

      // Create unread notification
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Unread Notification',
        message: 'This is unread',
        isRead: false,
      });

      const result = await notificationModel.findUnreadByUserId(testUserId1);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Unread Notification');
    });

    test('getUnreadCount should return 0 for user with no unread notifications', async () => {
      const result = await notificationModel.getUnreadCount(testUserId1);
      expect(result).toBe(0);
    });

    test('getUnreadCount should count only unread notifications', async () => {
      // Create read notification
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Read Notification',
        message: 'This is read',
        isRead: true,
      });

      // Create unread notifications
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Unread Notification 1',
        message: 'This is unread',
        isRead: false,
      });

      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_deadline',
        title: 'Unread Notification 2',
        message: 'This is also unread',
        isRead: false,
      });

      const result = await notificationModel.getUnreadCount(testUserId1);
      expect(result).toBe(2);
    });

    test('findByType should handle different conditional parameters', async () => {
      // Create notifications of different types
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'Task assigned to user 1 in project 1',
      });

      await notificationModel.create({
        userId: testUserId2,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'Task assigned to user 2 in project 1',
      });

      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId2,
        type: 'task_deadline',
        title: 'Task Deadline',
        message: 'Task deadline in project 2',
      });

      // Test type only
      const typeOnly = await notificationModel.findByType('task_assigned');
      expect(typeOnly).toHaveLength(2);

      // Test type + userId  
      const typeAndUser = await notificationModel.findByType('task_assigned', testUserId1);
      expect(typeAndUser).toHaveLength(1);

      // Test type + projectId
      const typeAndProject = await notificationModel.findByType('task_assigned', undefined, testProjectId1);
      expect(typeAndProject).toHaveLength(2);

      // Test type + userId + projectId
      const allParams = await notificationModel.findByType('task_assigned', testUserId1, testProjectId1);
      expect(allParams).toHaveLength(1);
    });

    test('markAsRead should return null for non-existent notification', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await notificationModel.markAsRead(nonExistentId);
      expect(result).toBeNull();
    });

    test('markAsRead should update existing notification', async () => {
      const notification = await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
      });

      const result = await notificationModel.markAsRead(notification._id);
      expect(result).not.toBeNull();
      expect(result!.isRead).toBe(true);
    });

    test('markAllAsRead should handle user with no unread notifications', async () => {
      // Should not throw error
      await notificationModel.markAllAsRead(testUserId1);
      
      // Create read notification
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Already Read',
        message: 'This is already read',
        isRead: true,
      });

      await notificationModel.markAllAsRead(testUserId1);
      const count = await notificationModel.getUnreadCount(testUserId1);
      expect(count).toBe(0);
    });

    test('markAllAsRead should update multiple notifications', async () => {
      // Create multiple unread notifications
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Unread 1',
        message: 'Unread message 1',
        isRead: false,
      });

      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_deadline',
        title: 'Unread 2',
        message: 'Unread message 2',
        isRead: false,
      });

      await notificationModel.markAllAsRead(testUserId1);
      const count = await notificationModel.getUnreadCount(testUserId1);
      expect(count).toBe(0);
    });

    test('markProjectNotificationsAsRead should handle project with no notifications', async () => {
      // Should not throw error
      await notificationModel.markProjectNotificationsAsRead(testUserId1, testProjectId1);
    });

    test('markProjectNotificationsAsRead should update only project notifications', async () => {
      // Create notifications for different projects
      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Project 1 Notification',
        message: 'Project 1 message',
        isRead: false,
      });

      await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId2,
        type: 'task_assigned',
        title: 'Project 2 Notification',
        message: 'Project 2 message',
        isRead: false,
      });

      await notificationModel.markProjectNotificationsAsRead(testUserId1, testProjectId1);

      // Check that only project 1 notification was marked as read
      const project1Notifications = await notificationModel.findByProjectId(testProjectId1);
      const project2Notifications = await notificationModel.findByProjectId(testProjectId2);

      expect(project1Notifications[0].isRead).toBe(true);
      expect(project2Notifications[0].isRead).toBe(false);
    });

    test('deleteOldNotifications should handle case with no old notifications', async () => {
      const deletedCount = await notificationModel.deleteOldNotifications(30);
      expect(deletedCount).toBe(0);
    });

    test('deleteOldNotifications should only delete old read notifications', async () => {
      // Create old date (35 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 35);

      // Create old read notification using direct database insertion
      const oldReadNotification = await notificationModel['notification'].create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Old Read Notification',
        message: 'This is old and read',
        isRead: true,
        createdAt: cutoffDate,
      });

      // Create old unread notification using direct database insertion
      const oldUnreadNotification = await notificationModel['notification'].create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Old Unread Notification', 
        message: 'This is old but unread',
        isRead: false,
        createdAt: cutoffDate,
      });

      // Delete old notifications
      const deletedCount = await notificationModel.deleteOldNotifications(30);
      expect(deletedCount).toBe(1);

      // Verify only read notification was deleted
      const remainingNotification = await notificationModel.findById(oldUnreadNotification._id);
      expect(remainingNotification).not.toBeNull();

      // Verify read notification was deleted
      const deletedNotification = await notificationModel.findById(oldReadNotification._id);
      expect(deletedNotification).toBeNull();
    });

    test('delete should handle non-existent notification gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      // Should not throw error
      await notificationModel.delete(nonExistentId);
    });

    test('helper methods should create notifications with correct data', async () => {
      // Test task deadline notification
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      
      const taskDeadlineNotification = await notificationModel.createTaskDeadlineNotification(
        testUserId1,
        testProjectId1,
        'Important Task',
        deadline
      );

      expect(taskDeadlineNotification.type).toBe('task_deadline');
      expect(taskDeadlineNotification.title).toBe('Task Deadline Approaching');
      expect(taskDeadlineNotification.message).toContain('Important Task');

      // Test task assigned notification
      const taskAssignedNotification = await notificationModel.createTaskAssignedNotification(
        testUserId1,
        testProjectId1,
        'New Task',
        'John Doe'
      );

      expect(taskAssignedNotification.type).toBe('task_assigned');
      expect(taskAssignedNotification.title).toBe('New Task Assigned');
      expect(taskAssignedNotification.message).toContain('New Task');

      // Test expense added notification
      const expenseNotification = await notificationModel.createExpenseAddedNotification(
        testUserId1,
        testProjectId1,
        'Office Supplies',
        150.50,
        'Jane Smith'
      );

      expect(expenseNotification.type).toBe('expense_added');
      expect(expenseNotification.message).toContain('$150.50');

      // Test project invitation notification
      const invitationNotification = await notificationModel.createProjectInvitationNotification(
        testUserId1,
        testProjectId1,
        'New Project',
        'Admin User'
      );

      expect(invitationNotification.type).toBe('project_invitation');
      expect(invitationNotification.title).toBe('Project Invitation');
    });

    test('create should handle different notification types', async () => {
      const types = ['task_deadline', 'expense_added', 'chat_message', 'task_assigned', 'project_invitation', 'task_completed', 'expense_paid'];

      for (const type of types) {
        const notification = await notificationModel.create({
          userId: testUserId1,
          projectId: testProjectId1,
          type: type as any,
          title: `Test ${type}`,
          message: `Test message for ${type}`,
        });

        expect(notification.type).toBe(type);
        expect(notification.userId.toString()).toBe(testUserId1.toString());
        expect(notification.projectId.toString()).toBe(testProjectId1.toString());
      }
    });

    test('comprehensive workflow test', async () => {
      // Create multiple notifications
      const notification1 = await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_assigned',
        title: 'Task 1',
        message: 'Message 1',
      });

      const notification2 = await notificationModel.create({
        userId: testUserId1,
        projectId: testProjectId1,
        type: 'task_deadline',
        title: 'Task 2',
        message: 'Message 2',
      });

      // Test unread count
      expect(await notificationModel.getUnreadCount(testUserId1)).toBe(2);

      // Mark one as read
      await notificationModel.markAsRead(notification1._id);
      expect(await notificationModel.getUnreadCount(testUserId1)).toBe(1);

      // Test finding by type
      const taskAssignedNotifications = await notificationModel.findByType('task_assigned', testUserId1);
      expect(taskAssignedNotifications).toHaveLength(1);

      // Mark all as read
      await notificationModel.markAllAsRead(testUserId1);
      expect(await notificationModel.getUnreadCount(testUserId1)).toBe(0);

      // Delete notification
      await notificationModel.delete(notification1._id);
      const deletedNotification = await notificationModel.findById(notification1._id);
      expect(deletedNotification).toBeNull();
    });
  });
});