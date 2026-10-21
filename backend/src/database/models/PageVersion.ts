import mongoose, { Schema, Document } from 'mongoose';
import { CmsBlock } from '../../schema/index.js';

export interface IPageVersionDoc extends Document {
  siteId: string;
  pageId: string;
  revision: number;
  kind: 'draft' | 'published';
  schemaVersion: number;
  title: string;
  slug: string;
  sections: CmsBlock[];
  seo?: Record<string, any>;
  checksum?: string;
  createdBy: string;
  createdAt: Date;
}

const PageVersionSchema = new Schema<IPageVersionDoc>(
  {
    siteId: {
      type: String,
      required: true,
      default: 'gunasai-in',
      index: true,
    },
    pageId: {
      type: String,
      required: true,
      index: true,
    },
    revision: {
      type: Number,
      required: true,
    },
    kind: {
      type: String,
      enum: ['draft', 'published'],
      required: true,
    },
    schemaVersion: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    sections: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    seo: {
      type: Schema.Types.Mixed,
      default: {},
    },
    checksum: {
      type: String,
    },
    createdBy: {
      type: String,
      default: 'owner',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PageVersionSchema.index({ siteId: 1, pageId: 1, revision: 1, kind: 1 }, { unique: true });
PageVersionSchema.index({ siteId: 1, pageId: 1, kind: 1 });
PageVersionSchema.index({ createdAt: -1 });

export const PageVersionModel = mongoose.model<IPageVersionDoc>('PageVersion', PageVersionSchema);

