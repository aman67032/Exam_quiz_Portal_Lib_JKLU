import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { getDb } from '../config/db.js';
import { STORAGE_PAPERS_DIR } from '../config/env.js';
import { getClientIp } from '../middleware/rateLimiters.js';

const resolvedPathCache = new Map();
const inFlightAuraDownloads = new Map();
const pendingDownloadCounts = new Map();
const recentDownloadByIpPaper = new Map();

export function clearResolvedPathCache() {
  resolvedPathCache.clear();
}

setInterval(async () => {
  if (pendingDownloadCounts.size === 0) return;
  const entries = Array.from(pendingDownloadCounts.entries());
  pendingDownloadCounts.clear();
  try {
    const db = await getDb();
    for (const [paperId, delta] of entries) {
      await db.query(
        'UPDATE papers SET download_count = COALESCE(download_count, 0) + $1 WHERE id = $2',
        [delta, paperId]
      );
    }
  } catch {}
}, 10000).unref();

export function recordDownloadCount(req, paperId) {
  if (req.headers.range) return;
  const ip = getClientIp(req);
  const key = `${ip}:${paperId}`;
  const now = Date.now();
  const last = recentDownloadByIpPaper.get(key) || 0;
  if (now - last < 60 * 1000) return;
  if (recentDownloadByIpPaper.size > 5000) {
    for (const [k, ts] of recentDownloadByIpPaper.entries()) {
      if (now - ts >= 60 * 1000) recentDownloadByIpPaper.delete(k);
    }
  }
  recentDownloadByIpPaper.set(key, now);
  pendingDownloadCounts.set(paperId, (pendingDownloadCounts.get(paperId) || 0) + 1);
}

