/**
 * api.js — Express Router
 *
 * REST surface — direct port of Java ApiController.
 *
 * Endpoint groups:
 *   GET  /api/server-key          → RSA public key for simulated senders
 *   POST /api/demo/send           → create + inject a packet (demo helper)
 *   GET  /api/mesh/state          → current virtual device state
 *   POST /api/mesh/gossip         → run one gossip round
 *   POST /api/mesh/flush          → bridge nodes upload to backend (tests idempotency)
 *   POST /api/mesh/reset          → clear all mesh state + idempotency cache
 *   POST /api/bridge/ingest       → THE production endpoint
 *   GET  /api/accounts            → list all accounts (for dashboard)
 *   GET  /api/transactions        → last 20 transactions (for dashboard)
 */

import { Router } from 'express';
import { getPublicKeyBase64 } from '../crypto/serverKeyHolder.js';
import { createPacket, seedAccounts } from '../services/demoService.js';
import * as mesh from '../services/meshSimulatorService.js';
import { ingest } from '../services/bridgeIngestionService.js';
import { size as idempotencySize, clear as idempotencyClear } from '../services/idempotencyService.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

const router = Router();

// ── Server public key ─────────────────────────────────────────────────────────

router.get('/server-key', (_req, res) => {
  res.json({
    publicKey: getPublicKeyBase64(),
    algorithm: 'RSA-2048 / OAEP-SHA256',
    hybridScheme: 'RSA-OAEP encrypts an AES-256-GCM session key',
  });
});

// ── Demo helper ───────────────────────────────────────────────────────────────

/**
 * POST /api/demo/send
 * Body: { senderVpa, receiverVpa, amount, pin, ttl?, startDevice? }
 */
router.post('/demo/send', (req, res) => {
  try {
    const { senderVpa, receiverVpa, amount, pin, ttl, startDevice } = req.body;

    if (!senderVpa || !receiverVpa || amount == null || !pin) {
      return res.status(400).json({ error: 'senderVpa, receiverVpa, amount, pin are required' });
    }

    const packet = createPacket(senderVpa, receiverVpa, parseFloat(amount), pin, ttl ?? 5);
    const device = startDevice ?? 'phone-alice';
    mesh.inject(device, packet);

    res.json({
      packetId: packet.packetId,
      ciphertextPreview: packet.ciphertext.substring(0, 64) + '...',
      ttl: packet.ttl,
      injectedAt: device,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Mesh simulator ────────────────────────────────────────────────────────────

router.get('/mesh/state', (_req, res) => {
  const devices = mesh.getDevices().map(d => ({
    deviceId: d.deviceId,
    hasInternet: d.hasInternet,
    packetCount: d.packetCount(),
    packetIds: d.getHeldPackets().map(p => p.packetId.substring(0, 8)),
  }));
  res.json({ devices, idempotencyCacheSize: idempotencySize() });
});

router.post('/mesh/gossip', (_req, res) => {
  const result = mesh.gossipOnce();
  res.json(result);
});

/**
 * POST /api/mesh/flush
 * "All bridge nodes simultaneously walk outside and get 4G."
 * Tests concurrent idempotency: multiple bridges may hold the same packet.
 */
router.post('/mesh/flush', async (_req, res) => {
  try {
    const uploads = mesh.collectBridgeUploads();

    // Run all ingestions concurrently (equivalent to Java's parallelStream)
    const results = await Promise.all(
      uploads.map(async ({ bridgeNodeId, packet }) => {
        const r = await ingest(packet, bridgeNodeId, 5 - packet.ttl);
        return {
          bridgeNode: bridgeNodeId,
          packetId: packet.packetId.substring(0, 8),
          outcome: r.outcome,
          reason: r.reason ?? '',
          transactionId: r.transactionId ?? null,
        };
      })
    );

    res.json({ uploadsAttempted: uploads.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mesh/reset', (_req, res) => {
  mesh.resetMesh();
  idempotencyClear();
  res.json({ status: 'mesh and idempotency cache cleared' });
});

// ── Production bridge endpoint ────────────────────────────────────────────────

/**
 * POST /api/bridge/ingest
 * Body: MeshPacket { packetId, ttl, createdAt, ciphertext }
 * Headers: X-Bridge-Node-Id, X-Hop-Count
 */
router.post('/bridge/ingest', async (req, res) => {
  try {
    const bridgeNodeId = req.headers['x-bridge-node-id'] ?? 'unknown';
    const hopCount = parseInt(req.headers['x-hop-count'] ?? '0', 10);
    const result = await ingest(req.body, bridgeNodeId, hopCount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard data ────────────────────────────────────────────────────────────

router.get('/accounts', async (_req, res) => {
  try {
    const accounts = await Account.find().sort({ vpa: 1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', async (_req, res) => {
  try {
    const txs = await Transaction.find().sort({ settledAt: -1 }).limit(20);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Seed helper (can also call via POST for test resets) ──────────────────────

router.post('/demo/reset-db', async (_req, res) => {
  try {
    await Account.deleteMany({});
    await Transaction.deleteMany({});
    await seedAccounts();
    res.json({ status: 'Database reset and re-seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
