import mongoose, { Schema, Document } from 'mongoose';
import { FormField } from '../../schema/index.js';

export interface IFormDoc extends Document {
  siteId: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  submitButtonText: string;
  successMessage: string;
  notificationEmail?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

const FormSchema = new Schema<IFormDoc>(
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
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    submitButtonText: {
      type: String,
      default: 'Send Message',
    },
    successMessage: {
      type: String,
      default: 'Thank you for reaching out! I will get back to you shortly.',
    },
    notificationEmail: {
      type: String,
    },
    fields: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

FormSchema.index({ siteId: 1, slug: 1 }, { unique: true });

export const FormModel = mongoose.model<IFormDoc>('Form', FormSchema);