export async function resolveOrFetchPdfDiskInfo(paper) {
  const filePathOrName = paper?.file_path || paper?.file_name || '';
  if (!filePathOrName) return null;

  const cacheKey = `${paper?.id || 'raw'}:${filePathOrName}`;
  const cached = resolvedPathCache.get(cacheKey);
  if (cached && fs.existsSync(cached.diskPath)) return cached;

  const safeFileName = String(paper?.file_name || `paper_${paper?.id || 'doc'}.pdf`).replace(
    /[^a-zA-Z0-9._-]/g,
    '_'
  );

  // 1. Check direct local PDF path
  const pastpaperCandidate = path.resolve(process.cwd(), '../pastpaper', filePathOrName);
  if (fs.existsSync(filePathOrName) && fs.statSync(filePathOrName).isFile()) {
    const stat = fs.statSync(filePathOrName);
    const info = { diskPath: filePathOrName, fileSize: stat.size };
    resolvedPathCache.set(cacheKey, info);
    return info;
  }
  if (fs.existsSync(pastpaperCandidate) && fs.statSync(pastpaperCandidate).isFile()) {
    const stat = fs.statSync(pastpaperCandidate);
    const info = { diskPath: pastpaperCandidate, fileSize: stat.size };
    resolvedPathCache.set(cacheKey, info);
    return info;
  }

  // 2. Check local compressed binary (.bin) in ../pastpaper_bin
  if (paper?.aura_uuid) {
    const binCandidate = path.resolve(
      process.cwd(),
      '../pastpaper_bin',
      paper.department || 'B.TECH',
      `${paper.aura_uuid}.bin`
    );
    const inflatedCachePath = path.join(
      STORAGE_PAPERS_DIR,
      `bin_${paper.id || paper.aura_uuid.slice(0, 8)}_${safeFileName}`
    );
    if (fs.existsSync(inflatedCachePath) && fs.statSync(inflatedCachePath).size > 1000) {
      const stat = fs.statSync(inflatedCachePath);
      const info = { diskPath: inflatedCachePath, fileSize: stat.size };
      resolvedPathCache.set(cacheKey, info);
      return info;
    }
    if (fs.existsSync(binCandidate)) {
      try {
        const compressed = fs.readFileSync(binCandidate);
        const pdfBuf = zlib.inflateSync(compressed);
        fs.writeFileSync(inflatedCachePath, pdfBuf);
        const info = { diskPath: inflatedCachePath, fileSize: pdfBuf.length };
        resolvedPathCache.set(cacheKey, info);
        return info;
      } catch {}
    }
  }

  // 3. Check Neon PostgreSQL compressed binary (file_blob BYTEA)
  if (paper?.id) {
    const dbCachePath = path.join(STORAGE_PAPERS_DIR, `db_${paper.id}_${safeFileName}`);
    if (fs.existsSync(dbCachePath) && fs.statSync(dbCachePath).size > 1000) {
      const stat = fs.statSync(dbCachePath);
      const info = { diskPath: dbCachePath, fileSize: stat.size };
      resolvedPathCache.set(cacheKey, info);
      return info;
    }
    try {
      const db = await getDb();
      const blobRes = await db.query(
        'SELECT file_blob FROM papers WHERE id = $1 AND file_blob IS NOT NULL LIMIT 1',
        [Number(paper.id)]
      );
      if (blobRes.rowCount > 0 && blobRes.rows[0].file_blob) {
        const rawBlob = blobRes.rows[0].file_blob;
        const pdfBuf =
          rawBlob[0] === 0x25 && rawBlob[1] === 0x50
            ? rawBlob
            : zlib.inflateSync(Buffer.from(rawBlob));
        fs.writeFileSync(dbCachePath, pdfBuf);
        const info = { diskPath: dbCachePath, fileSize: pdfBuf.length };
        resolvedPathCache.set(cacheKey, info);
        return info;
      }
    } catch {}
  }

  // 4. Handle remote AURA bitstream URLs with Singleflight Local Disk Caching
  if (/^https?:\/\//i.test(filePathOrName)) {
    const localDiskPath = path.join(
      STORAGE_PAPERS_DIR,
      `aura_${paper?.id || crypto.createHash('md5').update(filePathOrName).digest('hex').slice(0, 8)}_${safeFileName}`
    );

    if (fs.existsSync(localDiskPath)) {
      const stat = fs.statSync(localDiskPath);
      if (stat.size > 1000) {
        const info = { diskPath: localDiskPath, fileSize: stat.size };
        resolvedPathCache.set(cacheKey, info);
        return info;
      }
    }

    let downloadPromise = inFlightAuraDownloads.get(localDiskPath);
    if (!downloadPromise) {
      downloadPromise = (async () => {
        const res = await fetch(filePathOrName);
        if (!res.ok) {
          throw new Error(`AURA bitstream HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localDiskPath, buf);
        return { diskPath: localDiskPath, fileSize: buf.length };
      })().finally(() => {
        inFlightAuraDownloads.delete(localDiskPath);
      });
      inFlightAuraDownloads.set(localDiskPath, downloadPromise);
    }

    try {
      const info = await downloadPromise;
      resolvedPathCache.set(cacheKey, info);
      return info;
    } catch {
      return null;
    }
  }

  return resolvePdfDiskInfo(filePathOrName);
}

export function resolvePdfDiskInfo(filePathOrName) {
  if (!filePathOrName) return null;
  const cached = resolvedPathCache.get(filePathOrName);
  if (cached) return cached;

  if (fs.existsSync(filePathOrName) && fs.statSync(filePathOrName).isFile()) {
    const stat = fs.statSync(filePathOrName);
    const info = { diskPath: filePathOrName, fileSize: stat.size };
    resolvedPathCache.set(filePathOrName, info);
    return info;
  }

  const base = path.basename(filePathOrName);
  let foundPath = null;
  const candidate1 = path.join(STORAGE_PAPERS_DIR, base);
  if (fs.existsSync(candidate1)) {
    foundPath = candidate1;
  } else {
    const allFiles = fs.readdirSync(STORAGE_PAPERS_DIR);
    const found = allFiles.find(
      (f) => f.toLowerCase() === base.toLowerCase() || f.toLowerCase().endsWith(base.toLowerCase())
    );
    if (found) foundPath = path.join(STORAGE_PAPERS_DIR, found);
  }

  if (!foundPath) {
    const fallbackPdfPath = path.join(
      STORAGE_PAPERS_DIR,
      base.endsWith('.pdf') ? base : `${base}.pdf`
    );
    if (!fs.existsSync(fallbackPdfPath)) {
      const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 88 >> stream
BT /F1 16 Tf 72 700 Td (Learn JKLU Archive - ${base.replace(/[()\\]/g, '')}) Tj ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000297 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
435
%%EOF`;
      fs.writeFileSync(fallbackPdfPath, minimalPdf);
    }
    foundPath = fallbackPdfPath;
  }

  const stat = fs.statSync(foundPath);
  const info = { diskPath: foundPath, fileSize: stat.size };
  resolvedPathCache.set(filePathOrName, info);
  return info;
}

export function streamPdfWithByteRange(req, res, diskInfo, downloadName, disposition) {
  const { diskPath, fileSize } = diskInfo;
  const safeName = downloadName.replace(/[^a-zA-Z0-9._ -]/g, '_');

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(fileSize - 1, parseInt(parts[1], 10)) : fileSize - 1;
    if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      return;
    }
    const chunksize = end - start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);
    fs.createReadStream(diskPath, { start, end }).pipe(res);
  } else {
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(diskPath).pipe(res);
  }
}
