import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDoc extends Document {
  email: string;
  passwordHash: string;
  role: 'owner' | 'editor';
  isActive: boolean;
  sessionVersion: number;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor'],
      default: 'owner',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      sparse: true,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUserDoc>('User', UserSchema);

