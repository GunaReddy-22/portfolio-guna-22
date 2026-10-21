import { Router } from 'express';
import {
  listSubmissions,
  getSubmission,
  updateSubmissionStatus,
  exportSubmissionsCsv,
} from './submissions.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSubmissions);
router.get('/export', exportSubmissionsCsv);
router.post('/export', exportSubmissionsCsv);
router.get('/:submissionId', getSubmission);
router.patch('/:submissionId', updateSubmissionStatus);

export default router;

