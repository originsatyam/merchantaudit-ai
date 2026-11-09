// Deterministic compliance rules and prohibited category patterns

export const PROHIBITED_KEYWORDS = [
  'counterfeit',
  'replica watches',
  'fake id',
  'buy narcotics',
  'unlicensed pharmacy',
  'steroids online',
  'lose 15kg in 7 days',
  'miracle cure',
  'guaranteed 1000% return',
  'get rich quick',
  'pyramid scheme',
  'unregistered casino',
  'cracked software',
  'hacked accounts',
  'negative option billing'
];

export function scanProhibitedKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const flagged: string[] = [];
  for (const kw of PROHIBITED_KEYWORDS) {
    if (lower.includes(kw)) {
      flagged.push(kw);
    }
  }
  return flagged;
}

export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return Array.from(new Set(matches)).filter(e => !e.includes('example.com') && !e.includes('domain.com'));
}

export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  const matches = text.match(phoneRegex) || [];
  return Array.from(new Set(matches)).filter(p => p.replace(/\D/g, '').length >= 10);
}

export function extractTaxOrRegIds(text: string): string[] {
  // Common patterns: GSTIN (15 chars in India), CIN (21 chars), EIN (XX-XXXXXXX in US)
  const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/g;
  const cinRegex = /\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g;
  const einRegex = /\b\d{2}-\d{7}\b/g;

  const results: string[] = [];
  const gstin = text.match(gstinRegex);
  if (gstin) results.push(...gstin);
  const cin = text.match(cinRegex);
  if (cin) results.push(...cin);
  const ein = text.match(einRegex);
  if (ein) results.push(...ein);

  return Array.from(new Set(results));
}
