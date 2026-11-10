'use client';

import React, { useState } from 'react';
import { ReconciliationChain } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { formatMoney } from '../lib/money';
import { Search, Check, RotateCcw, Eye, HelpCircle } from 'lucide-react';

interface LedgerTableProps {
  chains: ReconciliationChain[];
  selectedChainId: string | null;
  onSelectChain: (id: string) => void;
  onConfirmChain: (id: string) => void;
  onUnlinkChain: (id: string) => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  chains,
  selectedChainId,
  onSelectChain,
  onConfirmChain,
  onUnlinkChain,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'suggested' | 'review' | 'unexplained' | 'confirmed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Filtering
  const filteredChains = chains.filter(chain => {
    // Status Tab Match
    if (filterTab === 'suggested' && chain.status !== 'suggested') return false;
    if (filterTab === 'review' && chain.status !== 'needs_review' && chain.status !== 'duplicate_suspected') return false;
    if (filterTab === 'unexplained' && chain.status !== 'unexplained_difference') return false;
    if (filterTab === 'confirmed' && chain.status !== 'confirmed') return false;

    // Search Query Match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const client = chain.invoice?.clientName?.toLowerCase() || '';
      const invRef = chain.invoice?.invoiceNumber?.toLowerCase() || '';
      const bankUtr = chain.bankCredit?.utrReference?.toLowerCase() || '';
      const chainRef = chain.chainReference.toLowerCase();
      return client.includes(q) || invRef.includes(q) || bankUtr.includes(q) || chainRef.includes(q);
    }

    return true;
  });

  const countSuggested = chains.filter(c => c.status === 'suggested').length;
  const countReview = chains.filter(c => c.status === 'needs_review' || c.status === 'duplicate_suspected').length;
  const countUnexplained = chains.filter(c => c.status === 'unexplained_difference').length;
  const countConfirmed = chains.filter(c => c.status === 'confirmed').length;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Top Ledger Bar: Linear Segmented Filter Tabs + Fast Search */}
      <div
        style={{
          padding: '12px 18px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('all')}
            style={{ borderRadius: 'var(--radius-pill)', gap: '6px' }}
          >
            <span>All</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: filterTab === 'all' ? 'rgba(0,0,0,0.2)' : 'var(--border)',
              fontWeight: 600,
            }}>
              {chains.length}
            </span>
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'suggested' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('suggested')}
            style={{ borderRadius: 'var(--radius-pill)', gap: '6px' }}
          >
            <span>Suggested</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: filterTab === 'suggested' ? 'rgba(0,0,0,0.2)' : 'var(--border)',
              fontWeight: 600,
            }}>
              {countSuggested}
            </span>
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'review' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('review')}
            style={{ borderRadius: 'var(--radius-pill)', gap: '6px' }}
          >
            <span>Needs Review</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: filterTab === 'review' ? 'rgba(0,0,0,0.2)' : 'var(--border)',
              fontWeight: 600,
            }}>
              {countReview}
            </span>
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'unexplained' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('unexplained')}
            style={{ borderRadius: 'var(--radius-pill)', gap: '6px' }}
          >
            <span>Unexplained Gaps</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: filterTab === 'unexplained' ? 'rgba(0,0,0,0.2)' : 'var(--border)',
              fontWeight: 600,
            }}>
              {countUnexplained}
            </span>
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'confirmed' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('confirmed')}
            style={{ borderRadius: 'var(--radius-pill)', gap: '6px' }}
          >
            <span>Confirmed</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: filterTab === 'confirmed' ? 'rgba(0,0,0,0.2)' : 'var(--border)',
              fontWeight: 600,
            }}>
              {countConfirmed}
            </span>
          </button>
        </div>

        {/* Linear / Supabase Style Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search invoice, UTR, client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="btn btn-sm"
            style={{
              width: '240px',
              paddingLeft: '32px',
              paddingRight: '30px',
              textAlign: 'left',
              background: 'var(--surface)',
              fontSize: '12.5px',
              letterSpacing: 0,
            }}
          />
          <kbd style={{
            position: 'absolute',
            right: '8px',
            fontSize: '10.5px',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '1px 5px',
            fontFamily: 'var(--font-mono)',
            userSelect: 'none',
          }}>
            /
          </kbd>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="clean-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Status</th>
              <th>Counterparty / Client</th>
              <th>Invoice Ref</th>
              <th style={{ textAlign: 'right' }}>Invoice Gross</th>
              <th style={{ textAlign: 'right' }}>Bank Credit (INR)</th>
              <th>Difference Analysis</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredChains.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  No records matching the selected criteria.
                </td>
              </tr>
            ) : (
              filteredChains.map(c => {
                const isSelected = c.id === selectedChainId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectChain(c.id)}
                    style={{
                      background: isSelected ? 'var(--surface-hover)' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid var(--accent)' : '4px solid transparent',
                      transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ fontWeight: 550, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {c.invoice?.clientName || c.bankCredit?.narration.slice(0, 26) || 'Unknown Sender'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {c.invoice?.invoiceNumber || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="amt">
                      {c.invoice ? (
                        <>
                          <span className="cur">{c.invoice.currency}</span>
                          {formatMoney(c.invoice.amount.minorUnits, c.invoice.currency).replace(/^[A-Z]+\s+/, '')}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontWeight: 400 }}>Not provided</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} className="amt pos">
                      {c.bankCredit ? (
                        <>
                          <span className="cur">INR</span>
                          {formatMoney(c.bankCredit.creditAmountINR.minorUnits, 'INR').replace(/^[A-Z]+\s+/, '')}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontWeight: 400 }}>Pending credit</span>
                      )}
                    </td>
                    <td>
                      {c.unexplainedDifferenceINR ? (
                        <span className="badge unexplained">
                          {formatMoney(c.unexplainedDifferenceINR.minorUnits, 'INR')} Gap
                        </span>
                      ) : c.documentedDifferences.length > 0 ? (
                        <span className="badge documented">
                          {c.documentedDifferences.length} Fee(s) itemized
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Clean Match</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        {c.status === 'confirmed' ? (
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => onUnlinkChain(c.id)}
                            title="Unlink"
                          >
                            <RotateCcw size={13} />
                            <span>Unlink</span>
                          </button>
                        ) : c.status === 'suggested' || c.status === 'documented_difference' ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => onConfirmChain(c.id)}
                            title="Confirm this match"
                          >
                            <Check size={13} strokeWidth={2.5} />
                            <span>Confirm</span>
                          </button>
                        ) : c.status === 'unexplained_difference' ? (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => onSelectChain(c.id)}
                            title="Inspect unexplained gap"
                          >
                            <HelpCircle size={13} />
                            <span>Inspect</span>
                          </button>
                        ) : c.status === 'duplicate_suspected' || c.status === 'needs_review' ? (
                          <button
                            className="btn btn-sm"
                            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                            onClick={() => onSelectChain(c.id)}
                            title="Review record"
                          >
                            <Eye size={13} />
                            <span>Review</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            Unmatched
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
