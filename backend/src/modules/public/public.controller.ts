import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { SiteModel } from '../../database/models/Site.js';
import { PageModel } from '../../database/models/Page.js';
import { FormModel } from '../../database/models/Form.js';
import { SubmissionModel } from '../../database/models/Submission.js';
import { verifyPreviewToken } from '../../services/preview.service.js';
import { sendEmail } from '../../services/email.service.js';
import { renderFeedbackFormHtml } from './feedback-html.js';
import { env } from '../../config/env.js';

export async function getHealth(req: Request, res: Response) {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'guna-cms-api',
  });
}

export async function getSite(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    let site = await SiteModel.findOne({ siteId });

    if (!site) {
      // Return default baseline site object if not yet imported
      return res.json({
        success: true,
        data: {
          siteId: 'gunasai-in',
          siteName: 'Guna Sai Portfolio',
          siteUrl: 'https://gunasai.in',
          title: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
          metaDescription: 'Full-Stack Developer & AI Builder at NIT Delhi crafting production-grade web, mobile, and AI-powered applications.',
          keywords: ['Guna Sai Venkata Reddy Kovvuri', 'Full Stack Developer', 'NIT Delhi'],
          nav: {
            logoText: 'GS',
            logoDot: '.',
            links: [
              { label: 'About', href: '#about', isCta: false },
              { label: 'Experience', href: '#experience', isCta: false },
              { label: 'Projects', href: '#projects', isCta: false },
              { label: 'Education', href: '#education', isCta: false },
              { label: 'Resume', href: '#resume', isCta: false },
              { label: 'Contact', href: '#contact', isCta: false },
            ],
            hireMeCta: {
              label: 'Hire Me ↗',
              href: 'mailto:241310022@nitdelhi.ac.in?subject=Hiring',
              enabled: true,
            },
            mechToggle: {
              enabled: true,
              label: 'Mech Portfolio',
              href: 'https://mech.gunasai.in',
            },
            languageSwitch: {
              enabled: true,
              defaultCode: 'en',
              languages: [
                { code: 'en', label: 'EN', name: 'English', native: 'English' },
                { code: 'hi', label: 'HI', name: 'Hindi', native: 'हिन्दी' },
                { code: 'te', label: 'TE', name: 'Telugu', native: 'తెలుగు' },
              ],
            },
          },
          footer: {
            leftText: 'Designed & built by',
            leftHighlight: 'Guna Sai Venkata Reddy Kovvuri',
            year: '2026',
            rightText: 'NIT Delhi · Full-Stack Developer',
          },
          socialLinks: [
            { platform: 'LinkedIn', url: 'https://linkedin.com/in/guna-kovvuri' },
            { platform: 'GitHub', url: 'https://github.com' },
          ],
          theme: {},
        },
      });
    }

    // Set cache headers for public CDN
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

    return res.json({
      success: true,
      data: site,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const slug = req.params.slug || 'home';
    const isPreview = req.query.preview === 'true';
    const previewToken = req.query.token as string | undefined;

    const page = await PageModel.findOne({ siteId, slug });
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAGE_NOT_FOUND', message: `Page with slug '${slug}' not found.`, requestId: req.requestId },
      });
    }

    // Check preview mode authorization
    if (isPreview) {
      let isAuthorizedPreview = false;

      // 1. Check active authenticated session
      if (req.session && req.session.userId) {
        isAuthorizedPreview = true;
      }

      // 2. Or check HMAC signed preview token
      if (!isAuthorizedPreview && previewToken) {
        const payload = verifyPreviewToken(previewToken);
        if (payload && payload.siteId === siteId && payload.pageId === page._id.toString()) {
          isAuthorizedPreview = true;
        }
      }

      if (!isAuthorizedPreview) {
        return res.status(403).json({
          success: false,
          error: { code: 'PREVIEW_UNAUTHORIZED', message: 'Invalid, expired, or missing preview authorization.', requestId: req.requestId },
        });
      }

      // Return draft revision for preview (never cache drafts)
      res.setHeader('Cache-Control', 'no-store, private');
      return res.json({
        success: true,
        data: {
          id: page._id.toString(),
          slug: page.slug,
          title: page.title,
          status: 'draft',
          revision: page.draftRevision,
          isPreview: true,
          sections: page.draftSections,
          seo: page.seo,
          updatedAt: page.updatedAt,
        },
      });
    }

    // Normal public request: Must have published revision
    if (!page.publishedRevision || !page.publishedSections || page.publishedSections.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAGE_NOT_PUBLISHED', message: 'This page has not been published yet.', requestId: req.requestId },
      });
    }

    // Cache published pages
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

    return res.json({
      success: true,
      data: {
        id: page._id.toString(),
        slug: page.slug,
        title: page.title,
        status: 'published',
        revision: page.publishedRevision,
        isPreview: false,
        sections: page.publishedSections,
        seo: page.seo,
        updatedAt: page.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function renderFeedbackPage(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const slug = req.params.slug;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);

    const form = await FormModel.findOne({
      siteId,
      ...(isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug }),
      isActive: true,
    });

    if (!form) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Form Not Found • Guna CMS</title>
  <style>
    body { background: #090d16; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2.5rem; max-width: 460px; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f59e0b; }
    p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; }
    a { display: inline-block; background: #f59e0b; color: #000; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Feedback Form Inactive or Not Found</h1>
    <p>This feedback link is currently closed, inactive, or may have expired. Please contact the developer if you need assistance.</p>
    <a href="/">Go to Homepage</a>
  </div>
</body>
</html>`);
    }

    const baseUrl = (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production')
      ? (env.FORMS_BASE_URL || `https://${env.FORMS_DOMAIN}`).replace(/\/+$/, '')
      : (process.env.FORMS_BASE_URL || `http://${req.get('host') || 'localhost:5000'}`).replace(/\/+$/, '');

    const html = renderFeedbackFormHtml(form, baseUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    next(err);
  }
}

export async function getPublicForm(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const slug = req.params.slug;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);

    const form = await FormModel.findOne({
      siteId,
      ...(isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug }),
      isActive: true,
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: { code: 'FORM_NOT_FOUND', message: `Form '${slug}' not found or is inactive.`, requestId: req.requestId },
      });
    }

    return res.json({
      success: true,
      data: {
        id: form._id.toString(),
        slug: form.slug,
        title: form.title,
        description: form.description || '',
        submitButtonText: form.submitButtonText || 'Submit Feedback',
        successMessage: form.successMessage || 'Thank you for your feedback!',
        fields: form.fields,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitPublicForm(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const slug = req.params.slug;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const rawData = req.body?.data || req.body;
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAYLOAD', message: 'Malformed form submission payload', requestId: req.requestId },
      });
    }

    const form = await FormModel.findOne({
      siteId,
      ...(isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug }),
      isActive: true,
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: { code: 'FORM_NOT_FOUND', message: 'Form not found or is currently inactive.', requestId: req.requestId },
      });
    }

    // 1. Whitelist supported fields and validate field types & lengths
    const allowedFieldMap = new Map<string, any>(form.fields.map((f: any) => [f.name, f]));
    const submissionData: Record<string, any> = {};

    for (const [key, val] of Object.entries(rawData)) {
      if (!allowedFieldMap.has(key)) {
        // Ignore unexpected / unapproved fields
        continue;
      }

      if (typeof val === 'string' && val.length > 5000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FIELD_TOO_LONG',
            message: `Field '${key}' exceeds maximum permitted length of 5000 characters.`,
            requestId: req.requestId,
          },
        });
      }

      const fieldDef = allowedFieldMap.get(key);
      if (fieldDef) {
        if (fieldDef.type === 'email' && typeof val === 'string' && val.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val.trim())) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_FIELD_TYPE',
                message: `Field '${fieldDef.label || key}' must be a valid email address.`,
                requestId: req.requestId,
              },
            });
          }
        } else if (fieldDef.type === 'number' && val !== undefined && val !== null && val !== '') {
          if (typeof val !== 'number' && isNaN(Number(val))) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_FIELD_TYPE',
                message: `Field '${fieldDef.label || key}' must be a numeric value.`,
                requestId: req.requestId,
              },
            });
          }
        }
      }

      if (Array.isArray(val)) {
        submissionData[key] = val.map((v) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
      } else {
        submissionData[key] = typeof val === 'string' ? val.trim() : val;
      }
    }

    // 2. Validate required fields
    const missingFields: string[] = [];
    for (const field of form.fields) {
      if (field.required) {
        const val = submissionData[field.name];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          missingFields.push(field.label || field.name);
        }
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `Required fields missing: ${missingFields.join(', ')}`,
          details: missingFields,
          requestId: req.requestId,
        },
      });
    }

    // Compute privacy-preserving IP hash
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);

    const submission = await SubmissionModel.create({
      siteId,
      formId: form._id.toString(),
      formSlug: form.slug,
      data: submissionData,
      status: 'unread',
      ipHash,
      userAgent: req.get('user-agent'),
    });

    // Send email notification if notificationEmail configured
    if (form.notificationEmail) {
      function escapeHtml(str: string): string {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      const escapedTitle = escapeHtml(form.title || 'Feedback Form');
      const tableRows = Object.entries(submissionData)
        .map(([k, v]) => {
          const displayVal = Array.isArray(v) ? v.join(', ') : String(v);
          return `<tr><td style="font-weight:bold;padding:6px;border:1px solid #ddd;">${escapeHtml(k)}</td><td style="padding:6px;border:1px solid #ddd;">${escapeHtml(displayVal)}</td></tr>`;
        })
        .join('');
      const emailHtml = `<h3>New Submission: ${escapedTitle}</h3><table style="border-collapse:collapse;width:100%;">${tableRows}</table>`;

      try {
        await sendEmail({
          to: form.notificationEmail,
          subject: `[New Feedback] ${form.title}`,
          text: `You have received a new response on '${form.title}':\n\n${JSON.stringify(submissionData, null, 2)}`,
          html: emailHtml,
        });
      } catch (emailErr: any) {
        console.error('[Public Submission] Notification email delivery error:', emailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: form.successMessage || 'Submission received successfully.',
      data: {
        id: submission._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

