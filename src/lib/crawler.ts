import { scrapeUrlWithFirecrawl, ScrapedPageResult } from './firecrawl';
import { validateMerchantUrl } from './security';
import { InspectedPage, InspectionCoverage } from './types';

export interface DiscoveredPolicyLinks {
  terms?: string;
  privacy?: string;
  refund?: string;
  shipping?: string;
  contact?: string;
}

export interface MultiPageInspectionResult {
  rootUrl: string;
  domain: string;
  inspectedPages: InspectedPage[];
  combinedMarkdown: string;
  coverage: InspectionCoverage;
}

/**
 * Extracts markdown links [anchor](url) and resolves same-site policy endpoints.
 */
export function discoverPolicyLinks(rootUrl: string, markdown: string): DiscoveredPolicyLinks {
  let baseHostname = '';
  try {
    const parsedRoot = new URL(rootUrl);
    baseHostname = parsedRoot.hostname.toLowerCase();
  } catch {
    return {};
  }

  const discovered: DiscoveredPolicyLinks = {};
  // Match markdown links: [text](href)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const anchorText = match[1].toLowerCase().trim();
    const rawHref = match[2].trim();

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      continue;
    }

    let absoluteUrl: string;
    try {
      const resolved = new URL(rawHref, rootUrl);
      // Enforce same-domain or same-subdomain restriction
      const targetHostname = resolved.hostname.toLowerCase();
      if (targetHostname !== baseHostname && !targetHostname.endsWith('.' + baseHostname)) {
        continue;
      }
      // SSRF check on target URL
      const validation = validateMerchantUrl(resolved.toString());
      if (!validation.valid || !validation.normalizedUrl) {
        continue;
      }
      absoluteUrl = validation.normalizedUrl;
    } catch {
      continue;
    }

    const combinedStr = `${anchorText} ${absoluteUrl.toLowerCase()}`;

    // Terms of Service
    if (!discovered.terms && (combinedStr.includes('term') || combinedStr.includes('tos') || combinedStr.includes('condition'))) {
      discovered.terms = absoluteUrl;
      continue;
    }

    // Privacy Policy
    if (!discovered.privacy && (combinedStr.includes('privacy') || combinedStr.includes('gdpr') || combinedStr.includes('data-policy'))) {
      discovered.privacy = absoluteUrl;
      continue;
    }

    // Refund / Return / Cancellation
    if (!discovered.refund && (combinedStr.includes('refund') || combinedStr.includes('return') || combinedStr.includes('cancellation'))) {
      discovered.refund = absoluteUrl;
      continue;
    }

    // Shipping / Delivery
    if (!discovered.shipping && (combinedStr.includes('shipping') || combinedStr.includes('delivery') || combinedStr.includes('dispatch'))) {
      discovered.shipping = absoluteUrl;
      continue;
    }

    // Contact / About
    if (!discovered.contact && (combinedStr.includes('contact') || combinedStr.includes('support') || combinedStr.includes('about-us'))) {
      discovered.contact = absoluteUrl;
      continue;
    }
  }

  return discovered;
}

/**
 * Bounded multi-page inspection:
 * 1. Fetches the primary root page.
 * 2. Identifies up to 4 high-priority policy subpages.
 * 3. Safely fetches discovered subpages with bounded concurrency and timeouts.
 * 4. Aggregates results and explicit coverage report.
 */
export async function inspectMerchantSite(
  rootUrl: string,
  apiKey?: string
): Promise<MultiPageInspectionResult> {
  const rootScrape = await scrapeUrlWithFirecrawl(rootUrl, apiKey);
  const domain = new URL(rootScrape.url).hostname;

  const inspectedPages: InspectedPage[] = [
    {
      url: rootScrape.url,
      title: rootScrape.title || 'Home Page',
      category: 'home',
      status: 'INSPECTED',
      httpStatus: rootScrape.statusCode || 200,
      content: rootScrape.markdown.slice(0, 15000),
    }
  ];

  // Discover candidate policy links
  const policyLinks = discoverPolicyLinks(rootScrape.url, rootScrape.markdown);
  const subpageTargets: { category: InspectedPage['category']; url: string }[] = [];

  if (policyLinks.refund && policyLinks.refund !== rootScrape.url) {
    subpageTargets.push({ category: 'refund', url: policyLinks.refund });
  }
  if (policyLinks.terms && policyLinks.terms !== rootScrape.url) {
    subpageTargets.push({ category: 'terms', url: policyLinks.terms });
  }
  if (policyLinks.privacy && policyLinks.privacy !== rootScrape.url) {
    subpageTargets.push({ category: 'privacy', url: policyLinks.privacy });
  }
  if (policyLinks.contact && policyLinks.contact !== rootScrape.url) {
    subpageTargets.push({ category: 'contact', url: policyLinks.contact });
  } else if (policyLinks.shipping && policyLinks.shipping !== rootScrape.url) {
    subpageTargets.push({ category: 'shipping', url: policyLinks.shipping });
  }

  // Bounded limit: Maximum 4 subpages (5 total with root)
  const boundedTargets = subpageTargets.slice(0, 4);

  // Concurrently fetch discovered policy pages with graceful partial-failure isolation
  const subpagePromises = boundedTargets.map(async (target) => {
    try {
      const scraped = await scrapeUrlWithFirecrawl(target.url, apiKey);
      return {
        url: scraped.url,
        title: scraped.title || `${target.category.toUpperCase()} Policy`,
        category: target.category,
        status: 'INSPECTED' as const,
        httpStatus: scraped.statusCode || 200,
        content: scraped.markdown.slice(0, 15000),
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch subpage';
      return {
        url: target.url,
        title: `${target.category.toUpperCase()} Page`,
        category: target.category,
        status: 'FAILED' as const,
        httpStatus: 500,
        errorMessage: errMsg,
        content: '',
      };
    }
  });

  const subpageResults = await Promise.all(subpagePromises);
  inspectedPages.push(...subpageResults);

  // Build structured combined markdown for AI analysis
  let combinedMarkdown = `# Multi-Page Website Inspection Evidence for ${domain}\n\n`;
  for (const page of inspectedPages) {
    combinedMarkdown += `\n--- START SOURCE PAGE: ${page.title} ---\n`;
    combinedMarkdown += `URL: ${page.url}\n`;
    combinedMarkdown += `Category: ${page.category}\n`;
    combinedMarkdown += `Inspection Status: ${page.status}\n\n`;
    if (page.status === 'INSPECTED') {
      combinedMarkdown += page.content;
    } else {
      combinedMarkdown += `[Page fetch failed: ${page.errorMessage || 'Unable to retrieve'}]`;
    }
    combinedMarkdown += `\n--- END SOURCE PAGE: ${page.title} ---\n\n`;
  }

  const coverage: InspectionCoverage = {
    pagesRequested: 1 + boundedTargets.length,
    pagesInspected: inspectedPages.filter(p => p.status === 'INSPECTED').length,
    pagesFailed: inspectedPages.filter(p => p.status === 'FAILED').length,
    discoveredPolicyPages: {
      terms: policyLinks.terms || null,
      privacy: policyLinks.privacy || null,
      refund: policyLinks.refund || null,
      shipping: policyLinks.shipping || null,
      contact: policyLinks.contact || null,
    },
  };

  return {
    rootUrl: rootScrape.url,
    domain,
    inspectedPages,
    combinedMarkdown,
    coverage,
  };
}
