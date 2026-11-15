import fs from 'node:fs';
import path from 'node:path';

const AURA_BASE_URL = 'https://aura.jklu.edu.in/server/api';
const PASTPAPER_DIR = path.resolve(process.cwd(), '../pastpaper');

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

function sanitizeFileName(name) {
  return String(name || 'paper.pdf')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return null;
}

async function main() {
  console.log(`🧹 Removing old pastpaper folder: ${PASTPAPER_DIR}`);
  if (fs.existsSync(PASTPAPER_DIR)) {
    fs.rmSync(PASTPAPER_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PASTPAPER_DIR, { recursive: true });

  console.log('🌐 Step 1/2: Discovering all question papers from https://aura.jklu.edu.in ...');
  const itemsToDownload = [];
  const seenUuids = new Set();

  for (const prog of AURA_PROGRAMME_SCOPES) {
    const firstUrl = `${AURA_BASE_URL}/discover/search/objects?scope=${prog.scope}&size=100&page=0&sort=dc.date.issued,DESC&embed=bundles/bitstreams&embed=owningCollection`;
    const firstRes = await fetchWithRetry(firstUrl);
    if (!firstRes) continue;
    const firstJson = await firstRes.json();
    const searchResult = firstJson?._embedded?.searchResult;
    if (!searchResult) continue;

    const totalPages = Number(searchResult.page?.totalPages || 1);
    const allObjects = [...(searchResult._embedded?.objects || [])];

    const remainingPages = [];
    for (let p = 1; p < totalPages; p++) remainingPages.push(p);

    for (let i = 0; i < remainingPages.length; i += 4) {
      const batch = remainingPages.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async (page) => {
          const r = await fetchWithRetry(
            `${AURA_BASE_URL}/discover/search/objects?scope=${prog.scope}&size=100&page=${page}&sort=dc.date.issued,DESC&embed=bundles/bitstreams&embed=owningCollection`
          );
          return r ? r.json() : null;
        })
      );
      for (const res of batchResults) {
        const objs = res?._embedded?.searchResult?._embedded?.objects || [];
        allObjects.push(...objs);
      }
    }

    let progCount = 0;
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
      progCount++;

      const meta = item.metadata || {};
      const rawTitle = meta['dc.title']?.[0]?.value || item.name || 'Question Paper';
      const issued = meta['dc.date.issued']?.[0]?.value || '';
      const abstractText = meta['dc.description.abstract']?.[0]?.value || '';
      const citation = meta['dc.identifier.citation']?.[0]?.value || '';
      const subjects = (meta['dc.subject'] || []).map((s) => s.value).join(' ');
      const accessioned = meta['dc.date.accessioned']?.[0]?.value || '';
      const colName = item._embedded?.owningCollection?.name || '';

      const semester = parseAuraSemester(colName, citation, subjects, rawTitle, abstractText);
      const yearMatch =
        issued.match(/\b(20\d{2})\b/) ||
        abstractText.match(/\b(20\d{2})\b/) ||
        rawTitle.match(/\b(20\d{2})\b/) ||
        accessioned.match(/\b(20\d{2})\b/);
      const year = yearMatch ? String(yearMatch[1]) : '2024';

      const combinedTypeText = `${abstractText} ${rawTitle} ${bitstream.name || ''}`;
      let paperType = 'ENDTERM';
      if (/mid[\s-]*term|mid[\s-]*sem|\bmte\b|cat[\s-]*[12]/i.test(combinedTypeText)) {
        paperType = 'MIDTERM';
      } else if (/quiz/i.test(combinedTypeText)) {
        paperType = 'QUIZ';
      }

      const targetDir = path.join(
        PASTPAPER_DIR,
        prog.department,
        `Semester_${semester}`,
        year,
        paperType
      );
      fs.mkdirSync(targetDir, { recursive: true });

      const rawFileName = sanitizeFileName(
        bitstream.name || `${rawTitle}.pdf`
      );
      const finalFileName = rawFileName.toLowerCase().endsWith('.pdf')
        ? rawFileName
        : `${rawFileName}.pdf`;

      // Handle filename collisions inside the same folder
      let targetFilePath = path.join(targetDir, finalFileName);
      if (fs.existsSync(targetFilePath)) {
        const base = finalFileName.replace(/\.pdf$/i, '');
        targetFilePath = path.join(targetDir, `${base}_${item.uuid.slice(0, 6)}.pdf`);
      }

      itemsToDownload.push({
        uuid: item.uuid,
        title: rawTitle,
        department: prog.department,
        semester,
        year: Number(year),
        paper_type: paperType,
        abstract: abstractText,
        issued,
        bitstream_url: contentHref,
        file_name: path.basename(targetFilePath),
        local_path: path.relative(PASTPAPER_DIR, targetFilePath),
        abs_path: targetFilePath,
        expected_size: Number(bitstream.sizeBytes || 0),
      });
    }
    console.log(`📚 ${prog.department}: queued ${progCount} PDFs`);
  }

  // Save metadata catalog inside pastpaper/aura_catalog.json
  const catalogPath = path.join(PASTPAPER_DIR, 'aura_catalog.json');
  fs.writeFileSync(
    catalogPath,
    JSON.stringify(
      itemsToDownload.map(({ abs_path, ...rest }) => rest),
      null,
      2
    )
  );
  console.log(
    `\n💾 Saved metadata catalog (${itemsToDownload.length} items) to ${catalogPath}`
  );
  console.log(`⬇️  Step 2/2: Downloading ${itemsToDownload.length} PDFs into ${PASTPAPER_DIR} (Concurrency: 16)...`);

  let downloaded = 0;
  let failed = 0;
  let totalBytes = 0;
  let index = 0;
  const CONCURRENCY = 16;

  async function worker() {
    while (index < itemsToDownload.length) {
      const currentIdx = index++;
      const entry = itemsToDownload[currentIdx];
      try {
        const res = await fetchWithRetry(entry.bitstream_url, 3);
        if (!res) {
          failed++;
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(entry.abs_path, buf);
        downloaded++;
        totalBytes += buf.length;
        if (downloaded % 100 === 0 || downloaded === itemsToDownload.length) {
          console.log(
            `   ✅ Progress: ${downloaded}/${itemsToDownload.length} PDFs downloaded (${(
              totalBytes /
              1024 /
              1024
            ).toFixed(1)} MB)`
          );
        }
      } catch {
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\n🎉 DONE!`);
  console.log(`   📁 Folder          : ${PASTPAPER_DIR}`);
  console.log(`   ✅ Downloaded PDFs : ${downloaded}`);
  console.log(`   ⚠️  Failed/Skipped  : ${failed}`);
  console.log(`   📦 Total Disk Size : ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
