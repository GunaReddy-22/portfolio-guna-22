import { Request, Response, NextFunction } from 'express';
import { PageModel } from '../../database/models/Page.js';
import { PageVersionModel } from '../../database/models/PageVersion.js';
import { CmsBlockSchema, PublishPageRequestSchema, UpdateDraftRequestSchema } from '../../schema/index.js';
import { signPreviewToken } from '../../services/preview.service.js';
import { recordAuditLog } from '../../middleware/audit.js';

export async function listPages(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const pages = await PageModel.find({ siteId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: pages.map((p) => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        siteId: p.siteId,
        slug: p.slug,
        title: p.title,
        status: p.status,
        draftRevision: p.draftRevision,
        publishedRevision: p.publishedRevision,
        sectionCount: p.draftSections?.length || 0,
        publishedSectionCount: p.publishedSections?.length || 0,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createPage(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.body.siteId as string) || 'gunasai-in';
    const { slug, title, seo } = req.body;

    if (!slug || !title) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Slug and Title are required.', requestId: req.requestId },
      });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const existing = await PageModel.findOne({ siteId, slug: cleanSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'SLUG_EXISTS', message: `Page slug '${cleanSlug}' already exists.`, requestId: req.requestId },
      });
    }

    const page = await PageModel.create({
      siteId,
      slug: cleanSlug,
      title,
      status: 'draft',
      draftRevision: 1,
      draftSections: [],
      seo: seo || {},
    });

    await PageVersionModel.create({
      siteId,
      pageId: page._id.toString(),
      revision: 1,
      kind: 'draft',
      schemaVersion: 1,
      title: page.title,
      slug: page.slug,
      sections: [],
      seo: page.seo,
      createdBy: req.user?.email || 'owner',
    });

    await recordAuditLog({
      req,
      action: 'PAGE_CREATE',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { slug: cleanSlug, title },
    });

    return res.status(201).json({
      success: true,
      data: page,
      message: 'Page created successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const page = await PageModel.findById(pageId);

    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    return res.json({
      success: true,
      data: page,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const { expectedRevision, sections, title, seo } = UpdateDraftRequestSchema.parse(req.body);

    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    // Optimistic concurrency verification if expectedRevision was supplied
    if (expectedRevision !== undefined && page.draftRevision !== expectedRevision) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENCY_CONFLICT',
          message: `Draft has been modified by another session (Current revision: ${page.draftRevision}, Expected: ${expectedRevision}). Please reload to review the latest changes.`,
          details: { currentRevision: page.draftRevision, expectedRevision },
          requestId: req.requestId,
        },
      });
    }

    // Validate every section block against schema
    const validatedSections = sections.map((s, idx) => {
      const parsed = CmsBlockSchema.parse(s);
      parsed.order = idx;
      return parsed;
    });

    // Increment draft revision
    const nextRevision = page.draftRevision + 1;
    page.draftRevision = nextRevision;
    page.draftSections = validatedSections;
    if (title) page.title = title;
    if (seo) page.seo = seo;
    await page.save();

    // Create immutable draft snapshot
    await PageVersionModel.create({
      siteId: page.siteId,
      pageId: page._id.toString(),
      revision: nextRevision,
      kind: 'draft',
      schemaVersion: 1,
      title: page.title,
      slug: page.slug,
      sections: validatedSections,
      seo: page.seo,
      createdBy: req.user?.email || 'owner',
    });

    await recordAuditLog({
      req,
      action: 'DRAFT_SAVE',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { revision: nextRevision, sectionCount: validatedSections.length },
    });

    return res.json({
      success: true,
      data: {
        id: page._id.toString(),
        _id: page._id.toString(),
        slug: page.slug,
        title: page.title,
        status: page.status,
        draftRevision: nextRevision,
        publishedRevision: page.publishedRevision,
        draftSections: validatedSections,
        sections: validatedSections,
        seo: page.seo,
        updatedAt: page.updatedAt,
      },
      message: 'Draft saved successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function addSection(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const validatedBlock = CmsBlockSchema.parse(req.body);

    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    validatedBlock.order = page.draftSections.length;
    page.draftSections.push(validatedBlock);
    page.draftRevision += 1;
    await page.save();

    await PageVersionModel.create({
      siteId: page.siteId,
      pageId: page._id.toString(),
      revision: page.draftRevision,
      kind: 'draft',
      schemaVersion: 1,
      title: page.title,
      slug: page.slug,
      sections: page.draftSections,
      seo: page.seo,
      createdBy: req.user?.email || 'owner',
    });

    await recordAuditLog({
      req,
      action: 'SECTION_ADD',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { sectionType: validatedBlock.type, sectionId: validatedBlock.id },
    });

    return res.status(201).json({
      success: true,
      data: {
        draftRevision: page.draftRevision,
        section: validatedBlock,
      },
      message: 'Section added to draft',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSection(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId, sectionId } = req.params;
    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    const idx = page.draftSections.findIndex((s: any) => s.id === sectionId);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'SECTION_NOT_FOUND', message: `Section '${sectionId}' not found in draft.`, requestId: req.requestId },
      });
    }

    const updated = CmsBlockSchema.parse({
      ...page.draftSections[idx],
      ...req.body,
      id: sectionId,
    });

    page.draftSections[idx] = updated;
    page.draftRevision += 1;
    page.markModified('draftSections');
    await page.save();

    await recordAuditLog({
      req,
      action: 'SECTION_UPDATE',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { sectionId },
    });

    return res.json({
      success: true,
      data: {
        draftRevision: page.draftRevision,
        section: updated,
      },
      message: 'Section updated',
    });
  } catch (err) {
    next(err);
  }
}

