'use client';

import React from 'react';
import { ReconciliationChain } from '../lib/types';
import { formatMoney } from '../lib/money';
import { StatusBadge } from './StatusBadge';
import {
  FileText,
  CreditCard,
  Building2,
  ArrowRight,
  Check,
  RotateCcw,
  HelpCircle,
  Receipt,
  ShieldCheck
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
  } = chain;

  const isConfirmed = status === 'confirmed';

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
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
              <Check size={13} strokeWidth={2.5} />
              <span>Confirm Match</span>
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
                <span>Unlink</span>
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
              <span>Inquire Gap</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Way Visualizer Grid */}
      <div className="recon-chain">
        {/* Node 1: Invoice */}
        <div className="recon-card">
          <div>
            <div className="recon-label">
              <FileText size={13} />
              <span>1. Client Invoice</span>
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
        <div className="recon-arrow">
          <ArrowRight size={16} />
        </div>

        {/* Node 2: Provider Settlement */}
        <div className="recon-card">
          <div>
            <div className="recon-label">
              <CreditCard size={13} />
              <span>2. Provider Settlement</span>
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
        <div className="recon-arrow">
          <ArrowRight size={16} />
        </div>

        {/* Node 3: Bank Credit */}
        <div className="recon-card">
          <div>
            <div className="recon-label">
              <Building2 size={13} />
              <span>3. Indian Bank Credit</span>
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
              <div className="amt neg" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                INR {formatMoney(unexplainedDifferenceINR.minorUnits, 'INR')} Missing in Transit
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                Net bank credit is lower than expected after subtracting all documented provider fees. In accordance with PRD Rule #3, RemitLens never guesses intermediary correspondent bank deductions without file proof.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Net bank credit strictly accounts for all expected funds and stated fees.
            </div>
          )}
        </div>
      </div>

      {/* Audit Evidence Trail */}
      {evidence.length > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Evidence trail:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {evidence.map((ev, i) => (
              <span key={i} className="src-chip" style={{ fontSize: '10.5px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{ev.field}:</strong> {ev.description}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
