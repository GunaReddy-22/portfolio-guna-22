import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { createApp } from './app.js';
import { connectDatabase } from './database/connection.js';
import { env } from './config/env.js';

async function bootstrap() {
  try {
    console.log('[Server] Connecting to database...');
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      const publicUrl = process.env.RENDER_EXTERNAL_URL || (env.NODE_ENV === 'production' ? 'https://api.gunasai.in' : `http://localhost:${env.PORT}`);
      console.log(`\n============================================================`);
      console.log(`🚀 Guna CMS Backend API running on port ${env.PORT}`);
      console.log(`📁 Health Check: ${publicUrl}/api/v1/health`);
      console.log(`🌐 Public Site API: ${publicUrl}/api/v1/public/site`);
      console.log(`🔒 Admin Auth: ${publicUrl}/api/v1/admin/auth/me`);
      console.log(`============================================================\n`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Graceful shutdown initiated...');
      server.close(() => {
        console.log('[Server] HTTP listener closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err: any) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();

