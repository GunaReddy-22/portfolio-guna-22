import { Request, Response, NextFunction } from 'express';
import { SubmissionModel } from '../../database/models/Submission.js';
import { FormModel } from '../../database/models/Form.js';
import { generateSafeSubmissionsCsv } from '../../services/csv.service.js';
import { recordAuditLog } from '../../middleware/audit.js';

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const formId = req.query.formId as string | undefined;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10);

    const query: any = { siteId };
    if (formId) {
      query.$or = [{ formId }, { formSlug: formId }];
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const forms = await FormModel.find({ siteId }).select('_id title slug').lean();
    const formTitleMap = new Map<string, string>();
    forms.forEach((f) => {
      const title = f.title || (f as any).name || f.slug;
      formTitleMap.set(f._id.toString(), title);
      formTitleMap.set(f.slug, title);
    });

    const total = await SubmissionModel.countDocuments(query);
    const items = await SubmissionModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: {
        items: items.map((s) => ({
          id: s._id.toString(),
          _id: s._id.toString(),
          formId: s.formId,
          formSlug: s.formSlug,
          formTitle: formTitleMap.get(s.formId) || formTitleMap.get(s.formSlug) || s.formSlug,
          data: s.data,
          status: s.status,
          createdAt: s.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found.', requestId: req.requestId },
      });
    }

    return res.json({
      success: true,
      data: submission,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSubmissionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const { status } = req.body;

    if (!['unread', 'reviewed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: "Status must be 'unread', 'reviewed', or 'archived'.", requestId: req.requestId },
      });
    }

    const submission = await SubmissionModel.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found.', requestId: req.requestId },
      });
    }

    await recordAuditLog({
      req,
      action: 'SUBMISSION_STATUS_UPDATE',
      resourceType: 'submission',
      resourceId: submissionId,
      metadata: { newStatus: status },
    });

    return res.json({
      success: true,
      data: submission,
      message: 'Submission status updated',
    });
  } catch (err) {
    next(err);
  }
}

export async function exportSubmissionsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const formId = req.query.formId as string | undefined;

    const query: any = { siteId };
    if (formId) query.formId = formId;

    const submissions = await SubmissionModel.find(query).sort({ createdAt: -1 });
    const csvContent = generateSafeSubmissionsCsv(submissions);

    await recordAuditLog({
      req,
      action: 'SUBMISSIONS_CSV_EXPORT',
      resourceType: 'submission',
      metadata: { count: submissions.length },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="submissions_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

