import { getDb, getLocalPastpaperCatalog } from '../config/db.js';
import { getOrSetCache, invalidateCachePrefix } from '../config/cache.js';
import { requireAuth, requireAdminOrStaff } from '../middleware/auth.js';
import { createAsyncRouter } from '../utils/routerHelper.js';

const router = createAsyncRouter();

router.get('/', async (_req, res) => {
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

router.get('/:course_id', async (req, res) => {
  const courseId = Number(req.params.course_id);
  const db = await getDb();
  const result = await db.query('SELECT * FROM courses WHERE id = $1 LIMIT 1', [courseId]);
  if (result.rowCount === 0) {
    res.status(404).json({ detail: 'Course not found' });
    return;
  }
  res.json(result.rows[0]);
});

router.post('/', requireAdminOrStaff, async (req, res) => {
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

router.post('/check-or-create', requireAuth, async (req, res) => {
  if (!req.user.id_verified && !req.user.is_admin && !req.user.admin_role) {
    res.status(403).json({ detail: 'ID verification required to create courses' });
    return;
  }
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

router.post('/admin/create-with-paper', requireAdminOrStaff, async (req, res) => {
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

router.put('/:course_id', requireAdminOrStaff, async (req, res) => {
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

router.delete('/:course_id', requireAdminOrStaff, async (req, res) => {
  const courseId = Number(req.params.course_id);
  const db = await getDb();
  await db.query('DELETE FROM courses WHERE id = $1', [courseId]);
  invalidateCachePrefix('courses:');
  invalidateCachePrefix('papers:');
  res.json({ message: 'Course deleted' });
});

export default router;
