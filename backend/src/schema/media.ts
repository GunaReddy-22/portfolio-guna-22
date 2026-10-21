import { z } from 'zod';

export const MediaAssetSchema = z.object({
  id: z.string(),
  siteId: z.string().default('gunasai-in'),
  provider: z.enum(['local', 'cloudinary']),
  providerAssetId: z.string().optional(),
  url: z.string().min(1),
  mimeType: z.string(),
  resourceType: z.enum(['image', 'document', 'video', 'raw']).default('image'),
  fileSizeBytes: z.number().int().nonnegative(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  altText: z.string().default(''),
  originalFilename: z.string(),
  visibility: z.enum(['public', 'private']).default('public'),
  uploader: z.string().default('owner'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const UploadIntentRequestSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  folder: z.string().default('portfolio'),
});

export const RegisterMediaRequestSchema = z.object({
  url: z.string().min(1),
  provider: z.enum(['local', 'cloudinary']).default('local'),
  providerAssetId: z.string().optional(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  altText: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type UploadIntentRequest = z.infer<typeof UploadIntentRequestSchema>;
export type RegisterMediaRequest = z.infer<typeof RegisterMediaRequestSchema>;

