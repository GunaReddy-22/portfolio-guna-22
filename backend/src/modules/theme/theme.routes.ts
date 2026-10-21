import { Router } from 'express';
import { getTheme, updateTheme } from './theme.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getTheme);
router.put('/', requireRole('owner'), updateTheme);

export default router;

