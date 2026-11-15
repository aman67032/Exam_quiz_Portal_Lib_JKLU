import bcrypt from 'bcryptjs';
import { LRUCache } from 'lru-cache';
import crypto from 'node:crypto';

/**
 * Non-Blocking Async Crypto Engine with Singleflight & Fast-Path LRU Cache.
 * Ensures that 1,000 simultaneous logins never duplicate CPU work or block
 * the Express.js event loop.
 */
const verifiedAuthCache = new LRUCache({
  max: 10000,
  ttl: 5 * 60 * 1000, // 5 minute fast-path cache for verified credentials
});

const inFlightVerifications = new Map();

function getFastKey(password, hash) {
  return crypto.createHash('sha256').update(`${password}:${hash}`).digest('hex');
}

export async function verifyPasswordNonBlocking(password, hash) {
  if (!password || !hash) return false;
  const cacheKey = getFastKey(password, hash);
  const cached = verifiedAuthCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const existing = inFlightVerifications.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      verifiedAuthCache.set(cacheKey, isMatch);
      return isMatch;
    } finally {
      inFlightVerifications.delete(cacheKey);
    }
  })();

  inFlightVerifications.set(cacheKey, promise);
  return promise;
}

export async function hashPasswordNonBlocking(password, rounds = 10) {
  return bcrypt.hash(password, rounds);
}
