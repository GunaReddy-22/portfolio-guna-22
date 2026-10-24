import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { MediaModel } from '../../database/models/Media.js';
import { PageModel } from '../../database/models/Page.js';
import { env } from '../../config/env.js';
import { RegisterMediaRequestSchema, UploadIntentRequestSchema } from '../../schema/index.js';
import { recordAuditLog } from '../../middleware/audit.js';

// Configure Cloudinary if credentials provided
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function listMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const search = req.query.search as string | undefined;
    const resourceType = req.query.type as string | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);

    const query: any = { siteId };
    if (search) {
      query.$or = [
        { originalFilename: { $regex: search, $options: 'i' } },
        { altText: { $regex: search, $options: 'i' } },
      ];
    }
    if (resourceType) {
      query.resourceType = resourceType;
    }

    const total = await MediaModel.countDocuments(query);
    const items = await MediaModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: {
        items: items.map((m) => ({
          id: m._id.toString(),
          _id: m._id.toString(),
          url: m.url,
          provider: m.provider,
          originalFilename: m.originalFilename,
          filename: m.originalFilename,
          altText: m.altText,
          mimeType: m.mimeType,
          resourceType: m.resourceType,
          fileSizeBytes: m.fileSizeBytes,
          size: m.fileSizeBytes,
          width: m.width,
          height: m.height,
          referenceCount: m.referenceCount,
          createdAt: m.createdAt,
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

export async function uploadIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { filename, mimeType, sizeBytes, folder } = UploadIntentRequestSchema.parse(req.body);

    if (sizeBytes > 15 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds maximum 15MB limit.', requestId: req.requestId },
      });
    }

    // If Cloudinary configured, return signed params
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        env.CLOUDINARY_API_SECRET
      );

      return res.json({
        success: true,
        data: {
          provider: 'cloudinary',
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          timestamp,
          folder,
          signature,
          uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
        },
      });
    }

    // In production, reject unconfigured storage
    if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DURABLE_STORAGE_REQUIRED',
          message: 'Durable media storage (Cloudinary) is required in production. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
          requestId: req.requestId,
        },
      });
    }

    // Default to local upload endpoint in development/testing
    return res.json({
      success: true,
      data: {
        provider: 'local',
        uploadUrl: '/api/v1/admin/media/upload-local',
      },
    });
  } catch (err) {
    next(err);
  }
}

function verifyMagicBytes(filePath: string, mimeType: string): boolean {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (mimeType === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimeType === 'image/png') {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }
    if (mimeType === 'image/gif') {
      const header = buffer.toString('ascii', 0, 4);
      return header === 'GIF8';
    }
    if (mimeType === 'image/webp') {
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      return riff === 'RIFF' && webp === 'WEBP';
    }
    if (mimeType === 'application/pdf') {
      const header = buffer.toString('ascii', 0, 4);
      return header === '%PDF';
    }
    return false;
  } catch {
    return false;
  }
}

