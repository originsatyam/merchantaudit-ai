/**
 * RemitLens Deterministic Matching Engine
 * Implements PRD §7C & §7E: Multi-tier matching, difference segregation,
 * and strict audit boundaries.
 */

import {
  InvoiceRecord,
  SettlementRecord,
  BankCreditRecord,
  ReconciliationChain,
  ReconciliationStatus,
  MatchEvidence,
  ProviderFeeItem,
  ReconciliationSummary,
} from './types';
import { calculateImpliedFxRate } from './money';

export interface MatchingEngineInput {
  invoices: InvoiceRecord[];
  settlements: SettlementRecord[];
  bankCredits: BankCreditRecord[];
}

export interface MatchingResult {
  chains: ReconciliationChain[];
  summary: ReconciliationSummary;
}

/**
 * Normalizes text for reference matching (removes hyphens, spaces, uppercase)
 */
function normalizeRef(ref: string): string {
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Checks token containment / similarity for counterparty names (supporting evidence only)
 */
function checkNameSimilarity(nameA: string, nameB: string): number {
  if (!nameA || !nameB) return 0;
  const cleanA = nameA.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const cleanB = nameB.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  if (cleanA === cleanB) return 100;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return 85;

  // Token overlap
  const tokensA = cleanA.split(/\s+/).filter(t => t.length > 2);
  const tokensB = cleanB.split(/\s+/).filter(t => t.length > 2);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const matches = tokensA.filter(t => tokensB.includes(t));
  if (matches.length > 0) {
    return Math.round((matches.length / Math.max(tokensA.length, tokensB.length)) * 75);
  }

  return 0;
}

/**
 * Calculates date difference in days between two ISO date strings (YYYY-MM-DD or DD/MM/YYYY)
 */
function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(dateStr)) {
    const parts = dateStr.split(/[\/-]/);
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
  }
  return new Date(dateStr).getTime();
}

function daysBetween(dateA: string, dateB: string): number {
  const tA = parseDateToTimestamp(dateA);
  const tB = parseDateToTimestamp(dateB);
  if (!tA || !tB) return 999;
  return Math.abs(Math.round((tB - tA) / (1000 * 60 * 60 * 24)));
}

/**
 * Run deterministic matching across the 3 datasets
 */
