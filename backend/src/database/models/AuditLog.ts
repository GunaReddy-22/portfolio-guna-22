import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLogDoc extends Document {
  siteId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    siteId: {
      type: String,
      required: true,
      default: 'gunasai-in',
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
    },
    requestId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ siteId: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);

