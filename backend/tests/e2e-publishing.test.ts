import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { PageModel } from '../src/database/models/Page.js';
import { PageVersionModel } from '../src/database/models/PageVersion.js';
import { FormModel } from '../src/database/models/Form.js';
import { SubmissionModel } from '../src/database/models/Submission.js';
import './setup.js';

describe('Complete End-to-End Publishing Workflow (Section 15 Master Spec)', () => {
  const app = createApp();
  const testEmail = 'e2e-owner@gunasai.in';
  const testPassword = 'E2EPassword123!Secure';
  let agent: any;
  let csrfToken: string;
  let homePageId: string;
  let initialPublishedHeading: string;
  const updatedHeading = 'GUNA (UPDATED FOR E2E TEST)';

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

    await FormModel.findOneAndUpdate(
      { slug: 'contact-me' },
      {
        siteId: 'gunasai-in',
        slug: 'contact-me',
        name: 'Contact Me',
        description: 'Direct inquiry inbox',
        schemaVersion: 1,
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'message', label: 'Message', type: 'textarea', required: true },
        ],
      },
      { upsert: true, new: true }
    );

    let home = await PageModel.findOne({ slug: 'home' });
    if (!home) {
      const heroSec = {
        id: 'sec-hero',
        type: 'hero',
        schemaVersion: 1,
        isVisible: true,
        order: 0,
        layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
        style: { showGlow: true },
        content: {
          pillText: 'Full Stack Developer Intern @ ZenithIndia',
          eyebrowText: 'Full-Stack Developer · AI Builder',
          headlineNameFirst: 'GUNA',
          headlineNameMiddle: 'Sai Venkata Reddy',
          headlineNameLast: 'KOVVURI',
          description: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications.',
          ctaButtons: [{ label: 'View Projects →', url: '#projects', style: 'primary' }],
          stats: [{ number: '100', suffix: '+', label: 'DSA Problems' }],
          floatingTags: ['Node.js', 'React.js'],
          photoUrl: '/assets/portrait.jpg',
          photoAlt: 'Guna Sai',
          badge: { enabled: true, tag: 'NIT Delhi', role: 'Mech Eng' },
          marqueeItems: ['Full-Stack Developer', 'NIT Delhi'],
        },
      };

      home = await PageModel.create({
        siteId: 'gunasai-in',
        slug: 'home',
        title: 'Home',
        status: 'published',
        draftRevision: 1,
        publishedRevision: 1,
        draftSections: [heroSec],
        publishedSections: [heroSec],
        seo: {
          title: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
          metaDescription: 'Personal portfolio',
          ogImage: '/assets/portrait.jpg',
        },
      });
    } else {
      home.draftRevision = 1;
      home.publishedRevision = 1;
      const heroSec = home.draftSections.find((s: any) => s.type === 'hero');
      if (heroSec) heroSec.content.headlineNameFirst = 'GUNA';
      const pubHero = home.publishedSections?.find((s: any) => s.type === 'hero');
      if (pubHero) pubHero.content.headlineNameFirst = 'GUNA';
      home.markModified('draftSections');
      home.markModified('publishedSections');
      await home.save();
    }

    await PageVersionModel.deleteMany({ pageId: home._id.toString() });
    await PageVersionModel.create({
      siteId: 'gunasai-in',
      pageId: home._id.toString(),
      revision: 1,
      kind: 'published',
      schemaVersion: 1,
      title: home.title,
      slug: home.slug,
      sections: home.publishedSections,
      createdBy: 'baseline',
    });
  });

  // Step 1: Log in
  it('Step 1: Admin logs in successfully and secures session', async () => {
    agent = request.agent(app);
    const loginRes = await agent
      .post('/api/v1/admin/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    const csrfRes = await agent.get('/api/v1/admin/auth/csrf');
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.data.csrfToken;
  });

  // Step 2: Open existing home page
  it('Step 2: Opens the existing home page', async () => {
    const listRes = await agent.get('/api/v1/admin/pages');
    expect(listRes.status).toBe(200);
    const home = listRes.body.data.find((p: any) => p.slug === 'home');
    expect(home).toBeDefined();
    homePageId = home.id;

    const pageRes = await agent.get(`/api/v1/admin/pages/${homePageId}`);
    expect(pageRes.status).toBe(200);
    const heroSec = pageRes.body.data.draftSections.find((s: any) => s.type === 'hero');
    expect(heroSec).toBeDefined();
    initialPublishedHeading = heroSec.content.headlineNameFirst;
  });

  // Step 3 & 4: Edit heading in draft and save draft
  it('Step 3 & 4: Edits heading in draft and saves draft revision', async () => {
    const pageRes = await agent.get(`/api/v1/admin/pages/${homePageId}`);
    const draftSections = pageRes.body.data.draftSections;
    const currentRevision = pageRes.body.data.draftRevision;

    const heroIdx = draftSections.findIndex((s: any) => s.type === 'hero');
    draftSections[heroIdx].content.headlineNameFirst = updatedHeading;

    const saveRes = await agent
      .put(`/api/v1/admin/pages/${homePageId}/draft`)
      .set('x-csrf-token', csrfToken)
      .send({
        expectedRevision: currentRevision,
        sections: draftSections,
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.draftRevision).toBe(currentRevision + 1);
  });

  // Step 5: Verify live page still shows old published heading
  it('Step 5: Verifies the live public page still shows the old published heading (Draft Isolation)', async () => {
    const liveRes = await request(app).get('/api/v1/public/pages/home');
    expect(liveRes.status).toBe(200);
    const liveHero = liveRes.body.data.sections.find((s: any) => s.type === 'hero');
    expect(liveHero.content.headlineNameFirst).toBe(initialPublishedHeading);
    expect(liveHero.content.headlineNameFirst).not.toBe(updatedHeading);
  });

  // Step 6: Preview draft
  it('Step 6: Previews the draft with generated preview token', async () => {
    const prevRes = await agent
      .post(`/api/v1/admin/pages/${homePageId}/preview`)
      .set('x-csrf-token', csrfToken);

    expect(prevRes.status).toBe(200);
    const token = prevRes.body.data.token;

    const previewRes = await request(app).get(`/api/v1/public/pages/home?preview=true&token=${token}`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.isPreview).toBe(true);
    const prevHero = previewRes.body.data.sections.find((s: any) => s.type === 'hero');
    expect(prevHero.content.headlineNameFirst).toBe(updatedHeading);
  });

  // Step 7 & 8: Publish draft and verify live site is updated
  it('Step 7 & 8: Publishes the draft and verifies live public website shows updated heading', async () => {
    const pageRes = await agent.get(`/api/v1/admin/pages/${homePageId}`);
    const draftRev = pageRes.body.data.draftRevision;

    const pubRes = await agent
      .post(`/api/v1/admin/pages/${homePageId}/publish`)
      .set('x-csrf-token', csrfToken)
      .send({
        expectedDraftRevision: draftRev,
        note: 'Published heading update via E2E test',
      });

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.publishedRevision).toBe(draftRev);

    // Live public page now shows updated heading
    const liveRes = await request(app).get('/api/v1/public/pages/home');
    expect(liveRes.status).toBe(200);
    const liveHero = liveRes.body.data.sections.find((s: any) => s.type === 'hero');
    expect(liveHero.content.headlineNameFirst).toBe(updatedHeading);
  });

  // Step 9 & 10: Restore earlier revision
  it('Step 9 & 10: Restores earlier revision into new draft and recovers original state', async () => {
    const versionsRes = await agent.get(`/api/v1/admin/pages/${homePageId}/versions`);
    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.data.length).toBeGreaterThan(0);
    const earliestRev = versionsRes.body.data[versionsRes.body.data.length - 1].revision;

    // Restore earliest revision
    const restoreRes = await agent
      .post(`/api/v1/admin/pages/${homePageId}/restore/${earliestRev}`)
      .set('x-csrf-token', csrfToken);

    expect(restoreRes.status).toBe(200);
    const newDraftRev = restoreRes.body.data.draftRevision;

    // Republish restored revision
    const republishRes = await agent
      .post(`/api/v1/admin/pages/${homePageId}/publish`)
      .set('x-csrf-token', csrfToken)
      .send({
        expectedDraftRevision: newDraftRev,
        note: 'Restored original baseline',
      });

    expect(republishRes.status).toBe(200);

    // Live page is restored
    const finalLive = await request(app).get('/api/v1/public/pages/home');
    const finalHero = finalLive.body.data.sections.find((s: any) => s.type === 'hero');
    expect(finalHero.content.headlineNameFirst).toBe(initialPublishedHeading);
  });

  // Step 11 & 12: Submit contact form and view in inbox
  it('Step 11 & 12: Submits public contact form and verifies in admin inbox', async () => {
    const submitRes = await request(app)
      .post('/api/v1/public/forms/contact-me/submissions')
      .send({
        name: 'Sarah Connor',
        email: 'sarah@skynet-defense.org',
        message: 'Looking for an AI / RAG Engineer for our autonomous defense project.',
      });

    expect(submitRes.status).toBe(201);
    const submissionId = submitRes.body.data.id;

    // View in admin inbox
    const inboxRes = await agent.get(`/api/v1/admin/submissions/${submissionId}`);
    expect(inboxRes.status).toBe(200);
    expect(inboxRes.body.data.data.name).toBe('Sarah Connor');
    expect(inboxRes.body.data.status).toBe('unread');
  });

  // Step 13: Verify unauthorized access protection
  it('Step 13: Verifies unauthenticated visitors cannot access admin data or endpoints', async () => {
    const unauthPages = await request(app).get('/api/v1/admin/pages');
    expect(unauthPages.status).toBe(401);

    const unauthSubmissions = await request(app).get('/api/v1/admin/submissions');
    expect(unauthSubmissions.status).toBe(401);

    const unauthTheme = await request(app).put('/api/v1/admin/theme').send({});
    expect(unauthTheme.status).toBe(401);
  });
});

