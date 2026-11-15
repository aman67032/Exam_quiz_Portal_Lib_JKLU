import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PGlite } from '@electric-sql/pglite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const prisma = new PrismaClient();
let dbAdapter = null;

export async function getDb() {
  if (dbAdapter) return dbAdapter;

  const dbUrl = (process.env.DATABASE_URL || 'pglite://./data/pgdata').trim();

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    const pool = new Pool({
      connectionString: dbUrl,
      max: Number(process.env.PG_POOL_MAX || 25),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl:
        dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
    });

    dbAdapter = {
      engineName: 'Neon Serverless PostgreSQL + Prisma ORM',
      prisma,
      async query(sql, params = []) {
        const res = await pool.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
      },
      async exec(sql) {
        await pool.query(sql);
      },
    };
  } else {
    const dataDir = path.resolve(
      process.cwd(),
      dbUrl.replace(/^pglite:\/\//, '') || './data/pgdata'
    );
    fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    const pglite = new PGlite(dataDir);
    await pglite.waitReady;

    dbAdapter = {
      engineName: 'PostgreSQL 16 (Embedded PGlite)',
      prisma,
      async query(sql, params = []) {
        const res = await pglite.query(sql, params);
        return { rows: res.rows, rowCount: res.rows.length || res.affectedRows || 0 };
      },
      async exec(sql) {
        await pglite.exec(sql);
      },
    };
  }

  return dbAdapter;
}

