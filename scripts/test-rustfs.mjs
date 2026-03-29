import { S3Client, PutObjectCommand, HeadBucketCommand, ListObjectsV2Command, ListBucketsCommand } from '@aws-sdk/client-s3';

// RustFS instance — S3-compatible, same SDK as MinIO
const client = new S3Client({
  region: 'cn-east-1',
  credentials: {
    accessKeyId: 'uh32IdeOj0ZT8DtX6lMm',
    secretAccessKey: 'aIK3s6U4PlYuVrvGTAR5fXHZiq2SNJMEgykwtpx1',
  },
  endpoint: 'http://161.97.178.128:9101',
  forcePathStyle: true,
});

const BUCKET = 'trade-directory';

async function test() {
  console.log('Testing RustFS connection at http://161.97.178.128:9101...\n');

  // 1. List buckets
  try {
    const result = await client.send(new ListBucketsCommand({}));
    console.log('✓ Auth OK — buckets:', result.Buckets?.map(b => b.Name).join(', ') || 'none');
  } catch (err) {
    console.error(`✗ ListBuckets failed: ${err.message} (HTTP ${err.$metadata?.httpStatusCode})`);
  }

  // 2. Check trade-directory bucket
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`✓ Bucket "${BUCKET}" accessible`);
  } catch (err) {
    console.error(`✗ Bucket check failed: ${err.message} (HTTP ${err.$metadata?.httpStatusCode})`);
    return;
  }

  // 3. Upload test file
  try {
    const key = `business-documents/kiro-test-${Date.now()}.txt`;
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(`RustFS test - ${new Date().toISOString()}`),
      ContentType: 'text/plain',
    }));
    console.log(`✓ Upload OK → http://161.97.178.128:9101/${BUCKET}/${key}`);
  } catch (err) {
    console.error(`✗ Upload failed: ${err.message}`);
  }

  // 4. List objects
  try {
    const result = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 5 }));
    console.log(`✓ List OK — ${result.KeyCount ?? 0} objects`);
    result.Contents?.forEach(o => console.log(`  - ${o.Key}`));
  } catch (err) {
    console.error(`✗ List failed: ${err.message}`);
  }
}

test();
