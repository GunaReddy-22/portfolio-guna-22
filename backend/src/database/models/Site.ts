import mongoose, { Schema, Document } from 'mongoose';
import { SiteSettings, SiteTheme } from '../../schema/index.js';

export interface ISiteDoc extends Document {
  siteId: string;
  siteName: string;
  siteUrl: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  nav: any;
  footer: any;
  socialLinks: any[];
  theme: SiteTheme;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISiteDoc>(
  {
    siteId: {
      type: String,
      required: true,
      unique: true,
      default: 'gunasai-in',
      index: true,
    },
    siteName: {
      type: String,
      default: 'Guna Sai Portfolio',
    },
    siteUrl: {
      type: String,
      default: 'https://gunasai.in',
    },
    title: {
      type: String,
      default: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
    },
    metaDescription: {
      type: String,
      default: 'Full-Stack Developer & AI Builder at NIT Delhi crafting production-grade web, mobile, and AI-powered applications.',
    },
    keywords: {
      type: [String],
      default: [],
    },
    nav: {
      type: Schema.Types.Mixed,
      default: {},
    },
    footer: {
      type: Schema.Types.Mixed,
      default: {},
    },
    socialLinks: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    theme: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const SiteModel = mongoose.model<ISiteDoc>('Site', SiteSchema);

