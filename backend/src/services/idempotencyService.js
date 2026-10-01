/**
 * idempotencyService.js
 *
 * In-memory idempotency cache.
 *
 * In production this would be Redis with SETNX + TTL — exactly the same
 * semantics, just distributed across instances.
 *
 * Contract:
 *   claim(hash) → true  on the FIRST call (this caller wins the settlement race)
 *   claim(hash) → false on every subsequent call (duplicate — drop it)
 *
 * The "atomicity" on a single Node.js instance is guaranteed by the event loop:
 * because Node is single-threaded, two concurrent async calls resolve
 * sequentially through the microtask queue, so Map.has + Map.set is effectively
 * atomic. For a multi-process deployment, swap this for Redis SETNX.
 */

const seen = new Map(); // packetHash → timestamp (ms)

const TTL_MS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS ?? '86400', 10) * 1000;

/**
 * Try to claim a packet hash.
 * @param {string} packetHash
 * @returns {boolean} true if first claim, false if duplicate
 */
export function claim(packetHash) {
  if (seen.has(packetHash)) return false;
  seen.set(packetHash, Date.now());
  return true;
}

export function size() {
  return seen.size;
}

export function clear() {
  seen.clear();
}

// Evict expired entries every minute so the Map doesn't grow forever
setInterval(() => {
  const cutoff = Date.now() - TTL_MS;
  for (const [hash, ts] of seen.entries()) {
    if (ts < cutoff) seen.delete(hash);
  }
}, 60_000);
