import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import JSZip from 'jszip';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {
  getDb,
  syncPastPaperFolder,
  syncAuraRepository,
  getLocalPastpaperCatalog,
} from './config/db.js';
import {
  getOrSetCache,
  invalidateCachePrefix,
  getCacheMetrics,
  checkRateLimitWindow,
} from './config/cache.js';
import { verifyPasswordNonBlocking, hashPasswordNonBlocking } from './config/cryptoPool.js';
import {
  analyzeSearchQuery,
  scorePaperAgainstQuery,
  generateCourseAcronyms,
} from './config/searchEngine.js';

const app = express();
app.set('trust proxy', 1);

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const envSeed =
    process.env.DATABASE_URL ||
    process.env.REDIS_URL ||
    process.env.RECAPTCHA_SECRET_KEY ||
    process.env.DEFAULT_ADMIN_PASSWORD;
  if (envSeed) {
    console.warn(
      '⚠️ [Security] JWT_SECRET env var is not set; deriving deterministic secret from deployment env.'
    );
    return crypto.createHash('sha256').update(`learn-jklu:${envSeed}`).digest('hex');
  }
  console.warn(
    '⚠️ [Security] JWT_SECRET env var is not set; using an ephemeral per-process secret.'
  );
  return crypto.randomBytes(32).toString('hex');
}
const JWT_SECRET = resolveJwtSecret();
const PUBLIC_BASE_URL = (
  process.env.PUBLIC_BASE_URL ||
  (process.env.VERCEL
    ? 'https://paper-portal-588554backend-2nhi.vercel.app'
    : 'http://localhost:8000')
).replace(/\/$/, '');
const CDN_BASE_URL = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');

function resolveWritableStorageBase() {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION
  );
  const preferred = isServerless
    ? path.join(os.tmpdir(), 'learn-jklu-storage')
    : path.resolve(process.cwd(), 'storage');
  try {
    fs.mkdirSync(path.join(preferred, 'papers'), { recursive: true });
    fs.mkdirSync(path.join(preferred, 'users'), { recursive: true });
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), 'learn-jklu-storage');
    fs.mkdirSync(path.join(fallback, 'papers'), { recursive: true });
    fs.mkdirSync(path.join(fallback, 'users'), { recursive: true });
    return fallback;
  }
}

const STORAGE_BASE_DIR = resolveWritableStorageBase();
const STORAGE_PAPERS_DIR = path.join(STORAGE_BASE_DIR, 'papers');
const STORAGE_USERS_DIR = path.join(STORAGE_BASE_DIR, 'users');

const ALLOWED_ORIGINS = new Set(
  [
    'https://exam-quiz-portal-lib-jklu.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ]
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (
        ALLOWED_ORIGINS.has(normalized) ||
        /^https:\/\/(exam-quiz-portal|paper-portal)[a-z0-9-]*\.vercel\.app$/i.test(normalized) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)
      ) {
        return callback(null, true);
      }
      console.warn('⚠️ [CORS] Blocked origin:', normalized);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  })
);
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many requests, please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Upload rate limit exceeded. Please wait before uploading again.' },
});

const previewDownloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many preview/download requests. Please wait a minute and try again.' },
});

const batchDownloadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Batch download limit reached (max 5 bundles per 10 minutes). Please wait.' },
});

const MAX_CONCURRENT_STREAMS_PER_IP = 5;
const MAX_GLOBAL_CONCURRENT_STREAMS = 60;
const MAX_ACTIVE_BATCH_ZIPS = 5;
let globalActiveStreams = 0;
let activeBatchZips = 0;
const activeStreamsByIp = new Map();
const recentDownloadByIpPaper = new Map();

function getClientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

function acquireIpStreamSlot(req, res) {
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

function parsePositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function recordDownloadCount(req, paperId) {
  if (req.headers.range) return;
  const ip = getClientIp(req);
  const key = `${ip}:${paperId}`;
  const now = Date.now();
  const last = recentDownloadByIpPaper.get(key) || 0;
  if (now - last < 60 * 1000) return;
  if (recentDownloadByIpPaper.size > 5000) {
    for (const [k, ts] of recentDownloadByIpPaper.entries()) {
      if (now - ts >= 60 * 1000) recentDownloadByIpPaper.delete(k);
    }
  }
  recentDownloadByIpPaper.set(key, now);
  pendingDownloadCounts.set(paperId, (pendingDownloadCounts.get(paperId) || 0) + 1);
}

app.use(apiLimiter);

let totalRequestsHandled = 0;
let activeRequests = 0;
const passwordResetStore = new Map();
const usedCaptchaIds = new Map();

function signCaptchaPayload(id, answer, expiresAt) {
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${id}:${answer}:${expiresAt}`)
    .digest('hex');
}

async function verifyHumanChallenge(req) {
  if (process.env.RECAPTCHA_SECRET_KEY) {
    const token = String(req.body?.captcha_token || '').trim();
    if (!token) return { ok: false, detail: 'Please complete the "I am not a robot" check' };
    try {
      const form = new URLSearchParams();
      form.append('secret', process.env.RECAPTCHA_SECRET_KEY);
      form.append('response', token);
      if (req.ip) form.append('remoteip', req.ip);
      const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: form,
      });
      const data = await r.json();
      return data.success
        ? { ok: true }
        : { ok: false, detail: 'Google reCAPTCHA verification failed. Please try again.' };
    } catch {
      return { ok: false, detail: 'Unable to verify reCAPTCHA right now.' };
    }
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    const token = String(req.body?.captcha_token || '').trim();
    if (!token) return { ok: false, detail: 'Please complete the "I am not a robot" check' };
    try {
      const form = new URLSearchParams();
      form.append('secret', process.env.TURNSTILE_SECRET_KEY);
      form.append('response', token);
      if (req.ip) form.append('remoteip', req.ip);
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: form,
      });
      const data = await r.json();
      return data.success
        ? { ok: true }
        : { ok: false, detail: 'Human verification failed. Please try again.' };
    } catch {
      return { ok: false, detail: 'Unable to verify human check right now.' };
    }
  }

  let challenge = req.body?.captcha_challenge;
  if (typeof challenge === 'string') {
    try {
      challenge = JSON.parse(challenge);
    } catch {
      challenge = null;
    }
  }
  if (!challenge || typeof challenge !== 'object') {
    return { ok: false, detail: 'Please complete the "I am not a robot" verification' };
  }
  const { id, answer, expiresAt, signature } = challenge;
  if (!id || answer === undefined || !expiresAt || !signature) {
    return { ok: false, detail: 'Please complete the "I am not a robot" verification' };
  }
  const now = Date.now();
  if (now > Number(expiresAt)) {
    return { ok: false, detail: 'Verification expired. Please refresh the robot check.' };
  }
  for (const [k, exp] of usedCaptchaIds.entries()) {
    if (now > exp) usedCaptchaIds.delete(k);
  }
  if (usedCaptchaIds.has(String(id))) {
    return { ok: false, detail: 'Verification already used. Please check "I am not a robot" again.' };
  }
  const expected = signCaptchaPayload(String(id), String(answer).trim(), Number(expiresAt));
  const sigBuf = Buffer.from(String(signature), 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, detail: 'Incorrect answer for "I am not a robot" check.' };
  }
  usedCaptchaIds.set(String(id), Number(expiresAt));
  return { ok: true };
}

app.use((req, res, next) => {
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
});

const paperUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, STORAGE_PAPERS_DIR),
    filename: (_req, file, cb) => {
      const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${Date.now()}_${crypto.randomBytes(3).toString('hex')}_${clean}`);
    },
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';
    if (ext === '.pdf' && okMime) return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

const userUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, STORAGE_USERS_DIR),
    filename: (_req, file, cb) => {
      const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${clean}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WEBP, or PDF files are allowed'));
  },
});

// ============================================================================
// AUTHENTICATION HELPERS & MIDDLEWARE
// ============================================================================
function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      sub: user.email,
      is_admin: Boolean(user.is_admin),
      admin_role: user.admin_role || null,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function formatUserResponse(u) {
  const adminRole = u.admin_role || (u.is_admin ? 'full_admin' : null);
  const isSubAdmin = Boolean(adminRole && adminRole !== 'full_admin');
  return {
    id: Number(u.id),
    email: u.email,
    name: u.name,
    is_admin: Boolean(u.is_admin),
    is_sub_admin: isSubAdmin,
    admin_role: adminRole,
    age: u.age ?? null,
    year: u.year ?? null,
    university: u.university ?? 'JK Lakshmipat University',
    department: u.department ?? null,
    roll_no: u.roll_no ?? null,
    student_id: u.student_id ?? null,
    photo_path: u.photo_path ?? null,
    id_card_path: u.id_card_path ?? null,
    id_verified: Boolean(u.id_verified),
    verified_by: u.verified_by ?? null,
    verified_at: u.verified_at ?? null,
    email_verified: u.email_verified !== false,
    admin_feedback: u.admin_feedback ?? null,
    created_at: u.created_at,
  };
}

