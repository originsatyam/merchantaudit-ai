'use client';

import React from 'react';
import { ProhibitedRiskItem } from '@/lib/types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

interface ProhibitedRiskCardProps {
  risks: ProhibitedRiskItem[];
}

export const ProhibitedRiskCard: React.FC<ProhibitedRiskCardProps> = ({ risks }) => {
  const hasCritical = risks.some(r => r.severity === 'CRITICAL');
  const hasWarning = risks.some(r => r.severity === 'WARNING');

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Card Network Prohibited Goods Scan
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated screening against Visa BRAM & Mastercard GBPP violation categories
          </p>
        </div>

        <div>
          {hasCritical ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Critical Risk Detected
            </span>
          ) : hasWarning ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Requires Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Catalog Clear
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {risks.map((item, idx) => {
          const isCritical = item.severity === 'CRITICAL';
          const isWarning = item.severity === 'WARNING';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-colors ${
                isCritical
                  ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20'
                  : isWarning
                  ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/15'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{item.category}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isCritical
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                          : isWarning
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.explanation}</p>
                </div>
              </div>

              {/* Keywords */}
              {item.flaggedKeywords && item.flaggedKeywords.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Matched:</span>
                  {item.flaggedKeywords.map((kw, kIdx) => (
                    <span
                      key={kIdx}
                      className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-[11px] font-mono font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Evidence Quote */}
              {item.evidenceSnippet && (
                <div className="mt-3 p-2.5 rounded bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-300 shadow-xs">
                  &quot;{item.evidenceSnippet}&quot;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
