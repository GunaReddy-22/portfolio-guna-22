import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaDoc extends Document {
  siteId: string;
  provider: 'local' | 'cloudinary';
  providerAssetId?: string;
  url: string;
  mimeType: string;
  resourceType: 'image' | 'document' | 'video' | 'raw';
  fileSizeBytes: number;
  width?: number;
  height?: number;
  altText: string;
  originalFilename: string;
  visibility: 'public' | 'private';
  uploader: string;
  referenceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMediaDoc>(
  {
    siteId: {
      type: String,
      required: true,
      default: 'gunasai-in',
      index: true,
    },
    provider: {
      type: String,
      enum: ['local', 'cloudinary'],
      default: 'local',
    },
    providerAssetId: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['image', 'document', 'video', 'raw'],
      default: 'image',
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      default: 0,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    altText: {
      type: String,
      default: '',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    uploader: {
      type: String,
      default: 'owner',
    },
    referenceCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MediaSchema.index({ siteId: 1, createdAt: -1 });

export const MediaModel = mongoose.model<IMediaDoc>('Media', MediaSchema);

