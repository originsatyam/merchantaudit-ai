'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Terminal, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onSelectSample: (type: 'valid' | 'pharma' | 'missing') => void;
  mockMode: boolean;
  setMockMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectSample, mockMode, setMockMode }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[11px] flex items-center justify-center transition-colors">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base tracking-tight">MerchantAudit</span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">AI + HITL</span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">Institutional KYB & Human-in-the-Loop Risk Review</p>
          </div>
        </div>

        {/* Quick Sample Selector & Theme & Engine Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset Buttons */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
            <span className="px-2 text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Presets:
            </span>
            <button
              onClick={() => onSelectSample('valid')}
              className="px-2.5 py-1 rounded text-xs hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition shadow-xs"
            >
              Compliant D2C
            </button>
            <button
              onClick={() => onSelectSample('missing')}
              className="px-2.5 py-1 rounded text-xs hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition shadow-xs"
            >
              Needs Review SaaS
            </button>
            <button
              onClick={() => onSelectSample('pharma')}
              className="px-2.5 py-1 rounded text-xs hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition shadow-xs"
            >
              High Risk Pharma
            </button>
          </div>

          {/* Engine Mode Toggle */}
          <button
            onClick={() => setMockMode(!mockMode)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              mockMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            }`}
            title="Toggle between zero-token instant demo mode and live Firecrawl scraping"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-medium">{mockMode ? 'Mock Mode' : 'Live Crawl'}</span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
