'use client';

import React from 'react';
import {
  UploadCloud,
  Download,
  Sun,
  Moon,
  ShieldCheck,
  BookOpen,
  LayoutDashboard,
  SearchCheck
} from 'lucide-react';

interface NavbarProps {
  currentView: 'workspace' | 'import' | 'audit' | 'readme';
  onViewChange: (view: 'workspace' | 'import' | 'audit' | 'readme') => void;
  onOpenExport: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  confirmedCount: number;
  totalChains: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenExport,
  isDarkMode,
  onToggleTheme,
  confirmedCount,
  totalChains,
}) => {
  return (
    <header className="header">
      {/* Brand Logo */}
      <div
        className="brand"
        onClick={() => onViewChange('workspace')}
        style={{ cursor: 'pointer' }}
        title="RemitLens - Cross-Border Payment Reconciliation"
      >
        <div className="brand-icon">
          <SearchCheck size={16} strokeWidth={2.5} />
        </div>
        <span>RemitLens</span>
        <span className="version-tag">B2B Recon</span>
      </div>

      {/* Segmented View Switcher */}
      <nav className="view-tabs" role="tablist" aria-label="Main Navigation">
        <button
          className={`view-tab ${currentView === 'workspace' ? 'active' : ''}`}
          onClick={() => onViewChange('workspace')}
        >
          <LayoutDashboard size={14} strokeWidth={2} />
          <span>Workspace</span>
        </button>
        <button
          className={`view-tab ${currentView === 'import' ? 'active' : ''}`}
          onClick={() => onViewChange('import')}
        >
          <UploadCloud size={14} strokeWidth={2} />
          <span>Import Files</span>
        </button>
        <button
          className={`view-tab ${currentView === 'audit' ? 'active' : ''}`}
          onClick={() => onViewChange('audit')}
        >
          <ShieldCheck size={14} strokeWidth={2} />
          <span>Audit Trail</span>
        </button>
        <button
          className={`view-tab ${currentView === 'readme' ? 'active' : ''}`}
          onClick={() => onViewChange('readme')}
        >
          <BookOpen size={14} strokeWidth={2} />
          <span>PRD Specs</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Workspace Progress Indicator */}
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginRight: '6px', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--status-confirmed-text)' }}>{confirmedCount}</strong> of {totalChains} verified
        </div>

        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>

        {/* Export Button */}
        <button className="btn btn-primary btn-sm" onClick={onOpenExport}>
          <Download size={14} strokeWidth={2} />
          <span>Export Ledger</span>
        </button>
      </div>
    </header>
  );
};
