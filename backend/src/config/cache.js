import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

/**
 * 2-Tier High-Concurrency Cache (L1 In-Memory LRU + L2 Redis Cloud 30MB-Safe)
 * with Singleflight Stampede Protection.
 */
const l1Cache = new LRUCache({
  max: 1500,
  ttl: 60 * 1000,
  allowStale: true,
});

const inFlightRequests = new Map();

let redisClient = null;
let redisConnected = false;
let cacheHits = 0;
let l2RedisHits = 0;
let cacheMisses = 0;
let stampedesPrevented = 0;

const REDIS_URL = process.env.REDIS_URL || '';
const MAX_REDIS_VALUE_BYTES = 120 * 1024; // 120KB max per key to keep 30MB Redis lean

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', async () => {
      redisConnected = true;
      console.log('⚡ [Cache] Connected to Redis Cloud L2 Cache (30MB-Safe Mode)');
      try {
        await redisClient.config('SET', 'maxmemory-policy', 'allkeys-lru');
      } catch {
        // Managed Redis instances may restrict CONFIG SET; safe to ignore
      }
    });

    redisClient.on('error', (err) => {
      redisConnected = false;
      console.warn('⚠️ [Cache] Redis L2 warning (falling back to L1):', err.message);
    });
  } catch (err) {
    console.warn('⚠️ [Cache] Failed to initialize Redis client:', err.message);
  }
}

export async function flushRedisCache() {
  l1Cache.clear();
  if (redisClient && redisConnected) {
    await redisClient.flushall();
  }
}

export async function getOrSetCache(key, ttlMs, fetcher) {
  // 1. Check L1 In-Memory Cache (~0.02ms)
  const cachedL1 = l1Cache.get(key);
  if (cachedL1 !== undefined) {
    cacheHits++;
    return cachedL1;
  }

  // 2. Singleflight Stampede Protection
  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    stampedesPrevented++;
    return existingPromise;
  }

  const promise = (async () => {
    try {
      // 3. Check L2 Redis Cache if connected
      if (redisClient && redisConnected) {
        try {
          const rawL2 = await redisClient.get(`jklu:${key}`);
          if (rawL2) {
            const parsed = JSON.parse(rawL2);
            l1Cache.set(key, parsed, { ttl: ttlMs });
            cacheHits++;
            l2RedisHits++;
            return parsed;
          }
        } catch {}
      }

      // 4. Cache Miss -> Fetch from Neon PostgreSQL / Prisma
      cacheMisses++;
      const freshData = await fetcher();
      l1Cache.set(key, freshData, { ttl: ttlMs });

      // Store in L2 Redis asynchronously if compact (< 120KB) to protect 30MB limit
      if (redisClient && redisConnected && freshData !== undefined) {
        try {
          const serialized = JSON.stringify(freshData);
          if (Buffer.byteLength(serialized, 'utf8') <= MAX_REDIS_VALUE_BYTES) {
            const ttlSeconds = Math.max(5, Math.min(300, Math.round(ttlMs / 1000)));
            redisClient.set(`jklu:${key}`, serialized, 'EX', ttlSeconds).catch(() => {});
          }
        } catch {}
      }

      return freshData;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export function invalidateCachePrefix(prefix) {
  if (!prefix) {
    l1Cache.clear();
    if (redisClient && redisConnected) {
      redisClient.flushdb().catch(() => {});
    }
    return;
  }
  for (const key of l1Cache.keys()) {
    if (key.startsWith(prefix)) {
      l1Cache.delete(key);
    }
  }
  if (redisClient && redisConnected) {
    redisClient
      .keys(`jklu:${prefix}*`)
      .then((keys) => {
        if (keys.length > 0) redisClient.del(...keys).catch(() => {});
      })
      .catch(() => {});
  }
}

export function getCacheMetrics() {
  const total = cacheHits + cacheMisses;
  return {
    l1Entries: l1Cache.size,
    l2RedisConnected: redisConnected,
    l2RedisHits,
    hits: cacheHits,
    misses: cacheMisses,
    hitRatePct: total > 0 ? Number(((cacheHits / total) * 100).toFixed(2)) : 100,
    stampedesPrevented,
    inFlightCount: inFlightRequests.size,
  };
}
