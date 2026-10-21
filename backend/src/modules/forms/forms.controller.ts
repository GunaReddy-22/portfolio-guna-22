import { Request, Response, NextFunction } from 'express';
import { FormModel } from '../../database/models/Form.js';
import { SubmissionModel } from '../../database/models/Submission.js';
import { FormDefinitionSchema } from '../../schema/index.js';
import { recordAuditLog } from '../../middleware/audit.js';
import { env } from '../../config/env.js';

export async function listForms(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const forms = await FormModel.find({ siteId }).sort({ createdAt: -1 });

    // Aggregate submission response counts per form
    const counts = await SubmissionModel.aggregate([
      { $match: { siteId } },
      {
        $group: {
          _id: '$formId',
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] } },
        },
      },
    ]);

    const countMap = new Map<string, { total: number; unread: number }>();
    counts.forEach((c) => {
      countMap.set(c._id?.toString(), { total: c.total, unread: c.unread });
    });

    return res.json({
      success: true,
      data: forms.map((f) => {
        const idStr = f._id.toString();
        const stats = countMap.get(idStr) || countMap.get(f.slug) || { total: 0, unread: 0 };
        return {
          id: idStr,
          _id: idStr,
          slug: f.slug,
          title: f.title || (f as any).name || 'Untitled Feedback Form',
          name: f.title || (f as any).name || 'Untitled Feedback Form',
          description: f.description || '',
          isActive: f.isActive,
          fieldCount: f.fields?.length || 0,
          responseCount: stats.total,
          unreadCount: stats.unread,
          submitButtonText: f.submitButtonText || 'Submit Feedback',
          successMessage: f.successMessage || 'Thank you for your feedback!',
          notificationEmail: f.notificationEmail || '',
          fields: f.fields || [],
          publicUrl: `${env.FORMS_BASE_URL}/${f.slug}`,
          formsDomain: env.FORMS_DOMAIN,
          formsBaseUrl: env.FORMS_BASE_URL,
          updatedAt: f.updatedAt,
          createdAt: f.createdAt,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function getForm(req: Request, res: Response, next: NextFunction) {
  try {
    const { formId } = req.params;
    const form = await FormModel.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Form not found.', requestId: req.requestId },
      });
    }

    const totalSubmissions = await SubmissionModel.countDocuments({
      $or: [{ formId }, { formSlug: form.slug }],
    });

    return res.json({
      success: true,
      data: {
        ...form.toObject(),
        id: form._id.toString(),
        responseCount: totalSubmissions,
        publicUrl: `${env.FORMS_BASE_URL}/${form.slug}`,
        formsDomain: env.FORMS_DOMAIN,
        formsBaseUrl: env.FORMS_BASE_URL,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createForm(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.body.siteId as string) || 'gunasai-in';
    const rawTitle = req.body.title || req.body.name || 'App Feedback Form';
    const rawSlug = req.body.slug || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanSlug = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const validated = FormDefinitionSchema.parse({
      ...req.body,
      title: rawTitle,
      slug: cleanSlug,
      description: req.body.description || '',
      id: req.body.id || `form_${Date.now()}`,
      siteId,
    });

    const existing = await FormModel.findOne({ siteId, slug: cleanSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'SLUG_EXISTS', message: `Form with slug '${cleanSlug}' already exists.`, requestId: req.requestId },
      });
    }

    const form = await FormModel.create({
      siteId,
      slug: cleanSlug,
      title: validated.title,
      description: validated.description || '',
      isActive: validated.isActive,
      submitButtonText: validated.submitButtonText,
      successMessage: validated.successMessage,
      notificationEmail: validated.notificationEmail || undefined,
      fields: validated.fields,
    });

    await recordAuditLog({
      req,
      action: 'FORM_CREATE',
      resourceType: 'form',
      resourceId: form._id.toString(),
      metadata: { slug: cleanSlug, title: form.title },
    });

    return res.status(201).json({
      success: true,
      data: form,
      message: 'Form created successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateForm(req: Request, res: Response, next: NextFunction) {
  try {
    const { formId } = req.params;
    const form = await FormModel.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Form not found.', requestId: req.requestId },
      });
    }

    if (req.body.title !== undefined) form.title = req.body.title;
    else if (req.body.name !== undefined) form.title = req.body.name;

    if (req.body.description !== undefined) form.description = req.body.description;
    if (req.body.slug !== undefined) {
      form.slug = req.body.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    if (req.body.isActive !== undefined) form.isActive = req.body.isActive;
    if (req.body.submitButtonText !== undefined) form.submitButtonText = req.body.submitButtonText;
    else if (req.body.submitLabel !== undefined) form.submitButtonText = req.body.submitLabel;
    if (req.body.successMessage !== undefined) form.successMessage = req.body.successMessage;
    if (req.body.notificationEmail !== undefined) form.notificationEmail = req.body.notificationEmail;
    if (req.body.fields !== undefined) {
      form.fields = req.body.fields;
      form.markModified('fields');
    }

    await form.save();

    await recordAuditLog({
      req,
      action: 'FORM_UPDATE',
      resourceType: 'form',
      resourceId: formId,
    });

    return res.json({
      success: true,
      data: form,
      message: 'Form updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteForm(req: Request, res: Response, next: NextFunction) {
  try {
    const { formId } = req.params;
    const form = await FormModel.findByIdAndDelete(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Form not found.', requestId: req.requestId },
      });
    }

    await recordAuditLog({
      req,
      action: 'FORM_DELETE',
      resourceType: 'form',
      resourceId: formId,
    });

    return res.json({
      success: true,
      message: 'Form deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

