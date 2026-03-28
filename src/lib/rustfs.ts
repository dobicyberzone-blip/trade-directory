/**
 * RustFS S3-compatible object storage client
 * Replaces Cloudinary for all file uploads
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const RUSTFS_ENDPOINT   = process.env.RUSTFS_ENDPOINT_URL!;
const RUSTFS_ACCESS_KEY = process.env.RUSTFS_ACCESS_KEY_ID!;
const RUSTFS_SECRET_KEY = process.env.RUSTFS_SECRET_ACCESS_KEY!;
const RUSTFS_BUCKET     = process.env.RUSTFS_BUCKET || 'trade-directory';
const RUSTFS_PUBLIC_URL = process.env.RUSTFS_PUBLIC_URL || RUSTFS_ENDPOINT;

export const rustfsClient = new S3Client({
  region: 'us-east-1', // RustFS ignores region but S3Client requires it
  credentials: {
    accessKeyId: RUSTFS_ACCESS_KEY,
    secretAccessKey: RUSTFS_SECRET_KEY,
  },
  endpoint: RUSTFS_ENDPOINT,
  forcePathStyle: true, // Required for S3-compatible stores (MinIO/RustFS)
});

export const BUCKET = RUSTFS_BUCKET;

/**
 * Upload a buffer to RustFS and return the public URL.
 */
export async function uploadToRustFS(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  await rustfsClient.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  // Return the public URL: endpoint/bucket/key
  const base = RUSTFS_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/${BUCKET}/${key}`;
}

/**
 * Delete an object from RustFS by its key.
 */
export async function deleteFromRustFS(key: string): Promise<void> {
  await rustfsClient.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Check if an object exists in RustFS.
 */
export async function existsInRustFS(key: string): Promise<boolean> {
  try {
    await rustfsClient.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract the RustFS key from a full URL.
 * e.g. http://161.97.178.128:9000/trade-directory/business-documents/file.pdf
 *   → business-documents/file.pdf
 */
export function urlToKey(url: string): string | null {
  try {
    const u = new URL(url);
    // Path is /<bucket>/<key...>
    const parts = u.pathname.replace(/^\//, '').split('/');
    if (parts[0] === BUCKET) return parts.slice(1).join('/');
    return parts.join('/');
  } catch {
    return null;
  }
}

export function isRustFSUrl(url: string): boolean {
  if (!url) return false;
  const endpoint = RUSTFS_PUBLIC_URL || RUSTFS_ENDPOINT;
  return url.startsWith(endpoint) || url.includes(BUCKET);
}
