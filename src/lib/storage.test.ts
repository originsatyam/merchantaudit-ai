import test from 'node:test';
import assert from 'node:assert';
import { saveReviewPack, loadReviewPack, clearReviewPack, getRecentReviewsList } from './storage';

// Setup minimal localStorage mock for Node test environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

(globalThis as unknown as { window: { localStorage: MockLocalStorage } }).window = {
  localStorage: new MockLocalStorage(),
};

test('storage: saves and loads review pack for a merchant domain', () => {
  const domain = 'test-merchant.com';
  saveReviewPack({
    domain,
    merchantUrl: 'https://test-merchant.com',
    decision: {
      verdict: 'APPROVED',
      reviewerName: 'Analyst Jane',
      reviewerId: 'JANE-01',
      rationale: 'All clear',
      reviewedAt: '2026-11-10T06:00:00.000Z',
      auditHash: 'EV-12345678',
    },
    policyOverrides: {
      refund: { verified: true, note: 'Found refund window', verifiedAt: '2026-11-10T06:00:00.000Z' },
    },
  });

  const loaded = loadReviewPack(domain);
  assert.notStrictEqual(loaded, null);
  assert.strictEqual(loaded?.domain, 'test-merchant.com');
  assert.strictEqual(loaded?.decision?.verdict, 'APPROVED');
  assert.strictEqual(loaded?.decision?.reviewerName, 'Analyst Jane');
  assert.strictEqual(loaded?.policyOverrides?.refund?.verified, true);
});

test('storage: appends previous decisions to history when verdict changes', () => {
  const domain = 'escalated-merchant.com';

  // First decision: REQUEST_INFO
  saveReviewPack({
    domain,
    merchantUrl: 'https://escalated-merchant.com',
    decision: {
      verdict: 'REQUEST_INFO',
      reviewerName: 'Analyst Bob',
      reviewerId: 'BOB-02',
      rationale: 'Missing phone number',
      reviewedAt: '2026-11-10T06:05:00.000Z',
    },
  });

  // Second decision: APPROVED later
  saveReviewPack({
    domain,
    merchantUrl: 'https://escalated-merchant.com',
    decision: {
      verdict: 'APPROVED',
      reviewerName: 'Lead Reviewer',
      reviewerId: 'LEAD-01',
      rationale: 'Phone verified over email',
      reviewedAt: '2026-11-10T06:15:00.000Z',
    },
  });

  const updated = loadReviewPack(domain);
  assert.strictEqual(updated?.decision?.verdict, 'APPROVED');
  assert.strictEqual(updated?.history.length, 1);
  assert.strictEqual(updated?.history[0].verdict, 'REQUEST_INFO');
  assert.strictEqual(updated?.history[0].rationale, 'Missing phone number');
});

test('storage: tracks recent reviews and clears properly', () => {
  const domain = 'temp-store.com';
  saveReviewPack({
    domain,
    merchantUrl: 'https://temp-store.com',
    decision: {
      verdict: 'REJECTED',
      reviewerName: 'Analyst Sam',
      reviewerId: 'SAM-03',
      rationale: 'Prohibited goods detected',
      reviewedAt: '2026-11-10T06:20:00.000Z',
    },
  });

  const recents = getRecentReviewsList();
  assert.strictEqual(recents.includes(domain), true);

  const cleared = clearReviewPack(domain);
  assert.strictEqual(cleared, true);
  assert.strictEqual(loadReviewPack(domain), null);
});
