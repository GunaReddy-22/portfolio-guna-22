import { z } from 'zod';

export const UserRoleSchema = z.enum(['owner', 'editor']);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: UserRoleSchema.default('owner'),
  isActive: z.boolean().default(true),
  sessionVersion: z.number().int().default(1),
  lastLoginAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const MIN_PASSWORD_LENGTH = 12;
export const PASSWORD_POLICY_MESSAGE = 'Password must be at least 12 characters long';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

