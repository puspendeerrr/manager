import { Router } from 'express';
import {
  handleGetGoogleStatus,
  handleGetGoogleAuthUrl,
  handleGoogleCallback,
  handleGoogleDisconnect,
} from '../controllers/googleController';

const router = Router();

router.get('/status', handleGetGoogleStatus);
router.get('/auth-url', handleGetGoogleAuthUrl);
router.get('/callback', handleGoogleCallback);
router.post('/disconnect', handleGoogleDisconnect);

export default router;
