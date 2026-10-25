import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { VisitorLog } from '../src/database/models/VisitorLog.js';
import './setup.js';

describe('Visitor Analytics & Engagement Intelligence API', () => {
  const app = createApp();
  const testEmail = 'analytics-owner@gunasai.in';
  const testPassword = 'AnalyticsOwnerPass123!';
  let agent: any;
  let csrfToken: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testEmail });
    await VisitorLog.deleteMany({});

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

  it('1. tracks public visitor beacon asynchronously with headers and metadata', async () => {
    const res = await request(app)
      .post('/api/v1/public/analytics/track')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')
      .set('x-forwarded-for', '103.21.244.2')
      .set('cf-ipcountry', 'IN')
      .set('cf-ipcity', 'Hyderabad')
      .set('cf-region', 'Telangana')
      .send({
        path: '/#projects',
        referrer: 'https://www.linkedin.com/in/gunareddy',
        screenResolution: '1920x1080',
        language: 'en-US',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sessionId).toBeDefined();

    // Verify written to database
    const saved = await VisitorLog.findOne({ sessionId: res.body.sessionId });
    expect(saved).toBeDefined();
    expect(saved?.countryCode).toBe('IN');
    expect(saved?.city).toBe('Hyderabad');
    expect(saved?.referrerSource).toBe('linkedin');
    expect(saved?.deviceType).toBe('desktop');
    expect(saved?.browser).toBe('Chrome');
    expect(saved?.isBot).toBe(false);
  });

  it('2. filters automated search engine crawlers and bots', async () => {
    const res = await request(app)
      .post('/api/v1/public/analytics/track')
      .set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
      .set('cf-connecting-ip', '66.249.66.1')
      .send({
        path: '/',
        referrer: '',
      });

    expect(res.status).toBe(200);
    const saved = await VisitorLog.findOne({ sessionId: res.body.sessionId });
    expect(saved?.isBot).toBe(true);
    expect(saved?.deviceType).toBe('bot');
  });

  it('3. updates visit duration and path via heartbeat endpoint', async () => {
    const trackRes = await request(app)
      .post('/api/v1/public/analytics/track')
      .send({ path: '/', referrer: 'Direct' });

    const sessionId = trackRes.body.sessionId;

    const hbRes = await request(app)
      .post('/api/v1/public/analytics/heartbeat')
      .send({
        sessionId,
        durationSeconds: 45,
        path: '/#contact',
      });

    expect(hbRes.status).toBe(200);
    expect(hbRes.body.success).toBe(true);

    const updated = await VisitorLog.findOne({ sessionId });
    expect(updated?.durationSeconds).toBe(45);
    expect(updated?.path).toBe('/#contact');
  });

  it('4. rejects unauthenticated access to admin analytics routes', async () => {
    const overviewRes = await request(app).get('/api/v1/admin/analytics/overview');
    expect(overviewRes.status).toBe(401);

    const liveRes = await request(app).get('/api/v1/admin/analytics/live');
    expect(liveRes.status).toBe(401);
  });

  it('5. returns aggregated analytics overview to authenticated owner', async () => {
    const res = await agent.get('/api/v1/admin/analytics/overview?period=7d');
    expect(res.status).toBe(200);
    expect(res.body.totalVisits).toBeGreaterThanOrEqual(1);
    expect(res.body.uniqueVisitors).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.topCountries)).toBe(true);
    expect(Array.isArray(res.body.topReferrers)).toBe(true);
    expect(Array.isArray(res.body.deviceBreakdown)).toBe(true);
    expect(Array.isArray(res.body.timeline)).toBe(true);
  });

  it('6. returns paginated live visitor logs to authenticated owner', async () => {
    const res = await agent.get('/api/v1/admin/analytics/live?limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].ip).toBeDefined();
  });

  it('7. streams formatted CSV export of visitor history', async () => {
    const res = await agent.get('/api/v1/admin/analytics/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Timestamp,IP Address,Country');
  });
});
