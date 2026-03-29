// Set trade-directory bucket to public read so files are accessible via URL
import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'cn-east-1',
  credentials: {
    accessKeyId: 'uh32IdeOj0ZT8DtX6lMm',
    secretAccessKey: 'aIK3s6U4PlYuVrvGTAR5fXHZiq2SNJMEgykwtpx1',
  },
  endpoint: 'http://161.97.178.128:9101',
  forcePathStyle: true,
});

const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::trade-directory/*',
    },
  ],
};

try {
  await client.send(new PutBucketPolicyCommand({
    Bucket: 'trade-directory',
    Policy: JSON.stringify(policy),
  }));
  console.log('✓ Bucket policy set to public read');
  console.log('  Files are now accessible at: http://161.97.178.128:9101/trade-directory/<key>');
} catch (err) {
  console.error('✗ Failed to set policy:', err.message);
  console.log('\nAlternative: Set bucket to public via RustFS console:');
  console.log('  http://161.97.178.128:9101/rustfs/console/browser/');
  console.log('  → Buckets → trade-directory → Access Policy → Set to Public');
}
