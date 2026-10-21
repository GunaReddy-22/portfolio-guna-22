import express, { Express } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

import { env, isProduction, allowedOrigins } from './config/env.js';
import { requestIdMiddleware, errorHandler } from './middleware/errorHandler.js';
import { validateCsrf } from './middleware/csrf.js';

// Route modules
import publicRoutes from './modules/public/public.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import pagesRoutes from './modules/pages/pages.routes.js';
import themeRoutes from './modules/theme/theme.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import formsRoutes from './modules/forms/forms.routes.js';
import submissionsRoutes from './modules/submissions/submissions.routes.js';
import { renderFeedbackPage } from './modules/public/public.controller.js';

export function createApp(): Express {
  const app = express();

  // Request ID
  app.use(requestIdMiddleware);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://translate.google.com',
            'https://translate.googleapis.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://translate.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: [
            "'self'",
            'data:',
            'https://res.cloudinary.com',
            'https://translate.google.com',
            'https://translate.googleapis.com',
            'https://www.google.com',
          ],
          connectSrc: [
            "'self'",
            'https://translate.googleapis.com',
            'https://api.cloudinary.com',
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Strictly reject wildcard origins
        if (origin === '*' || origin.includes('*')) {
          return callback(null, false);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // In local development/test only, allow any localhost port
        if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-request-id'],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Session Configuration
  const sessionConfig: session.SessionOptions = {
    name: 'guna_cms_sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  // Attach MongoStore reusing active mongoose client or mongoUrl
  if (env.MONGODB_URI && env.NODE_ENV !== 'test') {
    if (mongoose.connection.readyState === 1) {
      sessionConfig.store = MongoStore.create({
        client: mongoose.connection.getClient() as any,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
      });
    } else {
      const isAtlas = env.MONGODB_URI.includes('+srv') || env.MONGODB_URI.includes('mongodb.net');
      sessionConfig.store = MongoStore.create({
        mongoUrl: env.MONGODB_URI,
        mongoOptions: isAtlas ? { tls: true } : undefined,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
      });
    }
  }

  app.use(session(sessionConfig));

  // CSRF validation on mutating admin endpoints
  app.use(validateCsrf);

  // Serve static assets from public_assets and extracted_assets
  const publicAssetsDir = path.resolve(process.cwd(), 'public_assets');
  if (fs.existsSync(publicAssetsDir)) {
    app.use('/assets', express.static(publicAssetsDir));
  }
  const extractedAssetsDir = path.resolve(process.cwd(), 'extracted_assets');
  if (fs.existsSync(extractedAssetsDir)) {
    app.use('/assets', express.static(extractedAssetsDir));
  }

  // Subdomain & Routing Middleware for forms.gunasai.in
  app.use((req, res, next) => {
    const hostHeader = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
    const hostname = hostHeader.split(':')[0].toLowerCase();
    const formsDomain = (env.FORMS_DOMAIN || 'forms.gunasai.in').toLowerCase();

    const isFormsHost =
      hostname === formsDomain ||
      hostname === 'forms.localhost' ||
      hostname.startsWith('forms.');

    (req as any).isFormsDomain = isFormsHost;

    if (isFormsHost) {
      // Allow API and static asset requests through
      if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
        return next();
      }

      // Root access on forms.gunasai.in: redirect to main portfolio or default to app-feedback
      if (req.path === '/' || req.path === '') {
        return res.redirect(302, `${env.FORMS_BASE_URL}/app-feedback`);
      }

      // Match clean slug or /feedback/:slug or /f/:slug
      const slugMatch = req.path.match(/^\/(?:feedback\/|f\/)?([a-zA-Z0-9_-]+)\/?$/);
      if (slugMatch && slugMatch[1] !== 'favicon.ico') {
        req.params = { slug: slugMatch[1] };
        return renderFeedbackPage(req, res, next);
      }
    } else {
      // Main site (gunasai.in): Redirect /feedback/:slug or /f/:slug to forms.gunasai.in
      if (
        (hostname === 'gunasai.in' || hostname === 'www.gunasai.in' || isProduction) &&
        (req.path.startsWith('/feedback/') || req.path.startsWith('/f/'))
      ) {
        const slugMatch = req.path.match(/^\/(?:feedback\/|f\/)([a-zA-Z0-9_-]+)\/?$/);
        if (slugMatch) {
          return res.redirect(301, `${env.FORMS_BASE_URL}/${slugMatch[1]}`);
        }
      }
    }

    next();
  });

  // API v1 Routing
  app.use('/api/v1/public', publicRoutes);
  app.use('/api/v1/admin/auth', authRoutes);
  app.use('/api/v1/admin/pages', pagesRoutes);
  app.use('/api/v1/admin/theme', themeRoutes);
  app.use('/api/v1/admin/settings', settingsRoutes);
  app.use('/api/v1/admin/media', mediaRoutes);
  app.use('/api/v1/admin/forms', formsRoutes);
  app.use('/api/v1/admin/submissions', submissionsRoutes);

  // Standalone Public Feedback Forms (Fallback & direct access)
  app.get(['/feedback/:slug', '/f/:slug', '/forms/:slug/view'], renderFeedbackPage);

  // Legacy health check alias
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Serve Frontend / Admin build if present (e.g. monolithic or local preview)
  const frontendDist = fs.existsSync(path.resolve(process.cwd(), '../frontend/dist'))
    ? path.resolve(process.cwd(), '../frontend/dist')
    : path.resolve(process.cwd(), 'public');

  const adminDist = path.join(frontendDist, 'admin');
  if (fs.existsSync(adminDist)) {
    app.use('/admin', express.static(adminDist));
    app.get('/admin', (req, res) => {
      res.redirect('/admin/');
    });
    app.get('/admin/*', (req, res) => {
      res.sendFile(path.join(adminDist, 'index.html'));
    });
  }

  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
