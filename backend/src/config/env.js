import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  console.warn(
    '⚠️ [Security] JWT_SECRET env var is not set; using an ephemeral per-process secret for development.'
  );
  return crypto.randomBytes(32).toString('hex');
}

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

export const JWT_SECRET = resolveJwtSecret();

export const PUBLIC_BASE_URL = (
  process.env.PUBLIC_BASE_URL ||
  (process.env.VERCEL
    ? 'https://paper-portal-588554backend-2nhi.vercel.app'
    : 'http://localhost:8000')
).replace(/\/$/, '');

export const CDN_BASE_URL = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');

export const STORAGE_BASE_DIR = resolveWritableStorageBase();
export const STORAGE_PAPERS_DIR = path.join(STORAGE_BASE_DIR, 'papers');
export const STORAGE_USERS_DIR = path.join(STORAGE_BASE_DIR, 'users');

export const ALLOWED_ORIGINS = new Set(
  [
    'https://exam-quiz-portal-lib-jklu.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ]
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

export function parsePositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}
