import { Request, Response, NextFunction } from 'express';
import { UserModel, IUserDoc } from '../database/models/User.js';

// Extend Express Request interface with user
declare global {
  namespace Express {
    interface Request {
      user?: IUserDoc;
      requestId?: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
    sessionVersion?: number;
    csrfToken?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
        requestId: req.requestId,
      },
    });
  }

  try {
    const user = await UserModel.findById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account not found or has been deactivated.',
          requestId: req.requestId,
        },
      });
    }

    // Verify session version hasn't been revoked
    if (req.session.sessionVersion !== user.sessionVersion) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_REVOKED',
          message: 'Session has been invalidated. Please log in again.',
          requestId: req.requestId,
        },
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    next(err);
  }
}

export function requireRole(role: 'owner' | 'editor') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          requestId: req.requestId,
        },
      });
    }

    if (role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions. Owner role required.',
          requestId: req.requestId,
        },
      });
    }

    next();
  };
}