export async function initDatabaseAndSeed() {
  const db = await getDb();

  // Ensure functional indexes exist on Neon PostgreSQL
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_courses_code_upper ON courses(UPPER(code));
  `);

  const adminEmail = (
    process.env.DEFAULT_ADMIN_EMAIL || 'counciloftechnicalaffairs@jklu.edu.in'
  )
    .toLowerCase()
    .trim();
  const envAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (envAdminPassword) {
    const hash = await bcrypt.hash(envAdminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: 'Council of Technical Affairs',
        password_hash: hash,
        is_admin: true,
        admin_role: 'full_admin',
        id_verified: true,
        email_verified: true,
      },
      create: {
        email: adminEmail,
        name: 'Council of Technical Affairs',
        password_hash: hash,
        is_admin: true,
        admin_role: 'full_admin',
        id_verified: true,
        email_verified: true,
      },
    });
  } else {
    console.warn('⚠️ [Auth] DEFAULT_ADMIN_PASSWORD not set; skipping admin password sync.');
  }

  console.log(`🔐 [Auth] Verified Admin Account in Neon PostgreSQL: ${adminEmail}`);
}

let cachedLocalCatalog = null;

export function getLocalPastpaperCatalog() {
  if (cachedLocalCatalog) return cachedLocalCatalog;

  const pastpaperRoot = path.resolve(process.cwd(), '../pastpaper');
  const catalogPath = path.join(pastpaperRoot, 'aura_catalog.json');
  if (!fs.existsSync(catalogPath)) {
    return { papers: [], courses: [], stats: { totalPapers: 0, totalCourses: 0, byDept: {} } };
  }

  const rawItems = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const coursesMap = new Map();
  const byDept = {};
  const papers = [];

  rawItems.forEach((item, idx) => {
    const dept = item.department || 'B.TECH';
    const sem = String(item.semester || '1');
    byDept[dept] = (byDept[dept] || 0) + 1;

    const { code, name } = parseAuraCourseCodeAndName(
      item.title,
      item.file_name,
      dept,
      sem
    );

    let courseEntry = coursesMap.get(code);
    if (!courseEntry) {
      courseEntry = {
        id: coursesMap.size + 1,
        code,
        name,
        department: dept,
        semester: sem,
        paper_count: 0,
        description: `${dept} Course (Semester ${sem})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      coursesMap.set(code, courseEntry);
    }
    courseEntry.paper_count += 1;

    const absFilePath = path.join(pastpaperRoot, item.local_path || '');
    const pubId = String(item.uuid || `paper_${idx + 1}`).replace(/-/g, '').slice(0, 16);

    papers.push({
      id: idx + 1,
      course_id: courseEntry.id,
      course_code: code,
      course_name: name,
      uploaded_by: null,
      uploader_name: 'JKLU Examinations Cell (AURA)',
      uploader_email: null,
      aura_uuid: item.uuid || null,
      title: `${code} - ${name}${item.abstract ? ` (${item.abstract})` : ''}`,
      description: `Programme: ${dept} | Semester: ${sem} | Session: ${item.abstract || item.issued || item.year}`,
      paper_type: String(item.paper_type || 'ENDTERM').toUpperCase(),
      exam_session: item.abstract || String(item.year || 2026),
      year: Number(item.year || 2026),
      semester: sem,
      department: dept,
      file_path: absFilePath,
      file_name: item.file_name || `${code}_${item.year}.pdf`,
      file_size: Number(item.expected_size || 0),
      status: 'APPROVED',
      public_link_id: pubId,
      download_count: 0,
      uploaded_at: new Date(`${Number(item.year) || 2026}-01-01T00:00:00Z`).toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  const courses = Array.from(coursesMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  cachedLocalCatalog = {
    papers,
    courses,
    stats: {
      totalPapers: papers.length,
      totalCourses: courses.length,
      byDept,
    },
  };
  return cachedLocalCatalog;
}

async function seedInitialCatalog(db) {
  const seedDir = path.resolve(process.cwd(), 'seed_data');
  if (!fs.existsSync(seedDir)) return;

  console.log('🌱 Batch-seeding Neon PostgreSQL via Prisma createMany...');

  const coursesPath = path.join(seedDir, 'courses.json');
  if (fs.existsSync(coursesPath)) {
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    await prisma.course.createMany({
      data: courses.map((c) => ({
        id: Number(c.id),
        code: String(c.code).trim().toUpperCase(),
        name: String(c.name).trim(),
        description: c.description || null,
      })),
      skipDuplicates: true,
    });
    await db.exec(`SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id) FROM courses), 1), true)`);
  }

  const usersPath = path.join(seedDir, 'users_light.json');
  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    await prisma.user.createMany({
      data: users.map((u) => ({
        id: Number(u.id),
        email: String(u.email).toLowerCase().trim(),
        name: u.name || 'Student',
        password_hash: u.password_hash,
        is_admin: Boolean(u.is_admin),
        admin_role: u.admin_role || null,
        age: u.age ? Number(u.age) : null,
        year: u.year ? String(u.year) : null,
        university: u.university || 'JK Lakshmipat University',
        department: u.department || null,
        roll_no: u.roll_no || null,
        student_id: u.student_id || null,
        id_verified: Boolean(u.id_verified),
        email_verified: u.email_verified !== false,
      })),
      skipDuplicates: true,
    });
    await db.exec(`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true)`);
  }

  const papersPath = path.join(seedDir, 'papers_light.json');
  const storagePapersDir = path.resolve(process.cwd(), 'storage/papers');
  const storageFiles = fs.existsSync(storagePapersDir) ? fs.readdirSync(storagePapersDir) : [];

  if (fs.existsSync(papersPath)) {
    const papers = JSON.parse(fs.readFileSync(papersPath, 'utf8'));
    await prisma.paper.createMany({
      data: papers.map((p) => {
        const matchedFile =
          storageFiles.find((f) => f.startsWith(`${p.id}_`)) || p.file_name || `${p.id}.pdf`;
        let dept = p.department;
        if (!dept && p.description) {
          if (/BBA/i.test(p.description)) dept = 'BBA';
          else if (/BCA/i.test(p.description)) dept = 'BCA';
          else if (/M\.?TECH/i.test(p.description)) dept = 'M.TECH';
          else dept = 'B.TECH';
        }
        return {
          id: Number(p.id),
          course_id: Number(p.course_id),
          uploaded_by: null,
          title: p.title,
          description: p.description || null,
          paper_type: String(p.paper_type || 'ENDTERM').toUpperCase(),
          year: Number(p.year || 2024),
          semester: String(p.semester || '1'),
          department: dept || 'B.TECH',
          file_path: matchedFile,
          file_name: p.file_name || matchedFile,
          file_size: Number(p.file_size || 0),
          status: String(p.status || 'APPROVED').toUpperCase(),
          public_link_id: p.public_link_id || crypto.randomBytes(8).toString('hex'),
        };
      }),
      skipDuplicates: true,
    });
    await db.exec(`SELECT setval('papers_id_seq', COALESCE((SELECT MAX(id) FROM papers), 1), true)`);
  }

  console.log('✅ Neon PostgreSQL + Prisma initial seed complete.');
}

export async function syncPastPaperFolder(options = {}) {
  const db = await getDb();
  const pastpaperRoot = path.resolve(process.cwd(), '../pastpaper');
  const storagePapersDir = path.resolve(process.cwd(), 'storage/papers');
  fs.mkdirSync(storagePapersDir, { recursive: true });

  if (options.purgeExisting) {
    await prisma.paper.deleteMany({});
    for (const f of fs.readdirSync(storagePapersDir)) {
      try {
        fs.unlinkSync(path.join(storagePapersDir, f));
      } catch {}
    }
  }

  if (!fs.existsSync(pastpaperRoot)) {
    return { imported: 0, message: 'pastpaper directory not found' };
  }

  const pdfFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push(full);
      }
    }
  }
  walk(pastpaperRoot);

  let imported = 0;
  for (const pdfPath of pdfFiles) {
    const rel = path.relative(pastpaperRoot, pdfPath);
    const baseName = path.basename(pdfPath, '.pdf').trim();

    const yearMatch = rel.match(/\b(20\d{2})\b/);
    const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();

    let department = 'B.TECH';
    if (/\bBBA\b/i.test(rel)) department = 'BBA';
    else if (/\bBCA\b/i.test(rel)) department = 'BCA';
    else if (/\bM\.?Tech\b/i.test(rel)) department = 'M.TECH';
    else if (/\bB\.?Des\b/i.test(rel)) department = 'B.DES';

    let semester = '1';
    const romanMap = {
      VIII: '8',
      VII: '7',
      VI: '6',
      V: '5',
      IV: '4',
      III: '3',
      II: '2',
      I: '1',
    };
    const semRomanMatch = rel.match(/\bSEM(?:ESTER)?\s+(VIII|VII|VI|IV|III|II|I|V)\b/i);
    const semDigitMatch = rel.match(/\bSEM(?:ESTER)?\s*(\d)\b/i);
    if (semRomanMatch) {
      semester = romanMap[semRomanMatch[1].toUpperCase()] || '1';
    } else if (semDigitMatch) {
      semester = semDigitMatch[1];
    }

    const codeMatch = baseName.match(/^([A-Za-z]{2,4}[-\s]?\d{3,4})\s*[;:,-]?\s*(.*)$/);
    const rawCode = codeMatch ? codeMatch[1].replace(/[-\s]/g, '').toUpperCase() : 'GEN1001';
    const rawCourseName = (codeMatch && codeMatch[2] ? codeMatch[2].trim() : baseName) || rawCode;

    let paperType = 'ENDTERM';
    if (/mid\s*term|midsem/i.test(rel)) paperType = 'MIDTERM';
    else if (/quiz/i.test(rel)) paperType = 'QUIZ';

    const course = await prisma.course.upsert({
      where: { code: rawCode },
      update: {},
      create: {
        code: rawCode,
        name: rawCourseName,
        description: `${department} Course`,
      },
    });

    const stat = fs.statSync(pdfPath);
    const cleanFile = `${Date.now()}_${imported}_${rawCode}_${baseName.replace(
      /[^a-zA-Z0-9.-]/g,
      '_'
    )}.pdf`;
    fs.copyFileSync(pdfPath, path.join(storagePapersDir, cleanFile));

    const title = `${rawCode} - ${rawCourseName} - ${paperType} - Sem ${semester} - ${year}`;
    const description = `Programme: ${department} | Year: ${year} | Semester: ${semester}`;
    const publicLinkId = crypto.randomBytes(8).toString('hex');

    await prisma.paper.create({
      data: {
        course_id: course.id,
        title,
        description,
        paper_type: paperType,
        year,
        semester,
        department,
        file_path: cleanFile,
        file_name: path.basename(pdfPath),
        file_size: stat.size,
        status: 'APPROVED',
        public_link_id: publicLinkId,
      },
    });
    imported++;
  }

  return { imported, totalScanned: pdfFiles.length };
}

