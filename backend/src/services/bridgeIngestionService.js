/**
 * bridgeIngestionService.js
 *
 * Orchestrates the full server-side pipeline for one inbound packet from a
 * bridge node:
 *
 *   1. Hash the ciphertext (→ idempotency key)
 *   2. Try to claim that hash in the idempotency cache.
 *      If already claimed: duplicate — drop it.
 *   3. Decrypt the ciphertext with the server's private RSA key.
 *      If decryption fails: tampered or junk — reject.
 *   4. Freshness check — reject if signedAt is too old (replay protection).
 *   5. Hand off to SettlementService for the actual debit/credit.
 *
 * This is a direct port of the Java BridgeIngestionService.
 */

import { hashCiphertext, decrypt } from '../crypto/hybridCrypto.js';
import { claim } from './idempotencyService.js';
import { settle } from './settlementService.js';

const MAX_AGE_MS = parseInt(process.env.PACKET_MAX_AGE_SECONDS ?? '86400', 10) * 1000;

/**
 * @param {object} packet      - MeshPacket { packetId, ttl, createdAt, ciphertext }
 * @param {string} bridgeNodeId
 * @param {number} hopCount
 * @returns {object} IngestResult { outcome, packetHash, reason?, transactionId? }
 */
export async function ingest(packet, bridgeNodeId, hopCount) {
  try {
    const packetHash = hashCiphertext(packet.ciphertext);

    // ── Idempotency gate ──────────────────────────────────────────────────────
    if (!claim(packetHash)) {
      console.log(`[Bridge] DUPLICATE packet ${packetHash.substring(0, 12)}... from bridge ${bridgeNodeId} — dropped`);
      return { outcome: 'DUPLICATE_DROPPED', packetHash, reason: null, transactionId: null };
    }

    // ── Decrypt ───────────────────────────────────────────────────────────────
    let instruction;
    try {
      instruction = decrypt(packet.ciphertext);
    } catch (e) {
      console.warn(`[Bridge] Decryption failed for packet ${packetHash.substring(0, 12)}...: ${e.message}`);
      return { outcome: 'INVALID', packetHash, reason: 'decryption_failed', transactionId: null };
    }

    // ── Freshness check (replay protection) ───────────────────────────────────
    const ageMs = Date.now() - instruction.signedAt;
    if (ageMs > MAX_AGE_MS) {
      console.warn(`[Bridge] Packet ${packetHash.substring(0, 12)}... too old (${Math.round(ageMs / 1000)}s), rejected`);
      return { outcome: 'INVALID', packetHash, reason: 'stale_packet', transactionId: null };
    }
    if (ageMs < -300_000) { // 5-minute clock-skew tolerance
      return { outcome: 'INVALID', packetHash, reason: 'future_dated', transactionId: null };
    }

    // ── Settle ────────────────────────────────────────────────────────────────
    const tx = await settle(instruction, packetHash, bridgeNodeId, hopCount);
    return {
      outcome: tx.status === 'SETTLED' ? 'SETTLED' : 'REJECTED',
      packetHash,
      reason: tx.status === 'REJECTED' ? 'insufficient_balance' : null,
      transactionId: tx._id?.toString(),
    };

  } catch (err) {
    console.error(`[Bridge] Ingestion error: ${err.message}`, err);
    return { outcome: 'INVALID', packetHash: '?', reason: `internal_error: ${err.message}`, transactionId: null };
  }
}
