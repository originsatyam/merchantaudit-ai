export type AuditStatus = 'COMPLIANT' | 'NEEDS_REVIEW' | 'HIGH_RISK';

export interface PolicyCheck {
  id: string;
  name: string;
  required: boolean;
  found: boolean;
  url?: string;
  summary: string;
  confidenceScore: number;
  evidenceSnippet?: string;
  recommendation?: string;
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
}

export interface ProhibitedRiskItem {
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'CLEAR';
  flaggedKeywords: string[];
  explanation: string;
  evidenceSnippet?: string;
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
  crawledPages: {
    title: string;
    url: string;
    status: number;
  }[];
  humanDecision?: HumanAuditSignoff;
}

export interface AuditRequest {
  url: string;
  legalEntityName?: string;
  taxId?: string;
  forceMock?: boolean;
}