const AURA_BASE_URL = 'https://aura.jklu.edu.in/server/api';

const AURA_PROGRAMME_SCOPES = [
  { scope: '645b2f36-eb15-4c31-a073-02b5b87bf059', department: 'B.TECH', label: 'B.Tech' },
  { scope: 'b0a8406b-2f12-450c-933d-e05a86bdf9ed', department: 'BCA', label: 'BCA' },
  { scope: '3c8f5757-7928-45c1-b9da-fb6866695bc1', department: 'M.TECH', label: 'M.Tech' },
  { scope: '32e4c401-b311-4d76-844f-41b3e38e64ed', department: 'BBA', label: 'BBA' },
  { scope: 'cf73dd65-1f17-4030-9a73-1201de5c26c5', department: 'B.COM', label: 'B.Com' },
  { scope: 'b840bf5e-fb7c-40f0-88cf-1692f0432a97', department: 'MBA', label: 'MBA' },
  { scope: '55123063-babb-484f-91aa-6eb770434f00', department: 'B.DES', label: 'B.Des' },
  { scope: 'ea77bb9e-7e12-4985-8ec3-1b5437ecb86b', department: 'M.DES', label: 'M.Des' },
  { scope: '9cb6ebc4-6601-4a7d-83af-7b25339c07f6', department: 'PHD', label: 'PhD' },
];

