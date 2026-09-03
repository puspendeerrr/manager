import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  snoozeTask,
  rescheduleTask,
} from '../controllers/taskController';
import { validateRequest } from '../middleware/validateRequest';
import {
  createTaskSchema,
  updateTaskSchema,
  snoozeTaskSchema,
  rescheduleTaskSchema,
} from '../validators/schemas';

const router = Router();

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', validateRequest(createTaskSchema), createTask);
router.patch('/:id', validateRequest(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

router.post('/:id/complete', completeTask);
router.post('/:id/snooze', validateRequest(snoozeTaskSchema), snoozeTask);
router.post('/:id/reschedule', validateRequest(rescheduleTaskSchema), rescheduleTask);

export default router;
