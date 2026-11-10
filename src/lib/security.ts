import { createHash } from 'node:crypto';

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

// Private & reserved IPv4 ranges
const PRIVATE_IP_PATTERNS = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 127.0.0.0/8 loopback
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,  // 10.0.0.0/8 private
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12 private
  /^192\.168\.\d{1,3}\.\d{1,3}$/,     // 192.168.0.0/16 private
  /^169\.254\.\d{1,3}\.\d{1,3}$/,     // 169.254.0.0/16 link-local / cloud metadata
  /^0\.0\.0\.0$/,
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'instance-data',
]);

/**
 * Validates merchant URL to guard against SSRF, internal network probing,
 * non-HTTP schemes, and credential stuffing.
 */
export function validateMerchantUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required and must be a string.' };
  }

  let trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'URL cannot be empty.' };
  }

  // Check if an explicit scheme is provided
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      return { valid: false, error: `Protocol "${scheme}:" is not allowed. Only HTTP and HTTPS are permitted.` };
    }
  } else {
    // If no scheme, default to https://
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  // Double check protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Protocol "${parsed.protocol}" is not allowed. Only HTTP and HTTPS are permitted.` };
  }

  // Block credentials in URL
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs containing credentials (user:password) are not allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known localhost/metadata hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, error: `Access to hostname "${hostname}" is blocked for security (SSRF prevention).` };
  }

  // Block IPv6 loopback
  if (hostname === '::1' || hostname === '[::1]') {
    return { valid: false, error: 'Access to loopback address is blocked.' };
  }

  // Check IPv4 private/loopback/metadata patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: `Access to IP address "${hostname}" is blocked for security (private or link-local range).` };
    }
  }

  // Ensure hostname has at least a domain name structure
  if (!hostname.includes('.') && hostname !== 'localhost') {
    return { valid: false, error: 'Hostname must be a fully qualified domain name.' };
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
  };
}

/**
 * Generates an authentic cryptographic review digest (SHA-256)
 * of domain, verdict, reviewer identity, and timestamp.
 */
export function generateAuditDigest(params: {
  domain: string;
  verdict: string;
  reviewerId: string;
  timestamp: string;
}): string {
  const payload = `${params.domain}|${params.verdict}|${params.reviewerId}|${params.timestamp}`;
  const hash = createHash('sha256').update(payload).digest('hex').substring(0, 16).toUpperCase();
  return `EV-${hash}`;
}
