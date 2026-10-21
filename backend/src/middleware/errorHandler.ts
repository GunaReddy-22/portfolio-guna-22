import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('x-request-id', req.requestId);
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = req.requestId || `req_${Date.now()}`;

  // Log error with safe metadata
  console.error(`[Error] [${requestId}] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    name: err.name,
    code: err.code,
    ...(isProduction ? {} : { stack: err.stack }),
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
        requestId,
      },
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT_DUPLICATE_KEY',
        message: 'A resource with this identifier or unique field already exists.',
        details: err.keyValue,
        requestId,
      },
    });
  }

  // Handle HTTP status errors
  const status = typeof err.status === 'number' ? err.status : 500;
  const message = isProduction && status === 500 ? 'An unexpected server error occurred.' : err.message || 'Internal server error';
  const code = err.code && typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';

  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}

