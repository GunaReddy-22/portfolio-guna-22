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
      console.log(`\n============================================================`);
      console.log(`🚀 Guna CMS Backend API running on http://localhost:${env.PORT}`);
      console.log(`📁 Health Check: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`🌐 Public Site API: http://localhost:${env.PORT}/api/v1/public/site`);
      console.log(`🔒 Admin Auth: http://localhost:${env.PORT}/api/v1/admin/auth/me`);
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