export async function uploadLocal(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded.', requestId: req.requestId },
      });
    }

    // Verify magic bytes against declared MIME type to prevent polyglots / file spoofing
    const isValidSignature = verifyMagicBytes(file.path, file.mimetype);
    if (!isValidSignature) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_SIGNATURE',
          message: 'File content does not match the declared MIME type signature.',
          requestId: req.requestId,
        },
      });
    }

    // If Cloudinary configured, upload directly to durable cloud storage
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'portfolio',
          resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'auto',
          use_filename: true,
          unique_filename: true,
        });

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        const resourceType = file.mimetype.startsWith('image/')
          ? 'image'
          : file.mimetype === 'application/pdf'
          ? 'document'
          : 'raw';

        const media = await MediaModel.create({
          siteId: 'gunasai-in',
          provider: 'cloudinary',
          providerAssetId: uploadResult.public_id,
          url: uploadResult.secure_url,
          mimeType: file.mimetype,
          resourceType,
          fileSizeBytes: uploadResult.bytes || file.size,
          originalFilename: file.originalname,
          altText: req.body.altText || req.body.alt || file.originalname,
          width: uploadResult.width,
          height: uploadResult.height,
          uploader: req.user?.email || 'owner',
        });

        await recordAuditLog({
          req,
          action: 'MEDIA_UPLOAD',
          resourceType: 'media',
          resourceId: media._id.toString(),
          metadata: { filename: file.originalname, size: file.size, provider: 'cloudinary' },
        });

        return res.status(201).json({
          success: true,
          data: {
            id: media._id.toString(),
            _id: media._id.toString(),
            url: media.url,
            originalFilename: media.originalFilename,
            filename: media.originalFilename,
            fileSizeBytes: media.fileSizeBytes,
            size: media.fileSizeBytes,
            resourceType: media.resourceType,
            provider: 'cloudinary',
          },
          message: 'File uploaded successfully',
        });
      } catch (cloudErr: any) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        console.error('Cloudinary direct upload failed:', cloudErr);
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: `Cloudinary upload failed: ${cloudErr.message || 'Storage error'}`,
            requestId: req.requestId,
          },
        });
      }
    }

    // In production without Cloudinary, reject ephemeral local storage
    if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: {
          code: 'DURABLE_STORAGE_REQUIRED',
          message: 'Local filesystem uploads are disabled in production. Durable media storage (Cloudinary) is required.',
          requestId: req.requestId,
        },
      });
    }

    // Resolve public URL with the API host so public site (gunasai.in) resolves it correctly
    const apiHost = (process.env.PUBLIC_API_URL || process.env.API_BASE_URL || `http://localhost:${env.PORT || 5000}`).replace(/\/+$/, '');
    const publicUrl = `${apiHost}/assets/${file.filename}`;
    const resourceType = file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype === 'application/pdf'
      ? 'document'
      : 'raw';

    const media = await MediaModel.create({
      siteId: 'gunasai-in',
      provider: 'local',
      url: publicUrl,
      mimeType: file.mimetype,
      resourceType,
      fileSizeBytes: file.size,
      originalFilename: file.originalname,
      altText: req.body.altText || req.body.alt || file.originalname,
      uploader: req.user?.email || 'owner',
    });

    await recordAuditLog({
      req,
      action: 'MEDIA_UPLOAD',
      resourceType: 'media',
      resourceId: media._id.toString(),
      metadata: { filename: file.originalname, size: file.size },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: media._id.toString(),
        _id: media._id.toString(),
        url: media.url,
        originalFilename: media.originalFilename,
        filename: media.originalFilename,
        fileSizeBytes: media.fileSizeBytes,
        size: media.fileSizeBytes,
        resourceType: media.resourceType,
        provider: 'local',
      },
      message: 'File uploaded successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function registerMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = RegisterMediaRequestSchema.parse(req.body);
    const siteId = (req.body.siteId as string) || 'gunasai-in';

    // Validate registration URL protocol
    const url = validated.url.trim();
    const isSafeUrl =
      (url.startsWith('https://') || url.startsWith('/assets/')) &&
      !url.toLowerCase().startsWith('javascript:') &&
      !url.toLowerCase().startsWith('data:');

    if (!isSafeUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNSAFE_URL',
          message: 'Media registration URL must be a valid secure HTTPS destination or local /assets/ path.',
          requestId: req.requestId,
        },
      });
    }

    // Disallow SVG registration
    if (validated.mimeType === 'image/svg+xml') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FORBIDDEN_MIME',
          message: 'SVG assets cannot be registered for security reasons.',
          requestId: req.requestId,
        },
      });
    }

    const resourceType = validated.mimeType.startsWith('image/')
      ? 'image'
      : validated.mimeType === 'application/pdf'
      ? 'document'
      : 'raw';

    const media = await MediaModel.create({
      siteId,
      provider: validated.provider,
      providerAssetId: validated.providerAssetId,
      url: validated.url,
      mimeType: validated.mimeType,
      resourceType,
      fileSizeBytes: validated.fileSizeBytes,
      width: validated.width,
      height: validated.height,
      altText: validated.altText || validated.originalFilename,
      originalFilename: validated.originalFilename,
      uploader: req.user?.email || 'owner',
    });

    await recordAuditLog({
      req,
      action: 'MEDIA_REGISTER',
      resourceType: 'media',
      resourceId: media._id.toString(),
      metadata: { url: media.url },
    });

    return res.status(201).json({
      success: true,
      data: media,
      message: 'Media registered successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const { mediaId } = req.params;

    if (!mediaId || mediaId === 'undefined' || mediaId === 'null' || !/^[0-9a-fA-F]{24}$/.test(mediaId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Valid media ID is required.', requestId: req.requestId },
      });
    }

    const media = await MediaModel.findById(mediaId);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Media asset not found.', requestId: req.requestId },
      });
    }

    // 1. Check explicit referenceCount counter
    if (media.referenceCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MEDIA_IN_USE',
          message: `Cannot delete asset '${media.originalFilename}': It has active reference count (${media.referenceCount}).`,
          details: { referenceCount: media.referenceCount },
          requestId: req.requestId,
        },
      });
    }

    // 2. Query pages to ensure asset URL is not referenced in draft or published sections
    const pageUsingMedia = await PageModel.findOne({
      $or: [
        { 'draftSections.content.photoUrl': media.url },
        { 'draftSections.content.previewImageUrl': media.url },
        { 'draftSections.content.downloadPdfUrl': media.url },
        { 'publishedSections.content.photoUrl': media.url },
        { 'publishedSections.content.previewImageUrl': media.url },
        { 'publishedSections.content.downloadPdfUrl': media.url },
      ],
    });

    if (pageUsingMedia) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MEDIA_IN_USE',
          message: `Cannot delete asset '${media.originalFilename}': It is referenced in page '${pageUsingMedia.title}'.`,
          requestId: req.requestId,
        },
      });
    }

    // If Cloudinary file, remove from Cloudinary
    if (media.provider === 'cloudinary' && media.providerAssetId && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        const resourceType = media.mimeType === 'application/pdf' ? 'raw' : 'image';
        await cloudinary.uploader.destroy(media.providerAssetId, { resource_type: resourceType });
      } catch (e) {
        console.warn('[Media] Could not delete from Cloudinary:', e);
      }
    }

    // If local file, delete from disk
    if (media.provider === 'local' && media.url.startsWith('/assets/')) {
      const filename = path.basename(media.url);
      const filePath = path.resolve(process.cwd(), 'public_assets', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('[Media] Could not delete local file:', e);
        }
      }
    }

    await MediaModel.findByIdAndDelete(mediaId);

    await recordAuditLog({
      req,
      action: 'MEDIA_DELETE',
      resourceType: 'media',
      resourceId: mediaId,
      metadata: { url: media.url },
    });

    return res.json({
      success: true,
      message: 'Media asset deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

