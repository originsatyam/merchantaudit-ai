'use client';

import React from 'react';
import {
  Layers,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sun,
  Moon,
  ShieldCheck,
  BookOpen,
  LayoutDashboard
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
      {/* Brand logo */}
      <div className="brand" onClick={() => onViewChange('workspace')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <path d="M11 8v6M8 11h6"></path>
          </svg>
        </div>
        <span>RemitLens</span>
        <span className="version-tag">B2B Recon</span>
      </div>

      {/* Segmented View Switcher */}
      <nav className="view-tabs" role="tablist">
        <button
          className={`view-tab ${currentView === 'workspace' ? 'active' : ''}`}
          onClick={() => onViewChange('workspace')}
        >
          <LayoutDashboard size={13} />
          Workspace
        </button>
        <button
          className={`view-tab ${currentView === 'import' ? 'active' : ''}`}
          onClick={() => onViewChange('import')}
        >
          <UploadCloud size={13} />
          Import Files
        </button>
        <button
          className={`view-tab ${currentView === 'audit' ? 'active' : ''}`}
          onClick={() => onViewChange('audit')}
        >
          <ShieldCheck size={13} />
          Audit Trail
        </button>
        <button
          className={`view-tab ${currentView === 'readme' ? 'active' : ''}`}
          onClick={() => onViewChange('readme')}
        >
          <BookOpen size={13} />
          PRD Specs
        </button>
      </nav>

      {/* Right controls */}
      <div className="header-actions">
        {/* Workspace Progress Indicator */}
        <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginRight: '4px' }}>
          <strong style={{ color: 'var(--status-confirmed-text)' }}>{confirmedCount}</strong> of {totalChains} verified
        </div>

        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>

        {/* Export Button */}
        <button className="btn btn-primary btn-sm" onClick={onOpenExport}>
          <Download size={13} />
          Export Ledger
        </button>
      </div>
    </header>
  );
};
