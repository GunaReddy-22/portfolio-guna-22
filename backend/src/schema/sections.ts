import { z } from 'zod';

// Shared layout and style settings
export const BlockLayoutSchema = z.object({
  containerWidth: z.enum(['default', 'wide', 'narrow', 'full']).default('default'),
  alignment: z.enum(['left', 'center', 'right']).default('left'),
  paddingTop: z.string().default('default'),
  paddingBottom: z.string().default('default'),
}).default({
  containerWidth: 'default',
  alignment: 'left',
  paddingTop: 'default',
  paddingBottom: 'default',
});

export const BlockStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  showGlow: z.boolean().default(true),
  customClass: z.string().optional(),
}).default({
  showGlow: true,
});

export const BaseBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  schemaVersion: z.number().int().default(1),
  isVisible: z.boolean().default(true),
  order: z.number().int().default(0),
  layout: BlockLayoutSchema,
  style: BlockStyleSchema,
});

// 1. Hero Block
export const HeroBlockSchema = BaseBlockSchema.extend({
  type: z.literal('hero'),
  content: z.object({
    pillText: z.string().default('Full Stack Developer Intern @ ZenithIndia'),
    eyebrowText: z.string().default('Full-Stack Developer · AI Builder'),
    headlineNameFirst: z.string().default('GUNA'),
    headlineNameMiddle: z.string().default('Sai Venkata Reddy'),
    headlineNameLast: z.string().default('KOVVURI'),
    description: z.string().default('B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.'),
    ctaButtons: z.array(z.object({
      label: z.string(),
      url: z.string(),
      style: z.enum(['primary', 'secondary']),
    })).default([
      { label: 'View Projects →', url: '#projects', style: 'primary' },
      { label: 'View Resume', url: '#resume', style: 'secondary' },
    ]),
    stats: z.array(z.object({
      number: z.string(),
      suffix: z.string().optional(),
      label: z.string(),
    })).default([
      { number: '100', suffix: '+', label: 'DSA Problems' },
      { number: '5', suffix: '', label: 'Shipped Projects' },
      { number: '8.04', suffix: '', label: 'CGPA' },
    ]),
    floatingTags: z.array(z.string()).default(['Node.js', 'PostgreSQL', 'React.js', 'React Native', 'RAG / LLM']),
    photoUrl: z.string().default('/assets/hero-portrait.jpg'),
    photoAlt: z.string().default('Guna Sai Venkata Reddy Kovvuri'),
    badge: z.object({
      enabled: z.boolean().default(true),
      tag: z.string().default('Open to work'),
      role: z.string().default('Full-Stack & AI Roles'),
    }).default({
      enabled: true,
      tag: 'Open to work',
      role: 'Full-Stack & AI Roles',
    }),
    marqueeItems: z.array(z.string()).default([
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
    sectionNum: z.string().default('01'),
    sectionTitle: z.string().default('About'),
    headline: z.string().default('Engineered by curiosity.'),
    introText: z.string().default('I build things that work — fast, secure, and at scale.'),
    bodyParagraphs: z.array(z.string()).default([
      'As a Mechanical Engineering student at NIT Delhi who codes full-stack, I bring an engineering mindset to software. I\'m obsessed with system design, backend architecture, and building products real people use — across web, mobile, and offline desktop.',
      'My toolkit spans the entire MERN stack plus React Native for mobile and Electron for offline desktop apps, with a strong grip on security (JWT, RBAC) and modern AI integrations (RAG, Pinecone, Groq LLM). When I\'m not building software, I\'m diving into mechanical CAD and thermal simulations.',
    ]),
    quickFacts: z.array(z.object({
      key: z.string(),
      value: z.string(),
      link: z.string().optional(),
    })).default([
      { key: 'Location', value: 'New Delhi / Andhra Pradesh, India' },
      { key: 'Education', value: 'NIT Delhi — B.Tech 2nd Year (CGPA 8.04)' },
      { key: 'Interests', value: 'Full-Stack, AI/LLMs, System Design, Mechanical CAD' },
      { key: 'Mech Eng', value: 'View CAD & Thermal Work →', link: 'https://mech.gunasai.in' },
    ]),
    skillGroups: z.array(z.object({
      label: z.string(),
      tags: z.array(z.string()),
    })).default([
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
    sectionNum: z.string().default('01B'),
    sectionTitle: z.string().default('Technical Skills'),
    subtitle: z.string().default('Core capabilities and technologies I work with daily.'),
    groups: z.array(z.object({
      name: z.string(),
      skills: z.array(z.object({
        name: z.string(),
        level: z.string().optional(),
      })),
    })),
  }),
});

// 4. Experience Block
export const ExperienceBlockSchema = BaseBlockSchema.extend({
  type: z.literal('experience'),
  content: z.object({
    sectionNum: z.string().default('02'),
    sectionTitle: z.string().default('Experience'),
    headline: z.string().default('On the job.'),
    entries: z.array(z.object({
      id: z.string().optional(),
      role: z.string().default('Software Engineer'),
      company: z.string().default('Company'),
      companyUrl: z.string().optional(),
      dateRange: z.string().optional(),
      period: z.string().optional(),
      location: z.string().optional(),
      summary: z.string().optional(),
      description: z.string().optional(),
      points: z.array(z.string()).default([]),
    }).transform(e => ({
      id: e.id || `exp-${Date.now()}`,
      role: e.role,
      company: e.company,
      companyUrl: e.companyUrl,
      dateRange: e.dateRange || e.period || '2026',
      location: e.location,
      summary: e.summary || e.description || '',
      points: e.points || [],
    }))).default([]),
    jobs: z.array(z.any()).optional(),
  }).transform(c => ({
    ...c,
    entries: c.entries && c.entries.length > 0 ? c.entries : (c.jobs || []).map((j: any, i: number) => ({
      id: j.id || `exp-${i}-${Date.now()}`,
      role: j.role || 'Software Engineer',
      company: j.company || 'Company',
      companyUrl: j.companyUrl,
      dateRange: j.dateRange || j.period || '2026',
      location: j.location,
      summary: j.summary || j.description || '',
      points: j.points || [],
    })),
  })),
});

// 5. Projects Block
export const ProjectItemSchema = z.object({
  id: z.string().optional(),
  num: z.string().optional(),
  tag: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().default(''),
  techPills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  points: z.array(z.string()).default([]),
  liveUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
  downloadUrl: z.string().optional(),
  featured: z.boolean().default(true),
  aiBadge: z.string().optional(),
  platformBadge: z.object({
    text: z.string(),
    type: z.enum(['android', 'desktop', 'web']),
  }).optional(),
  downloadNote: z.string().optional(),
}).transform((p) => ({
  ...p,
  id: p.id || `proj-${Date.now()}`,
  num: p.num || '01',
  tag: p.tag || (p.tags && p.tags[0]) || 'Project',
  name: p.name || p.title || 'Untitled Project',
  techPills: p.techPills && p.techPills.length > 0 ? p.techPills : (p.tags || []),
  points: p.points || [],
}));

export const ProjectsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('projects'),
  content: z.object({
    sectionNum: z.string().default('03'),
    sectionTitle: z.string().default('Projects'),
    headline: z.string().default("Stuff I've shipped."),
    projects: z.array(ProjectItemSchema).default([]),
  }),
});

// 6. Education Block
export const EducationBlockSchema = BaseBlockSchema.extend({
  type: z.literal('education'),
  content: z.object({
    sectionNum: z.string().default('04'),
    sectionTitle: z.string().default('Education'),
    headline: z.string().default('Academic journey.'),
    entries: z.array(z.object({
      id: z.string().optional(),
      year: z.string().optional(),
      period: z.string().optional(),
      degree: z.string().default(''),
      school: z.string().optional(),
      institution: z.string().optional(),
      score: z.string().default(''),
    }).transform(e => ({
      id: e.id || `edu-${Date.now()}`,
      year: e.year || e.period || '',
      degree: e.degree,
      school: e.school || e.institution || '',
      score: e.score,
    }))).default([]),
    items: z.array(z.any()).optional(),
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
    sectionNum: z.string().default('05'),
    sectionTitle: z.string().default('Highlights'),
    headline: z.string().default('Beyond the code.'),
    highlights: z.array(z.object({
      id: z.string(),
      icon: z.string(),
      title: z.string(),
      description: z.string(),
      glowColor: z.string().optional(),
    })).default([
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
    sectionNum: z.string().default('06'),
    sectionTitle: z.string().default('Resume'),
    headline: z.string().default('See it on paper.'),
    frameLabel: z.string().default('Resume_KGuna.pdf'),
    previewImageUrl: z.string().default('/assets/resume-preview.png'),
    previewImageAlt: z.string().default('Guna Sai Venkata Reddy Kovvuri — Resume'),
    sideTitle: z.string().default('One-page snapshot of everything above.'),
    sideBody: z.string().default('This is my current resume — full stack & backend focused, covering my experience at ZenithIndia, the five shipped projects, technical skill set, and education. Click below to view it full-size or download a copy.'),
    downloadPdfUrl: z.string().default('/assets/resume.pdf'),
    downloadButtonLabel: z.string().default('Download PDF'),
    openFullSizeLabel: z.string().default('Open Full Size →'),
    highlights: z.array(z.object({
      icon: z.string(),
      label: z.string(),
      details: z.string(),
    })).default([
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
    sectionNum: z.string().default('07'),
    sectionTitle: z.string().default('Contact'),
    headline: z.string().default("Let's build something."),
    bgWord: z.string().default('HELLO'),
    subtext: z.string().default("I'm actively looking for internship opportunities where I can contribute, learn, and ship meaningful work. Whether it's a role, collaboration, or just a conversation — reach out."),
    contactLinks: z.array(z.object({
      id: z.string(),
      type: z.enum(['email', 'phone', 'linkedin', 'github', 'custom']),
      label: z.string(),
      value: z.string(),
      href: z.string(),
      icon: z.string(),
    })).default([
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
      id: z.string(),
      title: z.string(),
      body: z.string(),
    })).default([
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
    sectionNum: z.string().default('08'),
    sectionTitle: z.string().default('Get in Touch'),
    headline: z.string().default('Send a direct message.'),
    subtitle: z.string().default('Fill out the form below and I will respond within 24 hours.'),
    formSlug: z.string().default('contact-me'),
    formId: z.string().optional(),
  }),
});

// 11. Rich Text Block
export const RichTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('richText'),
  content: z.object({
    sectionNum: z.string().optional(),
    sectionTitle: z.string().optional(),
    headline: z.string().optional(),
    html: z.string().default('<p>Custom rich text content.</p>'),
  }),
});

// 12. Gallery Block
export const GalleryBlockSchema = BaseBlockSchema.extend({
  type: z.literal('gallery'),
  content: z.object({
    sectionNum: z.string().optional(),
    sectionTitle: z.string().default('Gallery'),
    headline: z.string().default('Featured Visuals'),
    items: z.array(z.object({
      id: z.string(),
      imageUrl: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
      order: z.number().int().default(0),
    })).default([]),
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

