import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.put('/', requireRole('owner'), updateSettings);

export default router;

