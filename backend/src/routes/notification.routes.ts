import { Router } from 'express';
import { notificationController } from '../features/notifications/notification.controller';

const router = Router();

// Authentication is handled at the router level in routes.ts
router.get('/', notificationController.getUserNotifications.bind(notificationController));
router.get('/unread', notificationController.getUnreadNotifications.bind(notificationController));
router.get('/count', notificationController.getUnreadCount.bind(notificationController));
router.post('/', notificationController.createNotification.bind(notificationController));
router.put('/:notificationId/read', notificationController.markAsRead.bind(notificationController));
router.put('/mark-all-read', notificationController.markAllAsRead.bind(notificationController));
router.delete('/:notificationId', notificationController.deleteNotification.bind(notificationController));

export default router;