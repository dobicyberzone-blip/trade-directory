/**
 * Migration script: re-upload local files to Cloudinary
 * 
 * Run on the server BEFORE deploying new code:
 *   node scripts/migrate-uploads-to-cloudinary.mjs
 * 
 * This scans the DB for /api/files/ URLs, finds the file on disk,
 * uploads it to Cloudinary, and updates the DB record.
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const prisma = new PrismaClient();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing Cloudinary env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

// Search roots — same as the file serving route
const ROOTS = [
  process.env.UPLOAD_DIR,
  '/data/uploads',
  '/app/uploads',
  join(process.cwd(), 'uploads'),
  join(process.cwd(), 'public', 'uploads'),
].filter(Boolean);

const SUBDIRS = ['business-documents', 'chat', 'products', 'logos', 'certifications'];

function findFile(relativePath) {
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

async function uploadToCloudinary(filePath, mimeType) {
  const buffer = readFileSync(filePath);
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'business-documents';
  const paramString = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(paramString + API_SECRET).digest('hex');

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, filePath.split('/').pop());
  formData.append('api_key', API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) throw new Error(`Cloudinary error: ${await res.text()}`);
  const data = await res.json();
  return data.secure_url;
}

function getMimeType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', jfif: 'image/jpeg' };
  return map[ext] || 'application/octet-stream';
}

function isLocalUrl(url) {
  return url && (url.startsWith('/api/files/') || url.startsWith('/uploads/'));
}

function urlToRelativePath(url) {
  // /api/files/business-documents/file.pdf -> business-documents/file.pdf
  return url.replace('/api/files/', '').replace('/uploads/', '');
}

async function migrateField(table, id, field, url) {
  const relativePath = urlToRelativePath(url);
  const filePath = findFile(relativePath);
  if (!filePath) {
    console.log(`  ⚠ File not found on disk: ${relativePath}`);
    return false;
  }
  try {
    const cloudUrl = await uploadToCloudinary(filePath, getMimeType(filePath));
    await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "${field}" = $1 WHERE id = $2`, cloudUrl, id);
    console.log(`  ✓ ${field}: ${relativePath} → ${cloudUrl}`);
    return true;
  } catch (e) {
    console.error(`  ✗ ${field}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('Scanning database for local file URLs...\n');
  let migrated = 0, missing = 0, skipped = 0;

  // Business fields
  const businesses = await prisma.business.findMany({
    select: {
      id: true, logoUrl: true, registrationCertificateUrl: true, pinCertificateUrl: true,
      kenyanNationalIdUrl: true, incorporationCertificateUrl: true, exportLicenseUrl: true,
    },
  });

  for (const b of businesses) {
    const fields = ['logoUrl', 'registrationCertificateUrl', 'pinCertificateUrl', 'kenyanNationalIdUrl', 'incorporationCertificateUrl', 'exportLicenseUrl'];
    for (const field of fields) {
      const url = b[field];
      if (!url || !isLocalUrl(url)) { skipped++; continue; }
      console.log(`Business ${b.id} — ${field}`);
      const ok = await migrateField('businesses', b.id, field, url);
      ok ? migrated++ : missing++;
    }
  }

  // Business certifications
  const certs = await prisma.businessCertification.findMany({ select: { id: true, imageUrl: true, logoUrl: true } });
  for (const c of certs) {
    for (const field of ['imageUrl', 'logoUrl']) {
      const url = c[field];
      if (!url || !isLocalUrl(url)) { skipped++; continue; }
      console.log(`Certification ${c.id} — ${field}`);
      const ok = await migrateField('business_certifications', c.id, field, url);
      ok ? migrated++ : missing++;
    }
  }

  // Products
  const products = await prisma.product.findMany({ select: { id: true, imageUrl: true } });
  for (const p of products) {
    if (!p.imageUrl || !isLocalUrl(p.imageUrl)) { skipped++; continue; }
    console.log(`Product ${p.id} — imageUrl`);
    const ok = await migrateField('products', p.id, 'imageUrl', p.imageUrl);
    ok ? migrated++ : missing++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Missing on disk: ${missing}, Already cloud/skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
