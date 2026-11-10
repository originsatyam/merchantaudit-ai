import { AuditRequest, AuditResult } from './types';
import { scrapeUrlWithFirecrawl } from './firecrawl';
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

  // 2. Live Crawl via Firecrawl
  const scraped = await scrapeUrlWithFirecrawl(req.url);

  // 3. Deterministic Scans
  const emails = extractEmails(scraped.markdown);
  const phones = extractPhoneNumbers(scraped.markdown);
  const taxIds = extractTaxOrRegIds(scraped.markdown);
  const detectedProhibited = scanProhibitedKeywords(scraped.markdown);

  // 4. Intelligence Scan via Gemini Flash
  const aiResult = await analyzeMerchantWithGemini(scraped.markdown, req.url);

  // Extract domain
  let domain = req.url;
  try {
    const parsed = new URL(req.url.startsWith('http') ? req.url : `https://${req.url}`);
    domain = parsed.hostname;
  } catch {
    // fallback
  }

  // Combine Deterministic + AI into complete AuditResult
  const finalResult: AuditResult = {
    id: `audit-${Date.now()}`,
    merchantUrl: scraped.url,
    domain,
    auditTimestamp: new Date().toISOString(),
    overallScore: aiResult.overallScore ?? 75,
    status: aiResult.status ?? 'NEEDS_REVIEW',
    executiveSummary: aiResult.executiveSummary || 'Website evidence inspection completed. Review analyst pack below.',
    businessIdentity: {
      legalEntityName: aiResult.businessIdentity?.legalEntityName || req.legalEntityName || 'Unspecified',
      claimedName: aiResult.businessIdentity?.claimedName || domain,
      entityMatch: aiResult.businessIdentity?.entityMatch ?? 'UNCERTAIN',
      taxId: taxIds[0] || aiResult.businessIdentity?.taxId || req.taxId || 'Not detected in inspected pages',
      addressFound: Boolean(aiResult.businessIdentity?.addressFound),
      physicalAddress: aiResult.businessIdentity?.physicalAddress || 'Not observed in inspected page footer or contact sections',
      supportEmail: emails[0] || aiResult.businessIdentity?.supportEmail || 'Not observed',
      supportPhone: phones[0] || aiResult.businessIdentity?.supportPhone || 'Not observed',
      evidenceSnippet: aiResult.businessIdentity?.evidenceSnippet || 'Extracted from inspected page content.',
    },
    policies: {
      termsOfService: aiResult.policies?.termsOfService || {
        id: 'terms',
        name: 'Terms of Service',
        required: true,
        found: false,
        summary: 'Not observed during this inspection',
        confidenceScore: 50,
      },
      privacyPolicy: aiResult.policies?.privacyPolicy || {
        id: 'privacy',
        name: 'Privacy Policy',
        required: true,
        found: false,
        summary: 'Not observed during this inspection',
        confidenceScore: 50,
      },
      refundPolicy: aiResult.policies?.refundPolicy || {
        id: 'refund',
        name: 'Refund & Cancellation Policy',
        required: true,
        found: false,
        summary: 'Not observed during this inspection',
        confidenceScore: 50,
      },
      shippingOrDeliveryPolicy: aiResult.policies?.shippingOrDeliveryPolicy || {
        id: 'shipping',
        name: 'Shipping & Delivery Policy',
        required: false,
        found: false,
        summary: 'Not observed during this inspection',
        confidenceScore: 50,
      },
      contactUs: aiResult.policies?.contactUs || {
        id: 'contact',
        name: 'Contact & Customer Support',
        required: true,
        found: phones.length > 0 || emails.length > 0,
        summary: emails.length > 0 ? `Support email: ${emails[0]}` : 'Contact details not observed',
        confidenceScore: 70,
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
      }] : [])
    ],
    crawledPages: [
      {
        title: scraped.title || domain,
        url: scraped.url,
        status: scraped.statusCode || 200,
      }
    ],
    humanDecision: {
      verdict: 'PENDING'
    }
  };

  return finalResult;
}