export async function reorderSections(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const { orderedSectionIds } = req.body;

    if (!Array.isArray(orderedSectionIds)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderedSectionIds must be an array of IDs.', requestId: req.requestId },
      });
    }

    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    const sectionMap = new Map(page.draftSections.map((s: any) => [s.id, s]));
    const newSections: any[] = [];

    orderedSectionIds.forEach((id: string, idx: number) => {
      const sec = sectionMap.get(id);
      if (sec) {
        sec.order = idx;
        newSections.push(sec);
        sectionMap.delete(id);
      }
    });

    // Append any remaining sections that were not listed
    for (const remaining of sectionMap.values()) {
      remaining.order = newSections.length;
      newSections.push(remaining);
    }

    page.draftSections = newSections;
    page.draftRevision += 1;
    page.markModified('draftSections');
    await page.save();

    await recordAuditLog({
      req,
      action: 'SECTION_REORDER',
      resourceType: 'page',
      resourceId: page._id.toString(),
    });

    return res.json({
      success: true,
      data: {
        draftRevision: page.draftRevision,
        sections: page.draftSections,
      },
      message: 'Sections reordered successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSection(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId, sectionId } = req.params;
    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    page.draftSections = page.draftSections.filter((s: any) => s.id !== sectionId);
    // Re-index order
    page.draftSections.forEach((s: any, idx: number) => {
      s.order = idx;
    });

    page.draftRevision += 1;
    page.markModified('draftSections');
    await page.save();

    await recordAuditLog({
      req,
      action: 'SECTION_DELETE',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { sectionId },
    });

    return res.json({
      success: true,
      data: {
        draftRevision: page.draftRevision,
        sections: page.draftSections,
      },
      message: 'Section removed from draft',
    });
  } catch (err) {
    next(err);
  }
}

