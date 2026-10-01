/**
 * settlementService.js
 *
 * Handles the actual ledger debit + credit, wrapped in a MongoDB session
 * transaction so either BOTH updates commit or neither does.
 *
 * This is the equivalent of Spring's @Transactional + JPA optimistic locking.
 * MongoDB multi-document transactions (replica-set or mongos required) give the
 * same "all or nothing" guarantee.
 *
 * NOTE: For local dev with a standalone mongod (not a replica set) MongoDB
 * transactions are not available. The code falls back to non-transactional
 * sequential writes (acceptable for a demo; production must use a replica set
 * or Atlas).
 */

import mongoose from 'mongoose';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

/**
 * Settle a payment instruction against the ledger.
 *
 * @param {object} instruction  - Decrypted PaymentInstruction
 * @param {string} packetHash   - SHA-256 hex of the ciphertext (idempotency key)
 * @param {string} bridgeNodeId - ID of the mesh node that delivered the packet
 * @param {number} hopCount     - How many devices the packet traversed
 * @returns {object} Saved Transaction document
 */
export async function settle(instruction, packetHash, bridgeNodeId, hopCount) {
  const { senderVpa, receiverVpa, amount: rawAmount, signedAt } = instruction;
  const amount = parseFloat(rawAmount);

  if (amount <= 0) throw new Error('Amount must be positive');

  // Use a MongoDB session/transaction if the server supports it (replica set)
  const supportsTransactions = mongoose.connection.readyState === 1 &&
    !!mongoose.connection.client?.topology?.description?.type &&
    mongoose.connection.client.topology.description.type !== 'Single';

  if (supportsTransactions) {
    return _settleWithSession(senderVpa, receiverVpa, amount, signedAt, packetHash, bridgeNodeId, hopCount);
  } else {
    // Standalone mongod — sequential writes (demo-acceptable)
    return _settleDirect(senderVpa, receiverVpa, amount, signedAt, packetHash, bridgeNodeId, hopCount);
  }
}

async function _settleDirect(senderVpa, receiverVpa, amount, signedAt, packetHash, bridgeNodeId, hopCount) {
  const sender = await Account.findOne({ vpa: senderVpa });
  if (!sender) throw new Error(`Unknown sender VPA: ${senderVpa}`);

  const receiver = await Account.findOne({ vpa: receiverVpa });
  if (!receiver) throw new Error(`Unknown receiver VPA: ${receiverVpa}`);

  const senderBalance = parseFloat(sender.balance.toString());

  if (senderBalance < amount) {
    console.warn(`[Settlement] Insufficient balance: ${senderVpa} has ₹${senderBalance}, tried to send ₹${amount}`);
    return _recordRejected({ senderVpa, receiverVpa, amount, signedAt }, packetHash, bridgeNodeId, hopCount);
  }

  // Debit sender, credit receiver
  await Account.findOneAndUpdate(
    { vpa: senderVpa },
    { $inc: { balance: -amount } }
  );
  await Account.findOneAndUpdate(
    { vpa: receiverVpa },
    { $inc: { balance: amount } }
  );

  const tx = await Transaction.create({
    packetHash,
    senderVpa,
    receiverVpa,
    amount: mongoose.Types.Decimal128.fromString(amount.toString()),
    signedAt: new Date(signedAt),
    settledAt: new Date(),
    bridgeNodeId,
    hopCount,
    status: 'SETTLED',
  });

  console.log(`[Settlement] SETTLED ₹${amount} from ${senderVpa} to ${receiverVpa} (hash=${packetHash.substring(0, 12)}..., bridge=${bridgeNodeId}, hops=${hopCount})`);
  return tx;
}

async function _settleWithSession(senderVpa, receiverVpa, amount, signedAt, packetHash, bridgeNodeId, hopCount) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [sender] = await Account.find({ vpa: senderVpa }).session(session);
    if (!sender) throw new Error(`Unknown sender VPA: ${senderVpa}`);

    const [receiver] = await Account.find({ vpa: receiverVpa }).session(session);
    if (!receiver) throw new Error(`Unknown receiver VPA: ${receiverVpa}`);

    const senderBalance = parseFloat(sender.balance.toString());

    if (senderBalance < amount) {
      console.warn(`[Settlement] Insufficient balance: ${senderVpa} has ₹${senderBalance}, tried ₹${amount}`);
      await session.abortTransaction();
      return _recordRejected({ senderVpa, receiverVpa, amount, signedAt }, packetHash, bridgeNodeId, hopCount);
    }

    await Account.findOneAndUpdate({ vpa: senderVpa }, { $inc: { balance: -amount } }, { session });
    await Account.findOneAndUpdate({ vpa: receiverVpa }, { $inc: { balance: amount } }, { session });

    const [tx] = await Transaction.create([{
      packetHash,
      senderVpa,
      receiverVpa,
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      signedAt: new Date(signedAt),
      settledAt: new Date(),
      bridgeNodeId,
      hopCount,
      status: 'SETTLED',
    }], { session });

    await session.commitTransaction();
    console.log(`[Settlement] SETTLED ₹${amount} from ${senderVpa} to ${receiverVpa} (hash=${packetHash.substring(0, 12)}..., bridge=${bridgeNodeId}, hops=${hopCount})`);
    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function _recordRejected(instruction, packetHash, bridgeNodeId, hopCount) {
  const tx = await Transaction.create({
    packetHash,
    senderVpa: instruction.senderVpa,
    receiverVpa: instruction.receiverVpa,
    amount: mongoose.Types.Decimal128.fromString(instruction.amount.toString()),
    signedAt: new Date(instruction.signedAt),
    settledAt: new Date(),
    bridgeNodeId,
    hopCount,
    status: 'REJECTED',
  });
  return tx;
}
