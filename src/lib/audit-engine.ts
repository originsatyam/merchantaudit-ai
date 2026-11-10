import { AuditRequest, AuditResult } from './types';
import { inspectMerchantSite } from './crawler';
import { analyzeMerchantWithGemini } from './gemini';
import { extractEmails, extractPhoneNumbers, extractTaxOrRegIds, scanProhibitedKeywords } from './rules';

import validD2C from '../data/fixtures/valid-d2c-store.json';
import highRiskPharma from '../data/fixtures/high-risk-pharma.json';
import missingRefund from '../data/fixtures/missing-refund-policy.json';

export async function runMerchantAudit(req: AuditRequest): Promise<AuditResult> {
  const normalizedUrl = req.url.toLowerCase().trim();

  // 1. Explicit mock request ONLY (Never intercept live audits by keyword)
  if (req.forceMock) {
    if (normalizedUrl.includes('keto') || normalizedUrl.includes('burn') || normalizedUrl.includes('pharma')) {
      return highRiskPharma as unknown as AuditResult;
    }
    if (normalizedUrl.includes('devsync') || normalizedUrl.includes('analytics') || normalizedUrl.includes('missing-refund')) {
      return missingRefund as unknown as AuditResult;
    }
    return validD2C as unknown as AuditResult;
  }

  // 2. Bounded Multi-Page Inspection (Root + up to 4 discovered policy subpages)
  const inspection = await inspectMerchantSite(req.url);

  // 3. Deterministic Scans across all inspected pages
  const emails = extractEmails(inspection.combinedMarkdown);
  const phones = extractPhoneNumbers(inspection.combinedMarkdown);
  const taxIds = extractTaxOrRegIds(inspection.combinedMarkdown);
  const detectedProhibited = scanProhibitedKeywords(inspection.combinedMarkdown);

  // 4. Intelligence Scan via Gemini Flash on combined multi-page evidence
  const aiResult = await analyzeMerchantWithGemini(inspection.combinedMarkdown, req.url);

  // Combine Deterministic + AI into complete AuditResult
  const finalResult: AuditResult = {
    id: `audit-${Date.now()}`,
    merchantUrl: inspection.rootUrl,
    domain: inspection.domain,
    auditTimestamp: new Date().toISOString(),
    overallScore: aiResult.overallScore ?? 75,
    status: aiResult.status ?? 'NEEDS_REVIEW',
    executiveSummary: aiResult.executiveSummary || 'Multi-page website evidence inspection completed. Review analyst pack below.',
    businessIdentity: {
      legalEntityName: aiResult.businessIdentity?.legalEntityName || req.legalEntityName || 'Unspecified',
      claimedName: aiResult.businessIdentity?.claimedName || inspection.domain,
      entityMatch: aiResult.businessIdentity?.entityMatch ?? 'UNCERTAIN',
      taxId: taxIds[0] || aiResult.businessIdentity?.taxId || req.taxId || 'Not observed in inspected pages',
      addressFound: Boolean(aiResult.businessIdentity?.addressFound),
      physicalAddress: aiResult.businessIdentity?.physicalAddress || 'Not observed in inspected page footer or contact sections',
      supportEmail: emails[0] || aiResult.businessIdentity?.supportEmail || 'Not observed',
      supportPhone: phones[0] || aiResult.businessIdentity?.supportPhone || 'Not observed',
      evidenceSnippet: aiResult.businessIdentity?.evidenceSnippet || 'Extracted from inspected page content.',
      sourceUrl: aiResult.businessIdentity?.sourceUrl || inspection.rootUrl,
    },
    policies: {
      termsOfService: aiResult.policies?.termsOfService || {
        id: 'terms',
        name: 'Terms of Service',
        required: true,
        found: Boolean(inspection.coverage.discoveredPolicyPages.terms),
        findingStatus: inspection.coverage.discoveredPolicyPages.terms ? 'OBSERVED' : 'NOT_OBSERVED',
        sourceUrl: inspection.coverage.discoveredPolicyPages.terms || undefined,
        summary: inspection.coverage.discoveredPolicyPages.terms ? 'Terms page discovered and inspected' : 'Not observed during this inspection',
        confidenceScore: inspection.coverage.discoveredPolicyPages.terms ? 75 : 40,
        limitations: inspection.coverage.discoveredPolicyPages.terms ? undefined : 'No terms link found across inspected pages',
      },
      privacyPolicy: aiResult.policies?.privacyPolicy || {
        id: 'privacy',
        name: 'Privacy Policy',
        required: true,
        found: Boolean(inspection.coverage.discoveredPolicyPages.privacy),
        findingStatus: inspection.coverage.discoveredPolicyPages.privacy ? 'OBSERVED' : 'NOT_OBSERVED',
        sourceUrl: inspection.coverage.discoveredPolicyPages.privacy || undefined,
        summary: inspection.coverage.discoveredPolicyPages.privacy ? 'Privacy page discovered and inspected' : 'Not observed during this inspection',
        confidenceScore: inspection.coverage.discoveredPolicyPages.privacy ? 75 : 40,
        limitations: inspection.coverage.discoveredPolicyPages.privacy ? undefined : 'No privacy link found across inspected pages',
      },
      refundPolicy: aiResult.policies?.refundPolicy || {
        id: 'refund',
        name: 'Refund & Cancellation Policy',
        required: true,
        found: Boolean(inspection.coverage.discoveredPolicyPages.refund),
        findingStatus: inspection.coverage.discoveredPolicyPages.refund ? 'OBSERVED' : 'NOT_OBSERVED',
        sourceUrl: inspection.coverage.discoveredPolicyPages.refund || undefined,
        summary: inspection.coverage.discoveredPolicyPages.refund ? 'Refund page discovered and inspected' : 'Not observed during this inspection',
        confidenceScore: inspection.coverage.discoveredPolicyPages.refund ? 75 : 30,
        limitations: inspection.coverage.discoveredPolicyPages.refund ? undefined : 'No refund or cancellation link found across inspected pages',
      },
      shippingOrDeliveryPolicy: aiResult.policies?.shippingOrDeliveryPolicy || {
        id: 'shipping',
        name: 'Shipping & Delivery Policy',
        required: false,
        found: Boolean(inspection.coverage.discoveredPolicyPages.shipping),
        findingStatus: inspection.coverage.discoveredPolicyPages.shipping ? 'OBSERVED' : 'NOT_OBSERVED',
        sourceUrl: inspection.coverage.discoveredPolicyPages.shipping || undefined,
        summary: inspection.coverage.discoveredPolicyPages.shipping ? 'Shipping page discovered and inspected' : 'Not observed during this inspection',
        confidenceScore: inspection.coverage.discoveredPolicyPages.shipping ? 70 : 50,
      },
      contactUs: aiResult.policies?.contactUs || {
        id: 'contact',
        name: 'Contact & Customer Support',
        required: true,
        found: phones.length > 0 || emails.length > 0 || Boolean(inspection.coverage.discoveredPolicyPages.contact),
        findingStatus: (phones.length > 0 || emails.length > 0 || inspection.coverage.discoveredPolicyPages.contact) ? 'OBSERVED' : 'NOT_OBSERVED',
        sourceUrl: inspection.coverage.discoveredPolicyPages.contact || inspection.rootUrl,
        summary: emails.length > 0 ? `Support email observed: ${emails[0]}` : (phones.length > 0 ? `Support phone: ${phones[0]}` : 'Contact details not observed'),
        confidenceScore: 75,
      },
    },
    prohibitedRisk: [
      ...(aiResult.prohibitedRisk || []),
      ...(detectedProhibited.length > 0 ? [{
        category: 'Deterministic Keyword Match',
        severity: 'CRITICAL' as const,
        flaggedKeywords: detectedProhibited,
        explanation: 'Regex scan found potential prohibited terms directly in the inspected page body.',
        evidenceSnippet: `Matched keywords: ${detectedProhibited.join(', ')}`,
        sourceUrl: inspection.rootUrl,
      }] : [])
    ],
    coverage: inspection.coverage,
    crawledPages: inspection.inspectedPages.map(p => ({
      title: p.title,
      url: p.url,
      status: p.httpStatus || 200,
      category: p.category,
      inspectionStatus: p.status,
      errorMessage: p.errorMessage,
    })),
    humanDecision: {
      verdict: 'PENDING'
    }
  };

  return finalResult;
}
