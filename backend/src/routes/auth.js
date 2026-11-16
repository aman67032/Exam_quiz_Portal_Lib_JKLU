import crypto from 'node:crypto';
import fs from 'node:fs';
import { getDb } from '../config/db.js';
import { getOrSetCache, invalidateCachePrefix, checkRateLimitWindow } from '../config/cache.js';
import { JWT_SECRET } from '../config/env.js';
import { verifyPasswordNonBlocking, hashPasswordNonBlocking } from '../config/cryptoPool.js';
import { signUserToken, formatUserResponse, requireAuth, requireFullAdmin } from '../middleware/auth.js';
import { apiLimiter, authLimiter, uploadLimiter } from '../middleware/rateLimiters.js';
import { userUpload } from '../middleware/uploads.js';
import { createAsyncRouter } from '../utils/routerHelper.js';

const router = createAsyncRouter();
const usedCaptchaIds = new Map();
let idCardColsEnsured = false;

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

router.get('/captcha/challenge', apiLimiter, (_req, res) => {
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

router.post('/login', authLimiter, async (req, res) => {
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

router.post('/admin-login', authLimiter, async (req, res) => {
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

router.post('/register', authLimiter, async (req, res) => {
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
    if (password.length < 6) {
      res.status(400).json({ detail: 'Password must be at least 6 characters' });
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

router.post('/create-admin', requireFullAdmin, async (req, res) => {
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

router.get('/me', requireAuth, async (req, res) => {
  res.json(formatUserResponse(req.user));
});

router.put('/profile', requireAuth, async (req, res) => {
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

router.post('/profile/id-card', requireAuth, uploadLimiter, userUpload.single('file'), async (req, res) => {
  const user = req.user;
  const file = req.file;
  if (!file) {
    res.status(400).json({ detail: 'ID card file is required' });
    return;
  }
  const db = await getDb();
  if (!idCardColsEnsured) {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_data BYTEA, ADD COLUMN IF NOT EXISTS id_card_mime TEXT`);
    idCardColsEnsured = true;
  }
  const fileBuffer = await fs.promises.readFile(file.path);
  const updated = await db.query(
    `UPDATE users SET id_card_path = $1, id_card_data = $2, id_card_mime = $3 WHERE id = $4 RETURNING *`,
    [file.filename, fileBuffer, file.mimetype || 'application/octet-stream', user.id]
  );
  invalidateCachePrefix('admin:');
  invalidateCachePrefix('auth:');
  res.json(formatUserResponse(updated.rows[0]));
});

export default router;
