import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  stopReminders,
  snoozeTask,
  rescheduleTask,
} from '../controllers/taskController';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/authMiddleware';
import {
  createTaskSchema,
  updateTaskSchema,
  snoozeTaskSchema,
  rescheduleTaskSchema,
} from '../validators/schemas';

const router = Router();

// Require Authentication for all task operations
router.use(requireAuth);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', validateRequest(createTaskSchema), createTask);
router.patch('/:id', validateRequest(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

router.post('/:id/complete', completeTask);
router.post('/:id/stop-reminders', stopReminders);
router.post('/:id/snooze', validateRequest(snoozeTaskSchema), snoozeTask);
router.post('/:id/reschedule', validateRequest(rescheduleTaskSchema), rescheduleTask);

export default router;
