import mongoose, { Schema, Document } from 'mongoose';
import { CmsBlock } from '../../schema/index.js';

export interface IPageDoc extends Document {
  siteId: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  draftRevision: number;
  publishedRevision?: number;
  draftSections: CmsBlock[];
  publishedSections?: CmsBlock[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPageDoc>(
  {
    siteId: {
      type: String,
      required: true,
      default: 'gunasai-in',
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Home',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    draftRevision: {
      type: Number,
      default: 1,
    },
    publishedRevision: {
      type: Number,
    },
    draftSections: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    publishedSections: {
      type: [Schema.Types.Mixed] as any,
    },
    seo: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        return ret;
      },
    },
  }
);

// Compound unique index on { siteId, slug }
PageSchema.index({ siteId: 1, slug: 1 }, { unique: true });
PageSchema.index({ siteId: 1, status: 1 });

export const PageModel = mongoose.model<IPageDoc>('Page', PageSchema);

