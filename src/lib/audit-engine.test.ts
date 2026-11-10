import test from 'node:test';
import assert from 'node:assert';
import { runMerchantAudit } from './audit-engine';

test('runMerchantAudit: forceMock: true returns mock fixtures as requested', async () => {
  const d2cResult = await runMerchantAudit({
    url: 'https://auraglow-organics.com',
    forceMock: true,
  });
  assert.strictEqual(d2cResult.domain, 'auraglow-organics.com');
  assert.strictEqual(d2cResult.status, 'COMPLIANT');

  const pharmaResult = await runMerchantAudit({
    url: 'https://ultra-ketomax-rapidburn.xyz',
    forceMock: true,
  });
  assert.strictEqual(pharmaResult.status, 'HIGH_RISK');
});

test('runMerchantAudit: forceMock: false does not silently hijack URLs containing keywords', async () => {
  // If forceMock is false, it should attempt real scrape rather than silently returning mock fixtures
  // Without FIRECRAWL_API_KEY set, it should throw an error rather than returning a fake successful fixture
  const originalKey = process.env.FIRECRAWL_API_KEY;
  try {
    delete process.env.FIRECRAWL_API_KEY;
    await assert.rejects(
      async () => {
        await runMerchantAudit({
          url: 'https://keto-store.example.com',
          forceMock: false,
        });
      },
      /Firecrawl API key is not configured/i
    );
  } finally {
    if (originalKey) process.env.FIRECRAWL_API_KEY = originalKey;
  }
});
