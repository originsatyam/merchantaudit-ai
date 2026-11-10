'use client';

import React from 'react';
import { Download, FileText, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { ReconciliationChain } from '../lib/types';
import { formatMoney } from '../lib/money';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chains: ReconciliationChain[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, chains }) => {
  if (!isOpen) return null;

  const confirmedChains = chains.filter(c => c.status === 'confirmed');
  const unexplainedChains = chains.filter(c => c.status === 'unexplained_difference');

  const totalBankCreditedINR = chains.reduce((acc, c) => acc + (c.bankCredit?.creditAmountINR.minorUnits || 0), 0);
  const totalUnexplainedINR = chains.reduce((acc, c) => acc + Math.abs(c.unexplainedDifferenceINR?.minorUnits || 0), 0);

  const handleDownloadCsv = () => {
    const headers = [
      'Chain Ref',
      'Status',
      'Client Name',
      'Invoice Number',
      'Invoice Currency',
      'Invoice Amount',
      'Settlement Provider',
      'Settlement Ref',
      'Net Settlement Amount',
      'Bank UTR',
      'Bank Credit INR',
      'Implied FX Rate',
      'Documented Fees',
      'Unexplained Gap INR',
      'Confirmed By',
      'Confirmed At'
    ];

    const rows = chains.map(c => [
      c.chainReference,
      c.status,
      `"${c.invoice?.clientName || ''}"`,
      c.invoice?.invoiceNumber || '',
      c.invoice?.currency || '',
      c.invoice ? (c.invoice.amount.minorUnits / 100).toFixed(2) : '',
      c.settlement?.provider || '',
      c.settlement?.reference || '',
      c.settlement ? (c.settlement.netSettlementAmount.minorUnits / 100).toFixed(2) : '',
      c.bankCredit?.utrReference || '',
      c.bankCredit ? (c.bankCredit.creditAmountINR.minorUnits / 100).toFixed(2) : '',
      c.impliedFxRate || '',
      c.documentedDifferences.length,
      c.unexplainedDifferenceINR ? (c.unexplainedDifferenceINR.minorUnits / 100).toFixed(2) : '0.00',
      c.confirmedBy || '',
      c.confirmedAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `remitlens_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chains, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `remitlens_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '540px',
          width: '100%',
          background: 'var(--surface)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>Export Reconciliation Report</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {/* Summary Card */}
        <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Current Ledger Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Bank Credits (INR)</div>
              <div className="amt pos" style={{ fontSize: '15px', fontWeight: 600 }}>
                {formatMoney(totalBankCreditedINR, 'INR')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Unexplained Discrepancies</div>
              <div className="amt neg" style={{ fontSize: '15px', fontWeight: 600 }}>
                {formatMoney(-totalUnexplainedINR, 'INR')}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>{confirmedChains.length}</strong> of {chains.length} matches verified and stamped by operator.
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={handleDownloadCsv} style={{ height: '36px' }}>
            <Download size={14} />
            Download Complete Reconciliation (CSV)
          </button>
          <button className="btn" onClick={handleDownloadJson} style={{ height: '36px' }}>
            <FileText size={14} />
            Export Raw Ledger Data (JSON)
          </button>
          <button className="btn btn-ghost" onClick={() => window.print()} style={{ height: '36px' }}>
            <Printer size={14} />
            Print Accounting Summary
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
