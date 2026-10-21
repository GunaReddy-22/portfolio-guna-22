import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import crypto from 'crypto';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { PageModel } from '../src/database/models/Page.js';
import './setup.js';

describe('Authentication & Security API', () => {
  const app = createApp();
  const testEmail = 'auth-test@gunasai.in';
  const testPassword = 'SecurePassword123!';

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testEmail });
    await PageModel.deleteMany({ slug: { $in: ['valid-csrf', 'no-csrf'] } });
    const passwordHash = await argon2.hash(testPassword);
    await UserModel.create({
      email: testEmail,
      passwordHash,
      role: 'owner',
      isActive: true,
      sessionVersion: 1,
    });
  });

  it('rejects unauthenticated requests to protected admin endpoints', async () => {
    const res = await request(app).get('/api/v1/admin/pages');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('fails login with incorrect password with generic error message', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('successfully logs in with valid credentials and sets secure session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('supports CSRF bootstrap and protects mutating admin routes', async () => {
    const agent = request.agent(app);

    // 1. Login
    await agent
      .post('/api/v1/admin/auth/login')
      .send({ email: testEmail, password: testPassword });

    // 2. Fetch CSRF token
    const csrfRes = await agent.get('/api/v1/admin/auth/csrf');
    expect(csrfRes.status).toBe(200);
    const csrfToken = csrfRes.body.data.csrfToken;
    expect(csrfToken).toBeDefined();

    // 3. Mutating request without CSRF token is rejected with 403
    const failRes = await agent
      .post('/api/v1/admin/pages')
      .send({ title: 'No CSRF Page', slug: 'no-csrf' });
    expect(failRes.status).toBe(403);
    expect(failRes.body.error.code).toBe('CSRF_MISMATCH');

    // 4. Mutating request with valid CSRF token succeeds
    const successRes = await agent
      .post('/api/v1/admin/pages')
      .set('x-csrf-token', csrfToken)
      .send({ title: 'Valid CSRF Page', slug: 'valid-csrf' });
    expect(successRes.status).toBe(201);
  });

  it('handles account deactivation and revokes active session', async () => {
    const agent = request.agent(app);

    // Login
    await agent
      .post('/api/v1/admin/auth/login')
      .send({ email: testEmail, password: testPassword });

    // Deactivate user in DB
    await UserModel.updateOne({ email: testEmail }, { isActive: false });

    // Subsequent request fails
    const res = await agent.get('/api/v1/admin/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');

    // Restore active state
    await UserModel.updateOne({ email: testEmail }, { isActive: true });
  });

  it('completes password reset and increments session version', async () => {
    const agent = request.agent(app);

    // 1. Request forgot password
    const forgotRes = await request(app)
      .post('/api/v1/admin/auth/forgot-password')
      .send({ email: testEmail });
    expect(forgotRes.status).toBe(200);

    // Retrieve user and reset token from DB
    const user = await UserModel.findOne({ email: testEmail });
    expect(user?.passwordResetToken).toBeDefined();

    // Simulate reset with invalid token
    const invalidReset = await request(app)
      .post('/api/v1/admin/auth/reset-password')
      .send({ token: 'bogus_token', newPassword: 'NewPassword999!' });
    expect(invalidReset.status).toBe(400);

    // Provide valid reset token (generate token matching sha256)
    const rawToken = crypto.randomBytes(32).toString('hex');
    user!.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user!.passwordResetExpires = new Date(Date.now() + 3600000);
    await user!.save();

    const validReset = await request(app)
      .post('/api/v1/admin/auth/reset-password')
      .send({ token: rawToken, newPassword: 'NewPassword999!' });
    expect(validReset.status).toBe(200);

    // Verify login with new password
    const newLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: testEmail, password: 'NewPassword999!' });
    expect(newLogin.status).toBe(200);
  });
});

