import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const PASTPAPER_DIR = path.resolve(process.cwd(), '../pastpaper');
const BINARY_OUT_DIR = path.resolve(process.cwd(), '../pastpaper_bin');
const CATALOG_PATH = path.join(PASTPAPER_DIR, 'aura_catalog.json');

async function main() {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Catalog not found at ${CATALOG_PATH}`);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  console.log(`📦 Converting ${catalog.length} PDFs to compressed binary (.bin) in ${BINARY_OUT_DIR} ...`);

  if (fs.existsSync(BINARY_OUT_DIR)) {
    fs.rmSync(BINARY_OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BINARY_OUT_DIR, { recursive: true });

  let totalRawBytes = 0;
  let totalBinBytes = 0;
  let convertedCount = 0;
  const manifest = [];

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    const pdfAbsPath = path.join(PASTPAPER_DIR, item.local_path);
    if (!fs.existsSync(pdfAbsPath)) continue;

    const rawPdfBuffer = fs.readFileSync(pdfAbsPath);
    const md5 = crypto.createHash('md5').update(rawPdfBuffer).digest('hex');

    // Compress PDF buffer into compact binary (.bin) using zlib deflate
    const compressedBinary = zlib.deflateSync(rawPdfBuffer, { level: 9 });

    const deptDir = path.join(BINARY_OUT_DIR, item.department || 'B.TECH');
    fs.mkdirSync(deptDir, { recursive: true });

    const binFileName = `${item.uuid}.bin`;
    const binRelPath = path.join(item.department || 'B.TECH', binFileName);
    const binAbsPath = path.join(BINARY_OUT_DIR, binRelPath);

    fs.writeFileSync(binAbsPath, compressedBinary);

    totalRawBytes += rawPdfBuffer.length;
    totalBinBytes += compressedBinary.length;
    convertedCount++;

    manifest.push({
      id: i + 1,
      uuid: item.uuid,
      title: item.title,
      department: item.department,
      semester: item.semester,
      year: item.year,
      paper_type: item.paper_type,
      abstract: item.abstract,
      issued: item.issued,
      file_name: item.file_name,
      bin_path: binRelPath,
      local_pdf_path: item.local_path,
      bitstream_url: item.bitstream_url,
      raw_size_bytes: rawPdfBuffer.length,
      bin_size_bytes: compressedBinary.length,
      checksum_md5: md5,
    });

    if (convertedCount % 250 === 0 || convertedCount === catalog.length) {
      console.log(
        `   ⚡ Converted ${convertedCount}/${catalog.length} PDFs -> .bin | Raw: ${(
          totalRawBytes /
          1024 /
          1024
        ).toFixed(1)} MB | Binary (.bin): ${(totalBinBytes / 1024 / 1024).toFixed(1)} MB`
      );
    }
  }

  const manifestPath = path.join(BINARY_OUT_DIR, 'binary_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const savedMB = (totalRawBytes - totalBinBytes) / 1024 / 1024;
  const ratio = totalRawBytes > 0 ? ((1 - totalBinBytes / totalRawBytes) * 100).toFixed(1) : '0.0';

  console.log(`\n✅ ALL ${convertedCount} PDFS CONVERTED TO LOCAL BINARY (.bin)!`);
  console.log(`   📁 Binary Directory  : ${BINARY_OUT_DIR}`);
  console.log(`   📄 Manifest Index    : ${manifestPath}`);
  console.log(`   📊 Raw PDF Size      : ${(totalRawBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   🗜️  Compressed Binary : ${(totalBinBytes / 1024 / 1024).toFixed(2)} MB (Saved ${savedMB.toFixed(2)} MB / ${ratio}%)`);
}

main().catch((err) => {
  console.error('❌ Conversion failed:', err);
  process.exit(1);
});
