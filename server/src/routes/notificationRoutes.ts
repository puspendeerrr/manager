import { Router } from 'express';
import {
  handleGetNotifications,
  handleSubscribePush,
  handleMarkNotificationRead,
  handleDismissNotification,
} from '../controllers/notificationController';

const router = Router();

router.get('/', handleGetNotifications);
router.post('/subscribe', handleSubscribePush);
router.post('/:id/read', handleMarkNotificationRead);
router.post('/:id/dismiss', handleDismissNotification);

export default router;
