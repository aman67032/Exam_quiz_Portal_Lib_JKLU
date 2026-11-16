import path from 'node:path';
import fs from 'node:fs';
import { getDb, getLocalPastpaperCatalog } from '../config/db.js';
import { getOrSetCache, getCacheMetrics } from '../config/cache.js';
import { STORAGE_USERS_DIR } from '../config/env.js';
import { getAuthenticatedUser, requireAdminOrStaff } from '../middleware/auth.js';
import { getRequestStats } from '../middleware/rateLimiters.js';
import { resolvePdfDiskInfo, streamPdfWithByteRange } from '../utils/pdfStorage.js';
import { createAsyncRouter } from '../utils/routerHelper.js';

const router = createAsyncRouter();

router.get('/', (_req, res) => {
  res.json({
    service: 'Learn JKLU 2.0 Express.js High-Concurrency Engine (JavaScript ESM)',
    status: 'online',
    architecture: 'Elephant & Goldfish (PostgreSQL + Singleflight L1 Cache + Async Crypto Pool)',
  });
});

router.get('/wake', (_req, res) => {
  res.json({ status: 'awake', timestamp: new Date().toISOString() });
});

router.get('/health', async (_req, res) => {
  const db = await getDb();
  const { activeRequests, totalRequestsHandled } = getRequestStats();
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

router.get('/metrics', requireAdminOrStaff, async (_req, res) => {
  const db = await getDb();
  const { activeRequests, totalRequestsHandled } = getRequestStats();
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

router.get('/uploads/:filename(*)', async (req, res) => {
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

  // Serverless fallback: load ID card binary from PostgreSQL when /tmp disk is ephemeral
  try {
    const user = await getAuthenticatedUser(req);
    if (user) {
      const db = await getDb();
      const rowRes = await db.query(
        `SELECT id, id_card_path, id_card_data, id_card_mime FROM users WHERE id_card_path = $1 LIMIT 1`,
        [base]
      );
      if (rowRes.rowCount > 0 && rowRes.rows[0].id_card_data) {
        const record = rowRes.rows[0];
        const isAdmin = Boolean(user.is_admin || user.admin_role);
        const isOwner = Number(record.id) === Number(user.id);
        if (!isAdmin && !isOwner) {
          res.status(403).json({ detail: 'Authentication required to access user files' });
          return;
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Type', record.id_card_mime || 'application/octet-stream');
        res.send(Buffer.from(record.id_card_data));
        return;
      }
    }
  } catch {
    // Column may not exist yet before first upload
  }

  const pdfInfo = resolvePdfDiskInfo(base);
  if (pdfInfo) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    streamPdfWithByteRange(req, res, pdfInfo, base, 'inline');
    return;
  }
  res.status(404).json({ detail: 'File not found' });
});

export default router;
