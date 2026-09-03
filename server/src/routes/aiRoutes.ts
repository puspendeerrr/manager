import { Router } from 'express';
import { handleAiChat, handleParseTask, handleSplitTask } from '../controllers/aiController';

const router = Router();

router.post('/chat', handleAiChat);
router.post('/parse-task', handleParseTask);
router.post('/split-task', handleSplitTask);

export default router;
