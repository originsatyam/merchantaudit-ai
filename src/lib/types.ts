export type AuditStatus = 'COMPLIANT' | 'NEEDS_REVIEW' | 'HIGH_RISK';

export type FindingStatus = 'OBSERVED' | 'POTENTIAL_CONCERN' | 'NOT_OBSERVED' | 'UNABLE_TO_VERIFY';

export interface PolicyCheck {
  id: string;
  name: string;
  required: boolean;
  found: boolean;
  findingStatus?: FindingStatus;
  url?: string;
  sourceUrl?: string;
  sourcePageTitle?: string;
  summary: string;
  confidenceScore: number;
  evidenceSnippet?: string;
  recommendation?: string;
  recommendedVerification?: string;
  limitations?: string;
  humanOverride?: {
    verified: boolean;
    overriddenStatus?: 'COMPLIANT' | 'NON_COMPLIANT';
    reviewerNote?: string;
    verifiedAt?: string;
  };
}

export interface BusinessIdentity {
  legalEntityName?: string;
  claimedName?: string;
  entityMatch: boolean | 'UNCERTAIN';
  taxId?: string; // GSTIN, PAN, EIN, CIN
  addressFound: boolean;
  physicalAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  evidenceSnippet?: string;
  sourceUrl?: string;
}

export interface ProhibitedRiskItem {
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'CLEAR';
  flaggedKeywords: string[];
  explanation: string;
  evidenceSnippet?: string;
  sourceUrl?: string;
}

export interface HumanAuditSignoff {
  verdict: 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | 'PENDING';
  reviewerName?: string;
  reviewerId?: string;
  rationale?: string;
  checklistConfirmed?: {
    policiesReviewed: boolean;
    identityVerified: boolean;
    prohibitedGoodsCleared: boolean;
  };
  auditHash?: string;
  reviewedAt?: string;
}

export interface InspectedPage {
  title: string;
  url: string;
  category: 'home' | 'terms' | 'privacy' | 'refund' | 'shipping' | 'contact' | 'other';
  status: 'INSPECTED' | 'FAILED' | 'NOT_FOUND';
  httpStatus?: number;
  errorMessage?: string;
  content?: string;
}

export interface InspectionCoverage {
  pagesRequested: number;
  pagesInspected: number;
  pagesFailed: number;
  discoveredPolicyPages: {
    terms?: string | null;
    privacy?: string | null;
    refund?: string | null;
    shipping?: string | null;
    contact?: string | null;
  };
}

export interface AuditResult {
  id: string;
  merchantUrl: string;
  domain: string;
  auditTimestamp: string;
  overallScore: number; // 0 to 100
  status: AuditStatus;
  executiveSummary: string;
  businessIdentity: BusinessIdentity;
  policies: {
    termsOfService: PolicyCheck;
    privacyPolicy: PolicyCheck;
    refundPolicy: PolicyCheck;
    shippingOrDeliveryPolicy: PolicyCheck;
    contactUs: PolicyCheck;
  };
  prohibitedRisk: ProhibitedRiskItem[];
  coverage?: InspectionCoverage;
  crawledPages: {
    title: string;
    url: string;
    status: number;
    category?: string;
    inspectionStatus?: 'INSPECTED' | 'FAILED' | 'NOT_FOUND';
    errorMessage?: string;
  }[];
  humanDecision?: HumanAuditSignoff;
}

export interface AuditRequest {
  url: string;
  legalEntityName?: string;
  taxId?: string;
  forceMock?: boolean;
}
