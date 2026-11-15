import fs from 'node:fs';
import path from 'node:path';
import { getDb, prisma } from '../src/config/db.js';

const BINARY_OUT_DIR = path.resolve(process.cwd(), '../pastpaper_bin');
const MANIFEST_PATH = path.join(BINARY_OUT_DIR, 'binary_manifest.json');

const SCHOOL_BY_DEPT = {
  'B.TECH': 'IET',
  BCA: 'IET',
  'M.TECH': 'IET',
  BBA: 'IM',
  MBA: 'IM',
  'B.COM': 'IM',
  'B.DES': 'ID',
  'M.DES': 'ID',
  PHD: 'PHD',
};

function parseVerifiedCourseCodeAndName(rawTitle, rawFileName, dept, sem) {
  const titleStr = String(rawTitle || '').trim();
  const fileStr = String(rawFileName || '')
    .replace(/\.pdf$/i, '')
    .trim();

  // Known exact overrides for the 3 OCR/untagged edge cases in 2020-2026
  if (/fundaments of automation engineering\s*-?\s*i\b/i.test(titleStr)) {
    return { code: 'ES1111', name: 'Fundamentals of Automation Engineering - I' };
  }
  if (/understanding cons.*ner behaviour/i.test(titleStr) || /^mk\s*10$/i.test(fileStr)) {
    return { code: 'MK10', name: 'Understanding Consumer Behaviour' };
  }
  if (/financial risk management/i.test(titleStr) && dept === 'PHD') {
    return { code: 'PHDFRM', name: 'Financial Risk Management' };
  }

  const candidates = [titleStr, fileStr].filter(Boolean);

  for (const text of candidates) {
    // 1. "Course Name (CS1135)" or "Course Name (TEMTech 223)" or "Course Name (E1407)"
    const parenMatch = text.match(/^(.*?)\(\s*([A-Za-z]{1,8}[-\s]?\d{2,4}[A-Za-z]?)\s*\)\s*$/);
    if (parenMatch) {
      const code = parenMatch[2].replace(/[-\s]/g, '').toUpperCase();
      const name =
        parenMatch[1]
          .replace(/^[-:;,\s]+|[-:;,\s]+$/g, '')
          .replace(/\bCongnitive\b/gi, 'Cognitive')
          .trim() || code;
      return { code, name };
    }

    // 2. "CS1108 - Operating Systems" or "ED1102- Idea To Business Model"
    const prefixMatch = text.match(/^([A-Za-z]{1,8}[-\s]?\d{2,4}[A-Za-z]?)\s*[-:;,.]+\s*(.+)$/);
    if (
      prefixMatch &&
      !/^(b\.?tech|m\.?tech|bba|bca|mba|b\.?com|b\.?des|sem)/i.test(prefixMatch[1])
    ) {
      const code = prefixMatch[1].replace(/[-\s]/g, '').toUpperCase();
      const name = prefixMatch[2].replace(/^[-:;,\s]+|[-:;,\s]+$/g, '').trim() || code;
      return { code, name };
    }

    // 3. "Number Theory AS1207"
    const suffixMatch = text.match(/^(.+?)\s+([A-Za-z]{1,8}[-\s]?\d{2,4}[A-Za-z]?)$/);
    if (suffixMatch && !/^(20\d{2}|sem.*)$/i.test(suffixMatch[2])) {
      const code = suffixMatch[2].replace(/[-\s]/g, '').toUpperCase();
      const name = suffixMatch[1].replace(/^[-:;,\s]+|[-:;,\s]+$/g, '').trim() || code;
      return { code, name };
    }

    // 4. Embedded code anywhere in string
    const anyMatch = text.match(/\b([A-Za-z]{2,7}[-\s]?\d{3,4}[A-Za-z]?)\b/);
    if (anyMatch && !/^20\d{2}$/.test(anyMatch[1])) {
      const code = anyMatch[1].replace(/[-\s]/g, '').toUpperCase();
      const name =
        text
          .replace(anyMatch[0], '')
          .replace(/[()]/g, '')
          .replace(/^[-:;,\s]+|[-:;,\s]+$/g, '')
          .trim() || code;
      return { code, name };
    }
  }

  return {
    code: `${dept.replace(/[^A-Z]/g, '')}${sem}01`,
    name: titleStr || 'University Course',
  };
}

