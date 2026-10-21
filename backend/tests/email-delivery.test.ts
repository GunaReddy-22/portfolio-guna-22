import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import argon2 from 'argon2';
import request from 'supertest';
import { sendEmail } from '../src/services/email.service.js';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import './setup.js';

describe('Real Email Delivery Service & Password Reset Lifecycle', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('A. Provider Delivery Implementations', () => {
    it('successfully delivers via Resend API when configured', async () => {
      // Mock Resend API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend_msg_12345' }),
      } as any);

      // Temporarily set env for test
      const { env } = await import('../src/config/env.js');
      const prevProvider = env.EMAIL_PROVIDER;
      const prevKey = env.EMAIL_API_KEY;

      (env as any).EMAIL_PROVIDER = 'resend';
      process.env.EMAIL_PROVIDER = 'resend';
      (env as any).EMAIL_API_KEY = 're_test_mock_key_998877';
      process.env.EMAIL_API_KEY = 're_test_mock_key_998877';

      const result = await sendEmail({
        to: 'recipient@gunasai.in',
        subject: 'Test Subject',
        text: 'Test Body',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('resend_msg_12345');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer re_test_mock_key_998877',
          }),
        })
      );

      (env as any).EMAIL_PROVIDER = prevProvider;
      (env as any).EMAIL_API_KEY = prevKey;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.EMAIL_API_KEY;
    });

    it('returns structured failure when Resend API returns an error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Invalid recipient address' }),
      } as any);

      const { env } = await import('../src/config/env.js');
      const prevProvider = env.EMAIL_PROVIDER;
      const prevKey = env.EMAIL_API_KEY;

      (env as any).EMAIL_PROVIDER = 'resend';
      process.env.EMAIL_PROVIDER = 'resend';
      (env as any).EMAIL_API_KEY = 're_test_mock_key_998877';
      process.env.EMAIL_API_KEY = 're_test_mock_key_998877';

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test Subject',
        text: 'Test Body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient address');

      (env as any).EMAIL_PROVIDER = prevProvider;
      (env as any).EMAIL_API_KEY = prevKey;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.EMAIL_API_KEY;
    });

    it('returns error when external provider API key is missing', async () => {
      const { env } = await import('../src/config/env.js');
      const prevProvider = env.EMAIL_PROVIDER;
      const prevKey = env.EMAIL_API_KEY;

      (env as any).EMAIL_PROVIDER = 'resend';
      process.env.EMAIL_PROVIDER = 'resend';
      (env as any).EMAIL_API_KEY = '';
      process.env.EMAIL_API_KEY = '';

      const result = await sendEmail({
        to: 'recipient@gunasai.in',
        subject: 'Test Subject',
        text: 'Test Body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing API key');

      (env as any).EMAIL_PROVIDER = prevProvider;
      (env as any).EMAIL_API_KEY = prevKey;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.EMAIL_API_KEY;
    });

    it('prohibits console adapter in production environment', async () => {
      const { env } = await import('../src/config/env.js');
      const prevProvider = env.EMAIL_PROVIDER;
      const prevEnv = env.NODE_ENV;

      (env as any).EMAIL_PROVIDER = 'console';
      process.env.EMAIL_PROVIDER = 'console';
      (env as any).NODE_ENV = 'production';
      process.env.NODE_ENV = 'production';

      const result = await sendEmail({
        to: 'recipient@gunasai.in',
        subject: 'Test Subject',
        text: 'Test Body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Console email provider prohibited in production');

      (env as any).EMAIL_PROVIDER = prevProvider;
      (env as any).NODE_ENV = prevEnv;
      delete process.env.EMAIL_PROVIDER;
      process.env.NODE_ENV = 'test';
    });

    it('successfully delivers via Brevo API when configured', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ messageId: '<brevo_msg_98765>' }),
      } as any);

      const { env } = await import('../src/config/env.js');
      const prevProvider = env.EMAIL_PROVIDER;

      (env as any).EMAIL_PROVIDER = 'brevo';
      process.env.EMAIL_PROVIDER = 'brevo';
      (env as any).BREVO_API_KEY = 'mock_brevo_key_123';
      process.env.BREVO_API_KEY = 'mock_brevo_key_123';

      const result = await sendEmail({
        to: 'noreply.dev.guna@gmail.com',
        subject: 'Brevo Subject',
        text: 'Brevo Body',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('<brevo_msg_98765>');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'mock_brevo_key_123',
          }),
        })
      );

      (env as any).EMAIL_PROVIDER = prevProvider;
      delete (env as any).BREVO_API_KEY;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.BREVO_API_KEY;
    });
  });

  describe('B. Password Reset Token Expiry & Single-Use Security', () => {
    let app: any;

    beforeEach(async () => {
      app = createApp();
      await UserModel.deleteMany({ email: 'reset-tester@gunasai.in' });
    });

    it('password reset token expires after validity window and cannot be used', async () => {
      const passwordHash = await argon2.hash('OldSecurePassword2026!');
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Create user with EXPIRED token (10 minutes ago)
      await UserModel.create({
        email: 'reset-tester@gunasai.in',
        passwordHash,
        role: 'owner',
        isActive: true,
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() - 10 * 60 * 1000), // Expired
      });

      const res = await request(app)
        .post('/api/v1/admin/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_TOKEN');
      expect(res.body.error?.message).toContain('invalid or has expired');

      // Password remains unchanged
      const user = await UserModel.findOne({ email: 'reset-tester@gunasai.in' });
      const matchesOld = await argon2.verify(user!.passwordHash, 'OldSecurePassword2026!');
      expect(matchesOld).toBe(true);
    });

    it('password reset token is strictly single-use and cannot be replayed', async () => {
      const passwordHash = await argon2.hash('OldSecurePassword2026!');
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Create user with valid token
      await UserModel.create({
        email: 'reset-tester@gunasai.in',
        passwordHash,
        role: 'owner',
        isActive: true,
        sessionVersion: 1,
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // Valid for 1 hour
      });

      // 1. First reset attempt: Succeeds
      const firstRes = await request(app)
        .post('/api/v1/admin/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.success).toBe(true);

      const userAfterFirst = await UserModel.findOne({ email: 'reset-tester@gunasai.in' });
      expect(userAfterFirst?.passwordResetToken).toBeUndefined();
      expect(userAfterFirst?.passwordResetExpires).toBeUndefined();
      expect(userAfterFirst?.sessionVersion).toBe(2);

      // 2. Replay attempt: Must be rejected immediately
      const replayRes = await request(app)
        .post('/api/v1/admin/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'AnotherHijackPassword999!',
        });

      expect(replayRes.status).toBe(400);
      expect(replayRes.body.error?.code).toBe('INVALID_TOKEN');
    });

    it('dispatches password reset email via Brevo to a controlled test destination', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ messageId: '<brevo_reset_controlled_999>' }),
      } as any);

      const { env } = await import('../src/config/env.js');
      const prevProvider = env.EMAIL_PROVIDER;

      (env as any).EMAIL_PROVIDER = 'brevo';
      process.env.EMAIL_PROVIDER = 'brevo';
      (env as any).BREVO_API_KEY = 'mock_brevo_key_123';
      process.env.BREVO_API_KEY = 'mock_brevo_key_123';
      process.env.EMAIL_USER = 'noreply.dev.guna@gmail.com';
      (env as any).EMAIL_FROM = 'noreply.dev.guna@gmail.com';

      await UserModel.deleteMany({ email: 'noreply.dev.guna@gmail.com' });
      await UserModel.create({
        email: 'noreply.dev.guna@gmail.com',
        passwordHash: await argon2.hash('CurrentSecurePassword123!'),
        role: 'owner',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/admin/auth/forgot-password')
        .send({ email: 'noreply.dev.guna@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify real Brevo dispatch was triggered with the controlled destination
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('noreply.dev.guna@gmail.com'),
        })
      );

      // Verify secure token was generated in database
      const user = await UserModel.findOne({ email: 'noreply.dev.guna@gmail.com' });
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetExpires).toBeDefined();

      (env as any).EMAIL_PROVIDER = prevProvider;
      delete (env as any).BREVO_API_KEY;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.BREVO_API_KEY;
      delete process.env.EMAIL_USER;
    });
  });
});
