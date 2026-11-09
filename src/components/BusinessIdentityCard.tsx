'use client';

import React from 'react';
import { BusinessIdentity } from '@/lib/types';
import { Building2, MapPin, Mail, Phone, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface BusinessIdentityCardProps {
  identity: BusinessIdentity;
}

export const BusinessIdentityCard: React.FC<BusinessIdentityCardProps> = ({ identity }) => {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Entity Verification & Legitimacy
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cross-reference claimed brand with registered corporate legal entity & tax registry
          </p>
        </div>

        <div>
          {identity.entityMatch === true ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              Entity Match
            </span>
          ) : identity.entityMatch === false ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Entity Mismatch
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Uncertain Match
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Legal Name */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Legal Entity</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
            {identity.legalEntityName || 'Not detected'}
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-0.5">
            Trade Brand: {identity.claimedName || 'Not specified'}
          </div>
        </div>

        {/* Tax ID */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Tax / CIN / EIN</div>
          <div className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1 truncate">
            {identity.taxId || 'Not detected'}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {identity.taxId && identity.taxId !== 'UNVERIFIED' ? 'Registry syntax validated' : 'Needs registry lookup'}
          </div>
        </div>

        {/* Physical Address */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            <MapPin className="w-3 h-3 text-zinc-400" />
            Physical Street Address
          </div>
          <div className="text-xs text-zinc-800 dark:text-zinc-300 mt-1 leading-relaxed font-medium">
            {identity.physicalAddress || 'No physical street address detected on website'}
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <Mail className="w-3.5 h-3.5 text-zinc-400" />
            <span>Support:</span>
            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{identity.supportEmail || 'None'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <Phone className="w-3.5 h-3.5 text-zinc-400" />
            <span>Telephone:</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">{identity.supportPhone || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Crawled Footer Evidence */}
      {identity.evidenceSnippet && (
        <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/90 rounded-lg text-xs font-mono text-zinc-700 dark:text-zinc-400">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-sans font-semibold">Footer Citation:</div>
          &quot;{identity.evidenceSnippet}&quot;
        </div>
      )}
    </div>
  );
};
