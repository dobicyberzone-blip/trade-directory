import { S3Client, PutObjectCommand, HeadBucketCommand, ListObjectsV2Command, ListBucketsCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'RiQEjTyN888uymNvfDBg',
    secretAccessKey: 'KVWVrXuTGa8LKMAFVHgHrFTujiZQCrsBpCqJSAEQ',
  },
  endpoint: 'https://minio-00.161.97.178.128.sslip.io',
  forcePathStyle: true,
  tls: false,
});

const BUCKET = 'trade-directory';

async function test() {
  console.log('Testing MinIO connection...\n');

  // 0. List all buckets first
  try {
    const result = await client.send(new ListBucketsCommand({}));
    console.log('✓ Auth works — buckets:', result.Buckets?.map(b => b.Name).join(', ') || 'none');
  } catch (err) {
    console.error(`✗ ListBuckets failed: ${err.message} (HTTP ${err.$metadata?.httpStatusCode})`);
  }

  // 1. Check bucket exists
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`✓ Bucket "${BUCKET}" exists and is accessible`);
  } catch (err) {
    console.error(`✗ Bucket check failed: ${err.message}`);
    if (err.$metadata) console.error('  HTTP Status:', err.$metadata.httpStatusCode);
    if (err.Code) console.error('  Code:', err.Code);
    console.error('  Full error:', JSON.stringify(err, null, 2));
    process.exit(1);
  }

  // 2. Upload a test file
  try {
    const key = `test/kiro-test-${Date.now()}.txt`;
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(`MinIO test from Kiro - ${new Date().toISOString()}`),
      ContentType: 'text/plain',
    }));
    console.log(`✓ Upload successful`);
    console.log(`  URL: https://minio-00.161.97.178.128.sslip.io/${BUCKET}/${key}`);
  } catch (err) {
    console.error(`✗ Upload failed: ${err.message}`);
  }

  // 3. List objects
  try {
    const result = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 5 }));
    console.log(`✓ Bucket listing works — ${result.KeyCount ?? 0} objects found (showing up to 5)`);
    result.Contents?.forEach(obj => console.log(`  - ${obj.Key} (${obj.Size} bytes)`));
  } catch (err) {
    console.error(`✗ List failed: ${err.message}`);
  }
}

test();
