import { z } from 'zod';
import { CmsBlockSchema } from './sections.js';
import { PageSchema, SiteSettingsSchema } from './site.js';
import { SiteThemeSchema } from './theme.js';

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
      requestId: z.string().optional(),
    }).optional(),
  });

export const PageVersionSnapshotSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  pageId: z.string(),
  revision: z.number().int(),
  kind: z.enum(['draft', 'published']),
  schemaVersion: z.number().int().default(1),
  title: z.string(),
  slug: z.string(),
  sections: z.array(CmsBlockSchema),
  seo: z.any().optional(),
  checksum: z.string().optional(),
  createdBy: z.string().default('owner'),
  createdAt: z.string(),
});

export const PublishPageRequestSchema = z.object({
  expectedDraftRevision: z.number().int().optional(),
  note: z.string().optional(),
});

export const UpdateDraftRequestSchema = z.object({
  expectedRevision: z.number().int().optional(),
  sections: z.array(CmsBlockSchema),
  title: z.string().optional(),
  seo: z.any().optional(),
});

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorEmail: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  siteId: z.string().default('gunasai-in'),
  requestId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
});

export type PageVersionSnapshot = z.infer<typeof PageVersionSnapshotSchema>;
export type PublishPageRequest = z.infer<typeof PublishPageRequestSchema>;
export type UpdateDraftRequest = z.infer<typeof UpdateDraftRequestSchema>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

