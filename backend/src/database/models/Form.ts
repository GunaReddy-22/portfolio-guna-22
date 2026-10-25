import mongoose, { Schema, Document } from 'mongoose';
import { FormField } from '../../schema/index.js';

export interface IFormDoc extends Document {
  siteId: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  formType?: string;
  showHomeButton?: boolean;
  showPill?: boolean;
  pillText?: string;
  showEyebrow?: boolean;
  eyebrowText?: string;
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
    formType: {
      type: String,
      default: 'general',
    },
    showHomeButton: {
      type: Boolean,
      default: true,
    },
    showPill: {
      type: Boolean,
      default: true,
    },
    pillText: {
      type: String,
      default: '',
    },
    showEyebrow: {
      type: Boolean,
      default: true,
    },
    eyebrowText: {
      type: String,
      default: '',
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

