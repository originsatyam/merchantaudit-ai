'use client';

import React, { useState } from 'react';
import { HumanAuditSignoff, ReviewVerdict } from '@/lib/types';
import { ReviewHistoryEntry } from '@/lib/storage';
import { Check, X, HelpCircle, Printer, UserCheck, Shield, AlertOctagon, History, RotateCcw } from 'lucide-react';

interface HumanDecisionBarProps {
  merchantDomain: string;
  onDecision: (signoff: HumanAuditSignoff) => void;
  currentDecision?: HumanAuditSignoff;
  decisionHistory?: ReviewHistoryEntry[];
  onClearReview?: () => void;
}

// Simple deterministic client digest
function computeClientDigest(payload: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `EV-${part1}${part2}`;
}

export const HumanDecisionBar: React.FC<HumanDecisionBarProps> = ({
  merchantDomain,
  onDecision,
  currentDecision,
  decisionHistory = [],
  onClearReview,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState<ReviewVerdict>('APPROVED');
  const [reviewerName, setReviewerName] = useState(currentDecision?.reviewerName || '');
  const [reviewerId, setReviewerId] = useState(currentDecision?.reviewerId || '');
  const [rationale, setRationale] = useState('');
  const [checklist, setChecklist] = useState({
    policiesReviewed: false,
    identityVerified: false,
    prohibitedGoodsCleared: false,
  });

  const activeVerdict = currentDecision?.verdict || 'PENDING';

  const handleOpenSignoff = (verdict: ReviewVerdict) => {
    setSelectedVerdict(verdict);
    setIsModalOpen(true);
  };

  const handleConfirmSignoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerId.trim() || !rationale.trim()) {
      return;
    }

    const reviewedAt = new Date().toISOString();
    const auditHash = computeClientDigest(`${merchantDomain}|${selectedVerdict}|${reviewerId.trim()}|${reviewedAt}`);

    const signoff: HumanAuditSignoff = {
      verdict: selectedVerdict,
      reviewerName: reviewerName.trim(),
      reviewerId: reviewerId.trim(),
      rationale: rationale.trim(),
      checklistConfirmed: checklist,
      auditHash,
      reviewedAt,
    };
    onDecision(signoff);
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getVerdictStyle = (v: ReviewVerdict) => {
    switch (v) {
      case 'APPROVED':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30';
      case 'REQUEST_INFO':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30';
      case 'ESCALATED':
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
    }
  };

  return (
    <>
      <div className="bg-white/95 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl dark:shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4 z-40 backdrop-blur-md transition-colors duration-200">
        {/* Left: Status info */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
              <span>Analyst Review Workflow</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                Durable Storage
              </span>
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-0.5">
              Analyst Status:
              <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold ${getVerdictStyle(activeVerdict)}`}>
                {activeVerdict}
              </span>
              {decisionHistory.length > 0 && (
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 underline ml-1"
                >
                  <History className="w-3 h-3" />
                  <span>({decisionHistory.length} prior logs)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition border border-zinc-200 dark:border-zinc-700 shadow-xs"
            title="Print or export analyst review pack (PDF)"
          >
            <Printer className="w-3.5 h-3.5" />
            Export Pack (PDF)
          </button>

          <button
            onClick={() => handleOpenSignoff('REQUEST_INFO')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-xs ${
              activeVerdict === 'REQUEST_INFO'
                ? 'bg-amber-500 text-black border-amber-400 font-bold'
                : 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Request Info
          </button>

          <button
            onClick={() => handleOpenSignoff('ESCALATED')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-xs ${
              activeVerdict === 'ESCALATED'
                ? 'bg-purple-600 text-white border-purple-500 font-bold'
                : 'bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Escalate
          </button>

          <button
            onClick={() => handleOpenSignoff('REJECTED')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-xs ${
              activeVerdict === 'REJECTED'
                ? 'bg-rose-600 text-white border-rose-500 font-bold'
                : 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>

          <button
            onClick={() => handleOpenSignoff('APPROVED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 border ${
              activeVerdict === 'APPROVED'
                ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            <Check className="w-4 h-4" />
            Approve
          </button>

          {activeVerdict !== 'PENDING' && onClearReview && (
            <button
              onClick={onClearReview}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition"
              title="Reset analyst review for this domain"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Decision History Modal / Slide-out */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold">Decision Audit History</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {decisionHistory.map((item, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${getVerdictStyle(item.verdict)}`}>
                      {item.verdict}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {item.reviewedAt ? item.reviewedAt.split('T')[0] : ''}
                    </span>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {item.reviewerName} ({item.reviewerId})
                  </div>
                  {item.rationale && (
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1 italic">&quot;{item.rationale}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Decision Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Record Review Decision</h3>
                  <p className="text-xs text-zinc-500 font-mono">Merchant: {merchantDomain}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSignoff} className="space-y-4 text-xs">
              {/* Reviewer Details (No fake pre-fills) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Analyst Name *
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Analyst ID / Email *
                  </label>
                  <input
                    type="text"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    placeholder="e.g. analyst@psp.com"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Review Checklist (Defaults unchecked) */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Evidence Review Checklist
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.policiesReviewed}
                    onChange={(e) => setChecklist(prev => ({ ...prev, policiesReviewed: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Consumer policies (Refund, Terms, Privacy) reviewed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.identityVerified}
                    onChange={(e) => setChecklist(prev => ({ ...prev, identityVerified: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Contact info and declared identity reviewed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.prohibitedGoodsCleared}
                    onChange={(e) => setChecklist(prev => ({ ...prev, prohibitedGoodsCleared: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Potential prohibited keyword alerts evaluated</span>
                </label>
              </div>

              {/* Rationale notes */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Analyst Decision Rationale *
                </label>
                <textarea
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Enter reason for this decision (e.g., 'Inspected refund terms, clear 14-day policy observed. Contact details match declared entity.')..."
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reviewerName.trim() || !reviewerId.trim() || !rationale.trim()}
                  className={`px-4 py-2 rounded-xl text-white font-bold transition shadow-xs disabled:opacity-50 ${
                    selectedVerdict === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : selectedVerdict === 'REJECTED'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : selectedVerdict === 'ESCALATED'
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  Record Decision ({selectedVerdict})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
