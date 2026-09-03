import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { validateRequest } from '../middleware/validateRequest';
import { createProjectSchema } from '../validators/schemas';

const router = Router();

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', validateRequest(createProjectSchema), createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
