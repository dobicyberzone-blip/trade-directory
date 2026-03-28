/**
 * Migration script: re-upload local/Cloudinary files to RustFS
 *
 * Run on the server:
 *   node scripts/migrate-uploads-to-rustfs.mjs
 *
 * Scans the DB for /api/files/ and res.cloudinary.com URLs,
 * uploads them to RustFS, and updates the DB records.
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

const ENDPOINT   = process.env.RUSTFS_ENDPOINT_URL;
const ACCESS_KEY = process.env.RUSTFS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.RUSTFS_SECRET_ACCESS_KEY;
const BUCKET     = process.env.RUSTFS_BUCKET || 'trade-directory';
const PUBLIC_URL = process.env.RUSTFS_PUBLIC_URL || ENDPOINT;

if (!ENDPOINT || !ACCESS_KEY || !SECRET_KEY) {
  console.error('Missing RUSTFS_ENDPOINT_URL, RUSTFS_ACCESS_KEY_ID, or RUSTFS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  endpoint: ENDPOINT,
  forcePathStyle: true,
});

async function uploadToRustFS(buffer, key, mimeType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
  return `${PUBLIC_URL.replace(/\/$/, '')}/${BUCKET}/${key}`;
}

const ROOTS = [
  process.env.UPLOAD_DIR,
  '/data/uploads',
  '/app/uploads',
  join(process.cwd(), 'uploads'),
  join(process.cwd(), 'public', 'uploads'),
].filter(Boolean);

const SUBDIRS = ['business-documents', 'chat', 'products', 'logos', 'certifications'];

function findLocalFile(relativePath) {
  const filename = relativePath.split('/').pop();
  const candidates = [];
  for (const root of ROOTS) {
    candidates.push(resolve(join(root, relativePath)));
    candidates.push(resolve(join(root, filename)));
    for (const sub of SUBDIRS) {
      candidates.push(resolve(join(root, sub, filename)));
    }
  }
  return candidates.find(p => existsSync(p)) || null;
}

function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', jfif: 'image/jpeg' };
  return map[ext] || 'application/octet-stream';
}

function isLocalUrl(url) {
  return url && (url.startsWith('/api/files/') || url.startsWith('/uploads/'));
}

function isCloudinaryUrl(url) {
  return url && url.includes('res.cloudinary.com');
}

function isRustFSUrl(url) {
  return url && (url.includes(BUCKET) || url.includes('rustfs') || url.startsWith(PUBLIC_URL));
}

async function getBuffer(url, relativePath) {
  // Try local disk first
  if (relativePath) {
    const localPath = findLocalFile(relativePath);
    if (localPath) return { buffer: readFileSync(localPath), filename: localPath.split('/').pop() };
  }

  // Try fetching from URL (Cloudinary or other)
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return { buffer: Buffer.from(ab), filename: url.split('/').pop().split('?')[0] };
      }
    } catch { /* fall through */ }
  }

  return null;
}

async function migrateField(table, id, field, url) {
  if (!url || isRustFSUrl(url)) return 'skip';

  const relativePath = isLocalUrl(url)
    ? url.replace('/api/files/', '').replace('/uploads/', '')
    : null;

  const filename = relativePath
    ? relativePath.split('/').pop()
    : url.split('/').pop().split('?')[0];

  const result = await getBuffer(url, relativePath);
  if (!result) {
    console.log(`  ⚠ Cannot retrieve: ${url}`);
    return 'missing';
  }

  const mimeType = getMimeType(result.filename || filename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = (result.filename || filename).split('.').pop() || 'bin';
  const key = `business-documents/${timestamp}-${random}.${ext}`;

  try {
    const newUrl = await uploadToRustFS(result.buffer, key, mimeType);
    await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "${field}" = $1 WHERE id = $2`, newUrl, id);
    console.log(`  ✓ ${field}: → ${newUrl}`);
    return 'migrated';
  } catch (e) {
    console.error(`  ✗ ${field}: ${e.message}`);
    return 'error';
  }
}

async function main() {
  console.log(`Migrating files to RustFS (${ENDPOINT}/${BUCKET})...\n`);
  const counts = { migrated: 0, missing: 0, error: 0, skip: 0 };

  const businesses = await prisma.business.findMany({
    select: { id: true, logoUrl: true, registrationCertificateUrl: true, pinCertificateUrl: true, kenyanNationalIdUrl: true, incorporationCertificateUrl: true, exportLicenseUrl: true },
  });

  for (const b of businesses) {
    for (const field of ['logoUrl', 'registrationCertificateUrl', 'pinCertificateUrl', 'kenyanNationalIdUrl', 'incorporationCertificateUrl', 'exportLicenseUrl']) {
      if (!b[field]) { counts.skip++; continue; }
      process.stdout.write(`Business ${b.id.slice(-6)} — ${field}: `);
      const r = await migrateField('businesses', b.id, field, b[field]);
      counts[r]++;
    }
  }

  const certs = await prisma.businessCertification.findMany({ select: { id: true, imageUrl: true, logoUrl: true } });
  for (const c of certs) {
    for (const field of ['imageUrl', 'logoUrl']) {
      if (!c[field]) { counts.skip++; continue; }
      process.stdout.write(`Cert ${c.id.slice(-6)} — ${field}: `);
      const r = await migrateField('business_certifications', c.id, field, c[field]);
      counts[r]++;
    }
  }

  const products = await prisma.product.findMany({ select: { id: true, imageUrl: true } });
  for (const p of products) {
    if (!p.imageUrl) { counts.skip++; continue; }
    process.stdout.write(`Product ${p.id.slice(-6)} — imageUrl: `);
    const r = await migrateField('products', p.id, 'imageUrl', p.imageUrl);
    counts[r]++;
  }

  console.log(`\nDone. Migrated: ${counts.migrated} | Missing: ${counts.missing} | Error: ${counts.error} | Skipped: ${counts.skip}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
