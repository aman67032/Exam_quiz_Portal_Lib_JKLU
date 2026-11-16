import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many requests, please slow down.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Upload rate limit exceeded. Please wait before uploading again.' },
});

export const previewDownloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many preview/download requests. Please wait a minute and try again.' },
});

export const batchDownloadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Batch download limit reached (max 5 bundles per 10 minutes). Please wait.' },
});

const MAX_CONCURRENT_STREAMS_PER_IP = 5;
const MAX_GLOBAL_CONCURRENT_STREAMS = 60;
export const MAX_ACTIVE_BATCH_ZIPS = 5;

let globalActiveStreams = 0;
let activeBatchZips = 0;
const activeStreamsByIp = new Map();

export function getClientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

export function acquireIpStreamSlot(req, res) {
  if (globalActiveStreams >= MAX_GLOBAL_CONCURRENT_STREAMS) {
    res.status(503).json({
      detail: 'Server is handling peak download traffic. Please retry in a few seconds.',
    });
    return false;
  }
  const ip = getClientIp(req);
  const current = activeStreamsByIp.get(ip) || 0;
  if (current >= MAX_CONCURRENT_STREAMS_PER_IP) {
    res.status(429).json({
      detail: `Maximum ${MAX_CONCURRENT_STREAMS_PER_IP} concurrent previews/downloads allowed at once.`,
    });
    return false;
  }
  globalActiveStreams += 1;
  activeStreamsByIp.set(ip, current + 1);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    globalActiveStreams = Math.max(0, globalActiveStreams - 1);
    const nextCount = (activeStreamsByIp.get(ip) || 1) - 1;
    if (nextCount <= 0) activeStreamsByIp.delete(ip);
    else activeStreamsByIp.set(ip, nextCount);
  };
  res.on('finish', release);
  res.on('close', release);
  return true;
}

export function getBatchZipCount() {
  return activeBatchZips;
}

export function incrementBatchZipCount() {
  activeBatchZips += 1;
}

export function decrementBatchZipCount() {
  activeBatchZips = Math.max(0, activeBatchZips - 1);
}

let totalRequestsHandled = 0;
let activeRequests = 0;

export function trackRequestMetrics(req, res, next) {
  totalRequestsHandled++;
  activeRequests++;
  const isLongRoute =
    req.path.startsWith('/papers/bulk-upload') || req.path.startsWith('/admin/papers/sync');
  res.setTimeout(isLongRoute ? 55000 : 30000, () => {
    if (!res.headersSent) {
      res.status(504).json({ detail: 'Request timed out' });
    }
  });
  res.on('finish', () => {
    activeRequests = Math.max(0, activeRequests - 1);
  });
  next();
}

export function getRequestStats() {
  return { activeRequests, totalRequestsHandled };
}
