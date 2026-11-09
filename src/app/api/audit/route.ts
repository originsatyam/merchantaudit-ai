import { NextRequest, NextResponse } from 'next/server';
import { runMerchantAudit } from '@/lib/audit-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'A valid merchant website URL is required.' },
        { status: 400 }
      );
    }

    const audit = await runMerchantAudit({
      url: body.url,
      legalEntityName: body.legalEntityName,
      taxId: body.taxId,
      forceMock: body.forceMock,
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
