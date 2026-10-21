import crypto from 'crypto';
import { env } from '../config/env.js';

interface PreviewPayload {
  siteId: string;
  pageId: string;
  revision: number;
  expiresAt: number;
}

export function signPreviewToken(payload: { siteId: string; pageId: string; revision: number; ttlSeconds?: number }): string {
  const ttl = payload.ttlSeconds || 7200; // 2 hours default
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;

  const dataStr = `${payload.siteId}:${payload.pageId}:${payload.revision}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', env.PREVIEW_SECRET);
  hmac.update(dataStr);
  const signature = hmac.digest('hex');

  // Base64URL encode payload + signature
  const token = Buffer.from(JSON.stringify({ ...payload, expiresAt, signature })).toString('base64url');
  return token;
}

export function verifyPreviewToken(token: string): PreviewPayload | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);

    const { siteId, pageId, revision, expiresAt, signature } = parsed;
    if (!siteId || !pageId || !revision || !expiresAt || !signature) {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      return null;
    }

    // Verify HMAC signature
    const dataStr = `${siteId}:${pageId}:${revision}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', env.PREVIEW_SECRET);
    hmac.update(dataStr);
    const expectedSignature = hmac.digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { siteId, pageId, revision, expiresAt };
    }

    return null;
  } catch (err) {
    return null;
  }
}

