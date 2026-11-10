/**
 * Realistic Synthetic Fixtures for RemitLens
 * Modeled after real Indian B2B Service Agencies (Software, Design, AI Consulting)
 * PRD §18: Synthetic demo data explicitly labeled
 */

import { InvoiceRecord, SettlementRecord, BankCreditRecord } from '../lib/types';

export const SAMPLE_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv_1042',
    invoiceNumber: 'INV-2026-1042',
    clientName: 'Acme Design Studios LLC',
    issueDate: '2026-10-10',
    dueDate: '2026-10-24',
    amount: { minorUnits: 500000, currency: 'USD' }, // $5,000.00
    currency: 'USD',
    description: 'UI/UX Redesign - Sprint 3 Milestone',
    provenance: { fileName: 'invoices_oct_2026.csv', rowNumber: 14, uploadedAt: '2026-10-10', sourceType: 'invoice_register' },
  },
  {
    id: 'inv_901',
    invoiceNumber: 'INV-2026-901',
    clientName: 'Globex Software AG',
    issueDate: '2026-10-05',
    dueDate: '2026-10-19',
    amount: { minorUnits: 800000, currency: 'EUR' }, // €8,000.00
    currency: 'EUR',
    description: 'Quarterly Frontend Engineering Retainer',
    provenance: { fileName: 'invoices_oct_2026.csv', rowNumber: 15, uploadedAt: '2026-10-05', sourceType: 'invoice_register' },
  },
  {
    id: 'inv_944',
    invoiceNumber: 'INV-2026-944',
    clientName: 'Hooli Cloud Inc',
    issueDate: '2026-10-08',
    dueDate: '2026-10-22',
    amount: { minorUnits: 1420000, currency: 'USD' }, // $14,200.00
    currency: 'USD',
    description: 'DevOps Pipeline Migration',
    provenance: { fileName: 'invoices_oct_2026.csv', rowNumber: 16, uploadedAt: '2026-10-08', sourceType: 'invoice_register' },
  },
  {
    id: 'inv_950',
    invoiceNumber: 'INV-2026-950',
    clientName: 'Initech US Corp',
    issueDate: '2026-10-12',
    dueDate: '2026-10-26',
    amount: { minorUnits: 1000000, currency: 'USD' }, // $10,000.00
    currency: 'USD',
    description: 'Payment Integration Consulting',
    provenance: { fileName: 'invoices_oct_2026.csv', rowNumber: 17, uploadedAt: '2026-10-12', sourceType: 'invoice_register' },
  },
  {
    id: 'inv_882',
    invoiceNumber: 'INV-2026-882',
    clientName: 'Soylent Health UK Ltd',
    issueDate: '2026-10-02',
    dueDate: '2026-10-16',
    amount: { minorUnits: 650000, currency: 'GBP' }, // £6,500.00
    currency: 'GBP',
    description: 'Mobile App React Native Build',
    provenance: { fileName: 'invoices_oct_2026.csv', rowNumber: 18, uploadedAt: '2026-10-02', sourceType: 'invoice_register' },
  },
  {
    id: 'inv_770',
    invoiceNumber: 'INV-2026-770',
    clientName: 'Massive Dynamic Inc',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    amount: { minorUnits: 350000, currency: 'USD' }, // $3,500.00
    currency: 'USD',
    description: 'AI Workflow Automation',
    provenance: { fileName: 'invoices_oct_2026.csv', rowNumber: 19, uploadedAt: '2026-10-01', sourceType: 'invoice_register' },
  }
];

