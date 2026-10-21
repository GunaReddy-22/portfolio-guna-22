import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import path from 'path';
import fs from 'fs';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { MediaModel } from '../src/database/models/Media.js';
import './setup.js';

describe('Media Library API', () => {
  const app = createApp();
  const testEmail = 'media-test@gunasai.in';
  const testPassword = 'MediaPassword123!';
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

  it('rejects unauthorized access to media library', async () => {
    const res = await request(app).get('/api/v1/admin/media');
    expect(res.status).toBe(401);
  });

  it('lists media assets with pagination', async () => {
    const res = await agent.get('/api/v1/admin/media');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('registers a media asset in the database', async () => {
    const res = await agent
      .post('/api/v1/admin/media/register')
      .set('x-csrf-token', csrfToken)
      .send({
        provider: 'local',
        url: '/assets/sample-doc.pdf',
        originalFilename: 'sample-doc.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 10240,
        altText: 'Sample Document',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.originalFilename).toBe('sample-doc.pdf');
    expect(res.body.data.resourceType).toBe('document');
  });

  it('protects referenced media from accidental deletion', async () => {
    // Create an asset with referenceCount > 0
    const inUseAsset = await MediaModel.create({
      siteId: 'gunasai-in',
      provider: 'local',
      url: '/assets/in-use-logo.png',
      mimeType: 'image/png',
      resourceType: 'image',
      fileSizeBytes: 5000,
      originalFilename: 'in-use-logo.png',
      referenceCount: 2, // Referenced on 2 sections!
    });

    // Delete attempt must fail
    const delRes = await agent
      .delete(`/api/v1/admin/media/${inUseAsset._id}`)
      .set('x-csrf-token', csrfToken);

    expect(delRes.status).toBe(400);
    expect(delRes.body.error.code).toBe('MEDIA_IN_USE');

    // Reset referenceCount to 0 -> deletion succeeds
    inUseAsset.referenceCount = 0;
    await inUseAsset.save();

    const successDel = await agent
      .delete(`/api/v1/admin/media/${inUseAsset._id}`)
      .set('x-csrf-token', csrfToken);

    expect(successDel.status).toBe(200);
  });
});