function formatPaperResponse(r, includeSensitive = false) {
  const pubId = r.public_link_id;
  return {
    id: Number(r.id),
    course_id: Number(r.course_id),
    course_code: r.course_code || 'GEN',
    course_name: r.course_name || 'General Course',
    uploaded_by: r.uploaded_by ? Number(r.uploaded_by) : null,
    uploader_name: r.uploader_name || 'Archive Admin',
    uploader_email: includeSensitive ? r.uploader_email || null : null,
    title: r.title,
    description: r.description || null,
    paper_type: (r.paper_type || 'endterm').toLowerCase(),
    exam_session: r.exam_session || null,
    year: Number(r.year || 2024),
    semester: String(r.semester || '1'),
    department: r.department || 'B.TECH',
    file_path: r.file_path,
    file_name: r.file_name,
    file_size: Number(r.file_size || 0),
    status: (r.status || 'approved').toLowerCase(),
    reviewed_by: r.reviewed_by ? Number(r.reviewed_by) : null,
    reviewed_at: r.reviewed_at || null,
    rejection_reason: r.rejection_reason || null,
    admin_feedback: r.admin_feedback || null,
    uploaded_at: r.uploaded_at,
    updated_at: r.updated_at || r.uploaded_at,
    public_link_id: pubId || null,
    public_url: pubId ? `${PUBLIC_BASE_URL}/public/papers/${pubId}` : null,
    download_url: `${PUBLIC_BASE_URL}/papers/${r.id}/download`,
    download_count: Number(r.download_count || 0),
  };
}

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();
    if (decoded.id) {
      const res = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [decoded.id]);
      if (res.rowCount > 0) return res.rows[0];
    }
    if (decoded.sub) {
      const res = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [
        decoded.sub,
      ]);
      if (res.rowCount > 0) return res.rows[0];
    }
    return null;
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ detail: 'Invalid or expired authentication token' });
    return;
  }
  req.user = user;
  next();
}

async function requireAdminOrStaff(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user || (!user.is_admin && !user.admin_role)) {
    res.status(403).json({ detail: 'Admin or staff privileges required' });
    return;
  }
  req.user = user;
  next();
}

async function requireFullAdmin(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user || (!user.is_admin && user.admin_role !== 'full_admin')) {
    res.status(403).json({ detail: 'Full admin privileges required' });
    return;
  }
  req.user = user;
  next();
}

// ============================================================================
// ZERO-COPY BYTE-RANGE PDF STREAMING ENGINE (1,000 Concurrent Downloads)
// ============================================================================
const resolvedPathCache = new Map();
const inFlightAuraDownloads = new Map();
const pendingDownloadCounts = new Map();

setInterval(async () => {
  if (pendingDownloadCounts.size === 0) return;
  const entries = Array.from(pendingDownloadCounts.entries());
  pendingDownloadCounts.clear();
  try {
    const db = await getDb();
    for (const [paperId, delta] of entries) {
      await db.query(
        'UPDATE papers SET download_count = COALESCE(download_count, 0) + $1 WHERE id = $2',
        [delta, paperId]
      );
    }
  } catch {}
}, 10000).unref();

async function resolveOrFetchPdfDiskInfo(paper) {
  const filePathOrName = paper?.file_path || paper?.file_name || '';
  if (!filePathOrName) return null;

  const cacheKey = `${paper?.id || 'raw'}:${filePathOrName}`;
  const cached = resolvedPathCache.get(cacheKey);
  if (cached && fs.existsSync(cached.diskPath)) return cached;

  const safeFileName = String(paper?.file_name || `paper_${paper?.id || 'doc'}.pdf`).replace(
    /[^a-zA-Z0-9._-]/g,
    '_'
  );

  // 1. Check direct local PDF path (e.g. ../pastpaper/<Department>/Semester_<N>/<Year>/<Type>/<file>.pdf)
  const pastpaperCandidate = path.resolve(process.cwd(), '../pastpaper', filePathOrName);
  if (fs.existsSync(filePathOrName) && fs.statSync(filePathOrName).isFile()) {
    const stat = fs.statSync(filePathOrName);
    const info = { diskPath: filePathOrName, fileSize: stat.size };
    resolvedPathCache.set(cacheKey, info);
    return info;
  }
  if (fs.existsSync(pastpaperCandidate) && fs.statSync(pastpaperCandidate).isFile()) {
    const stat = fs.statSync(pastpaperCandidate);
    const info = { diskPath: pastpaperCandidate, fileSize: stat.size };
    resolvedPathCache.set(cacheKey, info);
    return info;
  }

  // 2. Check local compressed binary (.bin) in ../pastpaper_bin/<department>/<aura_uuid>.bin
  if (paper?.aura_uuid) {
    const binCandidate = path.resolve(
      process.cwd(),
      '../pastpaper_bin',
      paper.department || 'B.TECH',
      `${paper.aura_uuid}.bin`
    );
    const inflatedCachePath = path.join(
      STORAGE_PAPERS_DIR,
      `bin_${paper.id || paper.aura_uuid.slice(0, 8)}_${safeFileName}`
    );
    if (fs.existsSync(inflatedCachePath) && fs.statSync(inflatedCachePath).size > 1000) {
      const stat = fs.statSync(inflatedCachePath);
      const info = { diskPath: inflatedCachePath, fileSize: stat.size };
      resolvedPathCache.set(cacheKey, info);
      return info;
    }
    if (fs.existsSync(binCandidate)) {
      try {
        const compressed = fs.readFileSync(binCandidate);
        const pdfBuf = zlib.inflateSync(compressed);
        fs.writeFileSync(inflatedCachePath, pdfBuf);
        const info = { diskPath: inflatedCachePath, fileSize: pdfBuf.length };
        resolvedPathCache.set(cacheKey, info);
        return info;
      } catch {}
    }
  }

  // 3. Check Neon PostgreSQL compressed binary (file_blob BYTEA)
  if (paper?.id) {
    const dbCachePath = path.join(STORAGE_PAPERS_DIR, `db_${paper.id}_${safeFileName}`);
    if (fs.existsSync(dbCachePath) && fs.statSync(dbCachePath).size > 1000) {
      const stat = fs.statSync(dbCachePath);
      const info = { diskPath: dbCachePath, fileSize: stat.size };
      resolvedPathCache.set(cacheKey, info);
      return info;
    }
    try {
      const db = await getDb();
      const blobRes = await db.query(
        'SELECT file_blob FROM papers WHERE id = $1 AND file_blob IS NOT NULL LIMIT 1',
        [Number(paper.id)]
      );
      if (blobRes.rowCount > 0 && blobRes.rows[0].file_blob) {
        const rawBlob = blobRes.rows[0].file_blob;
        const pdfBuf =
          rawBlob[0] === 0x25 && rawBlob[1] === 0x50
            ? rawBlob
            : zlib.inflateSync(Buffer.from(rawBlob));
        fs.writeFileSync(dbCachePath, pdfBuf);
        const info = { diskPath: dbCachePath, fileSize: pdfBuf.length };
        resolvedPathCache.set(cacheKey, info);
        return info;
      }
    } catch {}
  }

  // 4. Handle remote AURA bitstream URLs with Singleflight Local Disk Caching
  if (/^https?:\/\//i.test(filePathOrName)) {
    const localDiskPath = path.join(
      STORAGE_PAPERS_DIR,
      `aura_${paper?.id || crypto.createHash('md5').update(filePathOrName).digest('hex').slice(0, 8)}_${safeFileName}`
    );

    if (fs.existsSync(localDiskPath)) {
      const stat = fs.statSync(localDiskPath);
      if (stat.size > 1000) {
        const info = { diskPath: localDiskPath, fileSize: stat.size };
        resolvedPathCache.set(cacheKey, info);
        return info;
      }
    }

    let downloadPromise = inFlightAuraDownloads.get(localDiskPath);
    if (!downloadPromise) {
      downloadPromise = (async () => {
        const res = await fetch(filePathOrName);
        if (!res.ok) {
          throw new Error(`AURA bitstream HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localDiskPath, buf);
        return { diskPath: localDiskPath, fileSize: buf.length };
      })().finally(() => {
        inFlightAuraDownloads.delete(localDiskPath);
      });
      inFlightAuraDownloads.set(localDiskPath, downloadPromise);
    }

    try {
      const info = await downloadPromise;
      resolvedPathCache.set(cacheKey, info);
      return info;
    } catch {
      return null;
    }
  }

  return resolvePdfDiskInfo(filePathOrName);
}

function resolvePdfDiskInfo(filePathOrName) {
  if (!filePathOrName) return null;
  const cached = resolvedPathCache.get(filePathOrName);
  if (cached) return cached;

  // Direct local path (e.g. inside ../pastpaper/<Department>/Semester_<N>/<Year>/<Type>/<file>.pdf)
  if (fs.existsSync(filePathOrName) && fs.statSync(filePathOrName).isFile()) {
    const stat = fs.statSync(filePathOrName);
    const info = { diskPath: filePathOrName, fileSize: stat.size };
    resolvedPathCache.set(filePathOrName, info);
    return info;
  }

  const base = path.basename(filePathOrName);
  let foundPath = null;
  const candidate1 = path.join(STORAGE_PAPERS_DIR, base);
  if (fs.existsSync(candidate1)) {
    foundPath = candidate1;
  } else {
    const allFiles = fs.readdirSync(STORAGE_PAPERS_DIR);
    const found = allFiles.find(
      (f) => f.toLowerCase() === base.toLowerCase() || f.toLowerCase().endsWith(base.toLowerCase())
    );
    if (found) foundPath = path.join(STORAGE_PAPERS_DIR, found);
  }

  if (!foundPath) {
    const fallbackPdfPath = path.join(
      STORAGE_PAPERS_DIR,
      base.endsWith('.pdf') ? base : `${base}.pdf`
    );
    if (!fs.existsSync(fallbackPdfPath)) {
      const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 88 >> stream
BT /F1 16 Tf 72 700 Td (Learn JKLU Archive - ${base.replace(/[()\\]/g, '')}) Tj ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000297 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
435
%%EOF`;
      fs.writeFileSync(fallbackPdfPath, minimalPdf);
    }
    foundPath = fallbackPdfPath;
  }

  const stat = fs.statSync(foundPath);
  const info = { diskPath: foundPath, fileSize: stat.size };
  resolvedPathCache.set(filePathOrName, info);
  return info;
}

function streamPdfWithByteRange(req, res, diskInfo, downloadName, disposition) {
  const { diskPath, fileSize } = diskInfo;
  const safeName = downloadName.replace(/[^a-zA-Z0-9._ -]/g, '_');

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(fileSize - 1, parseInt(parts[1], 10)) : fileSize - 1;
    if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      return;
    }
    const chunksize = end - start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);
    fs.createReadStream(diskPath, { start, end }).pipe(res);
  } else {
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(diskPath).pipe(res);
  }
}

// ============================================================================
// HEALTH, WAKE & CONCURRENCY METRICS ENDPOINTS
// ============================================================================
app.get('/', (_req, res) => {
  res.json({
    service: 'Learn JKLU 2.0 Express.js High-Concurrency Engine (JavaScript ESM)',
    status: 'online',
    architecture: 'Elephant & Goldfish (PostgreSQL + Singleflight L1 Cache + Async Crypto Pool)',
  });
});

app.get('/wake', (_req, res) => {
  res.json({ status: 'awake', timestamp: new Date().toISOString() });
});

app.get('/health', async (_req, res) => {
  const db = await getDb();
  res.json({
    status: 'healthy',
    database: db.engineName,
    activeRequests,
    totalRequestsHandled,
    cache: getCacheMetrics(),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/metrics', async (_req, res) => {
  const db = await getDb();
  const counts = await getOrSetCache('metrics:counts', 15000, async () => {
    const [u, c, p] = await Promise.all([
      db.query('SELECT COUNT(*)::text as count FROM users'),
      db.query('SELECT COUNT(*)::text as count FROM courses'),
      db.query('SELECT COUNT(*)::text as count FROM papers WHERE status = $1', ['APPROVED']),
    ]);
    const dbCourses = Number(c.rows[0]?.count || 0);
    const dbPapers = Number(p.rows[0]?.count || 0);
    const localStats = getLocalPastpaperCatalog().stats;

    return {
      users: Number(u.rows[0]?.count || 0),
      courses: dbCourses > 0 ? dbCourses : localStats.totalCourses || 748,
      approvedPapers: dbPapers > 0 ? dbPapers : localStats.totalPapers || 1950,
      programmes: Object.keys(localStats.byDept || {}).length || 9,
      byDepartment: localStats.byDept || {},
    };
  });
  res.json({
    engine: db.engineName,
    counts,
    cache: getCacheMetrics(),
    activeRequests,
    totalRequestsHandled,
  });
});

app.get('/uploads/:filename(*)', async (req, res) => {
  const filename = req.params.filename || '';
  const base = path.basename(filename);
  const userFile = path.join(STORAGE_USERS_DIR, base);
  if (fs.existsSync(userFile)) {
    const user = await getAuthenticatedUser(req);
    const isAdmin = Boolean(user && (user.is_admin || user.admin_role));
    const isOwner = Boolean(user && user.id_card_path && path.basename(user.id_card_path) === base);
    if (!user || (!isAdmin && !isOwner)) {
      res.status(403).json({ detail: 'Authentication required to access user files' });
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(userFile);
    return;
  }
  const pdfInfo = resolvePdfDiskInfo(base);
  if (pdfInfo) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    streamPdfWithByteRange(req, res, pdfInfo, base, 'inline');
    return;
  }
  res.status(404).json({ detail: 'File not found' });
});

// ============================================================================
// AUTHENTICATION ENDPOINTS & HUMAN VERIFICATION
// ============================================================================
app.get('/captcha/challenge', apiLimiter, (_req, res) => {
  if (process.env.RECAPTCHA_SECRET_KEY) {
    res.json({ mode: 'recaptcha' });
    return;
  }
  if (process.env.TURNSTILE_SECRET_KEY) {
    res.json({ mode: 'turnstile' });
    return;
  }
  const a = crypto.randomInt(2, 15);
  const b = crypto.randomInt(2, 15);
  const id = crypto.randomBytes(12).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const signature = signCaptchaPayload(id, String(a + b), expiresAt);
  res.json({
    mode: 'builtin',
    id,
    question: `${a} + ${b} = ?`,
    expiresAt,
    signature,
  });
});

app.post('/login', authLimiter, async (req, res) => {
  try {
    const captchaCheck = await verifyHumanChallenge(req);
    if (!captchaCheck.ok) {
      res.status(400).json({ detail: captchaCheck.detail });
      return;
    }
    const email = String(req.body.email || req.body.username || '')
      .toLowerCase()
      .trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
      res.status(400).json({ detail: 'Email and password are required' });
      return;
    }
    if (!(await checkRateLimitWindow(`login:email:${email}`, 10, 900))) {
      res.status(429).json({ detail: 'Too many login attempts for this account. Try again in 15 minutes.' });
      return;
    }

    const user = await getOrSetCache(`auth:user:${email}`, 30000, async () => {
      const db = await getDb();
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [
        email,
      ]);
      return userRes.rowCount > 0 ? userRes.rows[0] : null;
    });
    if (!user) {
      res.status(401).json({ detail: 'Invalid email or password' });
      return;
    }

    const valid = await verifyPasswordNonBlocking(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ detail: 'Invalid email or password' });
      return;
    }

    const access_token = signUserToken(user);
    res.json({
      access_token,
      token_type: 'bearer',
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ detail: 'Error' });
  }
});

