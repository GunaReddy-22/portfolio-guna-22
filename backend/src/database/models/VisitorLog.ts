import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorEvent {
  type: string;
  label: string;
  target?: string;
  timestamp: Date;
}

export interface IVisitorLog extends Document {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip?: string;
  timezone?: string;
  isp?: string;
  org?: string;
  lat?: number;
  lon?: number;
  path: string;
  sections?: string[];
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
  lastActiveAt: Date;
  updatedAt: Date;

  // Anonymous Fingerprint & Loyalty
  visitorFingerprint?: string;
  visitNumber: number;
  isReturning: boolean;

  // Hardware & Device X-Ray
  gpuRenderer?: string;
  cpuCores?: number;
  deviceMemoryGb?: number;
  touchPoints?: number;
  pixelRatio?: number;
  colorDepth?: number;

  // Network Telemetry
  connectionType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;

  // User Preferences
  languages?: string[];
  colorScheme?: string;
  reducedMotion?: boolean;

  // High-Intent Engagement
  maxScrollPercentage?: number;
  sectionDwellTimes?: Record<string, number>;
  events?: IVisitorEvent[];
  activeSeconds?: number;
  idleSeconds?: number;
}

const VisitorEventSchema = new Schema<IVisitorEvent>(
  {
    type: { type: String, required: true },
    label: { type: String, required: true },
    target: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const VisitorLogSchema = new Schema<IVisitorLog>(
  {
    ip: { type: String, required: true, trim: true },
    country: { type: String, default: 'Unknown' },
    countryCode: { type: String, default: 'XX', uppercase: true },
    region: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    zip: { type: String, default: '' },
    timezone: { type: String, default: '' },
    isp: { type: String, default: '' },
    org: { type: String, default: '' },
    lat: { type: Number },
    lon: { type: Number },
    path: { type: String, default: '/', trim: true },
    sections: { type: [String], default: [] },
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
    lastActiveAt: { type: Date, default: Date.now, index: true },

    // Anonymous Fingerprint & Loyalty
    visitorFingerprint: { type: String, index: true, default: '' },
    visitNumber: { type: Number, default: 1 },
    isReturning: { type: Boolean, default: false, index: true },

    // Hardware & Device X-Ray
    gpuRenderer: { type: String, default: '' },
    cpuCores: { type: Number },
    deviceMemoryGb: { type: Number },
    touchPoints: { type: Number, default: 0 },
    pixelRatio: { type: Number, default: 1 },
    colorDepth: { type: Number },

    // Network Telemetry
    connectionType: { type: String, default: '' },
    downlinkMbps: { type: Number },
    rttMs: { type: Number },
    saveData: { type: Boolean, default: false },

    // User Preferences
    languages: { type: [String], default: [] },
    colorScheme: { type: String, default: '' },
    reducedMotion: { type: Boolean, default: false },

    // High-Intent Engagement
    maxScrollPercentage: { type: Number, default: 0 },
    sectionDwellTimes: { type: Schema.Types.Mixed, default: {} },
    events: { type: [VisitorEventSchema], default: [] },
    activeSeconds: { type: Number, default: 0 },
    idleSeconds: { type: Number, default: 0 },
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
