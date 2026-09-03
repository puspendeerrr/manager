import { Router } from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/settingsController';
import { validateRequest } from '../middleware/validateRequest';
import { updateSettingsSchema } from '../validators/schemas';

const router = Router();

router.get('/', getUserSettings);
router.patch('/', validateRequest(updateSettingsSchema), updateUserSettings);

export default router;
