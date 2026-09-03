import { Router } from 'express';
import {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleDismissNotification,
} from '../controllers/notificationController';

const router = Router();

router.get('/', handleGetNotifications);
router.post('/:id/read', handleMarkNotificationRead);
router.post('/:id/dismiss', handleDismissNotification);

export default router;
