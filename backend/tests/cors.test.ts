import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import './setup.js';

describe('Production CORS Security & Origin Allowlist Enforcement', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  it('allows verified HTTPS frontend origin and returns credentials header', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://gunasai.in');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://gunasai.in');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows admin dashboard HTTPS origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://admin.gunasai.in');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://admin.gunasai.in');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('strictly rejects unauthorized third-party origin (no CORS headers returned)', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://malicious-attacker.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('strictly rejects wildcard origin header (*)', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', '*');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('handles CORS preflight OPTIONS request correctly for allowed origins', async () => {
    const res = await request(app)
      .options('/api/v1/admin/auth/login')
      .set('Origin', 'https://admin.gunasai.in')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, x-csrf-token');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://admin.gunasai.in');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('allows forms domain HTTPS origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://forms.gunasai.in');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://forms.gunasai.in');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects insecure HTTP origin even if domain matches', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://gunasai.in');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
