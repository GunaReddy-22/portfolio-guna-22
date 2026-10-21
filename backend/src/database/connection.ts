import mongoose from 'mongoose';
import { env } from '../config/env.js';

let inMemoryServer: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (env.NODE_ENV === 'test') {
    if (!inMemoryServer) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          inMemoryServer = await MongoMemoryServer.create();
          break;
        } catch (mErr: any) {
          if (attempt === 3) throw mErr;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    const memUri = inMemoryServer.getUri();
    await mongoose.connect(memUri);
    return mongoose;
  }

  let connectionUri = env.MONGODB_URI;
  const isAtlas = connectionUri.includes('+srv') || connectionUri.includes('mongodb.net');

  try {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await mongoose.connect(connectionUri, {
          serverSelectionTimeoutMS: isAtlas ? 15000 : 3000,
          tls: isAtlas ? true : undefined,
          maxPoolSize: isAtlas ? 1 : undefined,
          minPoolSize: isAtlas ? 1 : undefined,
        });
        console.log(`[Database] Connected to MongoDB at ${connectionUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        return mongoose;
      } catch (connErr: any) {
        if (attempt === 4 || !isAtlas) throw connErr;
        console.warn(`[Database] Connection attempt ${attempt} failed (${connErr.message}), retrying in 1.5s...`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    return mongoose;
  } catch (err: any) {
    console.warn(`[Database] Initial MongoDB connection failed: ${err.message}`);

    // If in test or development mode, fallback to in-memory MongoDB
    if (env.NODE_ENV !== 'production') {
      console.log('[Database] Starting in-memory MongoDB server for development/testing...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        inMemoryServer = await MongoMemoryServer.create();
        connectionUri = inMemoryServer.getUri();
        await mongoose.connect(connectionUri);
        console.log(`[Database] Connected to in-memory MongoDB at ${connectionUri}`);
        return mongoose;
      } catch (memErr: any) {
        console.error('[Database] In-memory MongoDB failed to start:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (inMemoryServer) {
    await inMemoryServer.stop();
    inMemoryServer = null;
  }
}

