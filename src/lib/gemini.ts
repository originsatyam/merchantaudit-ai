import { AuditResult } from './types';

export async function analyzeMerchantWithGemini(
  scrapedContent: string,
  merchantUrl: string,
  apiKey?: string
): Promise<Partial<AuditResult>> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key is not configured.');
  }

  // Truncate markdown to fit comfortable token window (approx 25,000 characters)
  const trimmedContent = scrapedContent.slice(0, 25000);

  const systemPrompt = `You are an elite Senior Risk & Compliance Officer auditing online merchants for a major Payment Gateway (Stripe/Razorpay/Visa/Mastercard MCC rules).
Analyze the provided scraped website markdown and evaluate merchant legitimacy and compliance.

Return a STRICT valid JSON object with the following schema:
{
  "overallScore": number (0 to 100),
  "status": "COMPLIANT" | "NEEDS_REVIEW" | "HIGH_RISK",
  "executiveSummary": string (concise 2-3 sentence assessment for a human compliance manager),
  "businessIdentity": {
    "legalEntityName": string (or "Not found"),
    "claimedName": string,
    "entityMatch": boolean,
    "taxId": string (or "Not found"),
    "addressFound": boolean,
    "physicalAddress": string (or "Not found"),
    "supportEmail": string (or "Not found"),
    "supportPhone": string (or "Not found"),
    "evidenceSnippet": string
  },
  "policies": {
    "termsOfService": {
      "id": "terms",
      "name": "Terms of Service",
      "required": true,
      "found": boolean,
      "url": string (or empty),
      "summary": string,
      "confidenceScore": number (0-100),
      "evidenceSnippet": string
    },
    "privacyPolicy": {
      "id": "privacy",
      "name": "Privacy Policy",
      "required": true,
      "found": boolean,
      "url": string (or empty),
      "summary": string,
      "confidenceScore": number (0-100),
      "evidenceSnippet": string
    },
    "refundPolicy": {
      "id": "refund",
      "name": "Refund & Cancellation Policy",
      "required": true,
      "found": boolean,
      "url": string (or empty),
      "summary": string,
      "confidenceScore": number (0-100),
      "evidenceSnippet": string,
      "recommendation": string (optional)
    },
    "shippingOrDeliveryPolicy": {
      "id": "shipping",
      "name": "Shipping & Delivery Policy",
      "required": true,
      "found": boolean,
      "summary": string,
      "confidenceScore": number (0-100),
      "evidenceSnippet": string
    },
    "contactUs": {
      "id": "contact",
      "name": "Contact & Customer Support",
      "required": true,
      "found": boolean,
      "summary": string,
      "confidenceScore": number (0-100),
      "evidenceSnippet": string
    }
  },
  "prohibitedRisk": [
    {
      "category": string,
      "severity": "CRITICAL" | "WARNING" | "CLEAR",
      "flaggedKeywords": string[],
      "explanation": string,
      "evidenceSnippet": string
    }
  ]
}

DO NOT include markdown code fences. Output pure raw JSON only.`;

  const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                { text: `Target Merchant URL: ${merchantUrl}\n\nScraped Website Markdown:\n${trimmedContent}` }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini ${model} failed (${response.status}): ${errText}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('No content returned from Gemini model.');
      }

      // Clean possible stray markdown
      const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt with ${model} failed, trying next...`, lastError.message);
    }
  }

  throw lastError || new Error('All Gemini model invocations failed.');
}
