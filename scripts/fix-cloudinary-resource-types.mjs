/**
 * Fix Cloudinary resource_type mismatches.
 *
 * Problem: Files uploaded via "auto/upload" endpoint may have been stored
 * as the wrong resource_type (e.g. PDFs stored as "image" instead of "raw"),
 * causing URLs to break after CDN cache expiry.
 *
 * This script:
 * 1. Scans DB for all Cloudinary URLs (res.cloudinary.com)
 * 2. Checks each URL — if it returns 4xx, re-uploads the file with correct resource_type
 * 3. Updates the DB with the new working URL
 *
 * Run on the server:
 *   node scripts/fix-cloudinary-resource-types.mjs
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing Cloudinary env vars.');
  process.exit(1);
}

function isCloudinaryUrl(url) {
  return url && url.includes('res.cloudinary.com');
}

function isLocalUrl(url) {
  return url && (url.startsWith('/api/files/') || url.startsWith('/uploads/'));
}

/** Check if a Cloudinary URL is actually accessible */
async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Re-upload a file from its Cloudinary URL to fix resource_type.
 * Downloads the file from Cloudinary (if still accessible via raw endpoint)
 * and re-uploads with the correct resource_type.
 */
async function reuploadFromCloudinary(brokenUrl, mimeType) {
  // Try to fetch the file — try both image and raw delivery URLs
  const urlVariants = [brokenUrl];

  // If it's a PDF URL that was stored as image type, try the raw variant
  if (brokenUrl.includes('/image/upload/')) {
    urlVariants.push(brokenUrl.replace('/image/upload/', '/raw/upload/'));
  }
  if (brokenUrl.includes('/raw/upload/')) {
    urlVariants.push(brokenUrl.replace('/raw/upload/', '/image/upload/'));
  }

  let fileBuffer = null;
  for (const variant of urlVariants) {
    try {
      const res = await fetch(variant);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        console.log(`  ↓ Downloaded from: ${variant}`);
        break;
      }
    } catch { /* try next */ }
  }

  if (!fileBuffer) {
    console.log(`  ✗ Could not download file from any URL variant`);
    return null;
  }

  return await uploadBufferToCloudinary(fileBuffer, brokenUrl.split('/').pop(), mimeType);
}

async function uploadBufferToCloudinary(buffer, filename, mimeType) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'business-documents';
  const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
  const paramString = `folder=${folder}&resource_type=${resourceType}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(paramString + API_SECRET).digest('hex');

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, filename || 'file');
  formData.append('api_key', API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('resource_type', resourceType);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST', body: formData,
  });

  if (!res.ok) throw new Error(`Cloudinary upload failed: ${await res.text()}`);
  const data = await res.json();
  let url = data.secure_url;
  if (resourceType === 'raw' && !url.endsWith('.pdf')) url = `${url}.pdf`;
  return url;
}

function getMimeType(url) {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  const map = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  return map[ext] || (url.includes('.pdf') ? 'application/pdf' : 'image/jpeg');
}

async function checkAndFix(table, id, field, url) {
  if (!isCloudinaryUrl(url)) return 'skip';

  const ok = await checkUrl(url);
  if (ok) return 'ok';

  console.log(`  ✗ Broken URL for ${table}.${field} [${id}]: ${url}`);
  const mimeType = getMimeType(url);

  try {
    const newUrl = await reuploadFromCloudinary(url, mimeType);
    if (!newUrl) return 'missing';

    await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "${field}" = $1 WHERE id = $2`, newUrl, id);
    console.log(`  ✓ Fixed → ${newUrl}`);
    return 'fixed';
  } catch (e) {
    console.error(`  ✗ Fix failed: ${e.message}`);
    return 'error';
  }
}

async function main() {
  console.log('Scanning for broken Cloudinary URLs...\n');
  const counts = { ok: 0, fixed: 0, missing: 0, error: 0, skip: 0 };

  const businesses = await prisma.business.findMany({
    select: { id: true, logoUrl: true, registrationCertificateUrl: true, pinCertificateUrl: true, kenyanNationalIdUrl: true, incorporationCertificateUrl: true, exportLicenseUrl: true },
  });

  for (const b of businesses) {
    for (const field of ['logoUrl', 'registrationCertificateUrl', 'pinCertificateUrl', 'kenyanNationalIdUrl', 'incorporationCertificateUrl', 'exportLicenseUrl']) {
      if (!b[field]) { counts.skip++; continue; }
      const result = await checkAndFix('businesses', b.id, field, b[field]);
      counts[result]++;
    }
  }

  const certs = await prisma.businessCertification.findMany({ select: { id: true, imageUrl: true, logoUrl: true } });
  for (const c of certs) {
    for (const field of ['imageUrl', 'logoUrl']) {
      if (!c[field]) { counts.skip++; continue; }
      const result = await checkAndFix('business_certifications', c.id, field, c[field]);
      counts[result]++;
    }
  }

  const products = await prisma.product.findMany({ select: { id: true, imageUrl: true } });
  for (const p of products) {
    if (!p.imageUrl) { counts.skip++; continue; }
    const result = await checkAndFix('products', p.id, 'imageUrl', p.imageUrl);
    counts[result]++;
  }

  console.log(`\nDone. OK: ${counts.ok} | Fixed: ${counts.fixed} | Missing: ${counts.missing} | Error: ${counts.error} | Skipped: ${counts.skip}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
