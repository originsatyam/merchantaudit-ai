import { NextRequest, NextResponse } from 'next/server';
import { runMerchantAudit } from '@/lib/audit-engine';
import { validateMerchantUrl } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateMerchantUrl(body.url);
    if (!validation.valid || !validation.normalizedUrl) {
      return NextResponse.json(
        { error: validation.error || 'A valid merchant website URL is required.' },
        { status: 400 }
      );
    }

    const audit = await runMerchantAudit({
      url: validation.normalizedUrl,
      legalEntityName: typeof body.legalEntityName === 'string' ? body.legalEntityName : undefined,
      taxId: typeof body.taxId === 'string' ? body.taxId : undefined,
      forceMock: Boolean(body.forceMock),
    });

    return NextResponse.json(audit);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal audit error';
    console.error('Audit execution error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
