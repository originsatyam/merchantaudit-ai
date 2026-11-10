import { test } from 'node:test';
import assert from 'node:assert';
import { runMatchingEngine } from './matching-engine';
import { InvoiceRecord, SettlementRecord, BankCreditRecord } from './types';

test('runMatchingEngine matches exact references and itemizes documented fees', () => {
  const invoices: InvoiceRecord[] = [{
    id: 'inv_1',
    invoiceNumber: 'INV-1042',
    clientName: 'Acme Design Studios LLC',
    issueDate: '2026-10-10',
    amount: { minorUnits: 500000, currency: 'USD' },
    currency: 'USD',
    provenance: { fileName: 'invoices.csv', rowNumber: 2, uploadedAt: '2026-10-10', sourceType: 'invoice_register' },
  }];

  const settlements: SettlementRecord[] = [{
    id: 'st_1',
    provider: 'Stripe',
    reference: 'tr_1OqK8F_INV-1042',
    date: '2026-10-12',
    grossAmount: { minorUnits: 500000, currency: 'USD' },
    feeDeductions: [{
      label: 'Stripe Processing Fee',
      amount: { minorUnits: -14500, currency: 'USD' },
      category: 'processing_fee',
    }, {
      label: 'Fixed Cross-Border Payout',
      amount: { minorUnits: -250, currency: 'USD' },
      category: 'payout_charge',
    }],
    netSettlementAmount: { minorUnits: 485250, currency: 'USD' },
    currency: 'USD',
    provenance: { fileName: 'stripe_payouts.xlsx', rowNumber: 14, uploadedAt: '2026-10-12', sourceType: 'provider_settlement' },
  }];

  const bankCredits: BankCreditRecord[] = [{
    id: 'bk_1',
    utrReference: 'CMS99281726',
    valueDate: '2026-10-14',
    creditAmountINR: { minorUnits: 40123000, currency: 'INR' }, // ₹4,01,230.00
    narration: 'CMS/STRIPE PAYMENTS/tr_1OqK8F_INV-1042',
    provenance: { fileName: 'hdfc_bank.csv', rowNumber: 42, uploadedAt: '2026-10-14', sourceType: 'bank_statement' },
  }];

  const result = runMatchingEngine({ invoices, settlements, bankCredits });
  assert.strictEqual(result.chains.length, 1);
  const chain = result.chains[0];

  assert.strictEqual(chain.status, 'documented_difference');
  assert.strictEqual(chain.documentedDifferences.length, 2);
  assert.strictEqual(chain.impliedFxRate, 82.69);
  assert.strictEqual(chain.overallConfidence >= 90, true);
});

test('runMatchingEngine flags unexplained differences when money is missing in transit', () => {
  const invoices: InvoiceRecord[] = [{
    id: 'inv_2',
    invoiceNumber: 'INV-950',
    clientName: 'Initech US Corp',
    issueDate: '2026-10-08',
    amount: { minorUnits: 1000000, currency: 'USD' }, // $10,000.00
    currency: 'USD',
    provenance: { fileName: 'invoices.csv', rowNumber: 3, uploadedAt: '2026-10-08', sourceType: 'invoice_register' },
  }];

  const settlements: SettlementRecord[] = [{
    id: 'st_2',
    provider: 'WireTransfer',
    reference: 'WIRE-US-INV-950',
    date: '2026-10-10',
    grossAmount: { minorUnits: 1000000, currency: 'USD' },
    feeDeductions: [], // Wire claims zero fees in provider record
    netSettlementAmount: { minorUnits: 995000, currency: 'USD' }, // $50 missing with no fee explanation!
    currency: 'USD',
    provenance: { fileName: 'wire_payouts.xlsx', rowNumber: 5, uploadedAt: '2026-10-10', sourceType: 'provider_settlement' },
  }];

  const bankCredits: BankCreditRecord[] = [{
    id: 'bk_2',
    utrReference: 'CMS7728190',
    valueDate: '2026-10-12',
    creditAmountINR: { minorUnits: 82155000, currency: 'INR' }, // ₹8,21,550.00
    narration: 'CMS/WIRE-US-INV-950/INITECH',
    provenance: { fileName: 'axis_bank.csv', rowNumber: 18, uploadedAt: '2026-10-12', sourceType: 'bank_statement' },
  }];

  const result = runMatchingEngine({ invoices, settlements, bankCredits });
  const chain = result.chains[0];

  assert.strictEqual(chain.status, 'unexplained_difference');
  assert.strictEqual(chain.unexplainedDifferenceINR !== undefined, true);
  assert.strictEqual(chain.unexplainedDifferenceINR!.minorUnits < 0, true);
});

test('runMatchingEngine detects duplicate candidate UTRs', () => {
  const invoices: InvoiceRecord[] = [];
  const settlements: SettlementRecord[] = [];
  const bankCredits: BankCreditRecord[] = [
    {
      id: 'bk_dup_1',
      utrReference: 'CMS888999',
      valueDate: '2026-10-14',
      creditAmountINR: { minorUnits: 50000000, currency: 'INR' },
      narration: 'CMS/PAYMENT',
      provenance: { fileName: 'stmt.csv', rowNumber: 1, uploadedAt: '2026-10-14', sourceType: 'bank_statement' },
    },
    {
      id: 'bk_dup_2',
      utrReference: 'CMS888999', // Duplicate UTR!
      valueDate: '2026-10-15',
      creditAmountINR: { minorUnits: 50000000, currency: 'INR' },
      narration: 'CMS/PAYMENT DUPLICATE',
      provenance: { fileName: 'stmt.csv', rowNumber: 2, uploadedAt: '2026-10-15', sourceType: 'bank_statement' },
    },
  ];

  const result = runMatchingEngine({ invoices, settlements, bankCredits });
  assert.strictEqual(result.chains.length, 2);
  assert.strictEqual(result.chains[0].status, 'duplicate_suspected');
  assert.strictEqual(result.chains[1].status, 'duplicate_suspected');
});
