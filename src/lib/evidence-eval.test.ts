import test from 'node:test';
import assert from 'node:assert';
import { sanitizePolicyCheck, sanitizeFindingStatus } from './gemini';

test('sanitizeFindingStatus: correctly parses valid statuses or falls back', () => {
  assert.strictEqual(sanitizeFindingStatus('OBSERVED', true), 'OBSERVED');
  assert.strictEqual(sanitizeFindingStatus('POTENTIAL_CONCERN', true), 'POTENTIAL_CONCERN');
  assert.strictEqual(sanitizeFindingStatus('NOT_OBSERVED', false), 'NOT_OBSERVED');
  assert.strictEqual(sanitizeFindingStatus('UNABLE_TO_VERIFY', false), 'UNABLE_TO_VERIFY');

  // Fallbacks
  assert.strictEqual(sanitizeFindingStatus('UNKNOWN_STATUS', true), 'OBSERVED');
  assert.strictEqual(sanitizeFindingStatus(undefined, false), 'NOT_OBSERVED');
});

test('sanitizePolicyCheck: enforces evidence grounding and does not fabricate citations', () => {
  // Case A: Grounded observed finding
  const observed = sanitizePolicyCheck('refund', 'Refund Policy', {
    found: true,
    findingStatus: 'OBSERVED',
    sourceUrl: 'https://store.com/refunds',
    evidenceSnippet: 'Items may be returned within 14 days of delivery for a full refund.',
    confidenceScore: 92,
  });

  assert.strictEqual(observed.found, true);
  assert.strictEqual(observed.findingStatus, 'OBSERVED');
  assert.strictEqual(observed.sourceUrl, 'https://store.com/refunds');
  assert.strictEqual(observed.evidenceSnippet, 'Items may be returned within 14 days of delivery for a full refund.');
  assert.strictEqual(observed.confidenceScore, 92);

  // Case B: Not observed finding
  const missing = sanitizePolicyCheck('terms', 'Terms of Service', {
    found: false,
    findingStatus: 'NOT_OBSERVED',
  });

  assert.strictEqual(missing.found, false);
  assert.strictEqual(missing.findingStatus, 'NOT_OBSERVED');
  assert.strictEqual(missing.evidenceSnippet, undefined);
  assert.match(missing.limitations || '', /not found in inspected pages/i);
});

test('sanitizePolicyCheck: clamps extreme or invalid confidence scores', () => {
  const over = sanitizePolicyCheck('privacy', 'Privacy Policy', {
    found: true,
    confidenceScore: 150,
  });
  assert.strictEqual(over.confidenceScore, 100);

  const under = sanitizePolicyCheck('privacy', 'Privacy Policy', {
    found: false,
    confidenceScore: -20,
  });
  assert.strictEqual(under.confidenceScore, 0);
});