function formatExamSession(item) {
  const abs = String(item.abstract || '').trim();
  const issued = String(item.issued || '').trim();
  const year = item.year;

  if (abs && /\b(20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|term|sem)/i.test(abs)) {
    return abs;
  }
  if (/^\d{4}-\d{2}$/.test(issued)) {
    const [y, m] = issued.split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const mName = months[Math.max(0, Math.min(11, Number(m) - 1))];
    return `${item.paper_type === 'MIDTERM' ? 'Mid-Term' : 'End-Term'} Examination ${mName} ${y}`;
  }
  return `${item.paper_type === 'MIDTERM' ? 'Mid-Term' : 'End-Term'} Examination ${year}`;
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Binary manifest not found at ${MANIFEST_PATH}`);
  }

  const allManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const targetItems = allManifest.filter((x) => x.year >= 2020 && x.year <= 2026);

  console.log(
    `🚀 Preparing to push ${targetItems.length} verified papers (2020–2026) + binary blobs into Neon PostgreSQL...`
  );

  const db = await getDb();
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await db.query('SELECT 1');
      await prisma.$connect();
      break;
    } catch {
      console.log(`⏳ Waking Neon PostgreSQL (Attempt ${attempt}/4)...`);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  // Clear existing papers and courses first so we have a clean 2020-2026 dataset
  await prisma.paper.deleteMany({});
  await prisma.course.deleteMany({});

  // Build unique courses map with accurate paper counts
  const coursesMap = new Map();
  const enrichedPapers = [];

  for (const item of targetItems) {
    const dept = item.department || 'B.TECH';
    const sem = String(item.semester || '1');
    const school = SCHOOL_BY_DEPT[dept] || 'IET';
    const { code, name } = parseVerifiedCourseCodeAndName(
      item.title,
      item.file_name,
      dept,
      sem
    );
    const examSession = formatExamSession(item);

    let courseEntry = coursesMap.get(code);
    if (!courseEntry) {
      courseEntry = {
        code,
        name,
        department: dept,
        school,
        semester: sem,
        paper_count: 0,
        description: `${dept} (${school}) — Semester ${sem}`,
      };
      coursesMap.set(code, courseEntry);
    }
    courseEntry.paper_count += 1;

    const cleanTitle = `${code} — ${name} (${examSession})`;
    const cleanDescription = `Programme: ${dept} (${school}) | Semester: ${sem} | Course: ${code} - ${name} | Session: ${examSession} | Issued: ${
      item.issued || item.year
    } | MD5: ${item.checksum_md5.slice(0, 12)}`;

    enrichedPapers.push({
      ...item,
      courseCode: code,
      courseName: name,
      school,
      examSession,
      cleanTitle,
      cleanDescription,
    });
  }

  const courseList = Array.from(coursesMap.values());
  console.log(`📚 Inserting ${courseList.length} unique courses into Neon PostgreSQL...`);
  await prisma.course.createMany({
    data: courseList,
    skipDuplicates: true,
  });

  const dbCourses = await prisma.course.findMany({ select: { id: true, code: true } });
  const codeToId = new Map(dbCourses.map((c) => [c.code.toUpperCase(), c.id]));

  console.log(
    `📦 Uploading ${enrichedPapers.length} papers with compressed binary (.bin) BYTEA blobs (Concurrency: 8)...`
  );

  let uploaded = 0;
  let totalBinMB = 0;
  let idx = 0;
  const CONCURRENCY = 8;

  async function worker() {
    while (idx < enrichedPapers.length) {
      const current = enrichedPapers[idx++];
      const courseId = codeToId.get(current.courseCode.toUpperCase());
      const binAbsPath = path.join(BINARY_OUT_DIR, current.bin_path);
      const binBuffer = fs.existsSync(binAbsPath) ? fs.readFileSync(binAbsPath) : null;

      await prisma.paper.upsert({
        where: { aura_uuid: current.uuid },
        update: {
          course_id: courseId,
          title: current.cleanTitle,
          description: current.cleanDescription,
          paper_type: current.paper_type,
          exam_session: current.examSession,
          year: current.year,
          semester: String(current.semester),
          department: current.department,
          file_path: current.local_pdf_path,
          file_name: current.file_name,
          file_size: current.raw_size_bytes,
          file_blob: binBuffer,
          checksum_md5: current.checksum_md5,
          source_uri: current.bitstream_url,
          status: 'APPROVED',
          public_link_id: current.uuid.replace(/-/g, '').slice(0, 16),
        },
        create: {
          course_id: courseId,
          uploaded_by: null,
          aura_uuid: current.uuid,
          title: current.cleanTitle,
          description: current.cleanDescription,
          paper_type: current.paper_type,
          exam_session: current.examSession,
          year: current.year,
          semester: String(current.semester),
          department: current.department,
          file_path: current.local_pdf_path,
          file_name: current.file_name,
          file_size: current.raw_size_bytes,
          file_blob: binBuffer,
          checksum_md5: current.checksum_md5,
          source_uri: current.bitstream_url,
          status: 'APPROVED',
          public_link_id: current.uuid.replace(/-/g, '').slice(0, 16),
        },
      });

      uploaded++;
      totalBinMB += (binBuffer ? binBuffer.length : 0) / 1024 / 1024;
      if (uploaded % 50 === 0 || uploaded === enrichedPapers.length) {
        console.log(
          `   ✅ Uploaded ${uploaded}/${enrichedPapers.length} papers to Neon PostgreSQL (${totalBinMB.toFixed(
            2
          )} MB binary stored)`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  await db.exec(`SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id) FROM courses), 1), true)`);
  await db.exec(`SELECT setval('papers_id_seq', COALESCE((SELECT MAX(id) FROM papers), 1), true)`);

  const finalCounts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    papers: await prisma.paper.count(),
  };
  const dbSizeRes = await db.query(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`
  );

  console.log(`\n🎉 NEON POSTGRESQL UPLOAD COMPLETE!`);
  console.log(`   📊 Final Counts       :`, finalCounts);
  console.log(`   🗜️  Binary Payload     : ${totalBinMB.toFixed(2)} MB`);
  console.log(`   🐘 Total Neon DB Size : ${dbSizeRes.rows[0]?.db_size} / 500 MB`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Push failed:', err);
  process.exit(1);
});
