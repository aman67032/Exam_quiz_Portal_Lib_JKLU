import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';

export const USER_COLS = `id, email, name, password_hash, is_admin, admin_role, age, year, university, department, roll_no, student_id, photo_path, id_card_path, id_verified, verified_by, verified_at, email_verified, admin_feedback, created_at`;

export function signUserToken(user) {
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

export function formatUserResponse(u) {
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

export async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();
    if (decoded.id) {
      const res = await db.query(`SELECT ${USER_COLS} FROM users WHERE id = $1 LIMIT 1`, [decoded.id]);
      if (res.rowCount > 0) return res.rows[0];
    }
    if (decoded.sub) {
      const res = await db.query(`SELECT ${USER_COLS} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
        decoded.sub,
      ]);
      if (res.rowCount > 0) return res.rows[0];
    }
    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ detail: 'Invalid or expired authentication token' });
    return;
  }
  req.user = user;
  next();
}

export async function requireAdminOrStaff(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user || (!user.is_admin && !user.admin_role)) {
    res.status(403).json({ detail: 'Admin or staff privileges required' });
    return;
  }
  req.user = user;
  next();
}

export async function requireFullAdmin(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user || (!user.is_admin && user.admin_role !== 'full_admin')) {
    res.status(403).json({ detail: 'Full admin privileges required' });
    return;
  }
  req.user = user;
  next();
}
