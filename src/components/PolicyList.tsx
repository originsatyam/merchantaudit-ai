'use client';

import React, { useState } from 'react';
import { PolicyCheck } from '@/lib/types';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, FileText, ExternalLink, CheckSquare, Edit3 } from 'lucide-react';

interface PolicyListProps {
  policies: {
    termsOfService: PolicyCheck;
    privacyPolicy: PolicyCheck;
    refundPolicy: PolicyCheck;
    shippingOrDeliveryPolicy: PolicyCheck;
    contactUs: PolicyCheck;
  };
  onPolicyOverride?: (policyId: string, verified: boolean, note: string) => void;
}

export const PolicyList: React.FC<PolicyListProps> = ({ policies, onPolicyOverride }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [localOverrides, setLocalOverrides] = useState<Record<string, { verified: boolean; note?: string }>>({});

  const policyArray = [
    policies.refundPolicy,
    policies.termsOfService,
    policies.privacyPolicy,
    policies.shippingOrDeliveryPolicy,
    policies.contactUs,
  ].filter(Boolean);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleToggleVerify = (policyId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    const note = noteInputs[policyId] || '';
    setLocalOverrides(prev => ({
      ...prev,
      [policyId]: { verified: newStatus, note }
    }));
    if (onPolicyOverride) {
      onPolicyOverride(policyId, newStatus, note);
    }
  };

  const handleSaveNote = (policyId: string) => {
    const note = noteInputs[policyId] || '';
    setLocalOverrides(prev => ({
      ...prev,
      [policyId]: { ...(prev[policyId] || { verified: true }), note }
    }));
    setEditingNoteId(null);
    if (onPolicyOverride) {
      onPolicyOverride(policyId, localOverrides[policyId]?.verified ?? true, note);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Mandatory Policy Verification
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Card network compliance (Visa Rule 5.4 / Mastercard Section 3.2.1) • Human Reviewable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700/60">
            {policyArray.filter(p => localOverrides[p.id]?.verified ?? p.found).length} of {policyArray.length} Verified
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {policyArray.map((p) => {
          const isExpanded = expandedId === p.id;
          const isVerified = localOverrides[p.id]?.verified ?? p.found;
          const reviewerNote = localOverrides[p.id]?.note || p.humanOverride?.reviewerNote;
          const isEditingNote = editingNoteId === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-xl border transition-all duration-200 ${
                isVerified
                  ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                  : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 hover:border-rose-300 dark:hover:border-rose-800/60'
              }`}
            >
              {/* Header Row */}
              <div
                onClick={() => toggleExpand(p.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isVerified ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">{p.name}</span>
                      {p.required && (
                        <span className="text-[10px] font-mono text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.2 rounded bg-white dark:bg-zinc-900">
                          Mandatory
                        </span>
                      )}
                      {localOverrides[p.id] && (
                        <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1">
                          <CheckSquare className="w-2.5 h-2.5" />
                          HITL Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{p.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Quick HITL Override Checkbox Button */}
                  <button
                    onClick={(e) => handleToggleVerify(p.id, isVerified, e)}
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition ${
                      isVerified
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                    }`}
                    title="Human override: mark policy as verified or flag"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>{isVerified ? 'Mark Issue' : 'Verify'}</span>
                  </button>

                  <div className="text-right hidden md:block">
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{p.confidenceScore}%</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">confidence</span>
                  </div>
                  <div className="text-zinc-400 dark:text-zinc-500 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Evidence Section */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-200 dark:border-zinc-800/60 text-xs space-y-3">
                  {p.url && (
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <span className="text-zinc-400 dark:text-zinc-500">Detected URL:</span>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono truncate"
                      >
                        {p.url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* AI Evidence Citation */}
                  {p.evidenceSnippet ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed shadow-xs">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-sans font-semibold">
                        Crawled Evidence Excerpt
                      </div>
                      &quot;{p.evidenceSnippet}&quot;
                    </div>
                  ) : (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 p-3 rounded-lg border border-rose-200 dark:border-rose-900/30 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Missing Legal Page:</span>
                        <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                          {p.recommendation || 'No dedicated policy or clear cancellation clauses were detected on the merchant site.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Human-in-the-Loop Reviewer Note Area */}
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    {reviewerNote && !isEditingNote ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 w-full sm:w-auto">
                        <Edit3 className="w-3 h-3 shrink-0" />
                        <span>Officer Note: {reviewerNote}</span>
                      </div>
                    ) : isEditingNote ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={noteInputs[p.id] ?? reviewerNote ?? ''}
                          onChange={(e) => setNoteInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Add compliance officer rationale note..."
                          className="flex-1 px-2.5 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => handleSaveNote(p.id)}
                          className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded font-medium hover:bg-emerald-500 transition"
                        >
                          Save
                        </button>
                      </div>
                    ) : null}

                    {!isEditingNote && (
                      <button
                        onClick={() => {
                          setEditingNoteId(p.id);
                          setNoteInputs(prev => ({ ...prev, [p.id]: reviewerNote || '' }));
                        }}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-[11px] flex items-center gap-1 shrink-0 ml-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{reviewerNote ? 'Edit Note' : '+ Add Officer Note'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
