// Test upload directly to MinIO using the same logic as the app
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'RiQEjTyN888uymNvfDBg',
    secretAccessKey: 'KVWVrXuTGa8LKMAFVHgHrFTujiZQCrsBpCqJSAEQ',
  },
  endpoint: 'https://minio-00.161.97.178.128.sslip.io',
  forcePathStyle: true,
});

const BUCKET = 'trade-directory';

// Simulate what the upload route does
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const timestamp = Date.now();
const random = Math.random().toString(36).substring(2, 12);
const key = `business-documents/${timestamp}-${random}.png`;

console.log('Testing MinIO upload (simulating app upload route)...\n');

try {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: pngBuffer,
    ContentType: 'image/png',
  }));

  const url = `https://minio-00.161.97.178.128.sslip.io/${BUCKET}/${key}`;
  console.log('✓ Upload successful');
  console.log('  Key:', key);
  console.log('  URL:', url);
  console.log('\n✓ MinIO upload pipeline is working correctly.');
  console.log('  Once server is redeployed with correct .env, uploads will go to MinIO.');
} catch (err) {
  console.error('✗ Upload failed:', err.message);
}