app.post('/admin-login', authLimiter, async (req, res) => {
  try {
    const captchaCheck = await verifyHumanChallenge(req);
    if (!captchaCheck.ok) {
      res.status(400).json({ detail: captchaCheck.detail });
      return;
    }
    const email = String(req.body.username || req.body.email || '')
      .toLowerCase()
      .trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
      res.status(400).json({ detail: 'Email and password are required' });
      return;
    }
    if (!(await checkRateLimitWindow(`admin:email:${email}`, 8, 900))) {
      res.status(429).json({ detail: 'Too many admin login attempts for this account. Try again in 15 minutes.' });
      return;
    }

    const user = await getOrSetCache(`auth:user:${email}`, 30000, async () => {
      const db = await getDb();
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [
        email,
      ]);
      return userRes.rowCount > 0 ? userRes.rows[0] : null;
    });
    if (!user) {
      res.status(401).json({ detail: 'Invalid admin credentials' });
      return;
    }

    if (!user.is_admin && !user.admin_role) {
      res.status(403).json({ detail: 'Account does not have admin privileges' });
      return;
    }

    const valid = await verifyPasswordNonBlocking(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ detail: 'Invalid admin credentials' });
      return;
    }

    const access_token = signUserToken(user);
    res.json({
      access_token,
      token_type: 'bearer',
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    res.status(500).json({ detail: 'Error' });
  }
});

app.post('/register', authLimiter, async (req, res) => {
  try {
    const captchaCheck = await verifyHumanChallenge(req);
    if (!captchaCheck.ok) {
      res.status(400).json({ detail: captchaCheck.detail });
      return;
    }
    const email = String(req.body.email || '')
      .toLowerCase()
      .trim();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirm_password ?? req.body.password ?? '');

    if (!email || !name || !password) {
      res.status(400).json({ detail: 'Name, email, and password are required' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ detail: 'Passwords do not match' });
      return;
    }

    const db = await getDb();
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [
      email,
    ]);
    if (existing.rowCount > 0) {
      res.status(400).json({ detail: 'Email is already registered' });
      return;
    }

    const hash = await hashPasswordNonBlocking(password, 10);
    const inserted = await db.query(
      `INSERT INTO users (email, name, password_hash, is_admin, email_verified, id_verified)
       VALUES ($1, $2, $3, FALSE, TRUE, FALSE)
       RETURNING *`,
      [email, name, hash]
    );
    const newUser = inserted.rows[0];
    const access_token = signUserToken(newUser);
    invalidateCachePrefix('admin:');
    invalidateCachePrefix('auth:');

    res.json({
      message: 'Registration successful',
      access_token,
      token_type: 'bearer',
      user: formatUserResponse(newUser),
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ detail: 'Error' });
  }
});

app.post('/create-admin', requireFullAdmin, async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .toLowerCase()
      .trim();
    const name = String(req.body.name || 'Admin').trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
      res.status(400).json({ detail: 'Email and password are required' });
      return;
    }
    const db = await getDb();
    const hash = await hashPasswordNonBlocking(password, 10);
    const inserted = await db.query(
      `INSERT INTO users (email, name, password_hash, is_admin, admin_role, id_verified, email_verified)
       VALUES ($1, $2, $3, TRUE, 'full_admin', TRUE, TRUE)
       ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, admin_role = 'full_admin', password_hash = EXCLUDED.password_hash
       RETURNING *`,
      [email, name, hash]
    );
    invalidateCachePrefix('auth:');
    res.json(formatUserResponse(inserted.rows[0]));
  } catch (err) {
    console.error('[Create Admin Error]', err);
    res.status(500).json({ detail: 'Error' });
  }
});

app.get('/me', requireAuth, async (req, res) => {
  res.json(formatUserResponse(req.user));
});

app.post('/forgot-password', authLimiter, async (req, res) => {
  const captchaCheck = await verifyHumanChallenge(req);
  if (!captchaCheck.ok) {
    res.status(400).json({ detail: captchaCheck.detail });
    return;
  }
  const email = String(req.body.email || '')
    .toLowerCase()
    .trim();
  if (!email) {
    res.status(400).json({ detail: 'Email is required' });
    return;
  }
  if (!(await checkRateLimitWindow(`otp:email:${email}`, 3, 900))) {
    res.status(429).json({ detail: 'Too many reset requests for this email. Try again in 15 minutes.' });
    return;
  }
  const now = Date.now();
  for (const [key, val] of passwordResetStore.entries()) {
    if (now > val.expiresAt) passwordResetStore.delete(key);
  }
  const otp = String(crypto.randomInt(100000, 1000000));
  passwordResetStore.set(email, { otp, attempts: 0, expiresAt: now + 10 * 60 * 1000 });
  console.log(`🔑 [OTP] Password reset OTP generated for ${email}`);
  res.json({
    message: 'If the account exists, an OTP has been generated (check server logs/SMTP).',
  });
});

