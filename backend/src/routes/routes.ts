import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import mediaRoutes from './media.routes';
import projectRoutes from './project.routes';
import usersRoutes from './user.routes';
import expenseRoutes from './expense.routes';
import taskRoutes from './task.routes';
import calendarRoutes from './calendar.routes';
import devCalendarRoutes from './dev-calendar.routes';
import notificationRoutes from './notification.routes';


const router = Router();

router.use('/auth', authRoutes);


router.use('/user', authenticateToken, usersRoutes);

router.use('/media', authenticateToken, mediaRoutes);

router.use('/projects', authenticateToken, projectRoutes);

router.use('/chat', authenticateToken, chatRoutes);

router.use('/expenses', authenticateToken, expenseRoutes);

router.use('/tasks', authenticateToken, taskRoutes);

router.use('/notifications', authenticateToken, notificationRoutes);

// Calendar routes - some are public (OAuth callback), some need auth
router.use('/calendar', calendarRoutes);

// DEV ONLY - Remove before production!
router.use('/calendar', authenticateToken, devCalendarRoutes);


export default router;
