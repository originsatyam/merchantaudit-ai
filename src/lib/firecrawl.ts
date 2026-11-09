export interface ScrapedPageResult {
  url: string;
  markdown: string;
  title?: string;
  description?: string;
  statusCode?: number;
}

export async function scrapeUrlWithFirecrawl(url: string, apiKey?: string): Promise<ScrapedPageResult> {
  const key = apiKey || process.env.FIRECRAWL_API_KEY;
  if (!key) {
    throw new Error('Firecrawl API key is not configured.');
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: targetUrl,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 15000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl scrape failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.success && !data.data) {
    throw new Error(data.error || 'Failed to scrape webpage.');
  }

  return {
    url: targetUrl,
    markdown: data.data?.markdown || '',
    title: data.data?.metadata?.title || targetUrl,
    description: data.data?.metadata?.description || '',
    statusCode: data.data?.metadata?.statusCode || 200,
  };
}