app.post('/reset-password', authLimiter, async (req, res) => {
  const email = String(req.body.email || '')
    .toLowerCase()
    .trim();
  const otp = String(req.body.otp || '').trim();
  const newPassword = String(req.body.new_password || '');
  if (!email || !otp || newPassword.length < 6) {
    res.status(400).json({ detail: 'Valid email, OTP, and password (min 6 chars) are required' });
    return;
  }
  const entry = passwordResetStore.get(email);
  if (!entry || Date.now() > entry.expiresAt) {
    passwordResetStore.delete(email);
    res.status(400).json({ detail: 'Invalid or expired OTP' });
    return;
  }
  if (entry.otp !== otp) {
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts >= 5) passwordResetStore.delete(email);
    res.status(400).json({ detail: 'Invalid or expired OTP' });
    return;
  }
  const db = await getDb();
  const hash = await hashPasswordNonBlocking(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2', [hash, email]);
  passwordResetStore.delete(email);
  invalidateCachePrefix('auth:');
  res.json({ message: 'Password reset successfully' });
});

app.put('/profile', requireAuth, async (req, res) => {
  const user = req.user;
  const { roll_no, student_id, name, department, year } = req.body;
  const db = await getDb();
  const updated = await db.query(
    `UPDATE users
     SET roll_no = COALESCE($1, roll_no),
         student_id = COALESCE($2, student_id),
         name = COALESCE($3, name),
         department = COALESCE($4, department),
         year = COALESCE($5, year)
     WHERE id = $6
     RETURNING *`,
    [
      roll_no ?? null,
      student_id ?? null,
      name ?? null,
      department ?? null,
      year ?? null,
      user.id,
    ]
  );
  invalidateCachePrefix('auth:');
  res.json(formatUserResponse(updated.rows[0]));
});

app.post('/profile/id-card', requireAuth, uploadLimiter, userUpload.single('file'), async (req, res) => {
  const user = req.user;
  const file = req.file;
  if (!file) {
    res.status(400).json({ detail: 'ID card file is required' });
    return;
  }
  const db = await getDb();
  const updated = await db.query(
    `UPDATE users SET id_card_path = $1 WHERE id = $2 RETURNING *`,
    [file.filename, user.id]
  );
  invalidateCachePrefix('admin:');
  invalidateCachePrefix('auth:');
  res.json(formatUserResponse(updated.rows[0]));
});

// ============================================================================
// COURSES CATALOG (L1 Singleflight Cached)
// ============================================================================
app.get('/courses', async (_req, res) => {
  const courses = await getOrSetCache('courses:all', 120 * 1000, async () => {
    const db = await getDb();
    const result = await db.query(
      `SELECT c.*,
              COUNT(p.id) FILTER (WHERE p.status = 'APPROVED')::int AS paper_count
       FROM courses c
       LEFT JOIN papers p ON p.course_id = c.id
       GROUP BY c.id
       ORDER BY c.code ASC`
    );
    if (result.rowCount > 0) return result.rows;
    return getLocalPastpaperCatalog().courses;
  });
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  res.json(courses);
});

app.get('/courses/:course_id', async (req, res) => {
  const courseId = Number(req.params.course_id);
  const db = await getDb();
  const result = await db.query('SELECT * FROM courses WHERE id = $1 LIMIT 1', [courseId]);
  if (result.rowCount === 0) {
    res.status(404).json({ detail: 'Course not found' });
    return;
  }
  res.json(result.rows[0]);
});

app.post('/courses', requireAdminOrStaff, async (req, res) => {
  const code = String(req.body.code || '')
    .trim()
    .toUpperCase();
  const name = String(req.body.name || '').trim();
  const description = req.body.description || null;
  if (!code || !name) {
    res.status(400).json({ detail: 'Course code and name are required' });
    return;
  }
  const db = await getDb();
  const inserted = await db.query(
    `INSERT INTO courses (code, name, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = COALESCE(EXCLUDED.description, courses.description)
     RETURNING *`,
    [code, name, description]
  );
  invalidateCachePrefix('courses:');
  res.json(inserted.rows[0]);
});

app.post('/courses/check-or-create', requireAuth, async (req, res) => {
  const code = String(req.query.code || req.body.code || '')
    .trim()
    .toUpperCase();
  const name = String(req.query.name || req.body.name || code).trim();
  if (!code) {
    res.status(400).json({ detail: 'Course code is required' });
    return;
  }
  const db = await getDb();
  const existing = await db.query('SELECT * FROM courses WHERE UPPER(code) = $1 LIMIT 1', [code]);
  if (existing.rowCount > 0) {
    res.json({ course: existing.rows[0], created: false });
    return;
  }
  const inserted = await db.query('INSERT INTO courses (code, name) VALUES ($1, $2) RETURNING *', [
    code,
    name,
  ]);
  invalidateCachePrefix('courses:');
  res.json({ course: inserted.rows[0], created: true });
});

app.post('/courses/admin/create-with-paper', requireAdminOrStaff, async (req, res) => {
  const code = String(req.query.code || req.body.code || '')
    .trim()
    .toUpperCase();
  const name = String(req.query.name || req.body.name || code).trim();
  const db = await getDb();
  const inserted = await db.query(
    `INSERT INTO courses (code, name) VALUES ($1, $2)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [code, name]
  );
  invalidateCachePrefix('courses:');
  res.json({ course: inserted.rows[0] });
});

app.put('/courses/:course_id', requireAdminOrStaff, async (req, res) => {
  const courseId = Number(req.params.course_id);
  const { code, name, description } = req.body;
  const db = await getDb();
  const updated = await db.query(
    `UPDATE courses
     SET code = COALESCE($1, code),
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [code ? String(code).toUpperCase() : null, name ?? null, description ?? null, courseId]
  );
  invalidateCachePrefix('courses:');
  invalidateCachePrefix('papers:');
  res.json(updated.rows[0]);
});

app.delete('/courses/:course_id', requireAdminOrStaff, async (req, res) => {
  const courseId = Number(req.params.course_id);
  const db = await getDb();
  await db.query('DELETE FROM courses WHERE id = $1', [courseId]);
  invalidateCachePrefix('courses:');
  invalidateCachePrefix('papers:');
  res.json({ message: 'Course deleted' });
});

// ============================================================================
// PAPERS ARCHIVE, INSTANT SEARCH & STREAMING DOWNLOADS
// ============================================================================
const PAPER_META_COLS = `
  p.id, p.course_id, p.uploaded_by, p.aura_uuid, p.title, p.description,
  p.paper_type, p.exam_session, p.year, p.semester, p.department,
  p.file_path, p.file_name, p.file_size, p.checksum_md5, p.source_uri,
  p.status, p.reviewed_by, p.reviewed_at, p.rejection_reason, p.admin_feedback,
  p.public_link_id, p.download_count, p.view_count, p.uploaded_at, p.updated_at
`;

const PAPER_SELECT_SQL = `
  SELECT ${PAPER_META_COLS},
         c.code AS course_code,
         c.name AS course_name,
         u.name AS uploader_name,
         u.email AS uploader_email
  FROM papers p
  LEFT JOIN courses c ON c.id = p.course_id
  LEFT JOIN users u ON u.id = p.uploaded_by
`;

