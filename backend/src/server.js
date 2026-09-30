/**
 * server.js — Entry point for the ZeroNet UPI Node.js backend
 *
 * Responsibilities:
 *   1. Load environment config
 *   2. Connect to MongoDB
 *   3. Seed demo accounts (first run only)
 *   4. Wire up Express middleware and routes
 *   5. Start listening
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import apiRouter from './routes/api.js';
import { seedAccounts } from './services/demoService.js';
import { getKeyPair } from './crypto/serverKeyHolder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT ?? 8080;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/upi_mesh';

// ── App setup ─────────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// ── API routes ────────────────────────────────────────────────────────────────

app.use('/api', apiRouter);

// ── Serve built React frontend (if it exists) ─────────────────────────────────
// The Vite build output lands in ../frontend/dist — serve it from here so
// the Node.js backend can replace Spring Boot as a drop-in, single-process server.

const frontendDist = join(__dirname, '../../frontend/dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback — let React Router handle all non-API routes
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      message: 'ZeroNet UPI Backend (Node.js + MongoDB)',
      hint: 'Run `npm run build` inside the frontend/ folder, then restart, to serve the dashboard here.',
      api: 'All API endpoints available under /api',
    });
  });
}

// ── Boot sequence ─────────────────────────────────────────────────────────────

async function start() {
  try {
    // 1. Generate RSA keypair eagerly (avoids a slow first-request delay)
    getKeyPair();

    // 2. Connect to MongoDB
    console.log(`[Server] Connecting to MongoDB at ${MONGODB_URI} …`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Server] MongoDB connected ✓');

    // 3. Seed demo data
    await seedAccounts();

    // 4. Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n[Server] ZeroNet UPI backend running on http://localhost:${PORT}`);
      console.log('[Server] API docs: http://localhost:' + PORT + '/api/server-key');
      console.log('[Server] Press Ctrl+C to stop\n');
    });
  } catch (err) {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

start();
