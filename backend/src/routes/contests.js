import { getDb } from '../config/db.js';
import { getOrSetCache, invalidateCachePrefix } from '../config/cache.js';
import { PUBLIC_BASE_URL } from '../config/env.js';
import { requireAdminOrStaff } from '../middleware/auth.js';
import { paperUpload } from '../middleware/uploads.js';
import { createAsyncRouter } from '../utils/routerHelper.js';

const router = createAsyncRouter();

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

router.get('/admin/contests', requireAdminOrStaff, async (_req, res) => {
  const data = await getOrSetCache('contests:all', 30 * 1000, async () => {
    const db = await getDb();
    const cRes = await db.query('SELECT * FROM daily_contests ORDER BY date DESC, id DESC');
    return enrichContestsWithQuestions(cRes.rows);
  });
  res.json(data);
});

router.get('/contests/course/:course_id', async (req, res) => {
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

router.get('/contests/:contest_id', async (req, res) => {
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

router.post('/contests', requireAdminOrStaff, async (req, res) => {
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

router.put('/contests/:contest_id', requireAdminOrStaff, async (req, res) => {
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

router.delete('/contests/:contest_id', requireAdminOrStaff, async (req, res) => {
  const contestId = Number(req.params.contest_id);
  const db = await getDb();
  await db.query('DELETE FROM daily_contests WHERE id = $1', [contestId]);
  invalidateCachePrefix('contests:');
  res.json({ message: 'Contest deleted' });
});

router.get('/questions/:question_id', async (req, res) => {
  const qId = Number(req.params.question_id);
  const db = await getDb();
  const qRes = await db.query('SELECT * FROM contest_questions WHERE id = $1 LIMIT 1', [qId]);
  if (qRes.rowCount === 0) {
    res.status(404).json({ detail: 'Question not found' });
    return;
  }
  res.json(qRes.rows[0]);
});

router.post('/contests/:contest_id/questions', requireAdminOrStaff, async (req, res) => {
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

router.put('/questions/:question_id', requireAdminOrStaff, async (req, res) => {
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

router.delete('/questions/:question_id', requireAdminOrStaff, async (req, res) => {
  const qId = Number(req.params.question_id);
  const db = await getDb();
  await db.query('DELETE FROM contest_questions WHERE id = $1', [qId]);
  invalidateCachePrefix('contests:');
  res.json({ message: 'Question deleted' });
});

router.get('/coding-announcements', async (req, res) => {
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

router.post(
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

router.delete('/admin/coding-announcements/:id', requireAdminOrStaff, async (req, res) => {
  const db = await getDb();
  await db.query('DELETE FROM coding_announcements WHERE id = $1', [Number(req.params.id)]);
  res.json({ message: 'Announcement deleted' });
});

export default router;
