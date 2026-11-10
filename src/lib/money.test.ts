import { test } from 'node:test';
import assert from 'node:assert';
import { formatMoney, formatMoneyOrMissing, addMoney, subtractMoney, calculateImpliedFxRate } from './money';

test('formatMoney formats INR using Indian lakh and crore grouping', () => {
  assert.strictEqual(formatMoney(100854200, 'INR'), 'INR 10,08,542.00');
  assert.strictEqual(formatMoney(123456789, 'INR'), 'INR 12,34,567.89');
  assert.strictEqual(formatMoney(50000, 'INR'), 'INR 500.00');
  assert.strictEqual(formatMoney(10000000, 'INR'), 'INR 1,00,000.00');
});

test('formatMoney formats USD using Western thousands grouping', () => {
  assert.strictEqual(formatMoney(1250000, 'USD'), 'USD 12,500.00');
  assert.strictEqual(formatMoney(500000, 'USD'), 'USD 5,000.00');
  assert.strictEqual(formatMoney(-36520, 'USD'), 'USD -365.20');
});

test('formatMoney handles negative values correctly', () => {
  assert.strictEqual(formatMoney(-245000, 'INR'), 'INR -2,450.00');
  assert.strictEqual(formatMoney(-14750, 'USD'), 'USD -147.50');
});

test('formatMoneyOrMissing preserves missing values as "Not provided"', () => {
  assert.strictEqual(formatMoneyOrMissing(null), 'Not provided');
  assert.strictEqual(formatMoneyOrMissing(undefined), 'Not provided');
  assert.strictEqual(formatMoneyOrMissing({ minorUnits: 50000, currency: 'USD' }), 'USD 500.00');
});

test('addMoney and subtractMoney enforce currency matching', () => {
  const a = { minorUnits: 10000, currency: 'USD' };
  const b = { minorUnits: 2500, currency: 'USD' };
  assert.deepStrictEqual(addMoney(a, b), { minorUnits: 12500, currency: 'USD' });
  assert.deepStrictEqual(subtractMoney(a, b), { minorUnits: 7500, currency: 'USD' });

  const c = { minorUnits: 50000, currency: 'INR' };
  assert.throws(() => addMoney(a, c), /Cannot add mismatched currencies/);
});

test('calculateImpliedFxRate computes correct exchange rate', () => {
  // $4,852.50 USD yields ₹4,01,230.00 INR -> 401230 / 4852.50 = 82.685... rounds to 82.69
  const rate = calculateImpliedFxRate(485250, 40123000);
  assert.strictEqual(rate, 82.69);
});
