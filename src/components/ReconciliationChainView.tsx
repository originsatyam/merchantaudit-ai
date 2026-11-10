'use client';

import React from 'react';
import { ReconciliationChain } from '../lib/types';
import { formatMoney, formatMoneyOrMissing } from '../lib/money';
import { StatusBadge } from './StatusBadge';
import {
  FileText,
  CreditCard,
  Building2,
  ArrowRight,
  Check,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Receipt,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface ReconciliationChainViewProps {
  chain: ReconciliationChain;
  onConfirm: (chainId: string) => void;
  onUnlink: (chainId: string) => void;
  onFlagInquiry?: (chainId: string) => void;
}

export const ReconciliationChainView: React.FC<ReconciliationChainViewProps> = ({
  chain,
  onConfirm,
  onUnlink,
  onFlagInquiry,
}) => {
  const {
    id,
    chainReference,
    status,
    invoice,
    settlement,
    bankCredit,
    evidence,
    overallConfidence,
    documentedDifferences,
    unexplainedDifferenceINR,
    impliedFxRate,
    confirmedBy,
    confirmedAt,
  } = chain;

  const isConfirmed = status === 'confirmed';

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Chain Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StatusBadge status={status} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {chainReference}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            · Match Confidence: <strong>{overallConfidence}%</strong>
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isConfirmed ? (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onConfirm(id)}
              title="Verify and confirm this match"
            >
              <Check size={14} strokeWidth={2.5} />
              Confirm Match
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--status-confirmed-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Confirmed by {confirmedBy}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => onUnlink(id)}
                title="Unlink records and return to review"
              >
                <RotateCcw size={13} />
                Unlink
              </button>
            </div>
          )}

          {unexplainedDifferenceINR && onFlagInquiry && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onFlagInquiry(id)}
              title="Flag unaccounted gap for bank inquiry"
            >
              <HelpCircle size={13} />
              Inquire Gap
            </button>
          )}
        </div>
      </div>

      {/* 3-Way Visualizer Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 32px 1fr 32px 1fr',
          alignItems: 'stretch',
          gap: '0',
          margin: '16px 0',
        }}
      >
        {/* Node 1: Invoice */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={13} />
              1. Client Invoice
            </div>
            {invoice ? (
              <>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{invoice.clientName}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  {invoice.invoiceNumber}
                </div>
                <div className="amt" style={{ fontSize: '16px', fontWeight: 600 }}>
                  <span className="cur">{invoice.currency}</span>
                  {formatMoney(invoice.amount.minorUnits, invoice.currency).replace(/^[A-Z]+\s+/, '')}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>
                No invoice attached
              </div>
            )}
          </div>
          {invoice && (
            <div style={{ marginTop: '12px' }}>
              <span className="src-chip" title="Source provenance">
                {invoice.provenance.fileName}:{invoice.provenance.rowNumber}
              </span>
            </div>
          )}
        </div>

        {/* Arrow 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
          <ArrowRight size={16} />
        </div>

        {/* Node 2: Provider Settlement */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CreditCard size={13} />
              2. Provider Settlement
            </div>
            {settlement ? (
              <>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                  {settlement.provider} Payout
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  {settlement.reference}
                </div>
                <div className="amt" style={{ fontSize: '16px', fontWeight: 600 }}>
                  <span className="cur">{settlement.currency}</span>
                  {formatMoney(settlement.netSettlementAmount.minorUnits, settlement.currency).replace(/^[A-Z]+\s+/, '')}
                </div>
                {settlement.feeDeductions.length > 0 && (
                  <div className="amt neg" style={{ fontSize: '11.5px', marginTop: '2px' }}>
                    Fee: {settlement.currency} -
                    {(
                      settlement.feeDeductions.reduce((s, f) => s + Math.abs(f.amount.minorUnits), 0) / 100
                    ).toFixed(2)}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>
                Direct bank transfer (No provider record)
              </div>
            )}
          </div>
          {settlement && (
            <div style={{ marginTop: '12px' }}>
              <span className="src-chip" title="Source provenance">
                {settlement.provenance.fileName}:{settlement.provenance.rowNumber}
              </span>
            </div>
          )}
        </div>

        {/* Arrow 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
          <ArrowRight size={16} />
        </div>

        {/* Node 3: Bank Credit */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Building2 size={13} />
              3. Indian Bank Credit
            </div>
            {bankCredit ? (
              <>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                  Bank Current A/C
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  UTR: {bankCredit.utrReference}
                </div>
                <div className="amt pos" style={{ fontSize: '16px', fontWeight: 600 }}>
                  <span className="cur">INR</span>
                  {formatMoney(bankCredit.creditAmountINR.minorUnits, 'INR').replace(/^[A-Z]+\s+/, '')}
                </div>
                {impliedFxRate && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Implied FX: ₹{impliedFxRate}/{invoice?.currency || 'USD'}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>
                Bank credit pending arrival
              </div>
            )}
          </div>
          {bankCredit && (
            <div style={{ marginTop: '12px' }}>
              <span className="src-chip" title="Source provenance">
                {bankCredit.provenance.fileName}:{bankCredit.provenance.rowNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Difference Breakdown Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Documented Deductions */}
        <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Receipt size={13} style={{ color: 'var(--status-documented-text)' }} />
              Documented Deductions
            </span>
            <span className="badge documented">Itemized</span>
          </div>
          {documentedDifferences.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {documentedDifferences.map((diff, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{diff.label}</span>
                  <span className="amt neg">{formatMoney(diff.amount.minorUnits, diff.amount.currency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No provider fees itemized in uploaded statement.</div>
          )}
        </div>

        {/* Unexplained Difference (Never guess intermediary fees) */}
        <div
          style={{
            padding: '12px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${unexplainedDifferenceINR ? 'var(--status-unexplained-border)' : 'var(--border)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <HelpCircle size={13} style={{ color: unexplainedDifferenceINR ? 'var(--status-unexplained-text)' : 'var(--text-tertiary)' }} />
              Unexplained Difference
            </span>
            {unexplainedDifferenceINR ? (
              <span className="badge unexplained">Unaccounted</span>
            ) : (
              <span className="badge confirmed">Zero Gap</span>
            )}
          </div>
          {unexplainedDifferenceINR ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Unaccounted shortfall:</span>
                <span className="amt neg">{formatMoney(unexplainedDifferenceINR.minorUnits, 'INR')}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                <strong>Strict Rule:</strong> No uploaded file accounts for this gap. RemitLens does not assume intermediary correspondent bank fees without evidence.
              </p>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Net bank credit strictly accounts for all expected funds and stated fees.
            </div>
          )}
        </div>
      </div>

      {/* Match Evidence Footnote */}
      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Evidence trail:</span>
        {evidence.map((ev, i) => (
          <span
            key={i}
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {ev.field}: {ev.description}
          </span>
        ))}
      </div>
    </div>
  );
};
