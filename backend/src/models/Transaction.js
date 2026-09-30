/**
 * Transaction.js — Mongoose model
 *
 * Permanent, immutable record of every settled or rejected payment.
 * Once written, never modified — append-only audit log.
 *
 * packetHash is the idempotency key. A unique index at the DB layer acts as
 * a defense-in-depth fallback if the in-memory idempotency cache ever fails
 * (e.g., after a crash+restart). If the cache misses and the same packet
 * reaches settlement twice, the second write will throw a duplicate-key error
 * and be caught before the balance is touched.
 */

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    packetHash: {
      type: String,
      required: true,
      unique: true,   // ← DB-level idempotency guard (mirrors the unique index on JPA entity)
      length: 64,
    },
    senderVpa: {
      type: String,
      required: true,
    },
    receiverVpa: {
      type: String,
      required: true,
    },
    amount: {
      type: mongoose.Decimal128,
      required: true,
      get: (v) => parseFloat(v?.toString() ?? '0'),
    },
    signedAt: {
      type: Date, // When the sender originally signed it (offline)
      required: true,
    },
    settledAt: {
      type: Date, // When the backend processed it
      required: true,
    },
    bridgeNodeId: {
      type: String,
      required: true,
    },
    hopCount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SETTLED', 'REJECTED'],
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export default mongoose.model('Transaction', transactionSchema);
