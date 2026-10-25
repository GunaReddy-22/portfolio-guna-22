import { z } from 'zod';

// Shared layout and style settings
export const BlockLayoutSchema = z.object({
  containerWidth: z.enum(['default', 'wide', 'narrow', 'full']).nullish().default('default'),
  alignment: z.enum(['left', 'center', 'right']).nullish().default('left'),
  paddingTop: z.string().nullish().default('default'),
  paddingBottom: z.string().nullish().default('default'),
}).nullish().default({
  containerWidth: 'default',
  alignment: 'left',
  paddingTop: 'default',
  paddingBottom: 'default',
});

export const BlockStyleSchema = z.object({
  backgroundColor: z.string().nullish(),
  textColor: z.string().nullish(),
  accentColor: z.string().nullish(),
  showGlow: z.boolean().nullish().default(true),
  customClass: z.string().nullish(),
}).nullish().default({
  showGlow: true,
});

export const BaseBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  schemaVersion: z.number().int().nullish().default(1),
  isVisible: z.boolean().nullish().default(true),
  visible: z.boolean().nullish(),
  order: z.number().int().nullish().default(0),
  layout: BlockLayoutSchema,
  style: BlockStyleSchema,
});

// 1. Hero Block
export const HeroBlockSchema = BaseBlockSchema.extend({
  type: z.literal('hero'),
  content: z.object({
    pillText: z.string().nullish().default('Full Stack Developer Intern @ ZenithIndia'),
    eyebrowText: z.string().nullish().default('Full-Stack Developer · AI Builder'),
    headlineNameFirst: z.string().nullish().default('GUNA'),
    headlineNameMiddle: z.string().nullish().default('Sai Venkata Reddy'),
    headlineNameLast: z.string().nullish().default('KOVVURI'),
    headline: z.string().nullish(),
    introduction: z.string().nullish(),
    description: z.string().nullish().default('B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.'),
    ctaButtons: z.array(z.object({
      label: z.string().nullish().default(''),
      url: z.string().nullish().default('#'),
      style: z.enum(['primary', 'secondary']).nullish().default('primary'),
    })).nullish().default([
      { label: 'View Projects →', url: '#projects', style: 'primary' },
      { label: 'View Resume', url: '#resume', style: 'secondary' },
    ]),
    stats: z.array(z.object({
      number: z.string().nullish().default('0'),
      suffix: z.string().nullish(),
      label: z.string().nullish().default(''),
    })).nullish().default([
      { number: '100', suffix: '+', label: 'DSA Problems' },
      { number: '5', suffix: '', label: 'Shipped Projects' },
      { number: '8.04', suffix: '', label: 'CGPA' },
    ]),
    floatingTags: z.union([z.array(z.string()), z.string()]).nullish().default(['Node.js', 'PostgreSQL', 'React.js', 'React Native', 'RAG / LLM']),
    photoUrl: z.string().nullish().default('/assets/hero-portrait.jpg'),
    portraitUrl: z.string().nullish(),
    photoAlt: z.string().nullish().default('Guna Sai Venkata Reddy Kovvuri'),
    badge: z.object({
      enabled: z.boolean().nullish().default(true),
      tag: z.string().nullish().default('Open to work'),
      role: z.string().nullish().default('Full-Stack & AI Roles'),
    }).nullish().default({
      enabled: true,
      tag: 'Open to work',
      role: 'Full-Stack & AI Roles',
    }),
    marqueeItems: z.union([z.array(z.string()), z.string()]).nullish().default([
      'FULL-STACK DEVELOPMENT',
      'AI & LLM AGENTS',
      'REACT NATIVE',
      'POSTGRESQL & MONGODB',
      'CLOUD ARCHITECTURE',
      'FASTAPI & NODE.JS',
    ]),
  }),
});

