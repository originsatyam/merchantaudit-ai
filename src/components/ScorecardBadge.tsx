'use client';

import React from 'react';
import { AuditStatus, HumanAuditSignoff } from '@/lib/types';
import { ShieldCheck, AlertTriangle, XCircle, ExternalLink, Calendar, Globe, Award, UserCheck } from 'lucide-react';

interface ScorecardBadgeProps {
  score: number;
  status: AuditStatus;
  domain: string;
  url: string;
  timestamp: string;
  humanDecision?: HumanAuditSignoff;
}

export const ScorecardBadge: React.FC<ScorecardBadgeProps> = ({
  score,
  status,
  domain,
  url,
  timestamp,
  humanDecision,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLIANT':
        return {
          label: 'Policies Observed & Low Risk',
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          border: 'border-emerald-200 dark:border-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          badgeText: 'text-emerald-800 dark:text-emerald-300',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
          icon: ShieldCheck,
          recommendation: 'Observed consumer disclosures and identity signals match declared merchant profile.',
        };
      case 'NEEDS_REVIEW':
        return {
          label: 'Requires Analyst Verification',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-500/30',
          text: 'text-amber-700 dark:text-amber-400',
          badgeText: 'text-amber-800 dark:text-amber-300',
          badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
          icon: AlertTriangle,
          recommendation: 'Potential gaps in observed disclosures or refund terms. Analyst verification recommended before onboarding.',
        };
      case 'HIGH_RISK':
        return {
          label: 'Observable Risk Indicators Flagged',
          bg: 'bg-rose-50 dark:bg-rose-950/20',
          border: 'border-rose-200 dark:border-rose-500/30',
          text: 'text-rose-700 dark:text-rose-400',
          badgeText: 'text-rose-800 dark:text-rose-300',
          badgeBg: 'bg-rose-100 dark:bg-rose-500/20',
          icon: XCircle,
          recommendation: 'Observable risk signals or flagged keywords detected during inspection. Review evidence pack below.',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isHumanSigned = humanDecision && humanDecision.verdict !== 'PENDING';

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-6 relative overflow-hidden backdrop-blur-sm transition-all duration-200`}>
      {/* Human Review Decision Stamp */}
      {isHumanSigned && (
        <div className="mb-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-600/40 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Analyst Review: {humanDecision.verdict} by {humanDecision.reviewerName}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Digest: {humanDecision.auditHash}</span>
            <span>•</span>
            <span>{humanDecision.reviewedAt ? humanDecision.reviewedAt.split('T')[0] : ''}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Domain & Status */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText} border ${config.border}`}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3" />
              {timestamp ? timestamp.split('T')[0] : '2026-11-10'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Human Supervised
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-zinc-400" />
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{domain}</h2>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                title="Open merchant site"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">{config.recommendation}</p>
          </div>
        </div>

        {/* Right: Score Metric Circle */}
        <div className="flex items-center gap-5 self-start md:self-auto bg-white/90 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Evidence Index</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">Automated Scan</div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
              <span className={`text-2xl font-bold font-mono ${config.text}`}>
                {score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
