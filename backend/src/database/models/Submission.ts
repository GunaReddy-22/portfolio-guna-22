import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmissionDoc extends Document {
  siteId: string;
  formId: string;
  formSlug: string;
  data: Record<string, any>;
  status: 'unread' | 'reviewed' | 'archived';
  ipHash?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmissionDoc>(
  {
    siteId: {
      type: String,
      required: true,
      default: 'gunasai-in',
      index: true,
    },
    formId: {
      type: String,
      required: true,
      index: true,
    },
    formSlug: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['unread', 'reviewed', 'archived'],
      default: 'unread',
      index: true,
    },
    ipHash: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

SubmissionSchema.index({ siteId: 1, formId: 1, status: 1 });
SubmissionSchema.index({ siteId: 1, createdAt: -1 });

export const SubmissionModel = mongoose.model<ISubmissionDoc>('Submission', SubmissionSchema);

