import { z } from 'zod';
import { CmsBlockSchema } from './sections.js';

export const NavLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  isCta: z.boolean().default(false),
});

export const SupportedLanguageSchema = z.object({
  code: z.string(),
  label: z.string(),
  name: z.string(),
  native: z.string(),
});

export const SiteSettingsSchema = z.object({
  siteId: z.string().default('gunasai-in'),
  siteName: z.string().default('Guna Sai Portfolio'),
  siteUrl: z.string().default('https://gunasai.in'),
  title: z.string().default('Guna Sai Venkata Reddy Kovvuri — Full Stack Developer'),
  metaDescription: z.string().default('Full-Stack Developer & AI Builder at NIT Delhi crafting production-grade web, mobile, and AI-powered applications.'),
  keywords: z.array(z.string()).default([
    'Guna Sai Venkata Reddy Kovvuri',
    'Full Stack Developer',
    'NIT Delhi',
    'React',
    'Node.js',
    'RAG',
    'AI Builder',
    'ZenithIndia',
  ]),
  nav: z.object({
    logoText: z.string().default('GS'),
    logoDot: z.string().default('.'),
    links: z.array(NavLinkSchema).default([
      { label: 'About', href: '#about', isCta: false },
      { label: 'Experience', href: '#experience', isCta: false },
      { label: 'Projects', href: '#projects', isCta: false },
      { label: 'Education', href: '#education', isCta: false },
      { label: 'Resume', href: '#resume', isCta: false },
      { label: 'Contact', href: '#contact', isCta: false },
    ]),
    hireMeCta: z.object({
      label: z.string().default('Hire Me ↗'),
      href: z.string().default('mailto:241310022@nitdelhi.ac.in?subject=Hiring'),
      enabled: z.boolean().default(true),
    }).default({
      label: 'Hire Me ↗',
      href: 'mailto:241310022@nitdelhi.ac.in?subject=Hiring',
      enabled: true,
    }),
    mechToggle: z.object({
      enabled: z.boolean().default(true),
      label: z.string().default('Mech Portfolio'),
      href: z.string().default('https://mech.gunasai.in'),
    }).default({
      enabled: true,
      label: 'Mech Portfolio',
      href: 'https://mech.gunasai.in',
    }),
    languageSwitch: z.object({
      enabled: z.boolean().default(true),
      defaultCode: z.string().default('en'),
      languages: z.array(SupportedLanguageSchema).default([
        { code: 'en', label: 'EN', name: 'English', native: 'English' },
        { code: 'hi', label: 'HI', name: 'Hindi', native: 'हिन्दी' },
        { code: 'te', label: 'TE', name: 'Telugu', native: 'తెలుగు' },
        { code: 'ta', label: 'TA', name: 'Tamil', native: 'தமிழ்' },
        { code: 'kn', label: 'KN', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'ml', label: 'ML', name: 'Malayalam', native: 'മലയാളം' },
        { code: 'bn', label: 'BN', name: 'Bengali', native: 'বাংলা' },
        { code: 'mr', label: 'MR', name: 'Marathi', native: 'मराठी' },
        { code: 'gu', label: 'GU', name: 'Gujarati', native: 'ગુજરાતી' },
        { code: 'pa', label: 'PA', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
        { code: 'ur', label: 'UR', name: 'Urdu', native: 'اردو' },
        { code: 'es', label: 'ES', name: 'Spanish', native: 'Español' },
        { code: 'fr', label: 'FR', name: 'French', native: 'Français' },
        { code: 'de', label: 'DE', name: 'German', native: 'Deutsch' },
        { code: 'pt', label: 'PT', name: 'Portuguese', native: 'Português' },
        { code: 'it', label: 'IT', name: 'Italian', native: 'Italiano' },
        { code: 'ru', label: 'RU', name: 'Russian', native: 'Русский' },
        { code: 'zh-CN', label: 'ZH', name: 'Chinese', native: '中文' },
        { code: 'ja', label: 'JA', name: 'Japanese', native: '日本語' },
        { code: 'ko', label: 'KO', name: 'Korean', native: '한국어' },
        { code: 'ar', label: 'AR', name: 'Arabic', native: 'العربية' },
      ]),
    }).default({
      enabled: true,
      defaultCode: 'en',
      languages: [
        { code: 'en', label: 'EN', name: 'English', native: 'English' },
        { code: 'hi', label: 'HI', name: 'Hindi', native: 'हिन्दी' },
        { code: 'te', label: 'TE', name: 'Telugu', native: 'తెలుగు' },
      ],
    }),
  }),
  footer: z.object({
    leftText: z.string().default('Designed & built by'),
    leftHighlight: z.string().default('Guna Sai Venkata Reddy Kovvuri'),
    year: z.string().default('2026'),
    rightText: z.string().default('NIT Delhi · Full-Stack Developer'),
  }).default({
    leftText: 'Designed & built by',
    leftHighlight: 'Guna Sai Venkata Reddy Kovvuri',
    year: '2026',
    rightText: 'NIT Delhi · Full-Stack Developer',
  }),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string(),
    icon: z.string().optional(),
  })).default([
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/guna-kovvuri' },
    { platform: 'GitHub', url: 'https://github.com' },
    { platform: 'Email', url: 'mailto:241310022@nitdelhi.ac.in' },
  ]),
});

// Page document schema
export const PageSchema = z.object({
  id: z.string(),
  siteId: z.string().default('gunasai-in'),
  slug: z.string().min(1),
  title: z.string(),
  status: z.enum(['draft', 'published']),
  draftRevision: z.number().int().default(1),
  publishedRevision: z.number().int().optional(),
  draftSections: z.array(CmsBlockSchema).default([]),
  publishedSections: z.array(CmsBlockSchema).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
export type Page = z.infer<typeof PageSchema>;
export type NavLink = z.infer<typeof NavLinkSchema>;