export function runMatchingEngine(input: MatchingEngineInput): MatchingResult {
  const { invoices, settlements, bankCredits } = input;
  const chains: ReconciliationChain[] = [];

  const matchedInvoiceIds = new Set<string>();
  const matchedSettlementIds = new Set<string>();
  const matchedBankCreditIds = new Set<string>();

  // STEP 1: Duplicate Candidate Detection on Bank Credits
  const utrCounts = new Map<string, BankCreditRecord[]>();
  bankCredits.forEach(b => {
    const norm = normalizeRef(b.utrReference);
    if (!utrCounts.has(norm)) utrCounts.set(norm, []);
    utrCounts.get(norm)!.push(b);
  });

  const duplicateUtrs = new Set<string>();
  utrCounts.forEach((records, utr) => {
    if (records.length > 1 && utr.length > 4) {
      duplicateUtrs.add(utr);
    }
  });

  // STEP 2: Multi-tier Cross Reconciliation
  invoices.forEach(inv => {
    const normInvNum = normalizeRef(inv.invoiceNumber);

    // Look for matching Settlement record
    let bestSettlement: SettlementRecord | undefined;
    let settlementEvidence: MatchEvidence[] = [];

    for (const st of settlements) {
      if (matchedSettlementIds.has(st.id)) continue;
      const normStRef = normalizeRef(st.reference);

      // Exact Reference Match
      if (normStRef.includes(normInvNum) || normInvNum.includes(normStRef)) {
        settlementEvidence.push({
          tier: 'exact',
          field: 'Reference Match',
          description: `Settlement ref '${st.reference}' contains invoice '${inv.invoiceNumber}'`,
          confidenceScore: 95,
        });
        bestSettlement = st;
        break;
      }

      // Exact Gross Amount & Currency Match + Date proximity
      if (st.grossAmount.minorUnits === inv.amount.minorUnits && st.currency === inv.currency) {
        const diffDays = daysBetween(inv.issueDate, st.date);
        if (diffDays <= 14) {
          settlementEvidence.push({
            tier: 'heuristic',
            field: 'Amount & Currency Match',
            description: `Exact gross amount ${inv.currency} ${inv.amount.minorUnits / 100} matched within ${diffDays} days`,
            confidenceScore: 85,
          });
          bestSettlement = st;
          break;
        }
      }
    }

    // Look for matching Bank Credit record
    let bestBankCredit: BankCreditRecord | undefined;
    let bankEvidence: MatchEvidence[] = [];

    for (const b of bankCredits) {
      if (matchedBankCreditIds.has(b.id)) continue;
      const normNarration = normalizeRef(b.narration);
      const normUtr = normalizeRef(b.utrReference);

      // Tier 1: Check if Bank Narration includes Invoice Ref or Provider Ref
      let exactMatched = false;
      if (normNarration.includes(normInvNum)) {
        bankEvidence.push({
          tier: 'exact',
          field: 'Bank Narration Match',
          description: `Bank statement narration contains invoice number '${inv.invoiceNumber}'`,
          confidenceScore: 95,
        });
        exactMatched = true;
      }

      if (bestSettlement) {
        const normStRef = normalizeRef(bestSettlement.reference);
        if (normNarration.includes(normStRef) || normUtr.includes(normStRef)) {
          bankEvidence.push({
            tier: 'exact',
            field: 'Provider UTR Match',
            description: `Bank record references provider settlement ID '${bestSettlement.reference}'`,
            confidenceScore: 98,
          });
          exactMatched = true;
        }
      }

      // Tier 2: Date proximity + realistic implied FX
      const settlementDate = bestSettlement ? bestSettlement.date : inv.issueDate;
      const dateDiff = daysBetween(settlementDate, b.valueDate);

      // Implied FX check
      const foreignMinor = bestSettlement ? bestSettlement.netSettlementAmount.minorUnits : inv.amount.minorUnits;
      const fxRate = calculateImpliedFxRate(foreignMinor, b.creditAmountINR.minorUnits);

      const isValidFx = (inv.currency === 'USD' && fxRate >= 75 && fxRate <= 95) ||
                        (inv.currency === 'EUR' && fxRate >= 80 && fxRate <= 105) ||
                        (inv.currency === 'GBP' && fxRate >= 95 && fxRate <= 125);

      if (dateDiff <= 5 && isValidFx) {
        bankEvidence.push({
          tier: 'heuristic',
          field: 'Date Proximity & Realistic FX',
          description: `Bank credit appeared ${dateDiff} days after settlement at realistic implied FX ₹${fxRate}/${inv.currency}`,
          confidenceScore: exactMatched ? 95 : 75,
        });
        bestBankCredit = b;
        break;
      }

      // Tier 3: Supporting Name Similarity
      const nameScore = checkNameSimilarity(inv.clientName, b.narration);
      if (nameScore > 50) {
        bankEvidence.push({
          tier: 'supporting',
          field: 'Counterparty Name Proximity',
          description: `Client name '${inv.clientName}' has token similarity in bank narration (${nameScore}%)`,
          confidenceScore: nameScore,
        });
      }

      if (exactMatched) {
        bestBankCredit = b;
        break;
      }
    }

    // Determine Chain Status & Difference Breakdown (PRD §7E)
    if (bestSettlement && bestBankCredit) {
      matchedInvoiceIds.add(inv.id);
      matchedSettlementIds.add(bestSettlement.id);
      matchedBankCreditIds.add(bestBankCredit.id);

      const allEvidence = [...settlementEvidence, ...bankEvidence];
      const avgConfidence = Math.round(
        allEvidence.reduce((acc, e) => acc + e.confidenceScore, 0) / Math.max(1, allEvidence.length)
      );

      // Calculate documented deductions
      const documentedDiffs: ProviderFeeItem[] = [...bestSettlement.feeDeductions];

      // Implied FX and Difference Calculation
      const impliedFx = calculateImpliedFxRate(
        bestSettlement.netSettlementAmount.minorUnits,
        bestBankCredit.creditAmountINR.minorUnits
      );

      // Expected INR at standard median rate vs received
      // If settlement net converted at reference rate differs from bank credit
      let unexplainedINRMinor = 0;

      // Special case: check if duplicate suspected
      const isDuplicate = duplicateUtrs.has(normalizeRef(bestBankCredit.utrReference));

      let status: ReconciliationStatus = 'suggested';
      if (isDuplicate) {
        status = 'duplicate_suspected';
      } else if (documentedDiffs.length > 0) {
        // Documented fees accounted for
        status = 'documented_difference';
      }

      // Check if gross minus fees equals net
      const totalFeesMinor = documentedDiffs.reduce((sum, f) => sum + Math.abs(f.amount.minorUnits), 0);
      const expectedNetForeignMinor = inv.amount.minorUnits - totalFeesMinor;

      if (bestSettlement.netSettlementAmount.minorUnits < expectedNetForeignMinor) {
        // There is an unrecorded foreign deduction
        const gap = expectedNetForeignMinor - bestSettlement.netSettlementAmount.minorUnits;
        unexplainedINRMinor = Math.round(gap * impliedFx);
        status = 'unexplained_difference';
      }

      chains.push({
        id: `chain_${inv.id}_${bestBankCredit.id}`,
        chainReference: `REC-${bestBankCredit.utrReference.slice(-6) || inv.invoiceNumber}`,
        status,
        invoice: inv,
        settlement: bestSettlement,
        bankCredit: bestBankCredit,
        evidence: allEvidence,
        overallConfidence: avgConfidence,
        documentedDifferences: documentedDiffs,
        unexplainedDifferenceINR: unexplainedINRMinor !== 0 ? {
          minorUnits: -unexplainedINRMinor,
          currency: 'INR',
        } : undefined,
        impliedFxRate: impliedFx,
      });
    } else if (bestBankCredit) {
      // Direct invoice to bank credit match without provider file
      matchedInvoiceIds.add(inv.id);
      matchedBankCreditIds.add(bestBankCredit.id);

      const impliedFx = calculateImpliedFxRate(inv.amount.minorUnits, bestBankCredit.creditAmountINR.minorUnits);

      chains.push({
        id: `chain_${inv.id}_${bestBankCredit.id}`,
        chainReference: `REC-${bestBankCredit.utrReference.slice(-6) || inv.invoiceNumber}`,
        status: 'suggested',
        invoice: inv,
        bankCredit: bestBankCredit,
        evidence: bankEvidence,
        overallConfidence: 75,
        documentedDifferences: [],
        impliedFxRate: impliedFx,
      });
    } else {
      // Unmatched invoice
      chains.push({
        id: `chain_unmatched_inv_${inv.id}`,
        chainReference: `REC-UNM-${inv.invoiceNumber}`,
        status: 'unmatched',
        invoice: inv,
        evidence: [],
        overallConfidence: 0,
        documentedDifferences: [],
      });
    }
  });

  // STEP 3: Handle leftover orphan bank credits
  bankCredits.forEach(b => {
    if (!matchedBankCreditIds.has(b.id)) {
      const isDup = duplicateUtrs.has(normalizeRef(b.utrReference));
      chains.push({
        id: `chain_unmatched_bank_${b.id}`,
        chainReference: `REC-UNM-${b.utrReference.slice(-6)}`,
        status: isDup ? 'duplicate_suspected' : 'unmatched',
        bankCredit: b,
        evidence: isDup ? [{
          tier: 'exact',
          field: 'Duplicate UTR Reference',
          description: `Bank credit UTR '${b.utrReference}' appears multiple times in uploaded statements`,
          confidenceScore: 100,
        }] : [],
        overallConfidence: 0,
        documentedDifferences: [],
      });
    }
  });

  // Summary aggregation
  const summary: ReconciliationSummary = {
    totalInvoicedByCurrency: {},
    totalBankCreditedINR: 0,
    totalDocumentedFeesINR: 0,
    totalUnexplainedGapsINR: 0,
    countsByStatus: {
      suggested: 0,
      confirmed: 0,
      partial: 0,
      needs_review: 0,
      duplicate_suspected: 0,
      unmatched: 0,
      documented_difference: 0,
      unexplained_difference: 0,
    },
    totalChains: chains.length,
  };

  chains.forEach(c => {
    summary.countsByStatus[c.status] = (summary.countsByStatus[c.status] || 0) + 1;

    if (c.invoice) {
      const cur = c.invoice.currency;
      summary.totalInvoicedByCurrency[cur] = (summary.totalInvoicedByCurrency[cur] || 0) + c.invoice.amount.minorUnits;
    }

    if (c.bankCredit) {
      summary.totalBankCreditedINR += c.bankCredit.creditAmountINR.minorUnits;
    }

    if (c.unexplainedDifferenceINR) {
      summary.totalUnexplainedGapsINR += Math.abs(c.unexplainedDifferenceINR.minorUnits);
    }
  });

  return { chains, summary };
}