// 2. About Block
export const AboutBlockSchema = BaseBlockSchema.extend({
  type: z.literal('about'),
  content: z.object({
    sectionNum: z.string().nullish().default('01'),
    sectionTitle: z.string().nullish().default('About'),
    headline: z.string().nullish().default('Engineered by curiosity.'),
    introText: z.string().nullish().default('I build things that work — fast, secure, and at scale.'),
    bodyParagraphs: z.array(z.string()).nullish().default([
      'As a Mechanical Engineering student at NIT Delhi who codes full-stack, I bring an engineering mindset to software. I\'m obsessed with system design, backend architecture, and building products real people use — across web, mobile, and offline desktop.',
      'My toolkit spans the entire MERN stack plus React Native for mobile and Electron for offline desktop apps, with a strong grip on security (JWT, RBAC) and modern AI integrations (RAG, Pinecone, Groq LLM). When I\'m not building software, I\'m diving into mechanical CAD and thermal simulations.',
    ]),
    quickFacts: z.array(z.object({
      key: z.string().nullish().default(''),
      value: z.string().nullish().default(''),
      link: z.string().nullish(),
    })).nullish().default([
      { key: 'Location', value: 'New Delhi / Andhra Pradesh, India' },
      { key: 'Education', value: 'NIT Delhi — B.Tech 2nd Year (CGPA 8.04)' },
      { key: 'Interests', value: 'Full-Stack, AI/LLMs, System Design, Mechanical CAD' },
      { key: 'Mech Eng', value: 'View CAD & Thermal Work →', link: 'https://mech.gunasai.in' },
    ]),
    skillGroups: z.array(z.object({
      label: z.string().nullish().default(''),
      tags: z.array(z.string()).nullish().default([]),
    })).nullish().default([
      { label: 'Languages', tags: ['Python', 'C++', 'TypeScript', 'JavaScript ES6+'] },
      { label: 'Frontend', tags: ['React.js', 'React Native (Expo)', 'HTML5', 'CSS3'] },
      { label: 'Backend', tags: ['Node.js', 'Express.js', 'REST APIs', 'JWT Auth', 'RBAC', 'WebSockets'] },
      { label: 'AI & Vector DB', tags: ['Pinecone', 'Groq LLM', 'HuggingFace Embeddings', 'RAG'] },
      { label: 'Database & Infra', tags: ['MongoDB', 'PostgreSQL', 'SQLite', 'Redis', 'Docker', 'BullMQ'] },
      { label: 'Desktop & Tools', tags: ['Electron', 'Git/GitHub', 'Postman', 'Socket.io', 'Cloudinary', 'Razorpay'] },
    ]),
  }),
});

// 3. Skills Block (standalone or extra skill view)
export const SkillsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('skills'),
  content: z.object({
    sectionNum: z.string().nullish().default('01B'),
    sectionTitle: z.string().nullish().default('Technical Skills'),
    subtitle: z.string().nullish().default('Core capabilities and technologies I work with daily.'),
    headline: z.string().nullish(),
    skillGroups: z.array(z.object({
      label: z.string().nullish().default(''),
      tags: z.array(z.string()).nullish().default([]),
    })).nullish(),
    groups: z.array(z.object({
      name: z.string().nullish().default(''),
      skills: z.array(z.object({
        name: z.string().nullish().default(''),
        level: z.string().nullish(),
      })).nullish().default([]),
    })).nullish(),
  }).transform(c => ({
    ...c,
    groups: c.groups || (c.skillGroups || []).map(g => ({
      name: g.label || '',
      skills: (g.tags || []).map(t => ({ name: t })),
    })),
  })),
});

// 4. Experience Block
export const ExperienceBlockSchema = BaseBlockSchema.extend({
  type: z.literal('experience'),
  content: z.object({
    sectionNum: z.string().nullish().default('02'),
    sectionTitle: z.string().nullish().default('Experience'),
    headline: z.string().nullish().default('On the job.'),
    entries: z.array(z.object({
      id: z.string().nullish(),
      role: z.string().nullish().default('Software Engineer'),
      company: z.string().nullish().default('Company'),
      companyUrl: z.string().nullish(),
      dateRange: z.string().nullish(),
      period: z.string().nullish(),
      location: z.string().nullish(),
      summary: z.string().nullish(),
      description: z.string().nullish(),
      points: z.array(z.string()).nullish().default([]),
      achievements: z.array(z.string()).nullish(),
    }).transform(e => ({
      id: e.id || `exp-${Date.now()}`,
      role: e.role || 'Software Engineer',
      company: e.company || 'Company',
      companyUrl: e.companyUrl || undefined,
      dateRange: e.dateRange || e.period || '2026',
      location: e.location || undefined,
      summary: e.summary || e.description || '',
      points: (e.points && e.points.length > 0) ? e.points : (e.achievements || []),
    }))).nullish().default([]),
    jobs: z.array(z.any()).nullish(),
  }).transform(c => ({
    ...c,
    entries: c.entries && c.entries.length > 0 ? c.entries : (c.jobs || []).map((j: any, i: number) => ({
      id: j.id || `exp-${i}-${Date.now()}`,
      role: j.role || 'Software Engineer',
      company: j.company || 'Company',
      companyUrl: j.companyUrl || undefined,
      dateRange: j.dateRange || j.period || '2026',
      location: j.location || undefined,
      summary: j.summary || j.description || '',
      points: j.points || j.achievements || [],
    })),
  })),
});

