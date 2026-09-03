import { Router } from 'express';
import { getDashboardSummary } from '../controllers/statsController';

const router = Router();

router.get('/dashboard-summary', getDashboardSummary);

export default router;
