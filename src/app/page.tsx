'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ReconciliationChainView } from '../components/ReconciliationChainView';
import { LedgerTable } from '../components/LedgerTable';
import { ImportModal } from '../components/ImportModal';
import { ExportModal } from '../components/ExportModal';
import { AuditLogModal } from '../components/AuditLogModal';
import { Toast } from '../components/Toast';
import {
  createInitialWorkspace,
  confirmChainMatch,
  unlinkChainMatch,
  flagInquiry,
  undoLastAction,
  WorkspaceState,
} from '../lib/reconciliation-store';
import { runMatchingEngine } from '../lib/matching-engine';
import { formatMoney } from '../lib/money';
import {
  ShieldAlert,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  HelpCircle,
  Receipt,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { InvoiceRecord, SettlementRecord, BankCreditRecord } from '../lib/types';

export default function RemitLensApp() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [currentView, setCurrentView] = useState<'workspace' | 'import' | 'audit' | 'readme'>('workspace');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Modals & Overlays
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; action?: string; onAction?: () => void } | null>(null);

  // Initialize workspace on client mount
  useEffect(() => {
    const initial = createInitialWorkspace();
    setWorkspace(initial);

    // Apply dark theme by default
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
  };

  if (!workspace) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading RemitLens Financial Engine...</div>
      </div>
    );
  }

  // Handlers
  const handleConfirmMatch = (chainId: string) => {
    const updated = confirmChainMatch(workspace, chainId);
    setWorkspace(updated);
    setToastMessage({
      text: 'Match confirmed and logged to audit trail.',
      action: 'Undo',
      onAction: () => handleUndo(),
    });
  };

  const handleUnlinkMatch = (chainId: string) => {
    const updated = unlinkChainMatch(workspace, chainId);
    setWorkspace(updated);
    setToastMessage({
      text: 'Match unlinked. Records returned to Review Queue.',
      action: 'Undo',
      onAction: () => handleUndo(),
    });
  };

  const handleFlagInquiry = (chainId: string) => {
    const updated = flagInquiry(workspace, chainId);
    setWorkspace(updated);
    setToastMessage({
      text: 'Unexplained difference flagged for remitting bank inquiry.',
    });
  };

  const handleUndo = () => {
    if (!workspace.lastUndoableAction) return;
    const updated = undoLastAction(workspace);
    setWorkspace(updated);
    setToastMessage({
      text: 'Action reversed. Match state restored.',
    });
  };

  const handleImportNewData = (
    invoices: InvoiceRecord[],
    settlements: SettlementRecord[],
    bankCredits: BankCreditRecord[]
  ) => {
    const result = runMatchingEngine({ invoices, settlements, bankCredits });
    setWorkspace({
      ...workspace,
      chains: result.chains,
      selectedChainId: result.chains[0]?.id || null,
      auditLogs: [
        {
          id: `log_import_${Date.now()}`,
          timestamp: new Date().toISOString(),
          operatorEmail: workspace.activeOperator,
          action: 'IMPORT_FILE',
          details: `Imported ${invoices.length} invoices, ${settlements.length} settlement payouts, and ${bankCredits.length} bank statement credits.`,
          undoable: false,
        },
        ...workspace.auditLogs,
      ],
    });
    setToastMessage({
      text: `Successfully matched ${result.chains.length} reconciliation chains across datasets.`,
    });
  };

  // Metrics calculation
  const totalCreditedINR = workspace.chains.reduce((acc, c) => acc + (c.bankCredit?.creditAmountINR.minorUnits || 0), 0);
  const totalUnexplainedINR = workspace.chains.reduce((acc, c) => acc + Math.abs(c.unexplainedDifferenceINR?.minorUnits || 0), 0);
  const totalDocumentedFees = workspace.chains.reduce((acc, c) => acc + c.documentedDifferences.length, 0);
  const confirmedChains = workspace.chains.filter(c => c.status === 'confirmed');

  const selectedChain = workspace.chains.find(c => c.id === workspace.selectedChainId) || workspace.chains[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Glassmorphic Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={v => {
          if (v === 'import') setIsImportOpen(true);
          else if (v === 'audit') setIsAuditOpen(true);
          else setCurrentView(v);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        confirmedCount={confirmedChains.length}
        totalChains={workspace.chains.length}
      />

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1180px', width: '100%', margin: '0 auto' }}>

        {/* PRD §18 Synthetic Demo Data Notice */}
        <div
          style={{
            background: 'var(--status-review-bg)',
            border: '1px solid var(--status-review-border)',
            color: 'var(--status-review-text)',
            padding: '8px 14px',
            fontSize: '12px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={14} />
            <span>
              <strong>Demo Environment:</strong> All counterparty names, invoices, and bank references are synthetic demo data.
            </span>
          </div>
          <button
            className="btn btn-sm"
            style={{ height: '24px', padding: '0 8px', fontSize: '11px', background: 'transparent', borderColor: 'currentColor', color: 'inherit' }}
            onClick={() => setIsImportOpen(true)}
          >
            Switch / Import Datasets
          </button>
        </div>

        {/* VIEW: WORKSPACE */}
        {currentView === 'workspace' && (
          <div>
            {/* Quick Metrics KPI Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Total Inward Credited (INR)
                </div>
                <div className="amt pos" style={{ fontSize: '20px', fontWeight: 600 }}>
                  {formatMoney(totalCreditedINR, 'INR')}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Across {workspace.chains.length} transactions
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Documented Provider Fees
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--status-documented-text)' }}>
                  {totalDocumentedFees} Deductions
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Itemized in Stripe & Wise files
                </div>
              </div>

              <div className="card" style={{ padding: '16px', borderLeft: totalUnexplainedINR > 0 ? '2px solid var(--status-unexplained-text)' : '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Unexplained Differences
                </div>
                <div className="amt neg" style={{ fontSize: '20px', fontWeight: 600 }}>
                  {formatMoney(-totalUnexplainedINR, 'INR')}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--status-unexplained-text)', marginTop: '4px' }}>
                  Requires bank inquiry (Never guessed)
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Reconciliation Progress
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--status-confirmed-text)' }}>
                  {confirmedChains.length} / {workspace.chains.length}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {Math.round((confirmedChains.length / Math.max(1, workspace.chains.length)) * 100)}% Verified by human
                </div>
              </div>
            </div>

            {/* Active 3-Way Reconciliation Chain Visualizer */}
            {selectedChain && (
              <section style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                    Selected Chain Inspection (3-Way Link)
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Click any table row below to inspect
                  </span>
                </div>
                <ReconciliationChainView
                  chain={selectedChain}
                  onConfirm={handleConfirmMatch}
                  onUnlink={handleUnlinkMatch}
                  onFlagInquiry={handleFlagInquiry}
                />
              </section>
            )}

            {/* Master Review Workspace Ledger */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                  Reconciliation Master Ledger
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Showing {workspace.chains.length} active chains
                </span>
              </div>
              <LedgerTable
                chains={workspace.chains}
                selectedChainId={workspace.selectedChainId}
                onSelectChain={id => setWorkspace({ ...workspace, selectedChainId: id })}
                onConfirmChain={handleConfirmMatch}
                onUnlinkChain={handleUnlinkMatch}
              />
            </section>
          </div>
        )}

        {/* VIEW: PRD SPECS & GUIDELINES */}
        {currentView === 'readme' && (
          <div className="card" style={{ padding: '32px', lineHeight: 1.7 }}>
            <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>RemitLens Product Architecture (PRD v0.1)</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Reference guide on non-goals, data integrity invariants, and matching rules.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>1. The One Core Question</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              RemitLens establishes an inspectable 3-way chain connecting:
              <br />
              <strong>1. Client Invoices (USD/EUR/GBP)</strong> ➔ <strong>2. Provider Settlement Records (Stripe/Wise)</strong> ➔ <strong>3. Indian Bank Credits (INR)</strong>.
            </p>

            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>2. Strict Data Integrity Invariants</h3>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <li><strong>No Floating Point Math:</strong> All values stored as 64-bit integer minor units (paise/cents).</li>
              <li><strong>Suggestion Is Not Fact:</strong> Suggestions use dashed borders and spark glyphs. Checkmarks only appear after human confirmation.</li>
              <li><strong>Missing Stays Missing:</strong> Missing fields render as <em>"Not provided"</em> in muted italics. Never coerced to 0.00 or N/A.</li>
              <li><strong>Never Guess Intermediary Charges:</strong> Unaccounted transit gaps are strictly labeled as <em>"Unexplained Difference"</em>.</li>
            </ul>

            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>3. Non-Goals & Boundaries (PRD §6)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              RemitLens is strictly a financial operations tool. It does not touch or move money, does not issue regulatory FIRCs, and does not provide tax or FEMA advice.
            </p>
          </div>
        )}

      </main>

      {/* Overlays & Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportData={handleImportNewData}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        chains={workspace.chains}
      />

      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        auditLogs={workspace.auditLogs}
        onUndo={workspace.lastUndoableAction ? handleUndo : undefined}
      />

      {toastMessage && (
        <Toast
          message={toastMessage.text}
          actionLabel={toastMessage.action}
          onAction={toastMessage.onAction}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
