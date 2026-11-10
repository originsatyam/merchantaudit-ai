'use client';

import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { SAMPLE_INVOICES, SAMPLE_SETTLEMENTS, SAMPLE_BANK_CREDITS } from '../data/fixtures';
import { InvoiceRecord, SettlementRecord, BankCreditRecord } from '../lib/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (invoices: InvoiceRecord[], settlements: SettlementRecord[], bankCredits: BankCreditRecord[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportData }) => {
  const [selectedPreset, setSelectedPreset] = useState<'agency' | 'saas'>('agency');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onImportData(SAMPLE_INVOICES, SAMPLE_SETTLEMENTS, SAMPLE_BANK_CREDITS);
      setIsProcessing(false);
      onClose();
    }, 300);
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
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--surface)',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Import Financial Files (3-Way Datasets)</h3>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
              RemitLens connects three independent financial records. Upload CSV/XLSX statements or load pre-verified sample data.
            </p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {/* 3 Dataset Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Dataset 1
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>Client Invoices</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USD, EUR, GBP registers with invoice numbers</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Dataset 2
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>Provider Payouts</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Stripe, Wise, Payoneer itemized statements</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Dataset 3
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>Indian Bank Credits</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>HDFC, ICICI, Axis INR credit UTR lines</div>
          </div>
        </div>

        {/* Drag & Drop Box */}
        <div
          style={{
            border: '1.5px dashed var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-subtle)',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
          onClick={handleLoadSample}
        >
          <UploadCloud size={28} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            Drop statement files here (CSV or XLSX)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Supports QuickBooks, Stripe Payouts, Wise Business, and Indian Current Account exports
          </div>
        </div>

        {/* 1-Click Instant Demo Loader */}
        <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <strong style={{ fontSize: '13px' }}>1-Click Instant Test Dataset (Indian Software Studio)</strong>
          </div>
          <p style={{ fontSize: '12px', margin: '0 0 12px 0', color: 'var(--text-secondary)' }}>
            Pre-loaded with 6 overseas client invoices, Stripe/Wise itemized payout deductions, HDFC bank credits, clean matches, and a flagged unexplained gap.
          </p>
          <button className="btn btn-primary" onClick={handleLoadSample} disabled={isProcessing} style={{ width: '100%' }}>
            {isProcessing ? 'Processing Matching Engine...' : 'Load Demo Workspace (17 Records)'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
