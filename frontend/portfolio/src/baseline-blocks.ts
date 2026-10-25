import { CmsBlock } from './renderers.js';

export const BASELINE_BLOCKS: CmsBlock[] = [
  {
    id: 'sec-hero',
    type: 'hero',
    isVisible: true,
    order: 0,
    content: {
      pillVisible: true,
      pillText: 'Full-Stack & AI Roles',
      pillIsAnnouncement: true,
      pillAnnouncementTag: 'OPEN TO WORK',
      pillAnnouncementIcon: '💼',
      pillAnnouncementStyle: 'amber',
      eyebrowText: 'Full-Stack Developer · AI Builder',
      headlineNameFirst: 'GUNA',
      headlineNameMiddle: 'Sai Venkata Reddy',
      headlineNameLast: 'KOVVURI',
      description:
        'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.',
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
      photoUrl: '/assets/WhatsApp Image 2026-10-25 at 13.20.31.jpeg',
      photoAlt: 'Guna Sai Venkata Reddy Kovvuri',
      badge: {
        enabled: true,
        tag: 'OPEN TO WORK',
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
  },
  {
    id: 'sec-about',
    type: 'about',
    isVisible: true,
    order: 1,
    content: {
      sectionNum: '01',
      sectionTitle: 'About',
      headline: 'Engineered by curiosity.',
      introText: 'I build things that work — fast, secure, and at scale.',
      bodyParagraphs: [
        "As a Mechanical Engineering student at NIT Delhi who codes full-stack, I bring an engineering mindset to software. I'm obsessed with system design, backend architecture, and building products real people use — across web, mobile, and offline desktop.",
        'My toolkit spans the entire MERN stack plus React Native for mobile and Electron for offline desktop apps, with a strong grip on security (JWT, RBAC, cryptographic licensing), queue-driven workflows (BullMQ + Redis), real-time systems (Socket.io), and AI-powered features using RAG architectures with Pinecone, HuggingFace Embeddings, and Groq LLM. I actively practice DSA in C++ to keep problem-solving sharp.',
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
  },
  {
    id: 'sec-experience',
    type: 'experience',
    isVisible: true,
    order: 2,
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
          summary:
            'Developed scalable full-stack web applications using React.js, Node.js, Express.js, MongoDB, and REST APIs.',
          points: [
            'Developed scalable full-stack web applications using React.js, Node.js, Express.js, MongoDB, and REST APIs.',
            'Built production-ready products including ReviewOS, WhatsApp Catalog Builder, Restaurant QR Menu System, Credit Ledger Apps (Udhaar), and offline ERP solutions with RBAC, authentication, and payment integration.',
          ],
        },
      ],
    },
  },
  {
    id: 'sec-projects',
    type: 'projects',
    isVisible: true,
    order: 3,
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
          description:
            'A full-stack EdTech marketplace where users create, share, monetize, and purchase study notes. Features a RAG-powered AI system for semantic search, contextual Q&A, and automated summarization — built with Pinecone vector DB, HuggingFace Embeddings, and Groq LLM.',
          techPills: [
            'React.js',
            'Node.js',
            'Express.js',
            'MongoDB',
            'Pinecone',
            'Groq LLM',
            'HuggingFace',
            'Razorpay',
            'JWT',
            'Cloudinary',
          ],
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
          description:
            'A production-grade multi-tenant fintech platform supporting the complete loan lifecycle — borrower onboarding, employee operations, chit fund management, collections, capital recovery, and subscription-based business workflows.',
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
          description:
            'A real-time task orchestration platform where users submit file-based tasks, workers process them asynchronously, and admins monitor execution through role-based dashboards — all live via WebSockets.',
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
          description:
            'A mobile-first ERP for petrol pump owners that digitizes daily fuel operations — replacing manual registers with a fully offline digital workflow for sales, inventory, inspections, credit customers, and business analytics.',
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
          description:
            'A single-shop, fully offline point-of-sale and inventory system for wine/liquor retail — packaged as a licensed Windows installer with barcode billing, ledgered inventory, and a cryptographic anti-copying activation system.',
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
  },
  {
    id: 'sec-education',
    type: 'education',
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
  },
  {
    id: 'sec-highlights',
    type: 'highlights',
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
          description:
            'Solved 100+ problems on LeetCode using C++ — arrays, hashing, recursion, linked lists, trees, graphs, and dynamic programming.',
        },
        {
          id: 'hl-rag',
          icon: '🤖',
          title: 'AI & RAG Systems',
          description:
            'Built production RAG pipelines using Pinecone vector DB, HuggingFace Embeddings, and Groq LLM for semantic search, Q&A, and AI summarization.',
        },
        {
          id: 'hl-ship',
          icon: '📱',
          title: 'Cross-Platform Shipping',
          description:
            'Shipped real products across web, Android (React Native/Expo), and Windows desktop (Electron) — not just browser demos.',
        },
        {
          id: 'hl-ncc',
          icon: '🎖️',
          title: 'NCC Cadet',
          description:
            'Active NCC Cadet at NIT Delhi — building leadership, discipline, and teamwork skills through regular training.',
        },
        {
          id: 'hl-sec',
          icon: '🔐',
          title: 'Secure by Design',
          description:
            'Proficient in JWT auth, RBAC, and cryptographic licensing (RSA-2048 machine-fingerprint activation) for offline products.',
        },
        {
          id: 'hl-prod',
          icon: '🚀',
          title: 'Shipped to Production',
          description:
            'All five projects are live/deployed — not demos. Real deployments, real architecture decisions, real constraints solved.',
        },
      ],
    },
  },
  {
    id: 'sec-resume',
    type: 'resume',
    isVisible: true,
    order: 6,
    content: {
      sectionNum: '06',
      sectionTitle: 'Resume',
      headline: 'See it on paper.',
      frameLabel: 'Resume_KGuna.pdf',
      previewImageUrl:
        'https://res.cloudinary.com/dzlqe2lvf/image/upload/v1792591891/guna-cms/portfolio/rd0h174mbxmy59fxpcbg.png',
      previewImageAlt: 'Guna Sai Venkata Reddy Kovvuri — Resume',
      sideTitle: 'One-page snapshot of everything above.',
      sideBody:
        'This is my current resume — full stack & backend focused, covering my experience at ZenithIndia, the five shipped projects, technical skill set, and education. Click below to view it full-size.',
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
  },
  {
    id: 'sec-contact',
    type: 'contact',
    isVisible: true,
    order: 7,
    content: {
      sectionNum: '07',
      sectionTitle: 'Contact',
      headline: "Let's build something.",
      bgWord: 'HELLO',
      subtext:
        "I'm actively looking for internship opportunities where I can contribute, learn, and ship meaningful work. Whether it's a role, collaboration, or just a conversation — reach out.",
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
          title: 'Location & Availability',
          body: 'Based in New Delhi, India. Open to both on-site roles in Delhi/NCR, Bengaluru, Hyderabad, and remote worldwide.',
        },
        {
          title: 'What I Bring',
          body: 'Real production experience: shipping full-stack apps, architecting offline-first mobile and desktop software, and deploying RAG pipelines.',
        },
      ],
    },
  },
];
