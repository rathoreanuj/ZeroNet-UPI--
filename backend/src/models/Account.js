/**
 * Account.js — Mongoose model
 *
 * Simulated bank account. In a real system this lives in the bank's core
 * banking system, not here. For the demo, we own the ledger.
 *
 * Optimistic-concurrency equivalent:
 *   Mongoose's __v (versionKey) provides document versioning. For the
 *   settlement atomic debit/credit we use a MongoDB session + transaction.
 */

import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    vpa: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g. "alice@demo"
    },
    holderName: {
      type: String,
      required: true,
      trim: true,
    },
    balance: {
      type: mongoose.Decimal128,
      required: true,
      get: (v) => parseFloat(v?.toString() ?? '0'),
    },
  },
  {
    timestamps: true,
    versionKey: '__v', // Optimistic-locking fallback (mirrors @Version in JPA)
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export default mongoose.model('Account', accountSchema);
