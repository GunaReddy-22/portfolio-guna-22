import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const KNOWN_DEV_SECRETS = [
  'guna_cms_development_secure_session_secret_replace_in_prod_998877',
  'preview_secure_token_secret_replace_in_prod_5544332211',
  'guna_super_secure_session_secret_key_antigravity_2026_x92817364501928374',
  'changeme',
  'secret',
  '1234567890',
];

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
    APP_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001,http://localhost:5000'),
    PUBLIC_SITE_URL: z.string().default('http://localhost:3000'),
    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/guna-cms'),
    SESSION_SECRET: z.string().min(16).default('guna_cms_development_secure_session_secret_replace_in_prod_998877'),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    EMAIL_PROVIDER: z.enum(['console', 'smtp', 'resend', 'sendgrid', 'brevo']).default('console'),
    EMAIL_API_KEY: z.string().optional(),
    BREVO_API_KEY: z.string().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('noreply.dev.guna@gmail.com'),
    LOG_LEVEL: z.string().default('info'),
    PREVIEW_SECRET: z.string().min(16).default('preview_secure_token_secret_replace_in_prod_5544332211'),
    FORMS_DOMAIN: z.string().default('forms.gunasai.in'),
    FORMS_BASE_URL: z.string().default('https://forms.gunasai.in'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.SESSION_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET must be at least 32 characters in production',
          path: ['SESSION_SECRET'],
        });
      }
      if (KNOWN_DEV_SECRETS.includes(data.SESSION_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET must not use a known development placeholder in production',
          path: ['SESSION_SECRET'],
        });
      }
      if (data.PREVIEW_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PREVIEW_SECRET must be at least 32 characters in production',
          path: ['PREVIEW_SECRET'],
        });
      }
      if (KNOWN_DEV_SECRETS.includes(data.PREVIEW_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PREVIEW_SECRET must not use a known development placeholder in production',
          path: ['PREVIEW_SECRET'],
        });
      }
      if (data.SESSION_SECRET === data.PREVIEW_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET and PREVIEW_SECRET must be distinct cryptographically random secrets',
          path: ['PREVIEW_SECRET'],
        });
      }

      // Validate PUBLIC_SITE_URL in production (must be HTTPS, no localhost/HTTP)
      if (!data.PUBLIC_SITE_URL.startsWith('https://') || data.PUBLIC_SITE_URL.includes('localhost') || data.PUBLIC_SITE_URL.includes('127.0.0.1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PUBLIC_SITE_URL must be a secure HTTPS origin in production (e.g., https://gunasai.in)',
          path: ['PUBLIC_SITE_URL'],
        });
      }

      // Validate FORMS_BASE_URL in production (must be HTTPS, no localhost/HTTP)
      if (!data.FORMS_BASE_URL.startsWith('https://') || data.FORMS_BASE_URL.includes('localhost') || data.FORMS_BASE_URL.includes('127.0.0.1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FORMS_BASE_URL must be a secure HTTPS origin in production (e.g., https://forms.gunasai.in)',
          path: ['FORMS_BASE_URL'],
        });
      }

      // Enforce strict HTTPS origins in production (no wildcards, no HTTP, no localhost)
      const origins = data.APP_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
      for (const origin of origins) {
        if (origin === '*' || origin.includes('*')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Wildcard CORS origins (*) are strictly prohibited in production',
            path: ['APP_ORIGIN'],
          });
        }
        if (origin.startsWith('http://') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Insecure HTTP or localhost origin '${origin}' is prohibited in production`,
            path: ['APP_ORIGIN'],
          });
        }
        if (!origin.startsWith('https://')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `CORS origin '${origin}' must use HTTPS in production`,
            path: ['APP_ORIGIN'],
          });
        }
      }
    }
  });

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[CRITICAL] Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment configuration validation failed: Security constraints not met');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

// Production origins allowlist (HTTPS only, strictly no localhost/HTTP)
const productionOrigins = [
  env.PUBLIC_SITE_URL,
  env.FORMS_BASE_URL,
  `https://${env.FORMS_DOMAIN}`,
  'https://gunasai.in',
  'https://www.gunasai.in',
  'https://admin.gunasai.in',
  'https://api.gunasai.in',
  'https://forms.gunasai.in',
].filter((o) => (isProduction ? o.startsWith('https://') && !o.includes('localhost') && !o.includes('127.0.0.1') : Boolean(o)));

// Development-only origins
const devOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://forms.localhost:3000',
  'http://forms.localhost:5000',
];

const parsedAppOrigins = env.APP_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter((o) => {
    if (!o || o === '*') return false;
    if (isProduction && (o.startsWith('http://') || o.includes('localhost') || o.includes('127.0.0.1'))) {
      return false;
    }
    return true;
  });

export const allowedOrigins = Array.from(
  new Set([
    ...parsedAppOrigins,
    ...productionOrigins,
    ...(!isProduction ? devOrigins : []),
  ].filter(Boolean))
);
