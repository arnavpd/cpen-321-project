import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../../testApp';
import { userModel } from '../../../src/features/users/user.model';
import { projectModel } from '../../../src/features/projects/project.model';
import { notificationModel } from '../../../src/features/notifications/notification.model';
import jwt from 'jsonwebtoken';

describe('Notification API - Unmocked Tests', () => {
  let app: any;
  let testUser: any;
  let testProject: any;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create test user
    testUser = await userModel.create({
      googleId: `google_notif_${Date.now()}`,
      name: 'Notification Test User',
      email: `notification_test_${Date.now()}@example.com`,
      profilePicture: 'https://example.com/pic.jpg',
    });

    // Create JWT token for authentication
    userToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test project
    testProject = await projectModel.create({
      name: 'Notification Test Project',
      description: 'Test project for notifications',
      ownerId: testUser._id,
      invitationCode: 'NOTIF123', // Required 8-character invitation code
      members: [
        {
          userId: testUser._id,
          role: 'owner',
          admin: true,
          joinedAt: new Date(),
        },
      ],
    });

    console.log(`✅ Test user created: ${testUser._id}`);
    console.log(`✅ Test project created: ${testProject._id}`);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await userModel.delete(testUser._id);
    }
    if (testProject) {
      await projectModel.delete(testProject._id);
    }
    // Clean up any notifications created during tests - we'll handle this in each test
  });

  describe('POST /api/notifications', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        projectId: testProject._id.toString(),
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('userId', testUser._id.toString());
      expect(response.body.data).toHaveProperty('projectId', testProject._id.toString());
      expect(response.body.data).toHaveProperty('type', 'task_assigned');
      expect(response.body.data).toHaveProperty('title', 'New Task Assigned');
      expect(response.body.data).toHaveProperty('isRead', false);

      // Clean up
      await notificationModel.delete(new mongoose.Types.ObjectId(response.body.data._id));
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ projectId: testProject._id.toString() })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Missing required fields: projectId, type, title, message');
    });

    it('should return 400 for invalid notification type', async () => {
      const notificationData = {
        projectId: testProject._id.toString(),
        type: 'invalid_type',
        title: 'Test',
        message: 'Test message',
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid notification type');
    });

    it('should return 400 for invalid project ID', async () => {
      const notificationData = {
        projectId: 'invalid-id',
        type: 'task_assigned',
        title: 'Test',
        message: 'Test message',
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid project ID');
    });

    it('should return 401 when not authenticated', async () => {
      const notificationData = {
        projectId: testProject._id.toString(),
        type: 'task_assigned',
        title: 'Test',
        message: 'Test message',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/notifications', () => {
    let createdNotifications: any[] = [];

    beforeEach(async () => {
      // Create test notifications
      const notifications = [
        {
          userId: testUser._id,
          projectId: testProject._id,
          type: 'task_assigned' as const,
          title: 'Task 1',
          message: 'Task 1 assigned',
        },
        {
          userId: testUser._id,
          projectId: testProject._id,
          type: 'expense_added' as const,
          title: 'Expense 1',
          message: 'New expense added',
          isRead: true,
        },
        {
          userId: testUser._id,
          projectId: testProject._id,
          type: 'chat_message' as const,
          title: 'New Message',
          message: 'You have a new message',
        },
      ];

      for (const notif of notifications) {
        const created = await notificationModel.create(notif);
        createdNotifications.push(created);
      }
    });

    afterEach(async () => {
      // Clean up
      for (const notif of createdNotifications) {
        await notificationModel.delete(notif._id);
      }
      createdNotifications = [];
    });

    it('should retrieve user notifications successfully', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      
      // Check notification structure
      const notification = response.body.data[0];
      expect(notification).toHaveProperty('_id');
      expect(notification).toHaveProperty('userId');
      expect(notification).toHaveProperty('projectId');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('isRead');
    });

    it('should support pagination with limit and skip', async () => {
      const response = await request(app)
        .get('/api/notifications?limit=1&skip=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/notifications/unread', () => {
    let unreadNotification: any;
    let readNotification: any;

    beforeEach(async () => {
      unreadNotification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'task_deadline',
        title: 'Unread Notification',
        message: 'This is unread',
        isRead: false,
      });

      readNotification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'task_completed',
        title: 'Read Notification',
        message: 'This is read',
        isRead: true,
      });
    });

    afterEach(async () => {
      if (unreadNotification) {
        await notificationModel.delete(unreadNotification._id);
      }
      if (readNotification) {
        await notificationModel.delete(readNotification._id);
      }
    });

    it('should retrieve only unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications/unread')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Should contain unread notification but not read ones
      const unreadIds = response.body.data.map((n: any) => n._id);
      expect(unreadIds).toContain(unreadNotification._id.toString());
      expect(unreadIds).not.toContain(readNotification._id.toString());
      
      // All notifications should be unread
      response.body.data.forEach((notification: any) => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/notifications/unread')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/notifications/count', () => {
    let unreadNotifications: any[] = [];

    beforeEach(async () => {
      // Create multiple unread notifications
      for (let i = 0; i < 3; i++) {
        const notification = await notificationModel.create({
          userId: testUser._id,
          projectId: testProject._id,
          type: 'chat_message',
          title: `Unread ${i}`,
          message: `Unread notification ${i}`,
          isRead: false,
        });
        unreadNotifications.push(notification);
      }

      // Create one read notification (should not be counted)
      const readNotification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'task_assigned',
        title: 'Read Notification',
        message: 'This is read',
        isRead: true,
      });
      unreadNotifications.push(readNotification);
    });

    afterEach(async () => {
      for (const notif of unreadNotifications) {
        await notificationModel.delete(notif._id);
      }
      unreadNotifications = [];
    });

    it('should return correct unread count', async () => {
      const response = await request(app)
        .get('/api/notifications/count')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data.count).toBeGreaterThanOrEqual(3);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/notifications/count')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('PUT /api/notifications/:notificationId/read', () => {
    let testNotification: any;

    beforeEach(async () => {
      testNotification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'project_invitation',
        title: 'Test Notification',
        message: 'Test notification for mark as read',
        isRead: false,
      });
    });

    afterEach(async () => {
      if (testNotification) {
        await notificationModel.delete(testNotification._id);
      }
    });

    it('should mark notification as read successfully', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('isRead', true);
      expect(response.body.data).toHaveProperty('_id', testNotification._id.toString());
    });

    it('should return 400 for invalid notification ID', async () => {
      const response = await request(app)
        .put('/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid notification ID');
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Notification not found');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/read`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    let unreadNotifications: any[] = [];

    beforeEach(async () => {
      // Create multiple unread notifications
      for (let i = 0; i < 3; i++) {
        const notification = await notificationModel.create({
          userId: testUser._id,
          projectId: testProject._id,
          type: 'expense_paid',
          title: `Unread ${i}`,
          message: `Unread notification ${i}`,
          isRead: false,
        });
        unreadNotifications.push(notification);
      }
    });

    afterEach(async () => {
      for (const notif of unreadNotifications) {
        await notificationModel.delete(notif._id);
      }
      unreadNotifications = [];
    });

    it('should mark all notifications as read successfully', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'All notifications marked as read');

      // Verify all notifications are now read
      const unreadCount = await notificationModel.getUnreadCount(testUser._id);
      expect(unreadCount).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('DELETE /api/notifications/:notificationId', () => {
    let testNotification: any;

    beforeEach(async () => {
      // Create notification through API to ensure proper user association
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: testProject._id.toString(),
          type: 'task_completed',
          title: 'Test Notification to Delete',
          message: 'This notification will be deleted',
        })
        .expect(201);
        
      testNotification = response.body.data;
    });

    afterEach(async () => {
      // Try to clean up in case test failed
      if (testNotification) {
        try {
          await notificationModel.delete(new mongoose.Types.ObjectId(testNotification._id));
        } catch (error) {
          // Ignore if already deleted
        }
      }
    });

    it('should delete notification successfully', async () => {
      console.log('=== DEBUG DELETE TEST ===');
      console.log('Test notification:', testNotification);
      console.log('User ID from token:', testUser._id);
      console.log('Notification user ID:', testNotification.userId);
      
      const response = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Notification deleted successfully');

      // Verify notification is deleted
      const deletedNotification = await notificationModel.findById(testNotification._id);
      expect(deletedNotification).toBeNull();
      
      // Set to null so afterEach doesn't try to delete again
      testNotification = null;
    });

    it('should return 400 for invalid notification ID', async () => {
      const response = await request(app)
        .delete('/api/notifications/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid notification ID');
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Notification not found');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  // Test notification model helper methods through API
  describe('Notification Model Coverage via API', () => {
    it('should exercise findByProjectId method', async () => {
      // Create notification for the test project
      const notification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'task_assigned',
        title: 'Project Notification',
        message: 'Test for findByProjectId',
      });

      // Call findByProjectId through the model
      const projectNotifications = await notificationModel.findByProjectId(testProject._id);
      expect(projectNotifications.length).toBeGreaterThan(0);
      expect(projectNotifications.some(n => n._id.toString() === notification._id.toString())).toBe(true);

      // Clean up
      await notificationModel.delete(notification._id);
    });

    it('should exercise findByType method', async () => {
      // Create notifications of different types
      const taskNotification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'task_deadline',
        title: 'Task Deadline',
        message: 'Test for findByType',
      });

      const expenseNotification = await notificationModel.create({
        userId: testUser._id,
        projectId: testProject._id,
        type: 'expense_added',
        title: 'Expense Added',
        message: 'Test for findByType',
      });

      // Test findByType with different parameters
      const taskNotifications = await notificationModel.findByType('task_deadline');
      expect(taskNotifications.some(n => n._id.toString() === taskNotification._id.toString())).toBe(true);

      const userTaskNotifications = await notificationModel.findByType('task_deadline', testUser._id);
      expect(userTaskNotifications.some(n => n._id.toString() === taskNotification._id.toString())).toBe(true);

      const projectTaskNotifications = await notificationModel.findByType('task_deadline', testUser._id, testProject._id);
      expect(projectTaskNotifications.some(n => n._id.toString() === taskNotification._id.toString())).toBe(true);

      // Clean up
      await notificationModel.delete(taskNotification._id);
      await notificationModel.delete(expenseNotification._id);
    });

    it('should exercise markProjectNotificationsAsRead method', async () => {
      // Create multiple notifications for the project
      const notifications = [];
      for (let i = 0; i < 3; i++) {
        const notification = await notificationModel.create({
          userId: testUser._id,
          projectId: testProject._id,
          type: 'chat_message',
          title: `Project Notification ${i}`,
          message: `Test notification ${i}`,
          isRead: false,
        });
        notifications.push(notification);
      }

      // Mark project notifications as read
      await notificationModel.markProjectNotificationsAsRead(testUser._id, testProject._id);

      // Verify they are marked as read
      for (const notif of notifications) {
        const updated = await notificationModel.findById(notif._id);
        expect(updated?.isRead).toBe(true);
      }

      // Clean up
      for (const notif of notifications) {
        await notificationModel.delete(notif._id);
      }
    });


    it('should exercise helper notification creation methods', async () => {
      // Test createTaskDeadlineNotification
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const taskDeadlineNotif = await notificationModel.createTaskDeadlineNotification(
        testUser._id,
        testProject._id,
        'Test Task',
        deadline
      );
      expect(taskDeadlineNotif.type).toBe('task_deadline');
      expect(taskDeadlineNotif.title).toBe('Task Deadline Approaching');

      // Test createTaskAssignedNotification
      const taskAssignedNotif = await notificationModel.createTaskAssignedNotification(
        testUser._id,
        testProject._id,
        'Assigned Task',
        'John Doe'
      );
      expect(taskAssignedNotif.type).toBe('task_assigned');
      expect(taskAssignedNotif.title).toBe('New Task Assigned');

      // Test createExpenseAddedNotification
      const expenseNotif = await notificationModel.createExpenseAddedNotification(
        testUser._id,
        testProject._id,
        'Office Supplies',
        25.99,
        'Jane Smith'
      );
      expect(expenseNotif.type).toBe('expense_added');
      expect(expenseNotif.title).toBe('New Expense Added');

      // Test createProjectInvitationNotification
      const invitationNotif = await notificationModel.createProjectInvitationNotification(
        testUser._id,
        testProject._id,
        'Cool Project',
        'Bob Johnson'
      );
      expect(invitationNotif.type).toBe('project_invitation');
      expect(invitationNotif.title).toBe('Project Invitation');

      // Clean up
      await notificationModel.delete(taskDeadlineNotif._id);
      await notificationModel.delete(taskAssignedNotif._id);
      await notificationModel.delete(expenseNotif._id);
      await notificationModel.delete(invitationNotif._id);
    });
  });
});