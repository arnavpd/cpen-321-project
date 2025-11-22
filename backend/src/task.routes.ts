import { Router } from 'express';
import { taskController } from './features/tasks/task.controller';
import { authenticateToken } from './middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Debug routes
router.get(
  '/debug/all',
  authenticateToken,
  (req, res) => taskController.getAllTasks(req, res)
);

router.get(
  '/debug/users',
  authenticateToken,
  (req, res) => taskController.getAllUsers(req, res)
);

// Individual task routes
router.get(
  '/:taskId',
  authenticateToken,
  (req, res) => taskController.getTaskById(req, res)
);

router.put(
  '/:taskId',
  authenticateToken,
  (req, res) => taskController.updateTask(req, res)
);

router.delete(
  '/:taskId',        
  authenticateToken,
  (req, res) => taskController.deleteTask(req, res)
);

export default router;
