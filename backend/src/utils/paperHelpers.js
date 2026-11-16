import { getDb, getLocalPastpaperCatalog } from '../config/db.js';
import { getOrSetCache } from '../config/cache.js';
import { PUBLIC_BASE_URL, parsePositiveInt } from '../config/env.js';
import { analyzeSearchQuery, scorePaperAgainstQuery } from '../config/searchEngine.js';
import { getAuthenticatedUser } from '../middleware/auth.js';

export const PAPER_META_COLS = `
  p.id, p.course_id, p.uploaded_by, p.aura_uuid, p.title, p.description,
  p.paper_type, p.exam_session, p.year, p.semester, p.department,
  p.file_path, p.file_name, p.file_size, p.checksum_md5, p.source_uri,
  p.status, p.reviewed_by, p.reviewed_at, p.rejection_reason, p.admin_feedback,
  p.public_link_id, p.download_count, p.view_count, p.uploaded_at, p.updated_at
`;

export const PAPER_SELECT_SQL = `
  SELECT ${PAPER_META_COLS},
         c.code AS course_code,
         c.name AS course_name,
         u.name AS uploader_name,
         u.email AS uploader_email
  FROM papers p
  LEFT JOIN courses c ON c.id = p.course_id
  LEFT JOIN users u ON u.id = p.uploaded_by
`;

export function formatPaperResponse(r, includeSensitive = false) {
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

export function buildPaperFilterWhere(query, forceApproved) {
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

export function filterLocalCatalogPapers(query, forceApproved = true) {
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

export async function getApprovedCatalogIndex() {
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

export function executeSmartCatalogSearch(allPapers, query) {
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
    return b.paper.year - a.paper.year || b.paper.id - a.paper.id;
  });

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

export async function canAccessPaper(req, paper) {
  if (!paper) return false;
  if (!paper.status || String(paper.status).toLowerCase() === 'approved') return true;
  const user = await getAuthenticatedUser(req);
  if (!user) return false;
  if (user.is_admin || user.admin_role) return true;
  return Boolean(paper.uploaded_by && Number(paper.uploaded_by) === Number(user.id));
}
