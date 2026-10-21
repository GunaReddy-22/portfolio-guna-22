import { Router } from 'express';
import { login, logout, getMe, forgotPassword, resetPassword } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { getCsrfToken } from '../../middleware/csrf.js';
import { loginRateLimiter, forgotPasswordRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.get('/csrf', getCsrfToken);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

