import { Router } from 'express';
import { ProjectController } from '../features/projects/project.controller';
import { validateBody } from '../middleware/validation.middleware';
import { taskController } from '../features/tasks/task.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { z } from 'zod';
import expenseRoutes from './expense.routes';

const router = Router();
const projectController = new ProjectController();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional()
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional()
});

const joinProjectSchema = z.object({
  invitationCode: z.string().min(1, 'Invitation code is required').max(8, 'Invitation code must be 8 characters or less')
});

const addResourceSchema = z.object({
  resourceName: z.string().min(1, 'Resource name is required').max(200, 'Resource name must be less than 200 characters'),
  link: z.string().min(1, 'Resource link is required').max(500, 'Resource link must be less than 500 characters')
});

const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  assignee: z.string().min(1, 'Assignee username is required'),
  status: z.string().min(1, 'Status is required'),
  deadline: z.string().optional()
});

// Task routes
router.post(
  '/:projectId/tasks',
  authenticateToken,
  validateBody(createTaskSchema),
  (req, res) => taskController.createTask(req, res)
);

router.get(
  '/:projectId/tasks',
  authenticateToken,
  (req, res) => taskController.getTasksByProject(req, res)
);

// Routes
router.get('/status', authenticateToken, projectController.getProjectStatus);
router.post('/', authenticateToken, validateBody(createProjectSchema), projectController.createProject);
router.post('/join', authenticateToken, validateBody(joinProjectSchema), projectController.joinProject);
router.get('/', authenticateToken, projectController.getUserProjects);
router.get('/:projectId', authenticateToken, projectController.getProjectById);
router.put('/:projectId', authenticateToken, validateBody(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', authenticateToken, projectController.deleteProject);
router.delete('/:projectId/members/:userId', authenticateToken, projectController.removeMember);
router.post('/:projectId/resources', authenticateToken, validateBody(addResourceSchema), projectController.addResource);

export default router;
