import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { STORAGE_PAPERS_DIR, STORAGE_USERS_DIR } from '../config/env.js';

export const paperUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, STORAGE_PAPERS_DIR),
    filename: (_req, file, cb) => {
      const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${Date.now()}_${crypto.randomBytes(3).toString('hex')}_${clean}`);
    },
  }),
  limits: { fileSize: 500 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';
    if (ext === '.pdf' && okMime) return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

export const userUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, STORAGE_USERS_DIR),
    filename: (_req, file, cb) => {
      const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${clean}`);
    },
  }),
  limits: { fileSize: 500 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WEBP, or PDF files are allowed'));
  },
});
