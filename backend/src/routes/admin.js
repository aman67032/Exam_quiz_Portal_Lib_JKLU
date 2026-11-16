import fs from 'node:fs';
import path from 'node:path';
import {
  getDb,
  syncPastPaperFolder,
  syncAuraRepository,
  getLocalPastpaperCatalog,
} from '../config/db.js';
import { getOrSetCache, invalidateCachePrefix } from '../config/cache.js';
import { STORAGE_PAPERS_DIR } from '../config/env.js';
import { hashPasswordNonBlocking } from '../config/cryptoPool.js';
import { formatUserResponse, requireAdminOrStaff, requireFullAdmin } from '../middleware/auth.js';
import { clearResolvedPathCache } from '../utils/pdfStorage.js';
import { PAPER_SELECT_SQL, formatPaperResponse } from '../utils/paperHelpers.js';
import { createAsyncRouter } from '../utils/routerHelper.js';

const router = createAsyncRouter();

router.get('/dashboard', requireAdminOrStaff, async (_req, res) => {
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

router.post('/papers/approve-all', requireAdminOrStaff, async (_req, res) => {
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

router.post('/papers/sync-folder', requireFullAdmin, async (req, res) => {
  try {
    const purgeExisting = Boolean(req.body.purge_existing);
    if (purgeExisting) clearResolvedPathCache();
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

router.post('/papers/sync-aura', requireFullAdmin, async (req, res) => {
  try {
    const purgeExisting = req.body.purge_existing !== false;
    if (purgeExisting) clearResolvedPathCache();
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

router.post('/papers/purge-old', requireFullAdmin, async (_req, res) => {
  const db = await getDb();
  await db.exec('DELETE FROM papers');
  for (const f of fs.readdirSync(STORAGE_PAPERS_DIR)) {
    try {
      fs.unlinkSync(path.join(STORAGE_PAPERS_DIR, f));
    } catch {}
  }
  clearResolvedPathCache();
  invalidateCachePrefix();
  res.json({ message: 'All old papers purged. Ready for new PDFs!' });
});

router.get('/diagnose/files', requireAdminOrStaff, async (_req, res) => {
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

router.get('/verification-requests', requireAdminOrStaff, async (_req, res) => {
  const db = await getDb();
  const result = await db.query(
    'SELECT * FROM users WHERE is_admin = FALSE AND id_card_path IS NOT NULL ORDER BY created_at DESC'
  );
  res.json(result.rows.map(formatUserResponse));
});

router.post('/verify-user/:user_id', requireAdminOrStaff, async (req, res) => {
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

router.get('/users', requireFullAdmin, async (_req, res) => {
  const db = await getDb();
  const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(result.rows.map(formatUserResponse));
});

router.post('/create-sub-admin', requireFullAdmin, async (req, res) => {
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

router.put('/users/:user_id', requireFullAdmin, async (req, res) => {
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

router.delete('/users/:user_id', requireFullAdmin, async (req, res) => {
  const userId = Number(req.params.user_id);
  const db = await getDb();
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
  invalidateCachePrefix('auth:');
  res.json({ message: 'User deleted' });
});

export default router;
