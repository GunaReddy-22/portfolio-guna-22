import { z } from 'zod';

export const ThemeColorsSchema = z.object({
  void: z.string().default('#050508'),
  deep: z.string().default('#080c14'),
  surface: z.string().default('#0d1220'),
  border: z.string().default('rgba(255,255,255,0.07)'),
  border2: z.string().default('rgba(255,200,80,0.25)'),
  text: z.string().default('#e8eaf0'),
  textSoft: z.string().default('#8892a4'),
  textMuted: z.string().default('#4a5568'),
  amber: z.string().default('#ffc84a'),
  amberDim: z.string().default('#c99a2e'),
  violet: z.string().default('#7c5cfc'),
  teal: z.string().default('#00d4b4'),
  rose: z.string().default('#ff6b8a'),
}).default({
  void: '#050508',
  deep: '#080c14',
  surface: '#0d1220',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,200,80,0.25)',
  text: '#e8eaf0',
  textSoft: '#8892a4',
  textMuted: '#4a5568',
  amber: '#ffc84a',
  amberDim: '#c99a2e',
  violet: '#7c5cfc',
  teal: '#00d4b4',
  rose: '#ff6b8a',
});

export const ThemeTypographySchema = z.object({
  fontDisplay: z.string().default("'Bricolage Grotesque', Georgia, 'Segoe UI', sans-serif"),
  fontSerif: z.string().default("'Fraunces', Georgia, 'Times New Roman', serif"),
  fontMono: z.string().default("'Space Mono', 'Courier New', monospace"),
  fontBody: z.string().default("'Plus Jakarta Sans', 'Segoe UI', sans-serif"),
  baseFontSize: z.string().default('15px'),
  lineHeight: z.string().default('1.7'),
}).default({
  fontDisplay: "'Bricolage Grotesque', Georgia, 'Segoe UI', sans-serif",
  fontSerif: "'Fraunces', Georgia, 'Times New Roman', serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
  fontBody: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  baseFontSize: '15px',
  lineHeight: '1.7',
});

export const ThemeLayoutSchema = z.object({
  maxContentWidth: z.string().default('1200px'),
  heroPaddingDesktop: z.string().default('120px 64px 80px'),
  sectionPaddingDesktop: z.string().default('110px 64px'),
  sectionPaddingMobile: z.string().default('72px 24px'),
  cardBorderRadius: z.string().default('12px'),
  buttonBorderRadius: z.string().default('4px'),
  badgeBorderRadius: z.string().default('100px'),
}).default({
  maxContentWidth: '1200px',
  heroPaddingDesktop: '120px 64px 80px',
  sectionPaddingDesktop: '110px 64px',
  sectionPaddingMobile: '72px 24px',
  cardBorderRadius: '12px',
  buttonBorderRadius: '4px',
  badgeBorderRadius: '100px',
});

export const ThemeAnimationsSchema = z.object({
  enableParticles: z.boolean().default(true),
  particleCount: z.number().int().min(10).max(200).default(90),
  enableCustomCursor: z.boolean().default(true),
  enableScrollOrbs: z.boolean().default(true),
  enableScrollReveals: z.boolean().default(true),
}).default({
  enableParticles: true,
  particleCount: 90,
  enableCustomCursor: true,
  enableScrollOrbs: true,
  enableScrollReveals: true,
});

export const SiteThemeSchema = z.object({
  siteId: z.string().default('gunasai-in'),
  name: z.string().default('Default Dark Luxury Cyberpunk'),
  colors: ThemeColorsSchema,
  typography: ThemeTypographySchema,
  layout: ThemeLayoutSchema,
  animations: ThemeAnimationsSchema,
  customCss: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SiteTheme = z.infer<typeof SiteThemeSchema>;
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ThemeTypography = z.infer<typeof ThemeTypographySchema>;
export type ThemeLayout = z.infer<typeof ThemeLayoutSchema>;
export type ThemeAnimations = z.infer<typeof ThemeAnimationsSchema>;

