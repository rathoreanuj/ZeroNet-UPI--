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
import apiRouter from './routes/api.js';
import { seedAccounts } from './services/demoService.js';
import { getKeyPair } from './crypto/serverKeyHolder.js';

const PORT = process.env.PORT ?? 8080;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/upi_mesh';

// ── App setup ─────────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// ── API routes ────────────────────────────────────────────────────────────────

app.use('/api', apiRouter);

// ── Status & Health check ─────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    message: 'ZeroNet UPI Backend API is running',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    docs: '/api/server-key',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

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