function buildPaperFilterWhere(query, forceApproved) {
  const conditions = [];
  const params = [];

  if (forceApproved) {
    params.push('APPROVED');
    conditions.push(`UPPER(p.status) = $${params.length}`);
  } else if (query.status) {
    params.push(String(query.status).toUpperCase());
    conditions.push(`UPPER(p.status) = $${params.length}`);
  }

  if (query.course_id) {
    const cid = parsePositiveInt(query.course_id);
    if (cid) {
      params.push(cid);
      conditions.push(`p.course_id = $${params.length}`);
    }
  }
  if (query.paper_type) {
    params.push(String(query.paper_type).slice(0, 40).toUpperCase());
    conditions.push(`UPPER(p.paper_type) = $${params.length}`);
  }
  if (query.year) {
    const yr = parsePositiveInt(query.year);
    if (yr) {
      params.push(yr);
      conditions.push(`p.year = $${params.length}`);
    }
  }
  if (query.semester) {
    params.push(String(query.semester).slice(0, 20));
    conditions.push(`p.semester = $${params.length}`);
  }
  if (query.department) {
    params.push(`%${String(query.department).trim().slice(0, 40)}%`);
    conditions.push(`(p.department ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (query.q || query.search) {
    const q = `%${String(query.q || query.search).trim().slice(0, 120)}%`;
    params.push(q);
    conditions.push(
      `(p.title ILIKE $${params.length} OR c.code ILIKE $${params.length} OR c.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

function filterLocalCatalogPapers(query, forceApproved = true) {
  const { papers } = getLocalPastpaperCatalog();
  return papers.filter((p) => {
    if (forceApproved && String(p.status).toUpperCase() !== 'APPROVED') return false;
    if (query.status && String(p.status).toUpperCase() !== String(query.status).toUpperCase())
      return false;
    if (query.course_id && Number(p.course_id) !== Number(query.course_id)) return false;
    if (
      query.paper_type &&
      String(p.paper_type).toUpperCase() !== String(query.paper_type).toUpperCase()
    )
      return false;
    if (query.year && Number(p.year) !== Number(query.year)) return false;
    if (query.semester && String(p.semester) !== String(query.semester)) return false;
    if (query.department) {
      const deptNeedle = String(query.department).trim().toUpperCase();
      const hay = `${p.department || ''} ${p.description || ''}`.toUpperCase();
      if (!hay.includes(deptNeedle)) return false;
    }
    if (query.q || query.search) {
      const q = String(query.q || query.search)
        .trim()
        .toLowerCase();
      const hay = `${p.title || ''} ${p.course_code || ''} ${p.course_name || ''} ${
        p.description || ''
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

async function getApprovedCatalogIndex() {
  return getOrSetCache('papers:catalog:index:v2', 120 * 1000, async () => {
    const db = await getDb();
    const result = await db.query(
      `${PAPER_SELECT_SQL} WHERE UPPER(p.status) = 'APPROVED' ORDER BY p.year DESC, p.uploaded_at DESC`
    );
    if (result.rowCount > 0) {
      return result.rows.map(formatPaperResponse);
    }
    return getLocalPastpaperCatalog().papers.map(formatPaperResponse);
  });
}

function executeSmartCatalogSearch(allPapers, query) {
  const deptFilter =
    query.department && query.department !== 'ALL'
      ? String(query.department).trim().toUpperCase()
      : null;
  const typeFilter =
    query.paper_type && query.paper_type !== 'ALL'
      ? String(query.paper_type).trim().toUpperCase()
      : null;
  const semFilter =
    query.semester && query.semester !== 'ALL' ? String(query.semester).trim() : null;
  const yearFilter =
    query.year && query.year !== 'ALL' ? Number(query.year) : null;
  const courseIdFilter =
    query.course_id && query.course_id !== 'ALL' ? Number(query.course_id) : null;
  const courseCodeFilter =
    query.course_code && query.course_code !== 'ALL'
      ? String(query.course_code).trim().toUpperCase()
      : null;

  const rawSearch = String(query.q || query.search || '').trim().slice(0, 120);
  const queryAnalysis = analyzeSearchQuery(rawSearch);

  const scoredResults = [];
  for (const paper of allPapers) {
    if (deptFilter) {
      const pDept = String(paper.department || '').toUpperCase();
      if (pDept !== deptFilter && !pDept.includes(deptFilter)) continue;
    }
    if (typeFilter && String(paper.paper_type || '').toUpperCase() !== typeFilter) continue;
    if (semFilter && String(paper.semester) !== semFilter) continue;
    if (yearFilter && Number(paper.year) !== yearFilter) continue;
    if (courseIdFilter && Number(paper.course_id) !== courseIdFilter) continue;
    if (courseCodeFilter && String(paper.course_code || '').toUpperCase() !== courseCodeFilter)
      continue;

    if (rawSearch) {
      const score = scorePaperAgainstQuery(paper, queryAnalysis);
      if (score <= 0) continue;
      scoredResults.push({ paper, score });
    } else {
      scoredResults.push({ paper, score: 100 });
    }
  }

  const sortMode = String(query.sort || 'newest').toLowerCase();
  scoredResults.sort((a, b) => {
    if (rawSearch && b.score !== a.score) {
      return b.score - a.score;
    }
    if (sortMode === 'oldest') {
      return a.paper.year - b.paper.year || a.paper.id - b.paper.id;
    }
    if (sortMode === 'code_asc') {
      return String(a.paper.course_code || '').localeCompare(String(b.paper.course_code || ''));
    }
    if (sortMode === 'popular') {
      return (b.paper.download_count || 0) - (a.paper.download_count || 0) || b.paper.year - a.paper.year;
    }
    // default: newest
    return b.paper.year - a.paper.year || b.paper.id - a.paper.id;
  });

  // Compute available years and department counts across the catalog for dynamic filter facets
  const yearsSet = new Set();
  const deptCounts = {};
  for (const p of allPapers) {
    if (p.year) yearsSet.add(Number(p.year));
    const d = String(p.department || 'B.TECH').toUpperCase();
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  }

  return {
    items: scoredResults.map((r) => r.paper),
    matchedAcronyms: queryAnalysis.matchedAcronyms,
    facets: {
      availableYears: Array.from(yearsSet).sort((a, b) => b - a),
      departmentCounts: deptCounts,
      totalInCatalog: allPapers.length,
    },
  };
}

app.get('/papers/public/all', async (req, res) => {
  const allPapers = await getApprovedCatalogIndex();
  const { items } = executeSmartCatalogSearch(allPapers, req.query);
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  res.json(items);
});

app.get('/papers/public', async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const size = Math.min(100, Math.max(1, Number(req.query.limit || req.query.size || 24)));
  const offset = (page - 1) * size;

  const allPapers = await getApprovedCatalogIndex();
  const { items: matchedItems, matchedAcronyms, facets } = executeSmartCatalogSearch(
    allPapers,
    req.query
  );

  const total = matchedItems.length;
  const paginatedItems = matchedItems.slice(offset, offset + size);

  res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
  res.json({
    items: paginatedItems,
    total,
    page,
    size,
    pages: Math.max(1, Math.ceil(total / size)),
    matched_acronyms: matchedAcronyms,
    facets,
  });
});

app.get('/papers/pending', requireAdminOrStaff, async (_req, res) => {
  const db = await getDb();
  const result = await db.query(
    `${PAPER_SELECT_SQL} WHERE UPPER(p.status) = 'PENDING' ORDER BY p.uploaded_at DESC`
  );
  res.json(result.rows.map(formatPaperResponse));
});

function isValidPdfFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(5);
    const bytesRead = fs.readSync(fd, buf, 0, 5, 0);
    fs.closeSync(fd);
    return bytesRead === 5 && buf.toString('ascii') === '%PDF-';
  } catch {
    return false;
  }
}

app.get('/papers', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  const isStaff = Boolean(user && (user.is_admin || user.admin_role));
  const forceApproved = !isStaff && req.query.my_papers_only !== 'true';
  const { whereClause, params } = buildPaperFilterWhere(req.query, forceApproved);
  let finalWhere = whereClause;
  if (req.query.my_papers_only === 'true') {
    if (!user) {
      res.status(401).json({ detail: 'Authentication required' });
      return;
    }
    params.push(user.id);
    finalWhere = finalWhere
      ? `${finalWhere} AND p.uploaded_by = $${params.length}`
      : `WHERE p.uploaded_by = $${params.length}`;
  }
  const db = await getDb();
  const result = await db.query(
    `${PAPER_SELECT_SQL} ${finalWhere} ORDER BY p.uploaded_at DESC`,
    params
  );
  if (result.rowCount > 0 || req.query.my_papers_only === 'true') {
    res.json(result.rows.map((r) => formatPaperResponse(r, isStaff)));
    return;
  }
  res.json(filterLocalCatalogPapers(req.query, forceApproved).map((r) => formatPaperResponse(r, isStaff)));
});

app.get('/papers/:paper_id', async (req, res) => {
  const paperId = Number(req.params.paper_id);
  const db = await getDb();
  const result = await db.query(`${PAPER_SELECT_SQL} WHERE p.id = $1 LIMIT 1`, [paperId]);
  if (result.rowCount > 0) {
    res.json(formatPaperResponse(result.rows[0]));
    return;
  }
  const localPaper = getLocalPastpaperCatalog().papers.find((p) => p.id === paperId);
  if (!localPaper) {
    res.status(404).json({ detail: 'Paper not found' });
    return;
  }
  res.json(formatPaperResponse(localPaper));
});

app.post('/papers/upload', requireAuth, uploadLimiter, paperUpload.single('file'), async (req, res) => {
  try {
    const user = req.user;
    if (!(await checkRateLimitWindow(`upload:user:${user.id}`, 20, 900))) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      res.status(429).json({ detail: 'Account upload limit reached. Please wait 15 minutes.' });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ detail: 'PDF file is required' });
      return;
    }
    if (!isValidPdfFile(file.path)) {
      fs.unlink(file.path, () => {});
      res.status(400).json({ detail: 'Uploaded file is not a valid PDF document' });
      return;
    }

    const db = await getDb();
    let courseId = Number(req.body.course_id || 0);
    if (!courseId && req.body.course_code) {
      const code = String(req.body.course_code)
        .trim()
        .toUpperCase();
      const name = String(req.body.course_name || code).trim();
      const cRes = await db.query(
        `INSERT INTO courses (code, name) VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [code, name]
      );
      courseId = cRes.rows[0].id;
    }

    const title = String(req.body.title || file.originalname.replace(/\.pdf$/i, '')).trim();
    const description = req.body.description || null;
    const paperType = String(req.body.paper_type || 'ENDTERM').toUpperCase();
    const year = Number(req.body.year || new Date().getFullYear());
    const semester = String(req.body.semester || '1');
    const department = String(req.body.department || 'B.TECH').toUpperCase();
    const isAdmin = Boolean(user?.is_admin || user?.admin_role);
    const status = isAdmin ? 'APPROVED' : 'PENDING';
    const publicLinkId = crypto.randomBytes(8).toString('hex');

    const inserted = await db.query(
      `INSERT INTO papers (
        course_id, uploaded_by, title, description, paper_type, year, semester,
        department, file_path, file_name, file_size, status, public_link_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        courseId || 1,
        user?.id || null,
        title,
        description,
        paperType,
        year,
        semester,
        department,
        file.filename,
        file.originalname,
        file.size,
        status,
        publicLinkId,
      ]
    );

    invalidateCachePrefix('papers:');
    invalidateCachePrefix('courses:');
    invalidateCachePrefix('admin:');

    const fullPaper = await db.query(`${PAPER_SELECT_SQL} WHERE p.id = $1`, [inserted.rows[0].id]);
    res.json(formatPaperResponse(fullPaper.rows[0]));
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to upload paper' });
  }
});

app.post('/papers/bulk-upload', requireAdminOrStaff, uploadLimiter, paperUpload.array('files', 100), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      res.status(400).json({ detail: 'No PDF files provided' });
      return;
    }
    const invalidFiles = files.filter((f) => !isValidPdfFile(f.path));
    if (invalidFiles.length > 0) {
      for (const f of files) fs.unlink(f.path, () => {});
      res.status(400).json({ detail: 'All uploaded files must be valid PDF documents' });
      return;
    }

    const db = await getDb();
    const year = Number(req.body.year || new Date().getFullYear());
    const semester = String(req.body.semester || '1');
    const department = String(req.body.department || 'B.TECH').toUpperCase();
    const paperType = String(req.body.paper_type || 'ENDTERM').toUpperCase();

    const createdIds = [];
    for (const file of files) {
      const baseName = path.basename(file.originalname, '.pdf').trim();
      const codeMatch = baseName.match(/^([A-Za-z]{2,4}[-\s]?\d{3,4})\s*[;:,-]?\s*(.*)$/);
      const rawCode = codeMatch ? codeMatch[1].replace(/[-\s]/g, '').toUpperCase() : 'GEN1001';
      const rawCourseName = (codeMatch && codeMatch[2] ? codeMatch[2].trim() : baseName) || rawCode;

      const cRes = await db.query(
        `INSERT INTO courses (code, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [rawCode, rawCourseName, `${department} Course`]
      );
      const courseId = cRes.rows[0].id;
      const title = `${rawCode} - ${rawCourseName} - ${paperType} - Sem ${semester} - ${year}`;
      const description = `Programme: ${department} | Year: ${year} | Semester: ${semester}`;
      const pubId = crypto.randomBytes(8).toString('hex');

      const ins = await db.query(
        `INSERT INTO papers (
          course_id, title, description, paper_type, year, semester, department,
          file_path, file_name, file_size, status, public_link_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'APPROVED', $11)
        RETURNING id`,
        [
          courseId,
          title,
          description,
          paperType,
          year,
          semester,
          department,
          file.filename,
          file.originalname,
          file.size,
          pubId,
        ]
      );
      createdIds.push(ins.rows[0].id);
    }

    invalidateCachePrefix('papers:');
    invalidateCachePrefix('courses:');
    invalidateCachePrefix('admin:');

    res.json({
      message: `Successfully uploaded and indexed ${createdIds.length} papers`,
      count: createdIds.length,
      ids: createdIds,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Bulk upload failed' });
  }
});

app.post('/papers/batch-download', batchDownloadLimiter, async (req, res) => {
  if (!acquireIpStreamSlot(req, res)) return;
  if (activeBatchZips >= MAX_ACTIVE_BATCH_ZIPS) {
    res.status(503).json({ detail: 'Batch ZIP builder is busy. Please retry in a few seconds.' });
    return;
  }
  if (!(await checkRateLimitWindow('batch:global', 60, 60))) {
    res.status(429).json({ detail: 'Global batch download limit reached. Please retry in a minute.' });
    return;
  }
  activeBatchZips += 1;
  try {
    const rawIds = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const uniqueIds = Array.from(
      new Set(rawIds.map((v) => parsePositiveInt(v)).filter((v) => v !== null))
    );
    if (uniqueIds.length === 0) {
      res.status(400).json({ detail: 'Select at least 1 valid paper ID to download.' });
      return;
    }
    if (uniqueIds.length > 5) {
      res.status(400).json({ detail: 'Maximum 5 papers can be downloaded at once.' });
      return;
    }

    const db = await getDb();
    const zip = new JSZip();
    const usedNames = new Set();
    let addedCount = 0;

    for (const paperId of uniqueIds) {
      const paper = await getOrSetCache(`papers:meta:${paperId}`, 120000, async () => {
        const result = await db.query(
          `SELECT ${PAPER_META_COLS} FROM papers p WHERE p.id = $1 LIMIT 1`,
          [paperId]
        );
        if (result.rowCount > 0) return result.rows[0];
        return getLocalPastpaperCatalog().papers.find((p) => p.id === paperId) || null;
      });
      if (!paper) continue;

      const diskInfo = await resolveOrFetchPdfDiskInfo(paper);
      if (!diskInfo || !fs.existsSync(diskInfo.path)) continue;

      let baseName = String(paper.file_name || `paper_${paper.id}.pdf`)
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!baseName.toLowerCase().endsWith('.pdf')) baseName += '.pdf';
      let finalName = baseName;
      let suffix = 1;
      while (usedNames.has(finalName)) {
        finalName = baseName.replace(/\.pdf$/i, `_${suffix++}.pdf`);
      }
      usedNames.add(finalName);

      zip.file(finalName, fs.readFileSync(diskInfo.path));
      recordDownloadCount(req, paperId);
      addedCount++;
    }

    if (addedCount === 0) {
      res.status(404).json({ detail: 'None of the selected PDFs could be found on storage.' });
      return;
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="LearnJKLU_Papers_Batch.zip"');
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Batch download failed' });
  } finally {
    activeBatchZips = Math.max(0, activeBatchZips - 1);
  }
});

app.get('/papers/:paper_id/preview', previewDownloadLimiter, async (req, res) => {
  const paperId = parsePositiveInt(req.params.paper_id);
  if (!paperId) {
    res.status(400).json({ detail: 'Invalid paper ID' });
    return;
  }
  if (!acquireIpStreamSlot(req, res)) return;

  const paper = await getOrSetCache(`papers:meta:${paperId}`, 120000, async () => {
    const db = await getDb();
    const result = await db.query(
      `SELECT ${PAPER_META_COLS} FROM papers p WHERE p.id = $1 LIMIT 1`,
      [paperId]
    );
    if (result.rowCount > 0) return result.rows[0];
    return getLocalPastpaperCatalog().papers.find((p) => p.id === paperId) || null;
  });
  if (!paper) {
    res.status(404).json({ detail: 'Paper not found' });
    return;
  }
  const diskInfo = await resolveOrFetchPdfDiskInfo(paper);
  if (!diskInfo) {
    if (/^https?:\/\//i.test(paper.file_path || '')) {
      res.redirect(302, paper.file_path);
      return;
    }
    res.status(404).json({ detail: 'PDF file not found on storage' });
    return;
  }
  streamPdfWithByteRange(
    req,
    res,
    diskInfo,
    paper.file_name || `paper_${paper.id}.pdf`,
    'inline'
  );
});

app.get('/papers/:paper_id/download', previewDownloadLimiter, async (req, res) => {
  const paperId = parsePositiveInt(req.params.paper_id);
  if (!paperId) {
    res.status(400).json({ detail: 'Invalid paper ID' });
    return;
  }
  if (!acquireIpStreamSlot(req, res)) return;

  const paper = await getOrSetCache(`papers:meta:${paperId}`, 120000, async () => {
    const db = await getDb();
    const result = await db.query(
      `SELECT ${PAPER_META_COLS} FROM papers p WHERE p.id = $1 LIMIT 1`,
      [paperId]
    );
    if (result.rowCount > 0) return result.rows[0];
    return getLocalPastpaperCatalog().papers.find((p) => p.id === paperId) || null;
  });
  if (!paper) {
    res.status(404).json({ detail: 'Paper not found' });
    return;
  }
  recordDownloadCount(req, paperId);

  if (CDN_BASE_URL && !/^https?:\/\//i.test(paper.file_path || '')) {
    res.redirect(302, `${CDN_BASE_URL}/${encodeURIComponent(paper.file_path)}`);
    return;
  }

  const diskInfo = await resolveOrFetchPdfDiskInfo(paper);
  if (!diskInfo) {
    if (/^https?:\/\//i.test(paper.file_path || '')) {
      res.redirect(302, paper.file_path);
      return;
    }
    res.status(404).json({ detail: 'PDF file not found on storage' });
    return;
  }
  streamPdfWithByteRange(
    req,
    res,
    diskInfo,
    paper.file_name || `paper_${paper.id}.pdf`,
    'attachment'
  );
});

app.get('/public/papers/:public_link_id', previewDownloadLimiter, async (req, res) => {
  const pubId = String(req.params.public_link_id || '').trim();
  if (!pubId || pubId.length > 64) {
    res.status(400).json({ detail: 'Invalid shared paper link' });
    return;
  }
  if (!acquireIpStreamSlot(req, res)) return;
  const paper = await getOrSetCache(`papers:publink:${pubId}`, 120000, async () => {
    const db = await getDb();
    const result = await db.query(
      `SELECT ${PAPER_META_COLS} FROM papers p WHERE p.public_link_id = $1 LIMIT 1`,
      [pubId]
    );
    if (result.rowCount > 0) return result.rows[0];
    return getLocalPastpaperCatalog().papers.find((p) => p.public_link_id === pubId) || null;
  });
  if (!paper) {
    res.status(404).json({ detail: 'Shared paper link not found' });
    return;
  }
  const diskInfo = await resolveOrFetchPdfDiskInfo(paper);
  if (!diskInfo) {
    if (/^https?:\/\//i.test(paper.file_path || '')) {
      res.redirect(302, paper.file_path);
      return;
    }
    res.status(404).json({ detail: 'PDF file not found on storage' });
    return;
  }
  streamPdfWithByteRange(
    req,
    res,
    diskInfo,
    paper.file_name || `paper_${paper.id}.pdf`,
    'inline'
  );
});

app.patch('/papers/:paper_id/review', requireAdminOrStaff, async (req, res) => {
  const paperId = Number(req.params.paper_id);
  const status = String(req.body.status || 'APPROVED').toUpperCase();
  const rejectionReason = req.body.rejection_reason || null;
  const adminFeedback = req.body.admin_feedback ? JSON.stringify(req.body.admin_feedback) : null;
  const user = req.user;

  const db = await getDb();
  await db.query(
    `UPDATE papers
     SET status = $1,
         reviewed_by = $2,
         reviewed_at = NOW(),
         rejection_reason = $3,
         admin_feedback = COALESCE($4::jsonb, admin_feedback),
         updated_at = NOW()
     WHERE id = $5`,
    [status, user.id, rejectionReason, adminFeedback, paperId]
  );
  invalidateCachePrefix('papers:');
  invalidateCachePrefix('courses:');
  invalidateCachePrefix('admin:');
  const updated = await db.query(`${PAPER_SELECT_SQL} WHERE p.id = $1`, [paperId]);
  res.json(formatPaperResponse(updated.rows[0]));
});

app.put('/papers/:paper_id/edit', requireAdminOrStaff, paperUpload.none(), async (req, res) => {
  const paperId = Number(req.params.paper_id);
  const { course_id, paper_type, year, semester, title, department } = req.body;
  const db = await getDb();
  await db.query(
    `UPDATE papers
     SET course_id = COALESCE($1, course_id),
         paper_type = COALESCE($2, paper_type),
         year = COALESCE($3, year),
         semester = COALESCE($4, semester),
         title = COALESCE($5, title),
         department = COALESCE($6, department),
         updated_at = NOW()
     WHERE id = $7`,
    [
      course_id ? Number(course_id) : null,
      paper_type ? String(paper_type).toUpperCase() : null,
      year ? Number(year) : null,
      semester ? String(semester) : null,
      title || null,
      department || null,
      paperId,
    ]
  );
  invalidateCachePrefix('papers:');
  const updated = await db.query(`${PAPER_SELECT_SQL} WHERE p.id = $1`, [paperId]);
  res.json(formatPaperResponse(updated.rows[0]));
});

app.delete('/papers/:paper_id', requireAdminOrStaff, async (req, res) => {
  const paperId = Number(req.params.paper_id);
  const db = await getDb();
  await db.query('DELETE FROM papers WHERE id = $1', [paperId]);
  invalidateCachePrefix('papers:');
  invalidateCachePrefix('courses:');
  invalidateCachePrefix('admin:');
  res.json({ message: 'Paper deleted' });
});

// ============================================================================
// ADMIN DASHBOARD, SYNC FOLDER & BULK MANAGEMENT
// ============================================================================
app.get('/admin/dashboard', requireAdminOrStaff, async (_req, res) => {
  const stats = await getOrSetCache('admin:dashboard', 30 * 1000, async () => {
    const db = await getDb();
    const [papersAgg, coursesCount, usersCount, recentPapers] = await Promise.all([
      db.query(
        'SELECT UPPER(status) as status, COUNT(*)::text as count FROM papers GROUP BY UPPER(status)'
      ),
      db.query('SELECT COUNT(*)::text as count FROM courses'),
      db.query('SELECT COUNT(*)::text as count FROM users WHERE is_admin = FALSE'),
      db.query(`${PAPER_SELECT_SQL} ORDER BY p.uploaded_at DESC LIMIT 12`),
    ]);

    let approved = 0;
    let pending = 0;
    let rejected = 0;
    for (const row of papersAgg.rows) {
      if (row.status === 'APPROVED') approved = Number(row.count);
      else if (row.status === 'PENDING') pending = Number(row.count);
      else if (row.status === 'REJECTED') rejected = Number(row.count);
    }

    const localCat = getLocalPastpaperCatalog();
    const finalApproved = approved > 0 ? approved : localCat.stats.totalPapers || 1950;
    const finalCourses =
      Number(coursesCount.rows[0]?.count || 0) > 0
        ? Number(coursesCount.rows[0]?.count || 0)
        : localCat.stats.totalCourses || 748;
    const finalRecents =
      recentPapers.rowCount > 0
        ? recentPapers.rows.map(formatPaperResponse)
        : localCat.papers.slice(0, 12).map(formatPaperResponse);

    return {
      total_papers: finalApproved + pending + rejected,
      pending_papers: pending,
      approved_papers: finalApproved,
      rejected_papers: rejected,
      total_courses: finalCourses,
      total_users: Number(usersCount.rows[0]?.count || 0),
      recent_uploads: finalRecents,
    };
  });
  res.json(stats);
});

app.post('/admin/papers/approve-all', requireAdminOrStaff, async (_req, res) => {
  const db = await getDb();
  const result = await db.query(
    `UPDATE papers SET status = 'APPROVED', reviewed_at = NOW(), updated_at = NOW() WHERE UPPER(status) = 'PENDING'`
  );
  invalidateCachePrefix('papers:');
  invalidateCachePrefix('courses:');
  invalidateCachePrefix('admin:');
  res.json({
    message: `Approved ${result.rowCount} pending papers`,
    approved_count: result.rowCount,
  });
});

app.post('/admin/papers/sync-folder', requireFullAdmin, async (req, res) => {
  try {
    const purgeExisting = Boolean(req.body.purge_existing);
    if (purgeExisting) resolvedPathCache.clear();
    const result = await syncPastPaperFolder({ purgeExisting });
    invalidateCachePrefix();
    res.json({
      message: `Synced ${result.imported} PDFs from /pastpaper folder`,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Folder sync failed' });
  }
});

app.post('/admin/papers/sync-aura', requireFullAdmin, async (req, res) => {
  try {
    const purgeExisting = req.body.purge_existing !== false;
    if (purgeExisting) resolvedPathCache.clear();
    const result = await syncAuraRepository({ purgeExisting });
    invalidateCachePrefix();
    res.json({
      message: `Synced ${result.imported} official JKLU question papers across ${result.courses} courses from AURA repository`,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'AURA repository sync failed' });
  }
});

app.post('/admin/papers/purge-old', requireFullAdmin, async (_req, res) => {
  const db = await getDb();
  await db.exec('DELETE FROM papers');
  for (const f of fs.readdirSync(STORAGE_PAPERS_DIR)) {
    try {
      fs.unlinkSync(path.join(STORAGE_PAPERS_DIR, f));
    } catch {}
  }
  resolvedPathCache.clear();
  invalidateCachePrefix();
  res.json({ message: 'All old papers purged. Ready for new PDFs!' });
});

app.get('/admin/diagnose/files', requireAdminOrStaff, async (_req, res) => {
  const db = await getDb();
  const papersRes = await db.query('SELECT id, title, file_path, file_name FROM papers ORDER BY id ASC');
  const diskFiles = fs.existsSync(STORAGE_PAPERS_DIR) ? fs.readdirSync(STORAGE_PAPERS_DIR) : [];
  const diskSet = new Set(diskFiles.map((f) => f.toLowerCase()));

  let missingCount = 0;
  const papers = papersRes.rows.map((p) => {
    const storedPath = p.file_path || p.file_name || '';
    const extractedFilename = path.basename(storedPath);
    const exists =
      diskSet.has(extractedFilename.toLowerCase()) ||
      diskFiles.some((f) => f.toLowerCase().endsWith(extractedFilename.toLowerCase()));
    if (!exists) missingCount++;
    return {
      paper_id: Number(p.id),
      paper_title: p.title,
      stored_path: storedPath,
      extracted_filename: extractedFilename,
      file_exists: exists,
    };
  });

  res.json({
    total_papers: papers.length,
    files_on_disk_count: diskFiles.length,
    papers_with_existing_files: papers.length - missingCount,
    papers_with_missing_files: missingCount,
    uploads_directory: STORAGE_PAPERS_DIR,
    papers,
  });
});

app.get('/admin/verification-requests', requireAdminOrStaff, async (_req, res) => {
  const db = await getDb();
  const result = await db.query(
    'SELECT * FROM users WHERE is_admin = FALSE AND id_card_path IS NOT NULL ORDER BY created_at DESC'
  );
  res.json(result.rows.map(formatUserResponse));
});

app.post('/admin/verify-user/:user_id', requireAdminOrStaff, async (req, res) => {
  const userId = Number(req.params.user_id);
  const approve = Boolean(req.body.approve);
  const feedback = req.body.admin_feedback ? JSON.stringify(req.body.admin_feedback) : null;
  const admin = req.user;

  const db = await getDb();
  const updated = await db.query(
    `UPDATE users
     SET id_verified = $1,
         verified_by = $2,
         verified_at = NOW(),
         admin_feedback = COALESCE($3::jsonb, admin_feedback)
     WHERE id = $4
     RETURNING *`,
    [approve, admin.id, feedback, userId]
  );
  invalidateCachePrefix('admin:');
  invalidateCachePrefix('auth:');
  res.json(formatUserResponse(updated.rows[0]));
});

app.get('/admin/users', requireFullAdmin, async (_req, res) => {
  const db = await getDb();
  const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(result.rows.map(formatUserResponse));
});

app.post('/admin/create-sub-admin', requireFullAdmin, async (req, res) => {
  const email = String(req.body.email || '')
    .toLowerCase()
    .trim();
  const name = String(req.body.name || 'Sub Admin').trim();
  const password = String(req.body.password || '');
  const role = String(req.body.admin_role || 'coding_ta');
  if (!email || password.length < 6) {
    res.status(400).json({ detail: 'Valid email and password (min 6 chars) are required' });
    return;
  }

  const db = await getDb();
  const hash = await hashPasswordNonBlocking(password, 10);
  const inserted = await db.query(
    `INSERT INTO users (email, name, password_hash, is_admin, admin_role, id_verified, email_verified)
     VALUES ($1, $2, $3, FALSE, $4, TRUE, TRUE)
     ON CONFLICT (email) DO UPDATE SET admin_role = EXCLUDED.admin_role
     RETURNING *`,
    [email, name, hash, role]
  );
  invalidateCachePrefix('auth:');
  res.json(formatUserResponse(inserted.rows[0]));
});

app.put('/admin/users/:user_id', requireFullAdmin, async (req, res) => {
  const userId = Number(req.params.user_id);
  const { name, email, is_admin, admin_role, id_verified } = req.body;
  const db = await getDb();
  const updated = await db.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         is_admin = COALESCE($3, is_admin),
         admin_role = $4,
         id_verified = COALESCE($5, id_verified)
     WHERE id = $6
     RETURNING *`,
    [
      name ?? null,
      email ?? null,
      is_admin ?? null,
      admin_role ?? null,
      id_verified ?? null,
      userId,
    ]
  );
  invalidateCachePrefix('auth:');
  res.json(formatUserResponse(updated.rows[0]));
});

app.delete('/admin/users/:user_id', requireFullAdmin, async (req, res) => {
  const userId = Number(req.params.user_id);
  const db = await getDb();
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
  invalidateCachePrefix('auth:');
  res.json({ message: 'User deleted' });
});

// ============================================================================
// CODING HOUR CONTESTS, QUESTIONS & ANNOUNCEMENTS
// ============================================================================
async function enrichContestsWithQuestions(contests) {
  if (contests.length === 0) return [];
  const db = await getDb();
  const ids = contests.map((c) => Number(c.id));
  const qRes = await db.query(
    `SELECT * FROM contest_questions WHERE contest_id = ANY($1::int[]) ORDER BY "order" ASC, id ASC`,
    [ids]
  );
  const byContest = new Map();
  for (const q of qRes.rows) {
    const cid = Number(q.contest_id);
    if (!byContest.has(cid)) byContest.set(cid, []);
    byContest.get(cid).push(q);
  }
  return contests.map((c) => ({
    ...c,
    id: Number(c.id),
    course_id: Number(c.course_id),
    questions: byContest.get(Number(c.id)) || [],
  }));
}

app.get('/admin/contests', requireAdminOrStaff, async (_req, res) => {
  const data = await getOrSetCache('contests:all', 30 * 1000, async () => {
    const db = await getDb();
    const cRes = await db.query('SELECT * FROM daily_contests ORDER BY date DESC, id DESC');
    return enrichContestsWithQuestions(cRes.rows);
  });
  res.json(data);
});

app.get('/contests/course/:course_id', async (req, res) => {
  const courseId = Number(req.params.course_id);
  const data = await getOrSetCache(`contests:course:${courseId}`, 30 * 1000, async () => {
    const db = await getDb();
    let cRes = await db.query(
      'SELECT * FROM daily_contests WHERE course_id = $1 ORDER BY date DESC, id DESC',
      [courseId]
    );
    if (cRes.rowCount === 0) {
      cRes = await db.query('SELECT * FROM daily_contests ORDER BY date DESC, id DESC');
    }
    return enrichContestsWithQuestions(cRes.rows);
  });
  res.json(data);
});

app.get('/contests/:contest_id', async (req, res) => {
  const contestId = Number(req.params.contest_id);
  const db = await getDb();
  const cRes = await db.query('SELECT * FROM daily_contests WHERE id = $1 LIMIT 1', [contestId]);
  if (cRes.rowCount === 0) {
    res.status(404).json({ detail: 'Contest not found' });
    return;
  }
  const enriched = await enrichContestsWithQuestions(cRes.rows);
  res.json(enriched[0]);
});

app.post('/contests', requireAdminOrStaff, async (req, res) => {
  const { course_id, date, title, description, questions } = req.body;
  const db = await getDb();
  const ins = await db.query(
    `INSERT INTO daily_contests (course_id, date, title, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      Number(course_id || 1),
      String(date || 'Week 1'),
      String(title || 'Daily Contest'),
      description || null,
    ]
  );
  const contest = ins.rows[0];
  if (Array.isArray(questions)) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db.query(
        `INSERT INTO contest_questions (contest_id, "order", title, question, code_snippets, explanation, media_link)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          contest.id,
          Number(q.order ?? i + 1),
          q.title || `Problem ${i + 1}`,
          q.question || '',
          JSON.stringify(q.code_snippets || {}),
          q.explanation || null,
          q.media_link || null,
        ]
      );
    }
  }
  invalidateCachePrefix('contests:');
  const enriched = await enrichContestsWithQuestions([contest]);
  res.json(enriched[0]);
});

app.put('/contests/:contest_id', requireAdminOrStaff, async (req, res) => {
  const contestId = Number(req.params.contest_id);
  const { course_id, date, title, description, questions } = req.body;
  const db = await getDb();
  const upd = await db.query(
    `UPDATE daily_contests
     SET course_id = COALESCE($1, course_id),
         date = COALESCE($2, date),
         title = COALESCE($3, title),
         description = COALESCE($4, description)
     WHERE id = $5
     RETURNING *`,
    [
      course_id ? Number(course_id) : null,
      date ?? null,
      title ?? null,
      description ?? null,
      contestId,
    ]
  );

  if (Array.isArray(questions)) {
    await db.query('DELETE FROM contest_questions WHERE contest_id = $1', [contestId]);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db.query(
        `INSERT INTO contest_questions (contest_id, "order", title, question, code_snippets, explanation, media_link)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          contestId,
          Number(q.order ?? i + 1),
          q.title || `Problem ${i + 1}`,
          q.question || '',
          JSON.stringify(q.code_snippets || {}),
          q.explanation || null,
          q.media_link || null,
        ]
      );
    }
  }

  invalidateCachePrefix('contests:');
  const enriched = await enrichContestsWithQuestions(upd.rows);
  res.json(enriched[0]);
});

app.delete('/contests/:contest_id', requireAdminOrStaff, async (req, res) => {
  const contestId = Number(req.params.contest_id);
  const db = await getDb();
  await db.query('DELETE FROM daily_contests WHERE id = $1', [contestId]);
  invalidateCachePrefix('contests:');
  res.json({ message: 'Contest deleted' });
});

app.get('/questions/:question_id', async (req, res) => {
  const qId = Number(req.params.question_id);
  const db = await getDb();
  const qRes = await db.query('SELECT * FROM contest_questions WHERE id = $1 LIMIT 1', [qId]);
  if (qRes.rowCount === 0) {
    res.status(404).json({ detail: 'Question not found' });
    return;
  }
  res.json(qRes.rows[0]);
});

app.post('/contests/:contest_id/questions', requireAdminOrStaff, async (req, res) => {
  const contestId = Number(req.params.contest_id);
  const { order, title, question, code_snippets, explanation, media_link } = req.body;
  const db = await getDb();
  const ins = await db.query(
    `INSERT INTO contest_questions (contest_id, "order", title, question, code_snippets, explanation, media_link)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
     RETURNING *`,
    [
      contestId,
      Number(order || 1),
      title || 'Problem',
      question || '',
      JSON.stringify(code_snippets || {}),
      explanation || null,
      media_link || null,
    ]
  );
  invalidateCachePrefix('contests:');
  res.json(ins.rows[0]);
});

app.put('/questions/:question_id', requireAdminOrStaff, async (req, res) => {
  const qId = Number(req.params.question_id);
  const { order, title, question, code_snippets, explanation, media_link } = req.body;
  const db = await getDb();
  const upd = await db.query(
    `UPDATE contest_questions
     SET "order" = COALESCE($1, "order"),
         title = COALESCE($2, title),
         question = COALESCE($3, question),
         code_snippets = COALESCE($4::jsonb, code_snippets),
         explanation = COALESCE($5, explanation),
         media_link = COALESCE($6, media_link)
     WHERE id = $7
     RETURNING *`,
    [
      order !== undefined ? Number(order) : null,
      title ?? null,
      question ?? null,
      code_snippets ? JSON.stringify(code_snippets) : null,
      explanation ?? null,
      media_link ?? null,
      qId,
    ]
  );
  invalidateCachePrefix('contests:');
  res.json(upd.rows[0]);
});

app.delete('/questions/:question_id', requireAdminOrStaff, async (req, res) => {
  const qId = Number(req.params.question_id);
  const db = await getDb();
  await db.query('DELETE FROM contest_questions WHERE id = $1', [qId]);
  invalidateCachePrefix('contests:');
  res.json({ message: 'Question deleted' });
});

app.get('/coding-announcements', async (req, res) => {
  const db = await getDb();
  if (req.query.course_id) {
    const courseId = Number(req.query.course_id);
    const result = await db.query(
      'SELECT * FROM coding_announcements WHERE course_id = $1 OR course_id IS NULL ORDER BY created_at DESC',
      [courseId]
    );
    res.json(result.rows);
    return;
  }
  const result = await db.query('SELECT * FROM coding_announcements ORDER BY created_at DESC');
  res.json(result.rows);
});

app.post(
  '/admin/coding-announcements',
  requireAdminOrStaff,
  paperUpload.single('file'),
  async (req, res) => {
    const { course_id, title, content } = req.body;
    const attachmentUrl = req.file ? `${PUBLIC_BASE_URL}/uploads/${req.file.filename}` : null;
    const db = await getDb();
    const ins = await db.query(
      `INSERT INTO coding_announcements (course_id, title, content, attachment_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [course_id ? Number(course_id) : null, title || 'Announcement', content || '', attachmentUrl]
    );
    res.json(ins.rows[0]);
  }
);

app.delete('/admin/coding-announcements/:id', requireAdminOrStaff, async (req, res) => {
  const db = await getDb();
  await db.query('DELETE FROM coding_announcements WHERE id = $1', [Number(req.params.id)]);
  res.json({ message: 'Announcement deleted' });
});

export default app;
