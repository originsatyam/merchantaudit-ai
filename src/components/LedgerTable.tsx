'use client';

import React, { useState } from 'react';
import { ReconciliationChain, ReconciliationStatus } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { formatMoney } from '../lib/money';
import { Search, Check, RotateCcw, AlertTriangle, Eye, HelpCircle } from 'lucide-react';

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
      {/* Top Ledger Bar: Segmented Tabs + Search */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('all')}
          >
            All Records ({chains.length})
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'suggested' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('suggested')}
          >
            Suggested ({countSuggested})
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'review' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('review')}
          >
            Needs Review ({countReview})
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'unexplained' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('unexplained')}
          >
            Unexplained Gaps ({countUnexplained})
          </button>
          <button
            className={`btn btn-sm ${filterTab === 'confirmed' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTab('confirmed')}
          >
            Confirmed ({countConfirmed})
          </button>
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search invoice, UTR, client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="btn btn-sm"
            style={{ width: '220px', paddingLeft: '28px', textAlign: 'left', background: 'var(--surface)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="clean-table">
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Status</th>
              <th>Counterparty / Client</th>
              <th>Invoice Ref</th>
              <th style={{ textAlign: 'right' }}>Invoice Gross</th>
              <th style={{ textAlign: 'right' }}>Bank Credit (INR)</th>
              <th>Difference Analysis</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredChains.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
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
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                  >
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ fontWeight: 550, color: 'var(--text-primary)' }}>
                      {c.invoice?.clientName || c.bankCredit?.narration.slice(0, 24) || 'Unknown Sender'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {c.invoice?.invoiceNumber || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="amt">
                      {c.invoice ? (
                        <>
                          <span className="cur">{c.invoice.currency}</span>
                          {formatMoney(c.invoice.amount.minorUnits, c.invoice.currency).replace(/^[A-Z]+\s+/, '')}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not provided</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} className="amt pos">
                      {c.bankCredit ? (
                        <>
                          <span className="cur">INR</span>
                          {formatMoney(c.bankCredit.creditAmountINR.minorUnits, 'INR').replace(/^[A-Z]+\s+/, '')}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Pending credit</span>
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
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Clean Match</span>
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
                            <RotateCcw size={12} />
                            <span>Unlink</span>
                          </button>
                        ) : c.status === 'suggested' || c.status === 'documented_difference' ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => onConfirmChain(c.id)}
                            title="Confirm this match"
                          >
                            <Check size={12} />
                            <span>Confirm</span>
                          </button>
                        ) : c.status === 'unexplained_difference' ? (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => onSelectChain(c.id)}
                            title="Inspect unexplained gap"
                          >
                            <HelpCircle size={12} />
                            <span>Inspect</span>
                          </button>
                        ) : c.status === 'duplicate_suspected' || c.status === 'needs_review' ? (
                          <button
                            className="btn btn-sm"
                            style={{ borderColor: 'var(--border-focus)', color: 'var(--text-primary)' }}
                            onClick={() => onSelectChain(c.id)}
                            title="Review record"
                          >
                            <Eye size={12} />
                            <span>Review</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
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
