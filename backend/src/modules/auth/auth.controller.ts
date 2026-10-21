import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import { UserModel } from '../../database/models/User.js';
import { LoginRequestSchema, ResetPasswordRequestSchema, ForgotPasswordRequestSchema } from '../../schema/index.js';
import { recordAuditLog } from '../../middleware/audit.js';
import { sendEmail } from '../../services/email.service.js';
import { env } from '../../config/env.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = LoginRequestSchema.parse(req.body);

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          requestId: req.requestId,
        },
      });
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          requestId: req.requestId,
        },
      });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate(async (err) => {
      if (err) return next(err);

      req.session.userId = user._id.toString();
      req.session.userRole = user.role;
      req.session.sessionVersion = user.sessionVersion;
      // Generate fresh CSRF token for the new session
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');

      user.lastLoginAt = new Date();
      await user.save();

      await recordAuditLog({
        req,
        action: 'AUTH_LOGIN',
        resourceType: 'user',
        resourceId: user._id.toString(),
      });

      return res.json({
        success: true,
        data: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          csrfToken: req.session.csrfToken,
        },
        message: 'Login successful',
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session?.userId;
    if (userId) {
      await recordAuditLog({
        req,
        action: 'AUTH_LOGOUT',
        resourceType: 'user',
        resourceId: userId,
      });
    }

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('guna_cms_sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });
      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not logged in', requestId: req.requestId },
      });
    }

    return res.json({
      success: true,
      data: {
        id: req.user._id.toString(),
        email: req.user.email,
        role: req.user.role,
        lastLoginAt: req.user.lastLoginAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = ForgotPasswordRequestSchema.parse(req.body);

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (user && user.isActive) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Safely construct reset URL from trusted configured admin URL (preventing Host header injection)
      const baseAdminUrl = (process.env.ADMIN_URL || (env.NODE_ENV === 'production' ? 'https://admin.gunasai.in' : 'http://localhost:5000/admin')).replace(/\/+$/, '');
      const resetUrl = `${baseAdminUrl}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Guna CMS — Password Reset Request',
        text: `You have requested a password reset for Guna CMS. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
      });
    }

    // Always respond with success to prevent user enumeration
    return res.json({
      success: true,
      message: 'If the email is registered, a password reset link has been dispatched.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = ResetPasswordRequestSchema.parse(req.body);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Password reset token is invalid or has expired.',
          requestId: req.requestId,
        },
      });
    }

    user.passwordHash = await argon2.hash(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.sessionVersion += 1; // Invalidate all prior sessions
    await user.save();

    await recordAuditLog({
      req,
      action: 'AUTH_PASSWORD_RESET',
      resourceType: 'user',
      resourceId: user._id.toString(),
    });

    return res.json({
      success: true,
      message: 'Password has been successfully updated. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
}