// 5. Projects Block
export const ProjectItemSchema = z.object({
  id: z.string().nullish(),
  num: z.string().nullish(),
  tag: z.string().nullish(),
  name: z.string().nullish(),
  title: z.string().nullish(),
  description: z.string().nullish().default(''),
  techPills: z.array(z.string()).nullish(),
  tags: z.array(z.string()).nullish(),
  points: z.array(z.string()).nullish().default([]),
  liveUrl: z.string().nullish(),
  sourceUrl: z.string().nullish(),
  downloadUrl: z.string().nullish(),
  featured: z.boolean().nullish().default(true),
  aiBadge: z.string().nullish(),
  platformBadge: z.object({
    text: z.string().nullish().default(''),
    type: z.enum(['android', 'desktop', 'web']).nullish().default('web'),
  }).nullish(),
  downloadNote: z.string().nullish(),
  appIcon: z.string().nullish(),
  iconUrl: z.string().nullish(),
}).transform((p) => ({
  ...p,
  id: p.id || `proj-${Date.now()}`,
  num: p.num || '01',
  tag: p.tag || (p.tags && p.tags[0]) || 'Project',
  name: p.name || p.title || 'Untitled Project',
  techPills: p.techPills && p.techPills.length > 0 ? p.techPills : (p.tags || []),
  points: p.points || [],
  liveUrl: p.liveUrl || undefined,
  sourceUrl: p.sourceUrl || undefined,
  downloadUrl: p.downloadUrl || undefined,
  aiBadge: p.aiBadge || undefined,
  platformBadge: p.platformBadge || undefined,
  downloadNote: p.downloadNote || undefined,
  appIcon: p.appIcon || p.iconUrl || undefined,
  iconUrl: p.appIcon || p.iconUrl || undefined,
}));

export const ProjectsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('projects'),
  content: z.object({
    sectionNum: z.string().nullish().default('03'),
    sectionTitle: z.string().nullish().default('Projects'),
    headline: z.string().nullish().default("Stuff I've shipped."),
    projects: z.array(ProjectItemSchema).nullish().default([]),
  }),
});

// 6. Education Block
export const EducationBlockSchema = BaseBlockSchema.extend({
  type: z.literal('education'),
  content: z.object({
    sectionNum: z.string().nullish().default('04'),
    sectionTitle: z.string().nullish().default('Education'),
    headline: z.string().nullish().default('Academic journey.'),
    entries: z.array(z.object({
      id: z.string().nullish(),
      year: z.string().nullish(),
      period: z.string().nullish(),
      degree: z.string().nullish().default(''),
      school: z.string().nullish(),
      institution: z.string().nullish(),
      score: z.string().nullish().default(''),
    }).transform(e => ({
      id: e.id || `edu-${Date.now()}`,
      year: e.year || e.period || '',
      degree: e.degree || '',
      school: e.school || e.institution || '',
      score: e.score || '',
    }))).nullish().default([]),
    items: z.array(z.any()).nullish(),
  }).transform(c => ({
    ...c,
    entries: c.entries && c.entries.length > 0 ? c.entries : (c.items || []).map((it: any, i: number) => ({
      id: it.id || `edu-${i}-${Date.now()}`,
      year: it.year || it.period || '',
      degree: it.degree || '',
      school: it.school || it.institution || '',
      score: it.score || '',
    })),
  })),
});