function parseAuraCourseCodeAndName(rawTitle, rawBitstreamName, department, semester) {
  const candidates = [
    String(rawTitle || '').trim(),
    String(rawBitstreamName || '').replace(/\.pdf$/i, '').trim(),
  ].filter(Boolean);

  for (const text of candidates) {
    // Pattern 1: "Course Name (CS1135)" or "Course Name (CS 1258)" or "Course Name (AC09)"
    const parenMatch = text.match(/^(.*?)\(\s*([A-Za-z]{2,5}[-\s]?\d{2,4}[A-Za-z]?)\s*\)\s*$/);
    if (parenMatch) {
      const code = parenMatch[2].replace(/[-\s]/g, '').toUpperCase();
      const name = parenMatch[1].replace(/^[-:;,\s]+|[-:;,\s]+$/g, '').trim() || code;
      return { code, name };
    }

    // Pattern 2: "CS1108 - Operating Systems" or "ED1102- Idea To Business Model"
    const prefixMatch = text.match(/^([A-Za-z]{2,5}[-\s]?\d{2,4}[A-Za-z]?)\s*[-:;,.]+\s*(.+)$/);
    if (prefixMatch) {
      const code = prefixMatch[1].replace(/[-\s]/g, '').toUpperCase();
      const name = prefixMatch[2].replace(/^[-:;,\s]+|[-:;,\s]+$/g, '').trim() || code;
      return { code, name };
    }

    // Pattern 3: "Number Theory AS1207"
    const suffixMatch = text.match(/^(.+?)\s+([A-Za-z]{2,5}[-\s]?\d{2,4}[A-Za-z]?)$/);
    if (suffixMatch) {
      const code = suffixMatch[2].replace(/[-\s]/g, '').toUpperCase();
      const name = suffixMatch[1].replace(/^[-:;,\s]+|[-:;,\s]+$/g, '').trim() || code;
      return { code, name };
    }
  }

  // Fallback: derive deterministic code from subject initials + semester so courses stay distinct
  const cleanTitle = (candidates[0] || 'General Subject')
    .replace(/\b(end[\s-]*term|mid[\s-]*term|examination|may|dec|nov|20\d{2})\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'General Subject';
  const words = cleanTitle
    .replace(/[^A-Za-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(and|the|for|with|from)$/i.test(w));
  const initials =
    words
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join('') || department.replace(/[^A-Z]/g, '').slice(0, 3) || 'GEN';
  const hashNum =
    (Array.from(cleanTitle.toLowerCase()).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 900, 0) +
      100) %
    900 +
    100;
  return {
    code: `${initials}${semester}${String(hashNum).slice(0, 2)}`,
    name: cleanTitle,
  };
}

function parseAuraSemester(...sources) {
  const romanMap = {
    VIII: '8',
    VII: '7',
    VI: '6',
    V: '5',
    IV: '4',
    III: '3',
    II: '2',
    I: '1',
  };
  for (const src of sources) {
    if (!src) continue;
    const text = String(src);
    const ordinalMatch = text.match(/\b([1-8])(?:st|nd|rd|th)?\s*sem(?:ester)?\b/i);
    if (ordinalMatch) return ordinalMatch[1];

    const semDigitMatch = text.match(/\bsem(?:ester)?\s*[-:]?\s*([1-8])\b/i);
    if (semDigitMatch) return semDigitMatch[1];

    const romanMatch = text.match(/\bsem(?:ester)?\s*[-:]?\s*(VIII|VII|VI|IV|III|II|I|V)\b/i);
    if (romanMatch) return romanMap[romanMatch[1].toUpperCase()] || '1';

    const prefixRomanMatch = text.match(/\b(VIII|VII|VI|IV|III|II|I|V)\s+sem(?:ester)?\b/i);
    if (prefixRomanMatch) return romanMap[prefixRomanMatch[1].toUpperCase()] || '1';
  }
  return '1';
}

export async function syncAuraRepository(options = {}) {
  const db = await getDb();
  const storagePapersDir = path.resolve(process.cwd(), 'storage/papers');
  const seedDir = path.resolve(process.cwd(), 'seed_data');
  const auraCachePath = path.join(seedDir, 'aura_catalog.json');
  fs.mkdirSync(storagePapersDir, { recursive: true });
  fs.mkdirSync(seedDir, { recursive: true });

  let discoveredPapers = [];
  let courseList = [];

  if (options.useCachedSnapshot && fs.existsSync(auraCachePath)) {
    console.log('⚡ [AURA Sync] Loading cached AURA snapshot from seed_data/aura_catalog.json ...');
    const cached = JSON.parse(fs.readFileSync(auraCachePath, 'utf8'));
    discoveredPapers = cached.papers || [];
    courseList = cached.courses || [];
  } else {
    console.log('🌐 [AURA Sync] Fetching official question papers from https://aura.jklu.edu.in ...');
    const coursesMap = new Map();
    const seenUuids = new Set();

    for (const prog of AURA_PROGRAMME_SCOPES) {
      const firstUrl = `${AURA_BASE_URL}/discover/search/objects?scope=${prog.scope}&size=100&page=0&sort=dc.date.issued,DESC&embed=bundles/bitstreams&embed=owningCollection`;
      const firstRes = await fetch(firstUrl).then((r) => r.json());
      const searchResult = firstRes?._embedded?.searchResult;
      if (!searchResult) continue;

      const totalPages = Number(searchResult.page?.totalPages || 1);
      const allObjects = [...(searchResult._embedded?.objects || [])];

      const remainingPages = [];
      for (let p = 1; p < totalPages; p++) remainingPages.push(p);

      // Fetch in parallel batches of 4
      for (let i = 0; i < remainingPages.length; i += 4) {
        const batch = remainingPages.slice(i, i + 4);
        const batchResults = await Promise.all(
          batch.map((page) =>
            fetch(
              `${AURA_BASE_URL}/discover/search/objects?scope=${prog.scope}&size=100&page=${page}&sort=dc.date.issued,DESC&embed=bundles/bitstreams&embed=owningCollection`
            )
              .then((r) => r.json())
              .catch(() => null)
          )
        );
        for (const res of batchResults) {
          const objs = res?._embedded?.searchResult?._embedded?.objects || [];
          allObjects.push(...objs);
        }
      }

      console.log(`📚 [AURA Sync] ${prog.department}: fetched ${allObjects.length} items`);

      for (const obj of allObjects) {
        const item = obj?._embedded?.indexableObject;
        if (!item || item.type !== 'item' || !item.uuid) continue;
        if (seenUuids.has(item.uuid)) continue;

        const bundles = item._embedded?.bundles?._embedded?.bundles || [];
        const origBundle = bundles.find((b) => b.name === 'ORIGINAL');
        const bitstream = origBundle?._embedded?.bitstreams?._embedded?.bitstreams?.[0];
        const contentHref = bitstream?._links?.content?.href;
        if (!contentHref) continue;

        seenUuids.add(item.uuid);

        const meta = item.metadata || {};
        const rawTitle = meta['dc.title']?.[0]?.value || item.name || 'Question Paper';
        const issued = meta['dc.date.issued']?.[0]?.value || '';
        const abstractText = meta['dc.description.abstract']?.[0]?.value || '';
        const citation = meta['dc.identifier.citation']?.[0]?.value || '';
        const subjects = (meta['dc.subject'] || []).map((s) => s.value).join(' ');
        const accessioned = meta['dc.date.accessioned']?.[0]?.value || '';
        const handleUri =
          meta['dc.identifier.uri']?.[0]?.value || `https://aura.jklu.edu.in/items/${item.uuid}`;
        const colName = item._embedded?.owningCollection?.name || '';

        const semester = parseAuraSemester(colName, citation, subjects, rawTitle, abstractText);

        const yearMatch =
          issued.match(/\b(20\d{2})\b/) ||
          abstractText.match(/\b(20\d{2})\b/) ||
          rawTitle.match(/\b(20\d{2})\b/) ||
          accessioned.match(/\b(20\d{2})\b/);
        const year = yearMatch ? Number(yearMatch[1]) : 2024;

        const combinedTypeText = `${abstractText} ${rawTitle} ${bitstream.name || ''}`;
        let paperType = 'ENDTERM';
        if (/mid[\s-]*term|mid[\s-]*sem|\bmte\b|cat[\s-]*[12]/i.test(combinedTypeText)) {
          paperType = 'MIDTERM';
        } else if (/quiz/i.test(combinedTypeText)) {
          paperType = 'QUIZ';
        } else if (/assign/i.test(combinedTypeText)) {
          paperType = 'ASSIGNMENT';
        }

        const { code: courseCode, name: courseName } = parseAuraCourseCodeAndName(
          rawTitle,
          bitstream.name,
          prog.department,
          semester
        );

        if (!coursesMap.has(courseCode)) {
          coursesMap.set(courseCode, {
            code: courseCode,
            name: courseName,
            description: `${prog.label} Course (Semester ${semester})`,
          });
        }

        const title = `${courseCode} - ${courseName} (${abstractText || `${paperType} ${year}`})`;
        const description = `Programme: ${prog.department} | Semester: ${semester} | Session: ${
          abstractText || issued || year
        } | Source: JKLU AURA (${handleUri})`;

        discoveredPapers.push({
          courseCode,
          title,
          description,
          paper_type: paperType,
          year,
          semester,
          department: prog.department,
          file_path: contentHref,
          file_name: bitstream.name || `${courseCode}_${year}.pdf`,
          file_size: Number(bitstream.sizeBytes || 0),
          status: 'APPROVED',
          public_link_id: item.uuid.replace(/-/g, '').slice(0, 16),
        });
      }
    }

    courseList = Array.from(coursesMap.values());
    fs.writeFileSync(
      auraCachePath,
      JSON.stringify({ courses: courseList, papers: discoveredPapers }, null, 2)
    );
    console.log(`💾 [AURA Sync] Saved snapshot (${discoveredPapers.length} papers) to seed_data/aura_catalog.json`);
  }

  if (discoveredPapers.length === 0) {
    return { imported: 0, courses: 0, message: 'No items returned from AURA API' };
  }

  // Wake up Neon PostgreSQL compute before running bulk operations
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await db.query('SELECT 1');
      await prisma.$connect();
      break;
    } catch (err) {
      console.log(`⏳ [Neon Wake] Attempt ${attempt}/4 waking Neon PostgreSQL compute...`);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  if (options.purgeExisting !== false) {
    console.log('🧹 [AURA Sync] Purging old papers and outdated courses from Neon PostgreSQL...');
    await prisma.paper.deleteMany({});
    await prisma.course.deleteMany({});
    for (const f of fs.readdirSync(storagePapersDir)) {
      try {
        fs.unlinkSync(path.join(storagePapersDir, f));
      } catch {}
    }
  }

  await prisma.course.createMany({
    data: courseList,
    skipDuplicates: true,
  });

  const allCourses = await prisma.course.findMany({ select: { id: true, code: true } });
  const codeToId = new Map(allCourses.map((c) => [c.code.toUpperCase(), c.id]));

  const paperRows = discoveredPapers
    .map((p) => {
      const courseId = codeToId.get(p.courseCode.toUpperCase());
      if (!courseId) return null;
      return {
        course_id: courseId,
        uploaded_by: null,
        title: p.title,
        description: p.description,
        paper_type: p.paper_type,
        year: p.year,
        semester: p.semester,
        department: p.department,
        file_path: p.file_path,
        file_name: p.file_name,
        file_size: p.file_size,
        status: 'APPROVED',
        public_link_id: p.public_link_id,
      };
    })
    .filter(Boolean);

  // Batch insert in chunks of 500
  for (let i = 0; i < paperRows.length; i += 500) {
    await prisma.paper.createMany({
      data: paperRows.slice(i, i + 500),
      skipDuplicates: true,
    });
  }

  await db.exec(`SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id) FROM courses), 1), true)`);
  await db.exec(`SELECT setval('papers_id_seq', COALESCE((SELECT MAX(id) FROM papers), 1), true)`);

  console.log(
    `✅ [AURA Sync] Imported ${paperRows.length} official JKLU papers across ${courseList.length} courses into Neon PostgreSQL!`
  );

  return {
    imported: paperRows.length,
    courses: courseList.length,
    source: 'https://aura.jklu.edu.in',
  };
}