export const SAMPLE_SETTLEMENTS: SettlementRecord[] = [
  {
    id: 'st_1042',
    provider: 'Stripe',
    reference: 'tr_1OqK8F2eZv_INV-2026-1042',
    date: '2026-10-12',
    grossAmount: { minorUnits: 500000, currency: 'USD' },
    feeDeductions: [
      {
        label: 'Stripe Card Processing Fee (2.9%)',
        amount: { minorUnits: -14500, currency: 'USD' },
        category: 'processing_fee',
      },
      {
        label: 'Fixed Cross-Border Payout Charge',
        amount: { minorUnits: -250, currency: 'USD' },
        category: 'payout_charge',
      }
    ],
    netSettlementAmount: { minorUnits: 485250, currency: 'USD' },
    currency: 'USD',
    provenance: { fileName: 'stripe_payouts_oct.xlsx', rowNumber: 88, uploadedAt: '2026-10-12', sourceType: 'provider_settlement' },
  },
  {
    id: 'st_901',
    provider: 'Wise',
    reference: 'wise_transfer_994821',
    date: '2026-10-07',
    grossAmount: { minorUnits: 800000, currency: 'EUR' },
    feeDeductions: [
      {
        label: 'Wise Transfer Fee',
        amount: { minorUnits: -8000, currency: 'EUR' },
        category: 'processing_fee',
      }
    ],
    netSettlementAmount: { minorUnits: 792000, currency: 'EUR' },
    currency: 'EUR',
    provenance: { fileName: 'wise_oct_statement.csv', rowNumber: 22, uploadedAt: '2026-10-07', sourceType: 'provider_settlement' },
  },
  {
    id: 'st_950',
    provider: 'BankWire',
    reference: 'WIRE-US-99120-INV-2026-950',
    date: '2026-10-13',
    grossAmount: { minorUnits: 1000000, currency: 'USD' },
    feeDeductions: [], // Wire claims $0 fees in provider report
    netSettlementAmount: { minorUnits: 997000, currency: 'USD' }, // Missing $30 with no explanation!
    currency: 'USD',
    provenance: { fileName: 'bank_wires_oct.xlsx', rowNumber: 12, uploadedAt: '2026-10-13', sourceType: 'provider_settlement' },
  }
];

export const SAMPLE_BANK_CREDITS: BankCreditRecord[] = [
  {
    id: 'bk_1042',
    utrReference: 'CMS99281726',
    valueDate: '2026-10-14',
    creditAmountINR: { minorUnits: 40123000, currency: 'INR' }, // ₹4,01,230.00
    narration: 'CMS/STRIPE PAYMENTS/tr_1OqK8F2eZv_INV-2026-1042',
    provenance: { fileName: 'hdfc_bank_oct_stmt.csv', rowNumber: 312, uploadedAt: '2026-10-14', sourceType: 'bank_statement' },
  },
  {
    id: 'bk_901',
    utrReference: 'CMS88391024',
    valueDate: '2026-10-09',
    creditAmountINR: { minorUnits: 71240000, currency: 'INR' }, // ₹7,12,400.00
    narration: 'CMS/WISE PAYMENTS INDIA/wise_transfer_994821/GLOBEX',
    provenance: { fileName: 'icici_current_oct.csv', rowNumber: 140, uploadedAt: '2026-10-09', sourceType: 'bank_statement' },
  },
  {
    id: 'bk_950',
    utrReference: 'CMS7728190',
    valueDate: '2026-10-15',
    creditAmountINR: { minorUnits: 82155000, currency: 'INR' }, // ₹8,21,550.00
    narration: 'CMS/WIRE-US-99120-INV-2026-950/INITECH',
    provenance: { fileName: 'axis_bank_oct.csv', rowNumber: 88, uploadedAt: '2026-10-15', sourceType: 'bank_statement' },
  },
  {
    id: 'bk_dup_1',
    utrReference: 'CMS99281726', // Duplicate UTR candidate!
    valueDate: '2026-10-15',
    creditAmountINR: { minorUnits: 40123000, currency: 'INR' },
    narration: 'CMS/STRIPE PAYMENTS/DUPLICATE_ENTRY',
    provenance: { fileName: 'hdfc_bank_oct_stmt.csv', rowNumber: 315, uploadedAt: '2026-10-15', sourceType: 'bank_statement' },
  },
  {
    id: 'bk_orphan',
    utrReference: 'CMS55443322',
    valueDate: '2026-10-18',
    creditAmountINR: { minorUnits: 28700000, currency: 'INR' }, // ₹2,87,000.00
    narration: 'CMS/UNKNOWN SENDER WIRE/REF883',
    provenance: { fileName: 'hdfc_bank_oct_stmt.csv', rowNumber: 340, uploadedAt: '2026-10-18', sourceType: 'bank_statement' },
  }
];
