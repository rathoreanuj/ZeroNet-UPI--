/**
 * demoService.js
 *
 * Simulates what a sender's phone does before going offline:
 *   1. Build a PaymentInstruction with a fresh UUID nonce + current timestamp.
 *   2. Encrypt with the server's RSA public key (hybrid encryption).
 *   3. Wrap in a MeshPacket with TTL.
 *
 * Also seeds the 4 demo accounts into MongoDB on startup.
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '../crypto/hybridCrypto.js';
import { getKeyPair } from '../crypto/serverKeyHolder.js';
import Account from '../models/Account.js';
import mongoose from 'mongoose';

// ── Account seeding ───────────────────────────────────────────────────────────

export async function seedAccounts() {
  const count = await Account.countDocuments();
  if (count === 0) {
    await Account.insertMany([
      { vpa: 'alice@demo', holderName: 'Alice', balance: mongoose.Types.Decimal128.fromString('5000.00') },
      { vpa: 'bob@demo',   holderName: 'Bob',   balance: mongoose.Types.Decimal128.fromString('1000.00') },
      { vpa: 'carol@demo', holderName: 'Carol', balance: mongoose.Types.Decimal128.fromString('2500.00') },
      { vpa: 'dave@demo',  holderName: 'Dave',  balance: mongoose.Types.Decimal128.fromString('500.00')  },
    ]);
    console.log('[Demo] Seeded 4 demo accounts');
  }
}

// ── Packet creation ───────────────────────────────────────────────────────────

/**
 * Simulates the sender's phone creating an encrypted mesh packet.
 *
 * @param {string} senderVpa
 * @param {string} receiverVpa
 * @param {number} amount
 * @param {string} pin          - Plaintext PIN (will be SHA-256 hashed)
 * @param {number} [ttl=5]
 * @returns {object} MeshPacket
 */
export function createPacket(senderVpa, receiverVpa, amount, pin, ttl = 5) {
  const instruction = {
    senderVpa,
    receiverVpa,
    amount,
    pinHash: sha256Hex(pin),
    nonce: uuidv4(),       // UUID — guarantees every payment intent is unique
    signedAt: Date.now(),  // epoch ms — used for freshness / replay protection
  };

  const { publicKey } = getKeyPair();
  const ciphertext = encrypt(instruction, publicKey);

  return {
    packetId: uuidv4(),
    ttl,
    createdAt: Date.now(),
    ciphertext,
  };
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
