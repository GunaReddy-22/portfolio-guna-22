import { Router } from 'express';
import { listForms, getForm, createForm, updateForm, deleteForm } from './forms.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listForms);
router.post('/', createForm);
router.get('/:formId', getForm);
router.patch('/:formId', updateForm);
router.delete('/:formId', requireRole('owner'), deleteForm);

export default router;