export async function generatePreview(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    const token = signPreviewToken({
      siteId: page.siteId,
      pageId: page._id.toString(),
      revision: page.draftRevision,
      ttlSeconds: 7200,
    });

    const previewUrl = `/?preview=true&token=${token}`;

    return res.json({
      success: true,
      data: {
        previewUrl,
        token,
        revision: page.draftRevision,
        expiresInSeconds: 7200,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function publishPage(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const { expectedDraftRevision, note } = PublishPageRequestSchema.parse(req.body);

    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    // Verify concurrency if expectedDraftRevision was supplied
    if (expectedDraftRevision !== undefined && page.draftRevision !== expectedDraftRevision) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENCY_CONFLICT',
          message: `Cannot publish: Draft has been modified (Current: ${page.draftRevision}, Expected: ${expectedDraftRevision}).`,
          details: { currentRevision: page.draftRevision, expectedDraftRevision },
          requestId: req.requestId,
        },
      });
    }

    // Clone draft sections into published sections
    page.publishedSections = JSON.parse(JSON.stringify(page.draftSections));
    page.publishedRevision = page.draftRevision;
    page.status = 'published';
    await page.save();

    // Create or update immutable published revision snapshot
    await PageVersionModel.findOneAndUpdate(
      { siteId: page.siteId, pageId: page._id.toString(), revision: page.publishedRevision, kind: 'published' },
      {
        schemaVersion: 1,
        title: page.title,
        slug: page.slug,
        sections: page.publishedSections,
        seo: page.seo,
        createdBy: req.user?.email || 'owner',
      },
      { upsert: true, new: true }
    );

    await recordAuditLog({
      req,
      action: 'PAGE_PUBLISH',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { publishedRevision: page.publishedRevision, note },
    });

    return res.json({
      success: true,
      data: {
        id: page._id.toString(),
        _id: page._id.toString(),
        slug: page.slug,
        title: page.title,
        status: page.status,
        draftRevision: page.draftRevision,
        publishedRevision: page.publishedRevision,
        draftSections: page.draftSections,
        publishedSections: page.publishedSections,
        updatedAt: page.updatedAt,
      },
      message: 'Page published successfully! Changes are now live on gunasai.in.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId } = req.params;
    const versions = await PageVersionModel.find({ pageId }).sort({ revision: -1 }).limit(50);

    return res.json({
      success: true,
      data: versions.map((v) => ({
        id: v._id.toString(),
        revision: v.revision,
        kind: v.kind,
        title: v.title,
        slug: v.slug,
        sectionCount: v.sections?.length || 0,
        createdBy: v.createdBy,
        createdAt: v.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function restoreVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageId, revision } = req.params;
    const revNum = parseInt(revision, 10);

    const versionSnapshot = await PageVersionModel.findOne({ pageId, revision: revNum });
    if (!versionSnapshot) {
      return res.status(404).json({
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: `Revision ${revNum} not found.`, requestId: req.requestId },
      });
    }

    const page = await PageModel.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.', requestId: req.requestId },
      });
    }

    // Restoring creates a NEW draft revision with the restored content
    const nextRevision = page.draftRevision + 1;
    page.draftRevision = nextRevision;
    page.draftSections = JSON.parse(JSON.stringify(versionSnapshot.sections));
    page.title = versionSnapshot.title;
    if (versionSnapshot.seo) page.seo = versionSnapshot.seo;
    await page.save();

    await PageVersionModel.create({
      siteId: page.siteId,
      pageId: page._id.toString(),
      revision: nextRevision,
      kind: 'draft',
      schemaVersion: 1,
      title: page.title,
      slug: page.slug,
      sections: page.draftSections,
      seo: page.seo,
      createdBy: req.user?.email || 'owner',
    });

    await recordAuditLog({
      req,
      action: 'PAGE_RESTORE',
      resourceType: 'page',
      resourceId: page._id.toString(),
      metadata: { restoredFromRevision: revNum, newDraftRevision: nextRevision },
    });

    return res.json({
      success: true,
      data: {
        draftRevision: nextRevision,
        sections: page.draftSections,
      },
      message: `Restored revision ${revNum} into a new draft (Revision ${nextRevision}). You can preview and publish it.`,
    });
  } catch (err) {
    next(err);
  }
}

