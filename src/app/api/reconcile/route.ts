import { NextResponse } from 'next/server';
import { runMatchingEngine } from '@/lib/matching-engine';
import { SAMPLE_INVOICES, SAMPLE_SETTLEMENTS, SAMPLE_BANK_CREDITS } from '@/data/fixtures';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const invoices = body.invoices || SAMPLE_INVOICES;
    const settlements = body.settlements || SAMPLE_SETTLEMENTS;
    const bankCredits = body.bankCredits || SAMPLE_BANK_CREDITS;

    const result = runMatchingEngine({ invoices, settlements, bankCredits });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process reconciliation', message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const result = runMatchingEngine({
    invoices: SAMPLE_INVOICES,
    settlements: SAMPLE_SETTLEMENTS,
    bankCredits: SAMPLE_BANK_CREDITS,
  });
  return NextResponse.json(result);
}
