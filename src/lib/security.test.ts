import test from 'node:test';
import assert from 'node:assert';
import { validateMerchantUrl, generateAuditDigest } from './security';

test('validateMerchantUrl: allows valid public domains', () => {
  const result1 = validateMerchantUrl('https://example.com');
  assert.strictEqual(result1.valid, true);
  assert.strictEqual(result1.normalizedUrl, 'https://example.com/');

  const result2 = validateMerchantUrl('shop.mybrand.co.uk/store');
  assert.strictEqual(result2.valid, true);
  assert.strictEqual(result2.normalizedUrl, 'https://shop.mybrand.co.uk/store');
});

test('validateMerchantUrl: blocks private IP ranges (SSRF)', () => {
  const loopback = validateMerchantUrl('http://127.0.0.1:8080');
  assert.strictEqual(loopback.valid, false);
  assert.match(loopback.error || '', /blocked for security/i);

  const localClassA = validateMerchantUrl('http://10.0.0.5/api');
  assert.strictEqual(localClassA.valid, false);

  const localClassC = validateMerchantUrl('http://192.168.1.1/admin');
  assert.strictEqual(localClassC.valid, false);

  const metadataAWS = validateMerchantUrl('http://169.254.169.254/latest/meta-data/');
  assert.strictEqual(metadataAWS.valid, false);
});

test('validateMerchantUrl: blocks localhost and internal hostnames', () => {
  const lh = validateMerchantUrl('http://localhost:3000');
  assert.strictEqual(lh.valid, false);

  const metaGoogle = validateMerchantUrl('http://metadata.google.internal/computeMetadata/v1/');
  assert.strictEqual(metaGoogle.valid, false);

  const internalDomain = validateMerchantUrl('http://service.internal');
  assert.strictEqual(internalDomain.valid, false);
});

test('validateMerchantUrl: blocks non-HTTP/HTTPS protocols', () => {
  const ftp = validateMerchantUrl('ftp://example.com/files');
  assert.strictEqual(ftp.valid, false);
  assert.match(ftp.error || '', /not allowed/i);

  const file = validateMerchantUrl('file:///etc/passwd');
  assert.strictEqual(file.valid, false);
});

test('validateMerchantUrl: blocks credentials in URL', () => {
  const creds = validateMerchantUrl('https://admin:secret@malicious.com');
  assert.strictEqual(creds.valid, false);
  assert.match(creds.error || '', /credentials/i);
});

test('generateAuditDigest: produces deterministic authentic SHA-256 digest', () => {
  const digest1 = generateAuditDigest({
    domain: 'example.com',
    verdict: 'APPROVED',
    reviewerId: 'ANALYST-01',
    timestamp: '2026-11-10T05:00:00.000Z',
  });
  const digest2 = generateAuditDigest({
    domain: 'example.com',
    verdict: 'APPROVED',
    reviewerId: 'ANALYST-01',
    timestamp: '2026-11-10T05:00:00.000Z',
  });
  assert.strictEqual(digest1, digest2);
  assert.match(digest1, /^EV-[0-9A-F]{16}$/);
});
