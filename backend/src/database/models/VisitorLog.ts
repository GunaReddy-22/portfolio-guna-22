import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorLog extends Document {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp?: string;
  lat?: number;
  lon?: number;
  path: string;
  referrer: string;
  referrerSource: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot';
  browser: string;
  browserVersion?: string;
  os: string;
  screenResolution?: string;
  language?: string;
  sessionId: string;
  durationSeconds?: number;
  isBot: boolean;
  visitedAt: Date;
  updatedAt: Date;
}

const VisitorLogSchema = new Schema<IVisitorLog>(
  {
    ip: { type: String, required: true, trim: true },
    country: { type: String, default: 'Unknown' },
    countryCode: { type: String, default: 'XX', uppercase: true },
    region: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    isp: { type: String, default: '' },
    lat: { type: Number },
    lon: { type: Number },
    path: { type: String, default: '/', trim: true },
    referrer: { type: String, default: 'Direct', trim: true },
    referrerSource: {
      type: String,
      default: 'direct',
      enum: ['direct', 'linkedin', 'github', 'google', 'twitter', 'resume', 'other'],
    },
    deviceType: {
      type: String,
      default: 'desktop',
      enum: ['desktop', 'mobile', 'tablet', 'bot'],
    },
    browser: { type: String, default: 'Unknown' },
    browserVersion: { type: String, default: '' },
    os: { type: String, default: 'Unknown' },
    screenResolution: { type: String, default: '' },
    language: { type: String, default: '' },
    sessionId: { type: String, required: true, index: true },
    durationSeconds: { type: Number, default: 0 },
    isBot: { type: Boolean, default: false },
    visitedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

// High-speed compound queries for analytics dashboards
VisitorLogSchema.index({ visitedAt: -1 });
VisitorLogSchema.index({ ip: 1, visitedAt: -1 });
VisitorLogSchema.index({ isBot: 1, visitedAt: -1 });
VisitorLogSchema.index({ countryCode: 1, visitedAt: -1 });
VisitorLogSchema.index({ referrerSource: 1, visitedAt: -1 });

export const VisitorLog = mongoose.model<IVisitorLog>('VisitorLog', VisitorLogSchema);
