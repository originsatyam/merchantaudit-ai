'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ScorecardBadge } from '@/components/ScorecardBadge';
import { PolicyList } from '@/components/PolicyList';
import { BusinessIdentityCard } from '@/components/BusinessIdentityCard';
import { ProhibitedRiskCard } from '@/components/ProhibitedRiskCard';
import { HumanDecisionBar } from '@/components/HumanDecisionBar';
import { AuditResult, HumanAuditSignoff } from '@/lib/types';

import validD2C from '@/data/fixtures/valid-d2c-store.json';
import highRiskPharma from '@/data/fixtures/high-risk-pharma.json';
import missingRefund from '@/data/fixtures/missing-refund-policy.json';

import { Search, Loader2, Sparkles, Shield, AlertTriangle, FileCode2, Layers, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [inputUrl, setInputUrl] = useState('https://auraglow-organics.com');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [auditData, setAuditData] = useState<AuditResult>(validD2C as unknown as AuditResult);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'identity' | 'prohibited' | 'pages'>('scorecard');
  const [mockMode, setMockMode] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectSample = (type: 'valid' | 'pharma' | 'missing') => {
    setErrorMsg(null);
    if (type === 'valid') {
      setInputUrl('https://auraglow-organics.com');
      setAuditData(validD2C as unknown as AuditResult);
    } else if (type === 'pharma') {
      setInputUrl('https://ultra-ketomax-rapidburn.xyz');
      setAuditData(highRiskPharma as unknown as AuditResult);
    } else {
      setInputUrl('https://devsync-analytics.io');
      setAuditData(missingRefund as unknown as AuditResult);
    }
  };

  const handleRunAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mockMode) {
        setLoadingStep('Loading demo fixture data...');
        await new Promise((r) => setTimeout(r, 200));

        const lower = inputUrl.toLowerCase();
        if (lower.includes('keto') || lower.includes('pharma') || lower.includes('burn')) {
          setAuditData(highRiskPharma as unknown as AuditResult);
        } else if (lower.includes('devsync') || lower.includes('saas') || lower.includes('missing')) {
          setAuditData(missingRefund as unknown as AuditResult);
        } else {
          setAuditData(validD2C as unknown as AuditResult);
        }
      } else {
        setLoadingStep('Inspecting public merchant website...');
        const response = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputUrl }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to complete evidence inspection');
        }

        const data = await response.json();
        setAuditData(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inspection failed to complete.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleHumanDecision = (signoff: HumanAuditSignoff) => {
    // Decoupled: Record analyst decision without manipulating evidence score or status
    setAuditData((prev) => ({
      ...prev,
      humanDecision: signoff,
    }));
  };

  const handlePolicyOverride = (policyId: string, verified: boolean, note: string) => {
    setAuditData((prev) => {
      const updatedPolicies = { ...prev.policies };
      for (const key of Object.keys(updatedPolicies) as (keyof typeof updatedPolicies)[]) {
        if (updatedPolicies[key]?.id === policyId) {
          updatedPolicies[key] = {
            ...updatedPolicies[key],
            humanOverride: {
              verified,
              reviewerNote: note,
              verifiedAt: new Date().toISOString(),
            },
          };
        }
      }
      return { ...prev, policies: updatedPolicies };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Navigation */}
      <Navbar onSelectSample={handleSelectSample} mockMode={mockMode} setMockMode={setMockMode} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Search Bar */}
        <section className="space-y-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Merchant Onboarding Evidence • Human Analyst Supervised
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Merchant Evidence Copilot
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Human-reviewed website evidence and risk-review assistant for merchant onboarding teams. Inspect public merchant disclosures, identify observable gaps, and document decisions faster.
            </p>
          </div>

          {mockMode && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong className="font-semibold">DEMO MODE ACTIVE:</strong> Viewing pre-calculated demo fixtures (zero API tokens burned). Switch to &quot;Live Crawl&quot; in the top bar to inspect live websites.
                </span>
              </div>
            </div>
          )}

          {/* Audit URL Input Form */}
          <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter merchant store URL (e.g., https://example-store.com)"
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-mono transition shadow-xs"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{mockMode ? 'Load Demo Fixture' : 'Inspect Merchant Website'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Buttons on Mobile */}
          <div className="flex lg:hidden flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500">Presets:</span>
            <button
              onClick={() => handleSelectSample('valid')}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shadow-xs"
            >
              Compliant D2C
            </button>
            <button
              onClick={() => handleSelectSample('missing')}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shadow-xs"
            >
              Needs Review SaaS
            </button>
            <button
              onClick={() => handleSelectSample('pharma')}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shadow-xs"
            >
              High Risk Pharma
            </button>
          </div>

          {/* Loading Progress State */}
          {isLoading && (
            <div className="p-4 bg-emerald-50/80 dark:bg-zinc-900/90 border border-emerald-200 dark:border-zinc-800 rounded-xl flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-400 font-mono animate-pulse shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{loadingStep || 'Executing crawl & compliance pipeline...'}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm flex items-start gap-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Audit Notice:</span> {errorMsg}
                <div className="text-xs text-rose-700 dark:text-rose-400/80 mt-1">
                  Tip: Toggle to &quot;Mock Mode&quot; in the top bar to inspect pre-scraped test cases without external rate limits.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Audit Results Container */}
        {auditData && (
          <section className="space-y-6">
            {/* Top Scorecard Badge */}
            <ScorecardBadge
              score={auditData.overallScore}
              status={auditData.status}
              domain={auditData.domain}
              url={auditData.merchantUrl}
              timestamp={auditData.auditTimestamp}
              humanDecision={auditData.humanDecision}
            />

            {/* Executive Summary Memo & HITL Governance Disclaimer */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-2.5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Executive Risk Memo
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>HITL Verification Ready</span>
                </div>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                {auditData.executiveSummary}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 text-sm overflow-x-auto">
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`pb-3 font-semibold flex items-center gap-2 transition border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === 'scorecard'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Mandatory Policies
              </button>

              <button
                onClick={() => setActiveTab('identity')}
                className={`pb-3 font-semibold flex items-center gap-2 transition border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === 'identity'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Entity Verification
              </button>

              <button
                onClick={() => setActiveTab('prohibited')}
                className={`pb-3 font-semibold flex items-center gap-2 transition border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === 'prohibited'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Prohibited Goods Risk
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {auditData.prohibitedRisk.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('pages')}
                className={`pb-3 font-semibold flex items-center gap-2 transition border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === 'pages'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
                Crawled Evidence
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {auditData.crawledPages.length}
                </span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
              {activeTab === 'scorecard' && (
                <PolicyList
                  policies={auditData.policies}
                  onPolicyOverride={handlePolicyOverride}
                />
              )}
              {activeTab === 'identity' && <BusinessIdentityCard identity={auditData.businessIdentity} />}
              {activeTab === 'prohibited' && <ProhibitedRiskCard risks={auditData.prohibitedRisk} />}
              {activeTab === 'pages' && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Crawled Pages & Status</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Pages parsed by Firecrawl during this audit pass</p>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
                    {auditData.crawledPages.map((page, idx) => (
                      <div key={idx} className="p-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-4">
                        <div className="truncate">
                          <div className="text-zinc-900 dark:text-zinc-200 font-sans font-semibold truncate">{page.title}</div>
                          <div className="text-zinc-500 text-[11px] truncate mt-0.5">{page.url}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-semibold">
                          HTTP {page.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Human Decision & Governance Bar */}
            <HumanDecisionBar
              merchantDomain={auditData.domain}
              onDecision={handleHumanDecision}
              currentDecision={auditData.humanDecision}
            />
          </section>
        )}
      </main>
    </div>
  );
}
