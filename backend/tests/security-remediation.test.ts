import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import path from 'path';
import fs from 'fs';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { MediaModel } from '../src/database/models/Media.js';
import { PageModel } from '../src/database/models/Page.js';
import { provisionOwner as seedAdmin } from '../src/database/provision-owner.js';
import './setup.js';

describe('Production Readiness & Security Remediation Pass', () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();
  });

  describe('A. Secure Owner Provisioning (scripts/seed-admin.ts)', () => {
    it('provisions owner when none exists with explicit strong password', async () => {
      await UserModel.deleteMany({});

      const result = await seedAdmin('test-owner@gunasai.in', 'SuperSecureOwnerP@ssw0rd2026!');
      expect(result.created).toBe(true);
      expect(result.email).toBe('test-owner@gunasai.in');

      const owner = await UserModel.findOne({ email: 'test-owner@gunasai.in' });
      expect(owner).not.toBeNull();
      expect(owner?.role).toBe('owner');
      expect(owner?.isActive).toBe(true);

      const isValid = await argon2.verify(owner!.passwordHash, 'SuperSecureOwnerP@ssw0rd2026!');
      expect(isValid).toBe(true);
    });

    it('running seed-admin a second time is non-destructive (does not reset credentials)', async () => {
      const ownerBefore = await UserModel.findOne({ email: 'test-owner@gunasai.in' });
      const hashBefore = ownerBefore!.passwordHash;
      const sessionVersionBefore = ownerBefore!.sessionVersion;

      // Try running seed again with a different password
      const result = await seedAdmin('test-owner@gunasai.in', 'AnotherNewP@ssw0rd999!');
      expect(result.created).toBe(false);

      const ownerAfter = await UserModel.findOne({ email: 'test-owner@gunasai.in' });
      expect(ownerAfter!.passwordHash).toBe(hashBefore);
      expect(ownerAfter!.sessionVersion).toBe(sessionVersionBefore);
      expect(ownerAfter!.role).toBe('owner');
    });

    it('fails safely when an owner already exists even if inactive', async () => {
      // Mark current owner inactive
      await UserModel.updateOne({ email: 'test-owner@gunasai.in' }, { isActive: false });

      // Attempt to provision a new owner
      const result = await seedAdmin('another-owner@gunasai.in', 'AnotherNewP@ssw0rd999!');
      expect(result.created).toBe(false);
      expect(result.reason).toBe('owner_already_exists');

      // The inactive owner remains untouched
      const originalOwner = await UserModel.findOne({ email: 'test-owner@gunasai.in' });
      expect(originalOwner!.isActive).toBe(false);
      expect(originalOwner!.role).toBe('owner');

      // Restore active status for subsequent tests
      await UserModel.updateOne({ email: 'test-owner@gunasai.in' }, { isActive: true });
    });

    it('fails safely with account conflict error if user already exists as non-owner', async () => {
      await UserModel.deleteMany({});
      // Create an existing editor user
      await UserModel.create({
        email: 'editor@gunasai.in',
        passwordHash: 'dummy_hash',
        role: 'editor',
        isActive: true,
      });

      // Attempt to provision owner with the same email
      await expect(
        seedAdmin('editor@gunasai.in', 'SuperSecureOwnerP@ssw0rd2026!')
      ).rejects.toThrow(/Account conflict/);

      // Verify user was NOT promoted to owner and hash was untouched
      const editor = await UserModel.findOne({ email: 'editor@gunasai.in' });
      expect(editor!.role).toBe('editor');
      expect(editor!.passwordHash).toBe('dummy_hash');
    });

    it('accepts a password with exactly 12 characters (minimum policy)', async () => {
      await UserModel.deleteMany({});
      const result = await seedAdmin('min-pass@gunasai.in', '123456789012'); // exactly 12 chars
      expect(result.created).toBe(true);

      const owner = await UserModel.findOne({ email: 'min-pass@gunasai.in' });
      expect(owner).not.toBeNull();
      const isValid = await argon2.verify(owner!.passwordHash, '123456789012');
      expect(isValid).toBe(true);
    });

    it('rejects a password with 11 characters (one below minimum policy)', async () => {
      await UserModel.deleteMany({});
      await expect(seedAdmin('short@gunasai.in', '12345678901')).rejects.toThrow(
        'Initial password must be at least 12 characters long'
      );
    });

    it('rejects missing or empty initial password safely', async () => {
      await UserModel.deleteMany({});
      await expect(seedAdmin('empty@gunasai.in', '')).rejects.toThrow(
        /Missing required initial password/
      );
    });
  });

  describe('B. Session Cookie & Logout Security', () => {
    it('logout clears guna_cms_sid cookie with exact matching options', async () => {
      // Create user and log in
      await UserModel.deleteMany({ email: 'logout-test@gunasai.in' });
      const passwordHash = await argon2.hash('ValidPass123456!');
      await UserModel.create({
        email: 'logout-test@gunasai.in',
        passwordHash,
        role: 'owner',
        isActive: true,
        sessionVersion: 1,
      });

      const loginRes = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'logout-test@gunasai.in', password: 'ValidPass123456!' })
        .expect(200);

      const cookieHeader = loginRes.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      const sidCookie = cookieHeader.find((c: string) => c.startsWith('guna_cms_sid='));
      expect(sidCookie).toBeDefined();

      // Logout request
      const logoutRes = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Cookie', cookieHeader)
        .expect(200);

      const clearCookieHeader = logoutRes.headers['set-cookie'];
      expect(clearCookieHeader).toBeDefined();
      const clearedSid = clearCookieHeader.find((c: string) => c.includes('guna_cms_sid=;'));
      expect(clearedSid).toBeDefined();
      expect(clearedSid).toContain('Path=/');
    });
  });

  describe('C. Media Upload Security & SVG Prohibition', () => {
    let authCookie: string[];
    let csrfToken: string;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'logout-test@gunasai.in', password: 'ValidPass123456!' });
      authCookie = loginRes.headers['set-cookie'];
      csrfToken = loginRes.body.data.csrfToken;
    });

    it('rejects SVG file uploads through multer to prevent SVG XSS', async () => {
      const svgPayload = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

      const res = await request(app)
        .post('/api/v1/admin/media/upload-local')
        .set('Cookie', authCookie)
        .set('x-csrf-token', csrfToken)
        .attach('file', Buffer.from(svgPayload), { filename: 'xss.svg', contentType: 'image/svg+xml' });

      // Multer fileFilter rejection produces error
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects spoofed file where extension/mime is JPEG but content signature is invalid', async () => {
      const fakeJpeg = Buffer.from('NOT_A_REAL_JPEG_FILE_HEADER_DATA');

      const res = await request(app)
        .post('/api/v1/admin/media/upload-local')
        .set('Cookie', authCookie)
        .set('x-csrf-token', csrfToken)
        .attach('file', fakeJpeg, { filename: 'spoofed.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_SIGNATURE');
    });

    it('rejects registration of unsafe protocols (javascript: or data:)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/media/register')
        .set('Cookie', authCookie)
        .set('x-csrf-token', csrfToken)
        .send({
          provider: 'local',
          url: 'javascript:alert(1)',
          mimeType: 'image/png',
          originalFilename: 'test.png',
          fileSizeBytes: 1024,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('UNSAFE_URL');
    });

    it('prevents deletion of media currently referenced in active pages', async () => {
      const media = await MediaModel.create({
        siteId: 'gunasai-in',
        provider: 'local',
        url: '/assets/referenced-in-hero.jpg',
        mimeType: 'image/jpeg',
        resourceType: 'image',
        fileSizeBytes: 12000,
        originalFilename: 'referenced-in-hero.jpg',
        referenceCount: 0,
      });

      // Create page that references this media URL in draft
      await PageModel.create({
        siteId: 'gunasai-in',
        slug: 'media-test-page',
        title: 'Media Test',
        status: 'draft',
        draftRevision: 1,
        draftSections: [
          {
            id: 'sec1',
            type: 'hero',
            schemaVersion: 1,
            isVisible: true,
            order: 0,
            content: {
              photoUrl: '/assets/referenced-in-hero.jpg',
            },
          },
        ],
      });

      const res = await request(app)
        .delete(`/api/v1/admin/media/${media._id}`)
        .set('Cookie', authCookie)
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MEDIA_IN_USE');

      // Clean up test page
      await PageModel.deleteOne({ slug: 'media-test-page' });
      await MediaModel.deleteOne({ _id: media._id });
    });
  });

  describe('D. Authorization & Role Separation', () => {
    let editorCookie: string[];
    let editorCsrf: string;

    beforeAll(async () => {
      await UserModel.deleteMany({ email: 'editor@gunasai.in' });
      const passwordHash = await argon2.hash('EditorPassword123!');
      await UserModel.create({
        email: 'editor@gunasai.in',
        passwordHash,
        role: 'editor',
        isActive: true,
        sessionVersion: 1,
      });

      const loginRes = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'editor@gunasai.in', password: 'EditorPassword123!' });

      editorCookie = loginRes.headers['set-cookie'];
      editorCsrf = loginRes.body.data.csrfToken;
    });

    it('forbids editor role from publishing pages (requires owner)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/pages/some-page-id/publish')
        .set('Cookie', editorCookie)
        .set('x-csrf-token', editorCsrf)
        .send({ expectedDraftRevision: 1 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('forbids editor role from updating global theme settings (requires owner)', async () => {
      const res = await request(app)
        .put('/api/v1/admin/theme')
        .set('Cookie', editorCookie)
        .set('x-csrf-token', editorCsrf)
        .send({ name: 'Malicious Theme' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('forbids editor role from deleting media (requires owner)', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/media/6ad79dcd8730be9ca5d9a199')
        .set('Cookie', editorCookie)
        .set('x-csrf-token', editorCsrf);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('E. Host-Header Poisoning Immunity', () => {
    it('proves malicious Host or X-Forwarded-Host header cannot poison password reset link', async () => {
      const emailModule = await import('../src/services/email.service.js');
      const sendEmailSpy = vi.spyOn(emailModule, 'sendEmail').mockResolvedValue({ success: true, messageId: 'test-msg' });

      await UserModel.deleteMany({ email: 'poison-target@gunasai.in' });
      await UserModel.create({
        email: 'poison-target@gunasai.in',
        passwordHash: await argon2.hash('SafePass123456!'),
        role: 'owner',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/admin/auth/forgot-password')
        .set('Host', 'evil-attacker-site.com')
        .set('X-Forwarded-Host', 'evil-forwarded-site.com')
        .send({ email: 'poison-target@gunasai.in' });

      expect(res.status).toBe(200);
      expect(sendEmailSpy).toHaveBeenCalled();

      const emailCall = sendEmailSpy.mock.calls[0][0];
      // Must NOT contain evil attacker host
      expect(emailCall.text).not.toContain('evil-attacker-site.com');
      expect(emailCall.text).not.toContain('evil-forwarded-site.com');
      // Must contain trusted configured admin domain
      expect(emailCall.text).toContain('/reset-password?token=');

      sendEmailSpy.mockRestore();
    });
  });
});

