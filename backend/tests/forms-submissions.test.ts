import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/database/models/User.js';
import { FormModel } from '../src/database/models/Form.js';
import { SubmissionModel } from '../src/database/models/Submission.js';
import './setup.js';

describe('Forms & Submissions Inbox API', () => {
  const app = createApp();
  const testEmail = 'forms-test@gunasai.in';
  const testPassword = 'FormsPassword123!';
  let agent: any;
  let csrfToken: string;
  let formId: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testEmail });
    await FormModel.deleteMany({ slug: 'hire-inquiry' });

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

  it('creates a custom form definition via admin API', async () => {
    const res = await agent
      .post('/api/v1/admin/forms')
      .set('x-csrf-token', csrfToken)
      .send({
        slug: 'hire-inquiry',
        title: 'Hiring Inquiry Form',
        submitButtonText: 'Send Inquiry',
        successMessage: 'Inquiry received. Thank you!',
        fields: [
          { id: 'f1', name: 'recruiterName', label: 'Recruiter Name', type: 'text', required: true },
          { id: 'f2', name: 'workEmail', label: 'Company Email', type: 'email', required: true },
          { id: 'f3', name: 'details', label: 'Project Scope', type: 'textarea', required: false },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    formId = res.body.data._id;
  });

  it('allows public users to fetch active form definition without authentication', async () => {
    const res = await request(app).get('/api/v1/public/forms/hire-inquiry');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('hire-inquiry');
    expect(res.body.data.fields.length).toBe(3);
  });

  it('rejects public submission when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: 'Tech Recruiter',
        // workEmail is required and missing!
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
  });

  it('accepts valid public submission and saves to database', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: 'Alice Recruiter',
        workEmail: 'alice@innovate.co',
        details: 'Looking for a Full Stack / AI intern starting next month.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  it('lists submissions in admin inbox and updates review status', async () => {
    const listRes = await agent.get('/api/v1/admin/submissions?status=unread');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);

    const submissionId = listRes.body.data.items[0].id;

    // Mark as reviewed
    const updateRes = await agent
      .patch(`/api/v1/admin/submissions/${submissionId}`)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'reviewed' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('reviewed');
  });

  it('rejects invalid email format for email fields', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: 'Invalid Tester',
        workEmail: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FIELD_TYPE');
  });

  it('rejects oversized field values exceeding 5000 characters', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: 'A'.repeat(6000),
        workEmail: 'oversized@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FIELD_TOO_LONG');
  });

  it('rejects malformed array payload as body', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send(['malicious', 'array']);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  it('strips unexpected unapproved fields from stored submission data', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: 'Valid Recruiter',
        workEmail: 'valid@example.com',
        unapprovedField: 'should_be_stripped',
        isAdmin: true,
      });

    expect(res.status).toBe(201);
    const sub = await SubmissionModel.findById(res.body.data.id);
    expect(sub!.data.unapprovedField).toBeUndefined();
    expect(sub!.data.isAdmin).toBeUndefined();
    expect(sub!.data.recruiterName).toBe('Valid Recruiter');
  });

  it('safely accepts submissions with HTML/script payloads without execution', async () => {
    const res = await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: '<script>alert("xss")</script>',
        workEmail: 'security@example.com',
        details: '<img src=x onerror=alert("xss")>',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const sub = await SubmissionModel.findById(res.body.data.id);
    expect(sub!.data.recruiterName).toBe('<script>alert("xss")</script>');
  });

  it('exports submissions to CSV with spreadsheet formula injection protection', async () => {
    // Insert a potentially malicious submission with formula triggers (=, +, -, @)
    await request(app)
      .post('/api/v1/public/forms/hire-inquiry/submissions')
      .send({
        recruiterName: '=cmd|/c calc.exe!A1', // Formula injection attempt
        workEmail: 'malicious@evil.com',
        details: '+123456789',
      });

    const exportRes = await agent
      .post('/api/v1/admin/submissions/export')
      .set('x-csrf-token', csrfToken);

    expect(exportRes.status).toBe(200);
    expect(exportRes.headers['content-type']).toContain('text/csv');

    const csvText = exportRes.text;
    // Verify that values starting with =, +, -, @ were safely prefixed with an apostrophe (')
    expect(csvText).toContain("'=cmd|/c calc.exe!A1");
    expect(csvText).toContain("'+123456789");
  });

  it('renders public feedback form HTML with Portfolio Home linking to https://gunasai.in', async () => {
    // Request form via forms subdomain host header
    const res = await request(app)
      .get('/feedback/hire-inquiry')
      .set('Host', 'forms.gunasai.in');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    // Ensure Portfolio Home and GS. logo link to https://gunasai.in and not forms.gunasai.in
    expect(res.text).toContain('<a href="https://gunasai.in" class="nav-cta">');
    expect(res.text).toContain('<span>Portfolio Home</span> &#x2197;');
    expect(res.text).toContain('<a href="https://gunasai.in" class="logo">');
    expect(res.text).not.toContain('<a href="https://forms.gunasai.in" class="nav-cta">');
  });

  it('renders 404 inactive page linking back to Portfolio when form is not found', async () => {
    const res = await request(app)
      .get('/feedback/non-existent-form')
      .set('Host', 'forms.gunasai.in');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<a href="https://gunasai.in">Return to Portfolio</a>');
  });
});


