import { Request } from 'express';
import { AuditLogModel } from '../database/models/AuditLog.js';

interface AuditParams {
  req: Request;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export async function recordAuditLog({ req, action, resourceType, resourceId, metadata = {} }: AuditParams) {
  try {
    const actorId = req.user?._id?.toString() || req.session?.userId || 'anonymous';
    const actorEmail = req.user?.email || 'system';
    const siteId = (req.query.siteId as string) || 'gunasai-in';

    // Sanitize metadata to redact any sensitive keys
    const sanitizedMetadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (/password|token|secret|cookie|authorization/i.test(key)) {
        sanitizedMetadata[key] = '[REDACTED]';
      } else {
        sanitizedMetadata[key] = value;
      }
    }

    await AuditLogModel.create({
      siteId,
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      requestId: req.requestId,
      metadata: sanitizedMetadata,
    });
  } catch (err: any) {
    // Non-blocking error for audit logging
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}

