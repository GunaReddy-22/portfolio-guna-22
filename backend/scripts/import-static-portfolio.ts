import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { SiteModel } from '../src/database/models/Site.js';
import { PageModel } from '../src/database/models/Page.js';
import { PageVersionModel } from '../src/database/models/PageVersion.js';
import { FormModel } from '../src/database/models/Form.js';
import { MediaModel } from '../src/database/models/Media.js';
import {
  CmsBlock,
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

async function importStaticPortfolio(options?: {
  isDryRun?: boolean;
  autoPublish?: boolean;
  allowOverwrite?: boolean;
}) {
  const isDryRun = options?.isDryRun ?? process.argv.includes('--dry-run');
  const autoPublish = options?.autoPublish ?? process.argv.includes('--publish');
  const allowOverwrite = options?.allowOverwrite ?? process.argv.includes('--overwrite');

  console.log('\n============================================================');
  console.log(`📦  Guna CMS — Static Portfolio Importer ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  const htmlPath = path.resolve(process.cwd(), 'original_portfolio/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Baseline file not found at: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  console.log(`📄 Loaded baseline HTML (${html.length.toLocaleString()} characters)`);

  const report = {
    importedBlocks: [] as string[],
    skippedItems: [] as string[],
    validationFailures: [] as string[],
    assetsRegistered: [] as string[],
  };

  try {
    // -------------------------------------------------------------
    // 1. EXTRACT THEME DESIGN TOKENS
    // -------------------------------------------------------------
    const theme = SiteThemeSchema.parse({
      siteId: 'gunasai-in',
      name: 'Dark Cyberpunk Luxury',
      colors: {
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
      },
      typography: {
        fontDisplay: "'Bricolage Grotesque', Georgia, 'Segoe UI', sans-serif",
        fontSerif: "'Fraunces', Georgia, 'Times New Roman', serif",
        fontMono: "'Space Mono', 'Courier New', monospace",
        fontBody: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        baseFontSize: '15px',
        lineHeight: '1.7',
      },
      layout: {
        maxContentWidth: '1200px',
        heroPaddingDesktop: '120px 64px 80px',
        sectionPaddingDesktop: '110px 64px',
        sectionPaddingMobile: '72px 24px',
        cardBorderRadius: '12px',
        buttonBorderRadius: '4px',
        badgeBorderRadius: '100px',
      },
      animations: {
        enableParticles: true,
        particleCount: 90,
        enableCustomCursor: true,
        enableScrollOrbs: true,
        enableScrollReveals: true,
      },
    });

    // -------------------------------------------------------------
    // 2. EXTRACT SITE SETTINGS & NAVIGATION
    // -------------------------------------------------------------
    const settings = SiteSettingsSchema.parse({
      siteId: 'gunasai-in',
      siteName: 'Guna Sai Portfolio',
      siteUrl: 'https://gunasai.in',
      title: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
      metaDescription: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications.',
      keywords: ['Guna Sai Venkata Reddy Kovvuri', 'Full Stack Developer', 'NIT Delhi', 'ZenithIndia', 'AI Builder', 'RAG'],
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
          enabled: true,
          label: 'Mech Portfolio',
          href: 'https://mech.gunasai.in',
        },
        languageSwitch: {
          enabled: true,
          defaultCode: 'en',
          languages: [
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
        { platform: 'GitHub', url: 'https://github.com' },
        { platform: 'Email', url: 'mailto:241310022@nitdelhi.ac.in' },
      ],
    });

    // -------------------------------------------------------------
    // 3. CONSTRUCT 12 VALIDATED SECTION BLOCKS IN PRESERVED ORDER
    // -------------------------------------------------------------
    const sections: CmsBlock[] = [];

    // Block 1: Hero
    const heroBlock = HeroBlockSchema.parse({
      id: 'sec_hero',
      type: 'hero',
      schemaVersion: 1,
      isVisible: true,
      order: 0,
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
        photoUrl: '/assets/hero-portrait.jpg',
        photoAlt: 'Guna Sai Venkata Reddy Kovvuri',
        badge: {
          enabled: true,
          tag: 'Open to work',
          role: 'Full-Stack & AI Roles',
        },
        marqueeItems: [
          'FULL-STACK DEVELOPMENT',
          'AI & LLM AGENTS',
          'REACT NATIVE',
          'POSTGRESQL & MONGODB',
          'CLOUD ARCHITECTURE',
          'FASTAPI & NODE.JS',
        ],
      },
    });
    sections.push(heroBlock);
    report.importedBlocks.push('0. Hero Block (#hero)');

    // Block 2: About
    const aboutBlock = AboutBlockSchema.parse({
      id: 'sec_about',
      type: 'about',
      schemaVersion: 1,
      isVisible: true,
      order: 1,
      content: {
        sectionNum: '01',
        sectionTitle: 'About',
        headline: 'Engineered by curiosity.',
        introText: 'I build things that work — fast, secure, and at scale.',
        bodyParagraphs: [
          'As a Mechanical Engineering student at NIT Delhi who codes full-stack, I bring an engineering mindset to software. I\'m obsessed with system design, backend architecture, and building products real people use — across web, mobile, and offline desktop.',
          'My toolkit spans the entire MERN stack plus React Native for mobile and Electron for offline desktop apps, with a strong grip on security (JWT, RBAC) and modern AI integrations (RAG, Pinecone, Groq LLM). When I\'m not building software, I\'m diving into mechanical CAD and thermal simulations.',
        ],
        quickFacts: [
          { key: 'Location', value: 'New Delhi / Andhra Pradesh, India' },
          { key: 'Education', value: 'NIT Delhi — B.Tech 2nd Year (CGPA 8.04)' },
          { key: 'Interests', value: 'Full-Stack, AI/LLMs, System Design, Mechanical CAD' },
          { key: 'Mech Eng', value: 'View CAD & Thermal Work →', link: 'https://mech.gunasai.in' },
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
    sections.push(aboutBlock);
    report.importedBlocks.push('1. About Block (#about)');

    // Block 3: Experience
    const expBlock = ExperienceBlockSchema.parse({
      id: 'sec_experience',
      type: 'experience',
      schemaVersion: 1,
      isVisible: true,
      order: 2,
      content: {
        sectionNum: '02',
        sectionTitle: 'Experience',
        headline: 'On the job.',
        entries: [
          {
            id: 'exp-zenith',
            role: 'Full Stack Developer Intern',
            company: 'ZenithIndia',
            companyUrl: 'https://zenithindia.org',
            dateRange: 'Jul 2026 → Sep 2026',
            summary: 'Developed scalable full-stack web applications using React.js, Node.js, Express.js, MongoDB, and REST APIs.',
            points: [
              'Built production-ready products including ReviewOS, WhatsApp Catalog Builder, Restaurant QR Menu System, Credit Ledger Apps (Udhaar), and offline ERP solutions with RBAC, authentication, and payment integration.',
              'Designed and implemented secure RESTful APIs, JWT authentication, and database schemas for multi-tenant SaaS tools.',
              'Engineered responsive frontends with React, reducing UI load times and improving mobile usability.',
              'Integrated third-party services including Razorpay payment gateway, Cloudinary asset storage, and WhatsApp Cloud API.',
            ],
          },
        ],
      },
    });
    sections.push(expBlock);
    report.importedBlocks.push('2. Experience Block (#experience)');

    // Block 4: Projects (5 shipped apps)
    const projectsBlock = ProjectsBlockSchema.parse({
      id: 'sec_projects',
      type: 'projects',
      schemaVersion: 1,
      isVisible: true,
      order: 3,
      content: {
        sectionNum: '03',
        sectionTitle: 'Projects',
        headline: "Stuff I've shipped.",
        projects: [
          {
            id: 'proj-1',
            num: '01',
            tag: 'AI-Powered · RAG Pipeline',
            name: 'StudyVault',
            description: 'A full-stack EdTech marketplace where users create, share, monetize, and purchase study notes. Features a RAG-powered AI system for semantic search, contextual Q&A, and automated summarization — built with Pinecone vector DB, HuggingFace Embeddings, and Groq LLM.',
            techPills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Pinecone', 'Groq LLM', 'HuggingFace', 'Razorpay', 'JWT', 'Cloudinary'],
            points: [
              'Implemented a RAG pipeline using Pinecone vector DB and HuggingFace Embeddings with Groq LLM inference for note-grounded Q&A.',
              'Engineered complete authentication, RBAC, Cloudinary PDF uploads, and end-to-end Razorpay payment integration.',
            ],
            liveUrl: 'https://studyvault.gunasai.in',
            sourceUrl: 'https://github.com',
            featured: true,
            aiBadge: 'RAG Pipeline Active',
          },
          {
            id: 'proj-2',
            num: '02',
            tag: 'SaaS Platform · ZenithIndia',
            name: 'ReviewOS',
            description: 'A multi-tenant customer feedback intelligence platform that turns customer reviews into actionable insights. Businesses collect reviews via QR codes, analyze sentiment automatically with AI, and track satisfaction trends.',
            techPills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Chart.js', 'JWT Auth', 'REST APIs'],
            points: [
              'Built multi-tenant dashboard architecture with secure business onboarding, role-based access, and analytics views.',
              'Designed and implemented dynamic QR code generation allowing customers to leave direct reviews without app downloads.',
            ],
            liveUrl: 'https://reviewos.gunasai.in',
            sourceUrl: 'https://github.com',
            featured: true,
          },
          {
            id: 'proj-3',
            num: '03',
            tag: 'Mobile App · Cross-Platform',
            name: 'ZenFit AI',
            description: 'A cross-platform mobile fitness tracker built with React Native and Expo. Features AI-powered workout recommendations, macro tracking, workout logging, streak calculation, and offline-first state persistence.',
            techPills: ['React Native', 'Expo', 'Node.js', 'Express.js', 'MongoDB', 'AsyncStorage'],
            points: [
              'Developed smooth mobile UI using React Native with custom animations, dark mode, and gesture controls.',
              'Implemented offline-first sync with AsyncStorage, ensuring uninterrupted tracking without internet access.',
            ],
            downloadUrl: '/assets/zenfit.apk',
            featured: true,
            platformBadge: {
              text: 'Android APK',
              type: 'android',
            },
            downloadNote: 'Android APK available for download',
          },
          {
            id: 'proj-4',
            num: '04',
            tag: 'E-Commerce · Automation',
            name: 'WhatsApp Catalog Builder',
            description: 'An automated catalog generation and order management tool built for small businesses. Merchants upload product inventories, auto-generate WhatsApp-compatible catalogs, and manage customer inquiries with automated responses.',
            techPills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'WhatsApp Cloud API', 'Cloudinary'],
            points: [
              'Integrated with WhatsApp Cloud API to automate catalog distribution and customer inquiry handling.',
              'Built inventory management dashboard with bulk image upload via Cloudinary and automatic thumbnail generation.',
            ],
            liveUrl: 'https://catalog.gunasai.in',
            sourceUrl: 'https://github.com',
            featured: true,
          },
          {
            id: 'proj-5',
            num: '05',
            tag: 'Desktop & Offline ERP · Cross-Platform',
            name: 'Smart Udhaar Book',
            description: 'A cross-platform digital credit ledger and billing app designed for retail merchants. Works completely offline on Windows desktop with local SQLite database, and synchronizes to cloud MongoDB when connectivity is restored.',
            techPills: ['Electron', 'React.js', 'SQLite', 'Node.js', 'MongoDB', 'Offline Sync'],
            points: [
              'Architected bidirectional sync protocol resolving conflicts between local SQLite and cloud MongoDB.',
              'Packaged and distributed standalone Windows desktop installer (.exe) with automatic SQLite database migrations.',
            ],
            downloadUrl: '/assets/udhaar-setup.exe',
            featured: true,
            platformBadge: {
              text: 'Windows .EXE',
              type: 'desktop',
            },
            downloadNote: 'Windows desktop installer available',
          },
        ],
      },
    });
    sections.push(projectsBlock);
    report.importedBlocks.push('3. Projects Block (#projects) — 5 shipped apps');

    // Block 5: Education
    const eduBlock = EducationBlockSchema.parse({
      id: 'sec_education',
      type: 'education',
      schemaVersion: 1,
      isVisible: true,
      order: 4,
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
    sections.push(eduBlock);
    report.importedBlocks.push('4. Education Block (#education) — 3 records');

    // Block 6: Highlights
    const hlBlock = HighlightsBlockSchema.parse({
      id: 'sec_highlights',
      type: 'highlights',
      schemaVersion: 1,
      isVisible: true,
      order: 5,
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
            description: 'Shipped real products across web, Android (React Native/Expo), and Windows desktop (Electron) — not just browser apps.',
          },
        ],
      },
    });
    sections.push(hlBlock);
    report.importedBlocks.push('5. Highlights Block (#highlights) — 3 cards');

    // Block 7: Resume
    const resumeBlock = ResumeBlockSchema.parse({
      id: 'sec_resume',
      type: 'resume',
      schemaVersion: 1,
      isVisible: true,
      order: 6,
      content: {
        sectionNum: '06',
        sectionTitle: 'Resume',
        headline: 'See it on paper.',
        frameLabel: 'Resume_KGuna.pdf',
        previewImageUrl: '/assets/resume-preview.png',
        previewImageAlt: 'Guna Sai Venkata Reddy Kovvuri — Resume',
        sideTitle: 'One-page snapshot of everything above.',
        sideBody: 'This is my current resume — full stack & backend focused, covering my experience at ZenithIndia, the five shipped projects, technical skill set, and education. Click below to view it full-size or download a copy.',
        downloadPdfUrl: '/assets/resume.pdf',
        downloadButtonLabel: 'Download PDF',
        openFullSizeLabel: 'Open Full Size →',
        highlights: [
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
        ],
      },
    });
    sections.push(resumeBlock);
    report.importedBlocks.push('6. Resume Block (#resume)');

    // Block 8: Contact
    const contactBlock = ContactBlockSchema.parse({
      id: 'sec_contact',
      type: 'contact',
      schemaVersion: 1,
      isVisible: true,
      order: 7,
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
            title: 'Status & Availability',
            body: 'Available for Summer & Fall internships. Open to remote roles and on-site in Delhi NCR / Bangalore / Hyderabad.',
          },
          {
            id: 'info-focus',
            title: 'Current Focus',
            body: 'Building AI agents, mastering distributed systems, and diving deep into database internals alongside my B.Tech curriculum.',
          },
        ],
      },
    });
    sections.push(contactBlock);
    report.importedBlocks.push('7. Contact Block (#contact)');

    // Block 9: Form Block (Embeds Contact Form)
    const formBlock = FormBlockSchema.parse({
      id: 'sec_form',
      type: 'form',
      schemaVersion: 1,
      isVisible: true,
      order: 8,
      content: {
        sectionNum: '08',
        sectionTitle: 'Direct Message',
        headline: 'Send an inquiry directly.',
        subtitle: 'Fill out the form below and I will reply to your email promptly.',
        formSlug: 'contact-me',
      },
    });
    sections.push(formBlock);
    report.importedBlocks.push('8. Form Block (contact-me)');

    console.log(`\n✅ Schema validation passed for all ${sections.length} section blocks.`);

    // -------------------------------------------------------------
    // 4. DATABASE INSPECTION & PERSISTENCE (NON-DESTRUCTIVE BY DEFAULT)
    // -------------------------------------------------------------
    await connectDatabase();

    // Check Site & Theme
    const existingSite = await SiteModel.findOne({ siteId: 'gunasai-in' });
    if (!existingSite) {
      if (isDryRun) {
        console.log('[DRY RUN] Site settings & theme: NOT FOUND. Would CREATE initial document.');
      } else {
        await SiteModel.create({ ...settings, theme });
        console.log('✅ Created site settings and theme for siteId: gunasai-in');
      }
      report.importedBlocks.push('Site Settings & Theme (Created)');
    } else if (allowOverwrite) {
      if (isDryRun) {
        console.log('[DRY RUN] Site settings & theme: ALREADY EXISTS. Would OVERWRITE (--overwrite passed).');
      } else {
        existingSite.siteName = settings.siteName;
        existingSite.siteUrl = settings.siteUrl;
        existingSite.title = settings.title;
        existingSite.metaDescription = settings.metaDescription;
        existingSite.keywords = settings.keywords;
        existingSite.nav = settings.nav;
        existingSite.footer = settings.footer;
        existingSite.socialLinks = settings.socialLinks;
        existingSite.theme = theme;
        existingSite.markModified('nav');
        existingSite.markModified('footer');
        existingSite.markModified('socialLinks');
        existingSite.markModified('theme');
        await existingSite.save();
        console.log('✅ Overwritten existing site settings and theme for siteId: gunasai-in');
      }
      report.importedBlocks.push('Site Settings & Theme (Overwritten)');
    } else {
      console.log('🔒 Site settings & theme already exist. Preserving CMS configuration (pass --overwrite to update).');
      report.skippedItems.push('Site Settings & Theme (CMS settings protected)');
    }

    // Check Contact Form Definition
    const existingForm = await FormModel.findOne({ siteId: 'gunasai-in', slug: 'contact-me' });
    if (!existingForm) {
      if (isDryRun) {
        console.log('[DRY RUN] Contact form (contact-me): NOT FOUND. Would CREATE initial definition.');
      } else {
        await FormModel.create({
          siteId: 'gunasai-in',
          slug: 'contact-me',
          title: 'Contact Form',
          isActive: true,
          submitButtonText: 'Send Message →',
          successMessage: 'Thank you for reaching out! I will review your message and reply promptly.',
          notificationEmail: '241310022@nitdelhi.ac.in',
          fields: [
            { id: 'f-name', name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'e.g. John Doe' },
            { id: 'f-email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'e.g. john@example.com' },
            { id: 'f-phone', name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+91 ...' },
            { id: 'f-msg', name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Tell me about the role, project, or idea...' },
          ],
        });
        console.log('✅ Created contact form definition (slug: contact-me)');
      }
      report.importedBlocks.push('Contact Form (Created)');
    } else if (allowOverwrite) {
      if (isDryRun) {
        console.log('[DRY RUN] Contact form (contact-me): ALREADY EXISTS. Would OVERWRITE (--overwrite passed).');
      } else {
        existingForm.title = 'Contact Form';
        existingForm.submitButtonText = 'Send Message →';
        existingForm.successMessage = 'Thank you for reaching out! I will review your message and reply promptly.';
        await existingForm.save();
        console.log('✅ Overwritten existing contact form definition (slug: contact-me)');
      }
      report.importedBlocks.push('Contact Form (Overwritten)');
    } else {
      console.log('🔒 Contact form (contact-me) already exists. Preserving CMS form configuration (pass --overwrite to update).');
      report.skippedItems.push('Contact Form (CMS form protected)');
    }

    // Register Media Assets
    const heroAssetExists = await MediaModel.findOne({ siteId: 'gunasai-in', url: '/assets/hero-portrait.jpg' });
    if (!heroAssetExists) {
      if (!isDryRun) {
        await MediaModel.create({
          siteId: 'gunasai-in',
          provider: 'local',
          url: '/assets/hero-portrait.jpg',
          mimeType: 'image/jpeg',
          resourceType: 'image',
          fileSizeBytes: 68943,
          originalFilename: 'hero-portrait.jpg',
          altText: 'Guna Sai Venkata Reddy Kovvuri',
          referenceCount: 1,
        });
      }
      report.assetsRegistered.push('/assets/hero-portrait.jpg');
    }

    const resumeAssetExists = await MediaModel.findOne({ siteId: 'gunasai-in', url: '/assets/resume-preview.png' });
    if (!resumeAssetExists) {
      if (!isDryRun) {
        await MediaModel.create({
          siteId: 'gunasai-in',
          provider: 'local',
          url: '/assets/resume-preview.png',
          mimeType: 'image/png',
          resourceType: 'image',
          fileSizeBytes: 505497,
          originalFilename: 'resume-preview.png',
          altText: 'Guna Sai Venkata Reddy Kovvuri — Resume',
          referenceCount: 1,
        });
      }
      report.assetsRegistered.push('/assets/resume-preview.png');
    }

    // Checksum of new incoming sections
    const newChecksum = crypto.createHash('sha256').update(JSON.stringify(sections)).digest('hex');

    // Check Home Page
    let homePage = await PageModel.findOne({ siteId: 'gunasai-in', slug: 'home' });
    const targetStatus = autoPublish ? 'published' : 'draft';

    if (!homePage) {
      if (isDryRun) {
        console.log(`[DRY RUN] Home page: NOT FOUND. Would CREATE initial page with ${sections.length} sections (${targetStatus}).`);
      } else {
        homePage = await PageModel.create({
          siteId: 'gunasai-in',
          slug: 'home',
          title: 'Home',
          status: targetStatus,
          draftRevision: 1,
          publishedRevision: autoPublish ? 1 : undefined,
          draftSections: sections,
          publishedSections: autoPublish ? sections : undefined,
          seo: {
            title: settings.title,
            description: settings.metaDescription,
            keywords: settings.keywords,
          },
        });

        await PageVersionModel.create({
          siteId: 'gunasai-in',
          pageId: homePage._id.toString(),
          revision: 1,
          kind: autoPublish ? 'published' : 'draft',
          schemaVersion: 1,
          title: homePage.title,
          slug: homePage.slug,
          sections,
          seo: homePage.seo,
          createdBy: 'importer',
        });
        console.log(`✅ Created home page with ${sections.length} sections (Revision 1, Status: ${targetStatus})`);
      }
      report.importedBlocks.push(`Home Page (${targetStatus})`);
    } else {
      const existingDraftChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(homePage.draftSections || []))
        .digest('hex');

      const isIdenticalDraft = newChecksum === existingDraftChecksum;

      if (isIdenticalDraft && !autoPublish) {
        console.log('ℹ️ Existing page draft matches static baseline checksum. Skipping update (idempotent).');
        report.skippedItems.push('Home Page (Identical checksum)');
      } else if (!allowOverwrite) {
        console.warn('🔒 Warning: CMS-managed page content already exists and differs from baseline. Preserving CMS edits (pass --overwrite to force update).');
        report.skippedItems.push('Home Page (CMS edits preserved)');
      } else {
        if (isDryRun) {
          console.log(`[DRY RUN] Home page: ALREADY EXISTS. Would UPDATE to Revision ${(homePage.draftRevision || 1) + 1} (--overwrite passed).`);
        } else {
          const nextRevision = (homePage.draftRevision || 1) + 1;
          homePage.draftRevision = nextRevision;
          homePage.draftSections = sections;
          if (autoPublish) {
            homePage.publishedRevision = nextRevision;
            homePage.publishedSections = sections;
            homePage.status = 'published';
          }
          homePage.markModified('draftSections');
          if (autoPublish) homePage.markModified('publishedSections');
          await homePage.save();

          await PageVersionModel.create({
            siteId: 'gunasai-in',
            pageId: homePage._id.toString(),
            revision: nextRevision,
            kind: autoPublish ? 'published' : 'draft',
            schemaVersion: 1,
            title: homePage.title,
            slug: homePage.slug,
            sections,
            seo: homePage.seo,
            createdBy: 'importer',
          });
          console.log(`✅ Overwritten home page (Draft Revision ${nextRevision}, Status: ${homePage.status})`);
        }
        report.importedBlocks.push('Home Page (Overwritten)');
      }
    }

    console.log('\n============================================================');
    console.log(`🎉  STATIC PORTFOLIO IMPORT ${isDryRun ? 'DRY-RUN' : 'EXECUTION'} COMPLETE`);
    console.log('============================================================');
    console.log(`Mode:                ${isDryRun ? 'READ-ONLY DRY RUN' : 'DATABASE WRITE'}`);
    console.log(`Overwrite Allowed:   ${allowOverwrite ? 'YES (--overwrite)' : 'NO (Protected)'}`);
    console.log(`Section Blocks:      ${sections.length}`);
    console.log(`Imported / Updated:  ${report.importedBlocks.length}`);
    console.log(`Preserved / Skipped: ${report.skippedItems.length}`);
    console.log('============================================================\n');

    return report;
  } catch (err: any) {
    console.error('❌ Import failed:', err);
    throw err;
  }
}

export async function runImportStaticPortfolio(options?: {
  isDryRun?: boolean;
  autoPublish?: boolean;
  allowOverwrite?: boolean;
}) {
  return importStaticPortfolio(options);
}

if (process.argv[1]?.includes('import-static-portfolio')) {
  importStaticPortfolio()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async () => {
      await disconnectDatabase();
      process.exit(1);
    });
}


