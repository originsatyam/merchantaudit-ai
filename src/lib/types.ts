/**
 * RemitLens Core Type Contracts
 * Strictly aligned with RemitLens PRD v0.1 & Financial Operations Standards
 */

// The 8 Non-Negotiable Canonical UI Statuses
export type ReconciliationStatus =
  | 'suggested'              // Algorithmic or heuristic suggestion (dashed border, no checkmark)
  | 'confirmed'              // Human approved & locked with audit stamp
  | 'partial'                // Split payment or milestone settlement
  | 'needs_review'          // Ambiguity detected (multiple candidates, date tolerance)
  | 'duplicate_suspected'    // Identical refs/amounts collision
  | 'unmatched'              // Orphan invoice or bank credit
  | 'documented_difference'  // Explained by itemised source records (e.g. Stripe fee)
  | 'unexplained_difference';// Gap with no source explanation (never guess intermediary bank fee)

export type EvidenceTier = 'exact' | 'heuristic' | 'supporting';

export interface SourceProvenance {
  fileName: string;
  rowNumber: number;
  uploadedAt: string;
  sourceType: 'invoice_register' | 'provider_settlement' | 'bank_statement';
  rawRecordSnippet?: string;
}

export interface MoneyValue {
  minorUnits: number; // Stored as integer (e.g. 500000 = $5,000.00 or ₹5,000.00)
  currency: 'USD' | 'EUR' | 'GBP' | 'INR' | string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate?: string;
  amount: MoneyValue;
  currency: string;
  description?: string;
  provenance: SourceProvenance;
}

export interface ProviderFeeItem {
  label: string;
  amount: MoneyValue;
  category: 'processing_fee' | 'fx_spread' | 'payout_charge' | 'other';
  provenance?: SourceProvenance;
}

export interface SettlementRecord {
  id: string;
  provider: 'Stripe' | 'Wise' | 'Payoneer' | 'BankWire' | string;
  reference: string;
  date: string;
  grossAmount: MoneyValue;
  feeDeductions: ProviderFeeItem[];
  netSettlementAmount: MoneyValue;
  currency: string;
  provenance: SourceProvenance;
}

export interface BankCreditRecord {
  id: string;
  utrReference: string;
  valueDate: string;
  creditAmountINR: MoneyValue;
  narration: string;
  provenance: SourceProvenance;
}

export interface MatchEvidence {
  tier: EvidenceTier;
  field: string;
  description: string;
  confidenceScore: number; // 0 to 100
}

export interface ReconciliationChain {
  id: string;
  chainReference: string;
  status: ReconciliationStatus;
  invoice?: InvoiceRecord;
  settlement?: SettlementRecord;
  bankCredit?: BankCreditRecord;
  evidence: MatchEvidence[];
  overallConfidence: number; // 0 to 100
  documentedDifferences: ProviderFeeItem[];
  unexplainedDifferenceINR?: MoneyValue;
  impliedFxRate?: number; // e.g. 82.68
  confirmedBy?: string;
  confirmedAt?: string;
  operatorNotes?: string;
  isFlaggedForInquiry?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorEmail: string;
  action: 'CONFIRM_MATCH' | 'UNLINK_MATCH' | 'IMPORT_FILE' | 'EXPORT_REPORT' | 'ADD_NOTE' | 'FLAG_INQUIRY';
  chainId?: string;
  chainReference?: string;
  details: string;
  previousState?: ReconciliationStatus;
  newState?: ReconciliationStatus;
  undoable: boolean;
}

export interface ReconciliationSummary {
  totalInvoicedByCurrency: Record<string, number>; // Minor units by ISO currency
  totalBankCreditedINR: number;                   // Paise
  totalDocumentedFeesINR: number;                 // Paise
  totalUnexplainedGapsINR: number;                // Paise
  countsByStatus: Record<ReconciliationStatus, number>;
  totalChains: number;
}