// 7. Highlights Block
export const HighlightsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('highlights'),
  content: z.object({
    sectionNum: z.string().nullish().default('05'),
    sectionTitle: z.string().nullish().default('Highlights'),
    headline: z.string().nullish().default('Beyond the code.'),
    highlights: z.array(z.object({
      id: z.string().nullish(),
      icon: z.string().nullish().default('⚡'),
      title: z.string().nullish().default(''),
      description: z.string().nullish().default(''),
      glowColor: z.string().nullish(),
    }).transform(h => ({
      id: h.id || `hl-${Date.now()}`,
      icon: h.icon || '⚡',
      title: h.title || '',
      description: h.description || '',
      glowColor: h.glowColor || undefined,
    }))).nullish().default([
      {
        id: 'hl-dsa',
        icon: '⚡',
        title: 'DSA Practitioner',
        description: 'Solved 100+ problems on LeetCode using C++ — arrays, hashing, recursion, linked lists, trees, graphs, and dynamic programming.',
      },
      {
        id: 'hl-rag',
        icon: '🤖',
        title: 'AI & RAG Systems',
        description: 'Built production RAG pipelines using Pinecone vector DB, HuggingFace Embeddings, and Groq LLM for semantic search, Q&A, and AI summarization.',
      },
      {
        id: 'hl-ship',
        icon: '📱',
        title: 'Cross-Platform Shipping',
        description: 'Shipped real products across web, Android (React Native/Expo), and Windows desktop (Electron) — not just browser apps.',
      },
    ]),
  }),
});

// 8. Resume Block
export const ResumeBlockSchema = BaseBlockSchema.extend({
  type: z.literal('resume'),
  content: z.object({
    sectionNum: z.string().nullish().default('06'),
    sectionTitle: z.string().nullish().default('Resume'),
    headline: z.string().nullish().default('See it on paper.'),
    frameLabel: z.string().nullish().default('Resume_KGuna.pdf'),
    previewImageUrl: z.string().nullish().default('/assets/resume-preview.png'),
    previewImageAlt: z.string().nullish().default('Guna Sai Venkata Reddy Kovvuri — Resume'),
    sideTitle: z.string().nullish().default('One-page snapshot of everything above.'),
    sideBody: z.string().nullish().default('This is my current resume — full stack & backend focused, covering my experience at ZenithIndia, the five shipped projects, technical skill set, and education. Click below to view it full-size or download a copy.'),
    downloadPdfUrl: z.string().nullish().default('/assets/resume.pdf'),
    downloadButtonLabel: z.string().nullish().default('Download PDF'),
    openFullSizeLabel: z.string().nullish().default('Open Full Size →'),
    highlights: z.array(z.object({
      icon: z.string().nullish().default('💼'),
      label: z.string().nullish().default(''),
      details: z.string().nullish().default(''),
    })).nullish().default([
      {
        icon: '💼',
        label: 'Currently:',
        details: 'Full Stack Developer Intern @ ZenithIndia (Jul 2026 → Present)',
      },
      {
        icon: '🎓',
        label: 'Education:',
        details: 'B.Tech Mechanical Engineering, NIT Delhi — CGPA 8.04',
      },
      {
        icon: '🚀',
        label: 'Projects:',
        details: '5 production projects across Web, Android, and Desktop',
      },
    ]),
  }),
});

