import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function getCsrfToken(req: Request, res: Response) {
  if (!req.session) {
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_ERROR', message: 'Session store unavailable' },
    });
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  return res.json({
    success: true,
    data: {
      csrfToken: req.session.csrfToken,
    },
  });
}

export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public endpoints and auth bootstrap from CSRF
  if (
    req.path.startsWith('/api/v1/public/') ||
    req.path === '/api/v1/admin/auth/login' ||
    req.path === '/api/v1/admin/auth/logout' ||
    req.path === '/api/v1/admin/auth/forgot-password' ||
    req.path === '/api/v1/admin/auth/reset-password'
  ) {
    return next();
  }

  // If user is not authenticated, let requireAuth handle returning 401
  if (!req.session?.userId) {
    return next();
  }

  const tokenFromHeader = req.headers['x-csrf-token'] as string | undefined;
  const tokenFromSession = req.session?.csrfToken;

  if (!tokenFromSession || !tokenFromHeader || tokenFromHeader !== tokenFromSession) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_MISMATCH',
        message: 'Invalid or missing CSRF token. Please refresh and try again.',
        requestId: req.requestId,
      },
    });
  }

  next();
}

