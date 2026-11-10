import { HumanAuditSignoff } from './types';

export interface ReviewHistoryEntry {
  verdict: HumanAuditSignoff['verdict'];
  reviewerName?: string;
  reviewerId?: string;
  rationale?: string;
  reviewedAt: string;
  auditHash?: string;
}

export interface StoredReviewPack {
  domain: string;
  merchantUrl: string;
  decision?: HumanAuditSignoff;
  policyOverrides?: Record<string, { verified: boolean; note?: string; verifiedAt?: string }>;
  history: ReviewHistoryEntry[];
  updatedAt: string;
}

const STORAGE_PREFIX = 'merchant_evidence_copilot_review_';
const RECENT_KEYS_LIST = 'merchant_evidence_copilot_recent_reviews';

/**
 * Safely loads review pack from localStorage (handles SSR gracefully)
 */
export function loadReviewPack(domain: string): StoredReviewPack | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const normalizedDomain = domain.toLowerCase().trim();
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + normalizedDomain);
    if (!raw) return null;
    return JSON.parse(raw) as StoredReviewPack;
  } catch {
    return null;
  }
}

/**
 * Saves review decision and policy overrides to durable localStorage
 */
export function saveReviewPack(review: {
  domain: string;
  merchantUrl: string;
  decision?: HumanAuditSignoff;
  policyOverrides?: Record<string, { verified: boolean; note?: string; verifiedAt?: string }>;
}): StoredReviewPack {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      domain: review.domain,
      merchantUrl: review.merchantUrl,
      decision: review.decision,
      policyOverrides: review.policyOverrides,
      history: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const normalizedDomain = review.domain.toLowerCase().trim();
  const existing = loadReviewPack(normalizedDomain);

  const history: ReviewHistoryEntry[] = existing?.history ? [...existing.history] : [];

  // If there was a previous final decision and it changed, record in history
  if (
    existing?.decision &&
    review.decision &&
    existing.decision.reviewedAt !== review.decision.reviewedAt
  ) {
    history.push({
      verdict: existing.decision.verdict,
      reviewerName: existing.decision.reviewerName,
      reviewerId: existing.decision.reviewerId,
      rationale: existing.decision.rationale,
      reviewedAt: existing.decision.reviewedAt || new Date().toISOString(),
      auditHash: existing.decision.auditHash,
    });
  }

  const pack: StoredReviewPack = {
    domain: normalizedDomain,
    merchantUrl: review.merchantUrl,
    decision: review.decision,
    policyOverrides: review.policyOverrides || existing?.policyOverrides || {},
    history,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_PREFIX + normalizedDomain, JSON.stringify(pack));
    updateRecentReviewsList(normalizedDomain);
  } catch (err) {
    console.warn('Failed to persist review pack to localStorage:', err);
  }

  return pack;
}

/**
 * Updates list of recently reviewed merchant domains
 */
function updateRecentReviewsList(domain: string) {
  try {
    const raw = window.localStorage.getItem(RECENT_KEYS_LIST);
    let list: string[] = raw ? JSON.parse(raw) : [];
    list = [domain, ...list.filter(d => d !== domain)].slice(0, 10);
    window.localStorage.setItem(RECENT_KEYS_LIST, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Gets list of recently reviewed domains
 */
export function getRecentReviewsList(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(RECENT_KEYS_LIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears review pack for a specific merchant domain
 */
export function clearReviewPack(domain: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  const normalizedDomain = domain.toLowerCase().trim();
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + normalizedDomain);
    const raw = window.localStorage.getItem(RECENT_KEYS_LIST);
    if (raw) {
      const list: string[] = JSON.parse(raw);
      const filtered = list.filter(d => d !== normalizedDomain);
      window.localStorage.setItem(RECENT_KEYS_LIST, JSON.stringify(filtered));
    }
    return true;
  } catch {
    return false;
  }
}
