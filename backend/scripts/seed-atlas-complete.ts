import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import argon2 from 'argon2';
import fs from 'fs';
import { SiteModel } from '../src/database/models/Site.js';
import { PageModel } from '../src/database/models/Page.js';
import { PageVersionModel } from '../src/database/models/PageVersion.js';
import { FormModel } from '../src/database/models/Form.js';
import { UserModel } from '../src/database/models/User.js';
import {
  HeroBlockSchema,
  AboutBlockSchema,
  ExperienceBlockSchema,
  ProjectsBlockSchema,
  EducationBlockSchema,
  HighlightsBlockSchema,
  ResumeBlockSchema,
  ContactBlockSchema,
  FormBlockSchema,
  SiteThemeSchema,
  SiteSettingsSchema,
} from '../src/schema/index.js';

async function seedComplete() {
  const uri = process.env.MONGODB_URI!;
  console.log('\n============================================================');
  console.log('🚀  Guna CMS — Seeding Exact Authentic Portfolio to MongoDB Atlas');
  console.log('============================================================\n');

  console.log(`Connecting to MongoDB Atlas with single resilient socket...`);
  await mongoose.connect(uri, { tls: true, maxPoolSize: 1, minPoolSize: 1, serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected to MongoDB Atlas successfully!');

  // 1. Seed Owner Accounts
  const initialPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialPassword) {
    throw new Error('ADMIN_PASSWORD or ADMIN_INITIAL_PASSWORD must be set in environment variables');
  }
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gunasai.in').toLowerCase().trim();
  const hash = await argon2.hash(initialPassword);
  await UserModel.findOneAndUpdate(
    { email: adminEmail },
    { email: adminEmail, passwordHash: hash, role: 'owner', isActive: true, sessionVersion: 1 },
    { upsert: true, new: true }
  );
  console.log(`✅ Seeded primary owner: ${adminEmail}`);

  // 2. Exact Theme from original_portfolio/index.html
  const theme = SiteThemeSchema.parse({
    siteId: 'gunasai-in',
    name: 'Dark Cyberpunk Luxury',
    colors: {
      void: '#050508',
      deep: '#080c14',
      surface: '#0d1220',
      surfaceElevated: '#131b2e',
      border: 'rgba(255, 255, 255, 0.07)',
      borderHover: 'rgba(255, 200, 80, 0.25)',
      text: '#e8eaf0',
      textMuted: '#4a5568',
      textDim: '#3a4860',
      amber: '#ffc84a',
      amberGlow: 'rgba(255, 200, 74, 0.15)',
      amberDim: '#c99a2e',
      cyan: '#00d4b4',
      cyanGlow: 'rgba(0, 212, 180, 0.15)',
      cyanDim: 'rgba(0, 212, 180, 0.08)',
      danger: '#ff6b8a',
      dangerGlow: 'rgba(255, 107, 138, 0.15)',
      success: '#22c55e',
    },
    typography: {
      fontFamilySans: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      fontFamilyMono: "'Space Mono', 'Courier New', monospace",
      baseFontSize: '15px',
      lineHeight: '1.7',
    },
    radii: { sm: '3px', md: '6px', lg: '12px', full: '100px' },
    shadows: {
      glowAmber: '0 0 30px rgba(255, 200, 74, 0.15)',
      glowCyan: '0 0 30px rgba(0, 212, 180, 0.15)',
    },
    customCss: '',
  });

  // 3. Exact Site Settings from original_portfolio/index.html
  const siteSettings = SiteSettingsSchema.parse({
    siteId: 'gunasai-in',
    siteName: 'Guna Sai Portfolio',
    siteUrl: 'https://gunasai.in',
    title: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
    metaDescription: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.',
    keywords: [
      'Guna Sai Venkata Reddy Kovvuri',
      'Full Stack Developer',
      'NIT Delhi',
      'React',
      'Node.js',
      'RAG',
      'AI Builder',
      'ZenithIndia',
    ],
    nav: {
      logoText: 'GS',
      logoDot: '.',
      links: [
        { label: 'About', href: '#about', isCta: false },
        { label: 'Experience', href: '#experience', isCta: false },
        { label: 'Projects', href: '#projects', isCta: false },
        { label: 'Education', href: '#education', isCta: false },
        { label: 'Resume', href: '#resume', isCta: false },
        { label: 'Contact', href: '#contact', isCta: false },
      ],
      hireMeCta: {
        label: 'Hire Me ↗',
        href: 'mailto:241310022@nitdelhi.ac.in?subject=Hiring',
        enabled: true,
      },
      mechToggle: {
        label: 'Mech Portfolio',
        href: 'https://mech.gunasai.in',
        enabled: true,
      },
      languageSwitch: {
        enabled: true,
        defaultCode: 'en',
        languages: [
          { code: 'en', label: 'EN', name: 'English', native: 'English' },
          { code: 'hi', label: 'HI', name: 'Hindi', native: 'हिन्दी' },
          { code: 'te', label: 'TE', name: 'Telugu', native: 'తెలుగు' },
        ],
      },
    },
    footer: {
      leftText: 'Designed & built by',
      leftHighlight: 'Guna Sai Venkata Reddy Kovvuri',
      year: '2026',
      rightText: 'NIT Delhi · Full-Stack Developer',
    },
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/guna-kovvuri' },
      { platform: 'GitHub', url: 'https://github.com/GunaReddy-22' },
      { platform: 'Email', url: 'mailto:241310022@nitdelhi.ac.in' },
    ],
  });

  await SiteModel.findOneAndUpdate(
    { siteId: 'gunasai-in' },
    { ...siteSettings, theme },
    { upsert: true, new: true }
  );
  console.log('✅ Site settings and theme updated from authentic portfolio.');

  // 4. Contact Form
  await FormModel.findOneAndUpdate(
    { siteId: 'gunasai-in', slug: 'contact-form' },
    {
      siteId: 'gunasai-in',
      slug: 'contact-form',
      name: 'Contact Form',
      description: 'Direct inquiry message inbox',
      schemaVersion: 1,
      fields: [
        { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'e.g. John Doe' },
        { name: 'email', label: 'Your Email', type: 'email', required: true, placeholder: 'e.g. john@example.com' },
        { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can I help you?' },
      ],
      notifications: { emailTo: ['241310022@nitdelhi.ac.in'], sendConfirmation: false },
    },
    { upsert: true, new: true }
  );
  console.log('✅ Contact form configured.');

  // 5. Build All 9 Blocks with EXACT content from original_portfolio/index.html
  const heroBlock = HeroBlockSchema.parse({
    id: 'sec-hero',
    type: 'hero',
    schemaVersion: 1,
    isVisible: true,
    order: 0,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      pillText: 'Full Stack Developer Intern @ ZenithIndia',
      eyebrowText: 'Full-Stack Developer · AI Builder',
      headlineNameFirst: 'GUNA',
      headlineNameMiddle: 'Sai Venkata Reddy',
      headlineNameLast: 'KOVVURI',
      description: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.',
      ctaButtons: [
        { label: 'View Projects →', url: '#projects', style: 'primary' },
        { label: 'View Resume', url: '#resume', style: 'secondary' },
      ],
      stats: [
        { number: '100', suffix: '+', label: 'DSA Problems' },
        { number: '5', suffix: '', label: 'Shipped Projects' },
        { number: '8.04', suffix: '', label: 'CGPA' },
      ],
      floatingTags: ['Node.js', 'PostgreSQL', 'React.js', 'React Native', 'RAG / LLM'],
      photoUrl: '/assets/portrait.jpg',
      photoAlt: 'Guna Sai Venkata Reddy Kovvuri',
      badge: {
        enabled: true,
        tag: 'Open to work',
        role: 'Full-Stack & AI Roles',
      },
      marqueeItems: [
        'Full-Stack Developer',
        'NIT Delhi',
        'MERN Stack',
        'React Native',
        'RAG Pipelines',
        'Node.js',
        'Electron',
        'Pinecone',
        'PostgreSQL',
        'Redis',
        'SQLite',
        'Docker',
      ],
    },
  });

  const aboutBlock = AboutBlockSchema.parse({
    id: 'sec-about',
    type: 'about',
    schemaVersion: 1,
    isVisible: true,
    order: 1,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '01',
      sectionTitle: 'About',
      headline: 'Engineered by curiosity.',
      introText: 'I build things that work — fast, secure, and at scale.',
      bodyParagraphs: [
        "As a Mechanical Engineering student at NIT Delhi who codes full-stack, I bring an engineering mindset to software. I'm obsessed with system design, backend architecture, and building products real people use — across web, mobile, and offline desktop.",
        "My toolkit spans the entire MERN stack plus React Native for mobile and Electron for offline desktop apps, with a strong grip on security (JWT, RBAC, cryptographic licensing), queue-driven workflows (BullMQ + Redis), real-time systems (Socket.io), and AI-powered features using RAG architectures with Pinecone, HuggingFace Embeddings, and Groq LLM. I actively practice DSA in C++ to keep problem-solving sharp.",
      ],
      quickFacts: [
        { key: 'Location', value: 'Delhi, India' },
        { key: 'Phone', value: '+91 9381888078', link: 'tel:+919381888078' },
        { key: 'Email', value: '241310022@nitdelhi.ac.in', link: 'mailto:241310022@nitdelhi.ac.in' },
        { key: 'LinkedIn', value: 'guna-kovvuri', link: 'https://linkedin.com/in/guna-kovvuri' },
        { key: 'College', value: 'NIT Delhi · B.Tech Mech Eng' },
      ],
      skillGroups: [
        { label: 'Languages', tags: ['Python', 'C++', 'TypeScript', 'JavaScript ES6+'] },
        { label: 'Frontend', tags: ['React.js', 'React Native (Expo)', 'HTML5', 'CSS3'] },
        { label: 'Backend', tags: ['Node.js', 'Express.js', 'REST APIs', 'JWT Auth', 'RBAC', 'WebSockets'] },
        { label: 'AI & Vector DB', tags: ['Pinecone', 'Groq LLM', 'HuggingFace Embeddings', 'RAG'] },
        { label: 'Database & Infra', tags: ['MongoDB', 'PostgreSQL', 'SQLite', 'Redis', 'Docker', 'BullMQ'] },
        { label: 'Desktop & Tools', tags: ['Electron', 'Git/GitHub', 'Postman', 'Socket.io', 'Cloudinary', 'Razorpay'] },
      ],
    },
  });

  const experienceBlock = ExperienceBlockSchema.parse({
    id: 'sec-experience',
    type: 'experience',
    schemaVersion: 1,
    isVisible: true,
    order: 2,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '02',
      sectionTitle: 'Experience',
      headline: 'On the job.',
      entries: [
        {
          id: 'zenith-internship',
          role: 'Full Stack Developer Intern',
          company: 'ZenithIndia',
          dateRange: 'Jul 2026 → Sep 2026',
          summary: 'Developed scalable full-stack web applications using React.js, Node.js, Express.js, MongoDB, and REST APIs.',
          points: [
            'Developed scalable full-stack web applications using React.js, Node.js, Express.js, MongoDB, and REST APIs.',
            'Built production-ready products including ReviewOS, WhatsApp Catalog Builder, Restaurant QR Menu System, Credit Ledger Apps (Udhaar), and offline ERP solutions with RBAC, authentication, and payment integration.',
          ],
        },
      ],
    },
  });

  const projectsBlock = ProjectsBlockSchema.parse({
    id: 'sec-projects',
    type: 'projects',
    schemaVersion: 1,
    isVisible: true,
    order: 3,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '03',
      sectionTitle: 'Projects',
      headline: "Stuff I've shipped.",
      projects: [
        {
          id: 'proj-studyvault',
          num: '01',
          tag: 'Project · 01',
          name: 'StudyVault',
          aiBadge: 'AI-Powered · RAG Pipeline',
          description: 'A full-stack EdTech marketplace where users create, share, monetize, and purchase study notes. Features a RAG-powered AI system for semantic search, contextual Q&A, and automated summarization — built with Pinecone vector DB, HuggingFace Embeddings, and Groq LLM.',
          techPills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Pinecone', 'Groq LLM', 'HuggingFace', 'Razorpay', 'JWT', 'Cloudinary'],
          points: [
            'Implemented a RAG pipeline using Pinecone vector DB + HuggingFace Embeddings for semantic search and contextual note Q&A',
            'AI-powered note summarization and automated metadata tagging using Groq LLM APIs',
            'JWT-based auth with Role-Based Access Control for secure premium content access',
            'Wallet-driven monetization via Razorpay with creator payouts, 10% platform revenue-sharing, and transaction tracking',
          ],
          liveUrl: 'https://studyvault.gunasai.in/',
          featured: true,
        },
        {
          id: 'proj-finance360',
          num: '02',
          tag: 'Project · 02',
          name: 'Finance360',
          aiBadge: 'AI-Assisted · Multi-Tenant SaaS',
          description: 'A production-grade multi-tenant fintech platform supporting the complete loan lifecycle — borrower onboarding, employee operations, chit fund management, collections, capital recovery, and subscription-based business workflows.',
          techPills: ['React.js', 'Node.js', 'MongoDB', 'Redis', 'BullMQ', 'Groq LLM', 'Razorpay', 'JWT'],
          points: [
            'JWT-secured REST APIs with RBAC across borrowers, employees, and multi-tenant business accounts',
            'Asynchronous backend workflows via Redis + BullMQ for scheduled collections, subscription expiry, and capital-cycle automation',
            'Integrated Groq LLM for multilingual AI-driven financial insights and business analytics',
            'Fault-tolerant service orchestration with retry strategies and timeout handling',
          ],
          liveUrl: 'https://finance360.work/',
          featured: true,
        },
        {
          id: 'proj-taskflowx',
          num: '03',
          tag: 'Project · 03',
          name: 'TaskFlowX',
          description: 'A real-time task orchestration platform where users submit file-based tasks, workers process them asynchronously, and admins monitor execution through role-based dashboards — all live via WebSockets.',
          techPills: ['React.js', 'Node.js', 'PostgreSQL', 'Redis', 'BullMQ', 'Socket.io', 'Docker', 'Cloudinary'],
          points: [
            'Queue-driven backend with smart worker assignment, retry handling & task prioritization via BullMQ',
            'WebSocket-based live status updates for users, workers, and admin dashboards',
            'JWT auth + RBAC across three distinct user roles',
            'Dockerized deployment with Cloudinary file storage & PostgreSQL persistence',
          ],
          sourceUrl: 'https://github.com/GunaReddy-22/taskflowX-backend/',
          featured: true,
        },
        {
          id: 'proj-bunk360',
          num: '04',
          tag: 'Project · 04',
          name: 'Bunk360',
          platformBadge: { text: 'Android · Fully Offline', type: 'android' },
          description: 'A mobile-first ERP for petrol pump owners that digitizes daily fuel operations — replacing manual registers with a fully offline digital workflow for sales, inventory, inspections, credit customers, and business analytics.',
          techPills: ['React Native', 'Expo SDK 52', 'TypeScript', 'SQLite', 'Zustand', 'Zod', 'TweetNaCl'],
          points: [
            'Daily sales, tank reconciliation, lubricant inventory, and density-register modules — all fully offline via SQLite',
            'IOC-standard inspection checklists (equipment, safety, signage, tank verification)',
            'Credit customer ledger with payment history and outstanding tracking',
            'Excel/PDF report export and a layered architecture (Screens → Zustand Stores → Services → Repositories → SQLite)',
            'Cryptographically secured offline licensing with a 15-day trial and annual key activation',
          ],
          downloadNote: 'APK available on request',
          featured: true,
        },
        {
          id: 'proj-wineerp',
          num: '05',
          tag: 'Project · 05',
          name: 'WineERP Desktop',
          platformBadge: { text: 'Windows Desktop · Fully Offline', type: 'desktop' },
          description: 'A single-shop, fully offline point-of-sale and inventory system for wine/liquor retail — packaged as a licensed Windows installer with barcode billing, ledgered inventory, and a cryptographic anti-copying activation system.',
          techPills: ['React', 'Node.js', 'Express', 'MongoDB', 'Electron', 'RSA-2048', 'bcrypt'],
          points: [
            'Barcode-ready POS billing with live totals, keyboard shortcuts, and thermal-style receipt printing',
            'Double-entry inventory ledger covering purchases, returns, and owner-approved stock adjustments',
            'RSA-2048 machine-fingerprint licensing with three independent enforcement layers to prevent copy-across-shops piracy',
            'Automatic nightly local JSON backups with manual backup/restore and a database reset utility',
            'Electron main process spawns a local Express+MongoDB backend on a dedicated port — zero cloud dependency, zero telemetry',
          ],
          downloadNote: '.exe installer available on request',
          featured: true,
        },
      ],
    },
  });

  const educationBlock = EducationBlockSchema.parse({
    id: 'sec-education',
    type: 'education',
    schemaVersion: 1,
    isVisible: true,
    order: 4,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '04',
      sectionTitle: 'Education',
      headline: 'Academic journey.',
      entries: [
        {
          id: 'edu-nitd',
          year: 'Aug 2024 → May 2028',
          degree: 'B.Tech — Mechanical Engineering',
          school: 'National Institute of Technology Delhi',
          score: 'CGPA: 8.04 / 10.0',
        },
        {
          id: 'edu-inter',
          year: '2024',
          degree: 'Class XII',
          school: 'SASI EM High School',
          score: 'Score: 88%',
        },
        {
          id: 'edu-school',
          year: '2022',
          degree: 'Class X',
          school: 'Sri Chaitanya Techno School',
          score: 'Score: 94%',
        },
      ],
    },
  });

  const highlightsBlock = HighlightsBlockSchema.parse({
    id: 'sec-highlights',
    type: 'highlights',
    schemaVersion: 1,
    isVisible: true,
    order: 5,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '05',
      sectionTitle: 'Highlights',
      headline: 'Beyond the code.',
      highlights: [
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
          description: 'Shipped real products across web, Android (React Native/Expo), and Windows desktop (Electron) — not just browser demos.',
        },
        {
          id: 'hl-ncc',
          icon: '🎖️',
          title: 'NCC Cadet',
          description: 'Active NCC Cadet at NIT Delhi — building leadership, discipline, and teamwork skills through regular training.',
        },
        {
          id: 'hl-sec',
          icon: '🔐',
          title: 'Secure by Design',
          description: 'Proficient in JWT auth, RBAC, and cryptographic licensing (RSA-2048 machine-fingerprint activation) for offline products.',
        },
        {
          id: 'hl-prod',
          icon: '🚀',
          title: 'Shipped to Production',
          description: 'All five projects are live/deployed — not demos. Real deployments, real architecture decisions, real constraints solved.',
        },
      ],
    },
  });

  const resumeBlock = ResumeBlockSchema.parse({
    id: 'sec-resume',
    type: 'resume',
    schemaVersion: 1,
    isVisible: true,
    order: 6,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '06',
      sectionTitle: 'Resume',
      headline: 'See it on paper.',
      frameLabel: 'Resume_KGuna.pdf',
      previewImageUrl: '/assets/portrait.jpg',
      previewImageAlt: 'Guna Sai Venkata Reddy Kovvuri — Resume',
      sideTitle: 'One-page snapshot of everything above.',
      sideBody: 'This is my current resume — full stack & backend focused, covering my experience at ZenithIndia, the five shipped projects, technical skill set, and education. Click below to view it full-size or download a copy.',
      downloadPdfUrl: '/assets/Guna_Sai_Resume.pdf',
      downloadButtonLabel: 'Download Full Resume',
      openFullSizeLabel: 'View in Full Window',
      highlights: [
        {
          icon: '💼',
          label: 'Currently:',
          details: 'Full Stack Developer Intern @ ZenithIndia (Jul 2026 → Present)',
        },
        {
          icon: '🎓',
          label: 'Education:',
          details: 'B.Tech Mechanical Engineering, NIT Delhi — CGPA 8.04/10.0',
        },
        {
          icon: '🛠️',
          label: 'Core stack:',
          details: 'React.js, Node.js, Express.js, MongoDB, PostgreSQL, Redis, RAG/LLM pipelines',
        },
        {
          icon: '📈',
          label: 'Shipped:',
          details: '5 production projects across web, Android, and Windows desktop',
        },
      ],
    },
  });

  const contactBlock = ContactBlockSchema.parse({
    id: 'sec-contact',
    type: 'contact',
    schemaVersion: 1,
    isVisible: true,
    order: 7,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '07',
      sectionTitle: 'Contact',
      headline: "Let's build something.",
      bgWord: 'HELLO',
      subtext: "I'm actively looking for internship opportunities where I can contribute, learn, and ship meaningful work. Whether it's a role, collaboration, or just a conversation — reach out.",
      contactLinks: [
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
      ],
      infoCards: [
        {
          id: 'info-status',
          title: 'Currently',
          body: 'Full Stack Developer Intern at ZenithIndia, and 2nd year B.Tech at NIT Delhi. Building full-stack, mobile, and AI-powered projects, and open to further internships starting Summer 2026.',
        },
        {
          id: 'info-looking',
          title: "What I'm looking for",
          body: 'Backend-focused or full-stack roles where I can work on real systems — APIs, databases, queues, auth, AI pipelines — not just UI tasks.',
        },
        {
          id: 'info-tech',
          title: 'Tech I enjoy most',
          body: 'Node.js · MongoDB · PostgreSQL · Redis · SQLite · Pinecone · Groq LLM · Electron — anything involving system design, scalable architecture, or AI features.',
        },
      ],
    },
  });

  const formBlock = FormBlockSchema.parse({
    id: 'sec-form',
    type: 'form',
    schemaVersion: 1,
    isVisible: true,
    order: 8,
    layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
    style: { showGlow: true },
    content: {
      sectionNum: '08',
      sectionTitle: 'Send a Message',
      headline: 'Get in touch.',
      subtitle: 'Leave a message or project inquiry and I will get back to you promptly.',
      formSlug: 'contact-form',
    },
  });

  const allSections = [
    heroBlock,
    aboutBlock,
    experienceBlock,
    projectsBlock,
    educationBlock,
    highlightsBlock,
    resumeBlock,
    contactBlock,
    formBlock,
  ];

  // 6. Upsert and Publish Home Page on MongoDB Atlas
  const homePage = await PageModel.findOneAndUpdate(
    { siteId: 'gunasai-in', slug: 'home' },
    {
      siteId: 'gunasai-in',
      slug: 'home',
      title: 'Home',
      status: 'published',
      draftRevision: 1,
      publishedRevision: 1,
      draftSections: allSections,
      publishedSections: allSections,
      seo: {
        title: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
        description: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.',
        metaDescription: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.',
        ogImage: '/assets/portrait.jpg',
      },
    },
    { upsert: true, new: true }
  );

  await PageVersionModel.create({
    siteId: 'gunasai-in',
    pageId: homePage._id.toString(),
    revision: 1,
    kind: 'published',
    schemaVersion: 1,
    title: homePage.title,
    slug: homePage.slug,
    sections: allSections,
    seo: homePage.seo,
    createdBy: 'atlas-authentic-seeder',
  });

  console.log(`\n🎉 AUTHENTIC PORTFOLIO DATA COMPLETELY SEEDED AND PUBLISHED ON ATLAS!`);
  console.log(`Page:               Home (${homePage._id.toString()})`);
  console.log(`Status:             ${homePage.status.toUpperCase()}`);
  console.log(`Revision:           v${homePage.publishedRevision}`);
  console.log(`Sections Seeded:    ${allSections.length}`);
  console.log(`Projects Count:     ${projectsBlock.content.projects.length} (StudyVault, Finance360, TaskFlowX, Bunk360, WineERP)`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

async function runWithRetry() {
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      console.log(`\nAttempt ${attempt}/12 starting...`);
      await seedComplete();
      console.log('✅ ALL OPERATIONS COMPLETED SUCCESSFULLY ON ATLAS!');
      return;
    } catch (err: any) {
      console.warn(`Attempt ${attempt} encountered error: ${err.message}`);
      await mongoose.disconnect().catch(() => {});
      if (attempt < 12) {
        console.log('Retrying in 1.5 seconds...');
        await new Promise(r => setTimeout(r, 1500));
      } else {
        throw err;
      }
    }
  }
}

runWithRetry().catch(err => {
  console.error('❌ Seeding failed after 12 attempts:', err);
  process.exit(1);
});


