import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { JSDOM } from 'jsdom';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { PageVersionModel } from '../src/database/models/PageVersion.js';
import { PageModel } from '../src/database/models/Page.js';
import { UserModel } from '../src/database/models/User.js';
import { FormModel } from '../src/database/models/Form.js';
import { SubmissionModel } from '../src/database/models/Submission.js';

// Setup DOM environment for tests so DOMPurify operates with full HTML parsing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).jsdomWindow = dom.window;
(globalThis as any).Node = dom.window.Node;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).DOMParser = dom.window.DOMParser;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDatabase();

  // Drop conflicting legacy indexes on pageversions if present
  try {
    const coll = mongoose.connection.collection('pageversions');
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      if (idx.name === 'siteId_1_pageId_1_revision_1') {
        await coll.dropIndex('siteId_1_pageId_1_revision_1');
        console.log('[Test Setup] Dropped legacy index siteId_1_pageId_1_revision_1');
      }
    }
  } catch (err) {
    // Collection may not exist yet
  }

  // Ensure updated schema indexes are synchronized
  await PageVersionModel.syncIndexes();
  await PageModel.syncIndexes();
  await UserModel.syncIndexes();
});

afterAll(async () => {
  // Keep in-memory database alive across sequential test suites to prevent connection drops
});

