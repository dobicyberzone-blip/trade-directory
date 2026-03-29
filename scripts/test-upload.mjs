import https from 'https';

const boundary = '----TestBoundary' + Date.now();
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="kiro-test.png"\r\nContent-Type: image/png\r\n\r\n`),
  pngBuffer,
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

const options = {
  hostname: 'trade-directory-161.97.178.128.sslip.io',
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
  rejectUnauthorized: false,
};

console.log('Testing file upload to live server...\n');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      if (json.url) {
        console.log('✓ Upload successful!');
        console.log('  URL:', json.url);
        const isMinIO = json.url.includes('minio-00');
        const isBase64 = json.url.startsWith('data:');
        if (isMinIO) console.log('  ✓ Stored in MinIO');
        else if (isBase64) console.log('  ⚠ Stored as base64 (MinIO not active on server yet)');
        else console.log('  ⚠ Stored locally:', json.url);
      } else {
        console.log('✗ Upload failed:', json.error || data);
      }
    } catch {
      console.log('Response:', data);
    }
  });
});

req.on('error', e => console.error('✗ Request error:', e.message));
req.write(body);
req.end();
