import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { PageModel } from '../src/database/models/Page.js';
import { PageVersionModel } from '../src/database/models/PageVersion.js';
import './setup.js';

describe('Content Management, Drafts & Publishing', () => {
  const app = createApp();
  const testEmail = 'content-test@gunasai.in';
  const testPassword = 'ContentPassword123!';
  let agent: any;
  let csrfToken: string;
  let createdPageId: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testEmail });
    await PageModel.deleteMany({ slug: 'test-content-page' });
    await PageVersionModel.deleteMany({});

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

  it('creates a new page in draft status', async () => {
    const res = await agent
      .post('/api/v1/admin/pages')
      .set('x-csrf-token', csrfToken)
      .send({ title: 'Test Content Page', slug: 'test-content-page' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.draftRevision).toBe(1);
    createdPageId = res.body.data._id;
  });

  it('keeps drafts isolated from unauthenticated public endpoint', async () => {
    const res = await request(app).get('/api/v1/public/pages/test-content-page');
    // Page is draft only, so public endpoint returns 404
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PAGE_NOT_PUBLISHED');
  });

  it('adds schema-validated sections to the draft', async () => {
    const heroSection = {
      id: 'sec_test_hero',
      type: 'hero',
      schemaVersion: 1,
      isVisible: true,
      order: 0,
      layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
      style: { showGlow: true },
      content: {
        pillText: 'Intern @ Zenith',
        eyebrowText: 'Full Stack Dev',
        headlineNameFirst: 'GUNA',
        headlineNameMiddle: 'Sai',
        headlineNameLast: 'KOVVURI',
        description: 'Testing description',
        ctaButtons: [{ label: 'View', url: '#', style: 'primary' }],
        stats: [{ number: '5', label: 'Projects' }],
        floatingTags: ['React', 'Node'],
        photoUrl: '/assets/hero.jpg',
        photoAlt: 'Photo',
        badge: { enabled: true, tag: 'Open', role: 'Dev' },
        marqueeItems: ['FULL-STACK'],
      },
    };

    const res = await agent
      .post(`/api/v1/admin/pages/${createdPageId}/sections`)
      .set('x-csrf-token', csrfToken)
      .send(heroSection);

    expect(res.status).toBe(201);
    expect(res.body.data.draftRevision).toBe(2);
  });

  it('enforces optimistic concurrency and rejects stale draft saves with 409', async () => {
    const page = await PageModel.findById(createdPageId);
    expect(page?.draftRevision).toBe(2);

    // Stale attempt expecting revision 1
    const conflictRes = await agent
      .put(`/api/v1/admin/pages/${createdPageId}/draft`)
      .set('x-csrf-token', csrfToken)
      .send({
        expectedRevision: 1, // Stale!
        sections: page!.draftSections,
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('CONCURRENCY_CONFLICT');

    // Valid attempt with expectedRevision 2 succeeds
    const successRes = await agent
      .put(`/api/v1/admin/pages/${createdPageId}/draft`)
      .set('x-csrf-token', csrfToken)
      .send({
        expectedRevision: 2,
        sections: page!.draftSections,
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.data.draftRevision).toBe(3);
  });

  it('generates a secure preview token and authorizes draft viewing', async () => {
    const prevRes = await agent
      .post(`/api/v1/admin/pages/${createdPageId}/preview`)
      .set('x-csrf-token', csrfToken);

    expect(prevRes.status).toBe(200);
    const { token, previewUrl } = prevRes.body.data;
    expect(token).toBeDefined();

    // Use unauthenticated client with preview token
    const publicPreview = await request(app).get(`/api/v1/public/pages/test-content-page?preview=true&token=${token}`);
    expect(publicPreview.status).toBe(200);
    expect(publicPreview.body.data.isPreview).toBe(true);
    expect(publicPreview.body.data.sections.length).toBeGreaterThan(0);
  });

  it('publishes the page and exposes published sections to the public', async () => {
    const pubRes = await agent
      .post(`/api/v1/admin/pages/${createdPageId}/publish`)
      .set('x-csrf-token', csrfToken)
      .send({
        expectedDraftRevision: 3,
        note: 'First publication of test page',
      });

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.status).toBe('published');
    expect(pubRes.body.data.publishedRevision).toBe(3);

    // Now unauthenticated public request succeeds and returns published content
    const publicRes = await request(app).get('/api/v1/public/pages/test-content-page');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.status).toBe('published');
    expect(publicRes.body.data.sections[0].content.headlineNameFirst).toBe('GUNA');
  });

  it('inspects revision history and restores an earlier revision into a new draft', async () => {
    const historyRes = await agent.get(`/api/v1/admin/pages/${createdPageId}/versions`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);

    // Restore revision 2 into a new draft
    const restoreRes = await agent
      .post(`/api/v1/admin/pages/${createdPageId}/restore/2`)
      .set('x-csrf-token', csrfToken);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.draftRevision).toBe(4); // New draft revision created
  });
});