// 9. Contact Block
export const ContactBlockSchema = BaseBlockSchema.extend({
  type: z.literal('contact'),
  content: z.object({
    sectionNum: z.string().nullish().default('07'),
    sectionTitle: z.string().nullish().default('Contact'),
    headline: z.string().nullish().default("Let's build something."),
    bgWord: z.string().nullish().default('HELLO'),
    subtext: z.string().nullish().default("I'm actively looking for internship opportunities where I can contribute, learn, and ship meaningful work. Whether it's a role, collaboration, or just a conversation — reach out."),
    contactLinks: z.array(z.object({
      id: z.string().nullish(),
      type: z.enum(['email', 'phone', 'linkedin', 'github', 'custom']).nullish().default('custom'),
      label: z.string().nullish().default(''),
      value: z.string().nullish().default(''),
      href: z.string().nullish().default(''),
      icon: z.string().nullish().default('✉'),
    })).nullish().default([
      {
        id: 'c-email',
        type: 'email',
        label: 'Email',
        value: '241310022@nitdelhi.ac.in',
        href: 'mailto:241310022@nitdelhi.ac.in?subject=Hiring',
        icon: '✉',
      },
      {
        id: 'c-phone',
        type: 'phone',
        label: 'Phone',
        value: '+91 9381888078',
        href: 'tel:+919381888078',
        icon: '📱',
      },
      {
        id: 'c-linkedin',
        type: 'linkedin',
        label: 'LinkedIn',
        value: 'linkedin.com/in/guna-kovvuri',
        href: 'https://linkedin.com/in/guna-kovvuri',
        icon: 'in',
      },
    ]),
    infoCards: z.array(z.object({
      id: z.string().nullish(),
      title: z.string().nullish().default(''),
      body: z.string().nullish().default(''),
    })).nullish().default([
      {
        id: 'info-status',
        title: 'Status & Availability',
        body: 'Available for Summer & Fall internships. Open to remote roles and on-site in Delhi NCR / Bangalore / Hyderabad.',
      },
      {
        id: 'info-focus',
        title: 'Current Focus',
        body: 'Building AI agents, mastering distributed systems, and diving deep into database internals alongside my B.Tech curriculum.',
      },
    ]),
  }),
});

// 10. Form Block (Embeds CMS Managed Form)
export const FormBlockSchema = BaseBlockSchema.extend({
  type: z.literal('form'),
  content: z.object({
    sectionNum: z.string().nullish().default('08'),
    sectionTitle: z.string().nullish().default('Get in Touch'),
    headline: z.string().nullish().default('Send a direct message.'),
    subtitle: z.string().nullish().default('Fill out the form below and I will respond within 24 hours.'),
    formSlug: z.string().nullish().default('contact-me'),
    formId: z.string().nullish(),
  }),
});

// 11. Rich Text Block
export const RichTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('richText'),
  content: z.object({
    sectionNum: z.string().nullish(),
    sectionTitle: z.string().nullish(),
    headline: z.string().nullish(),
    html: z.string().nullish().default('<p>Custom rich text content.</p>'),
  }),
});

// 12. Gallery Block
export const GalleryBlockSchema = BaseBlockSchema.extend({
  type: z.literal('gallery'),
  content: z.object({
    sectionNum: z.string().nullish(),
    sectionTitle: z.string().nullish().default('Gallery'),
    headline: z.string().nullish().default('Featured Visuals'),
    items: z.array(z.object({
      id: z.string().nullish(),
      imageUrl: z.string(),
      alt: z.string().nullish().default(''),
      caption: z.string().nullish(),
      order: z.number().int().nullish().default(0),
    })).nullish().default([]),
  }),
});

// Discriminated union of all 12 blocks
export const CmsBlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  AboutBlockSchema,
  SkillsBlockSchema,
  ExperienceBlockSchema,
  ProjectsBlockSchema,
  EducationBlockSchema,
  HighlightsBlockSchema,
  ResumeBlockSchema,
  ContactBlockSchema,
  FormBlockSchema,
  RichTextBlockSchema,
  GalleryBlockSchema,
]);

export type CmsBlock = z.infer<typeof CmsBlockSchema>;
export type HeroBlock = z.infer<typeof HeroBlockSchema>;
export type AboutBlock = z.infer<typeof AboutBlockSchema>;
export type SkillsBlock = z.infer<typeof SkillsBlockSchema>;
export type ExperienceBlock = z.infer<typeof ExperienceBlockSchema>;
export type ProjectsBlock = z.infer<typeof ProjectsBlockSchema>;
export type EducationBlock = z.infer<typeof EducationBlockSchema>;
export type HighlightsBlock = z.infer<typeof HighlightsBlockSchema>;
export type ResumeBlock = z.infer<typeof ResumeBlockSchema>;
export type ContactBlock = z.infer<typeof ContactBlockSchema>;
export type FormBlock = z.infer<typeof FormBlockSchema>;
export type RichTextBlock = z.infer<typeof RichTextBlockSchema>;
export type GalleryBlock = z.infer<typeof GalleryBlockSchema>;
