import { Router } from 'express';
import { getSite, getPage, getPublicForm, submitPublicForm, getHealth, renderFeedbackPage } from './public.controller.js';
import { formSubmissionRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.get('/health', getHealth);
router.get('/site', getSite);
router.get('/pages/:slug', getPage);
router.get('/forms/:slug', getPublicForm);
router.post('/forms/:slug/submissions', formSubmissionRateLimiter, submitPublicForm);
router.get('/forms/:slug/view', renderFeedbackPage);
router.get('/feedback/:slug', renderFeedbackPage);

export default router;

