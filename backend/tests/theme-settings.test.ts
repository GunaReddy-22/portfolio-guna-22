import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import './setup.js';

describe('Theme Studio & Site Settings API', () => {
  const app = createApp();
  const testEmail = 'theme-test@gunasai.in';
  const testPassword = 'ThemePassword123!';
  let agent: any;
  let csrfToken: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testEmail });
    const passwordHash = await argon2.hash(testPassword);
    await UserModel.create({
      email: testEmail,
      passwordHash,
      role: 'owner',
      isActive: true,
      sessionVersion: 1,
    });

    agent = request.agent(app);
    await agent.post('/api/v1/admin/auth/login').send({ email: testEmail, password: testPassword });
    const csrfRes = await agent.get('/api/v1/admin/auth/csrf');
    csrfToken = csrfRes.body.data.csrfToken;
  });

  it('rejects unauthenticated attempts to modify theme or settings', async () => {
    const themeRes = await request(app).put('/api/v1/admin/theme').send({ colors: { amber: '#ff0000' } });
    expect(themeRes.status).toBe(401);

    const settingsRes = await request(app).put('/api/v1/admin/settings').send({ title: 'Hacked' });
    expect(settingsRes.status).toBe(401);
  });

  it('retrieves and safely updates theme tokens with schema validation', async () => {
    const getRes = await agent.get('/api/v1/admin/theme');
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.colors.amber).toBeDefined();

    // Update with valid theme token
    const updateRes = await agent
      .put('/api/v1/admin/theme')
      .set('x-csrf-token', csrfToken)
      .send({
        name: 'Updated Cyberpunk Gold',
        colors: {
          ...getRes.body.data.colors,
          amber: '#ffb703',
        },
        typography: getRes.body.data.typography,
        layout: getRes.body.data.layout,
        animations: getRes.body.data.animations,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.colors.amber).toBe('#ffb703');
  });

  it('updates site settings and reflects in public site endpoint', async () => {
    const getSettingsRes = await agent.get('/api/v1/admin/settings');
    expect(getSettingsRes.status).toBe(200);

    const updateRes = await agent
      .put('/api/v1/admin/settings')
      .set('x-csrf-token', csrfToken)
      .send({
        ...getSettingsRes.body.data,
        title: 'Guna Sai — AI & Full Stack Engineer',
        metaDescription: 'Updated meta description for testing.',
      });

    expect(updateRes.status).toBe(200);

    // Verify public endpoint reflects change
    const publicRes = await request(app).get('/api/v1/public/site');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toBe('Guna Sai — AI & Full Stack Engineer');
  });
});

