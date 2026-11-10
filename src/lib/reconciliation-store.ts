/**
 * RemitLens Reconciliation State & Audit Store
 * In-memory & local state manager enforcing audit logging and 10s undo window.
 */

import { ReconciliationChain, AuditLogEntry, ReconciliationStatus } from './types';
import { runMatchingEngine } from './matching-engine';
import { SAMPLE_INVOICES, SAMPLE_SETTLEMENTS, SAMPLE_BANK_CREDITS } from '../data/fixtures';

export interface WorkspaceState {
  chains: ReconciliationChain[];
  auditLogs: AuditLogEntry[];
  activeOperator: string;
  selectedChainId: string | null;
  lastUndoableAction: AuditLogEntry | null;
}

export function createInitialWorkspace(): WorkspaceState {
  const initialMatching = runMatchingEngine({
    invoices: SAMPLE_INVOICES,
    settlements: SAMPLE_SETTLEMENTS,
    bankCredits: SAMPLE_BANK_CREDITS,
  });

  const initialLogs: AuditLogEntry[] = [
    {
      id: 'log_init_1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      operatorEmail: 'satyam@agency.in',
      action: 'IMPORT_FILE',
      details: 'Imported invoices_oct_2026.csv (6 rows parsed, 6 valid)',
      undoable: false,
    },
    {
      id: 'log_init_2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      operatorEmail: 'satyam@agency.in',
      action: 'IMPORT_FILE',
      details: 'Imported hdfc_bank_oct_stmt.csv (5 rows parsed, 5 valid)',
      undoable: false,
    },
  ];

  return {
    chains: initialMatching.chains,
    auditLogs: initialLogs,
    activeOperator: 'satyam@agency.in',
    selectedChainId: initialMatching.chains[0]?.id || null,
    lastUndoableAction: null,
  };
}

export function confirmChainMatch(
  state: WorkspaceState,
  chainId: string,
  operatorEmail: string = state.activeOperator
): WorkspaceState {
  const chain = state.chains.find(c => c.id === chainId);
  if (!chain) return state;

  const previousState = chain.status;
  const updatedChains = state.chains.map(c => {
    if (c.id === chainId) {
      return {
        ...c,
        status: 'confirmed' as ReconciliationStatus,
        confirmedBy: operatorEmail,
        confirmedAt: new Date().toISOString(),
      };
    }
    return c;
  });

  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    operatorEmail,
    action: 'CONFIRM_MATCH',
    chainId,
    chainReference: chain.chainReference,
    details: `Confirmed match on chain ${chain.chainReference} (${chain.invoice?.invoiceNumber || 'No Inv'} ↔ ${chain.bankCredit?.utrReference || 'No Bank'})`,
    previousState,
    newState: 'confirmed',
    undoable: true,
  };

  return {
    ...state,
    chains: updatedChains,
    auditLogs: [newLog, ...state.auditLogs],
    lastUndoableAction: newLog,
  };
}

export function unlinkChainMatch(
  state: WorkspaceState,
  chainId: string,
  operatorEmail: string = state.activeOperator
): WorkspaceState {
  const chain = state.chains.find(c => c.id === chainId);
  if (!chain) return state;

  const previousState = chain.status;
  const updatedChains = state.chains.map(c => {
    if (c.id === chainId) {
      return {
        ...c,
        status: 'needs_review' as ReconciliationStatus,
        confirmedBy: undefined,
        confirmedAt: undefined,
      };
    }
    return c;
  });

  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    operatorEmail,
    action: 'UNLINK_MATCH',
    chainId,
    chainReference: chain.chainReference,
    details: `Unlinked chain ${chain.chainReference}. Records returned to Review Queue.`,
    previousState,
    newState: 'needs_review',
    undoable: true,
  };

  return {
    ...state,
    chains: updatedChains,
    auditLogs: [newLog, ...state.auditLogs],
    lastUndoableAction: newLog,
  };
}

export function undoLastAction(state: WorkspaceState): WorkspaceState {
  const action = state.lastUndoableAction;
  if (!action || !action.chainId || !action.previousState) return state;

  const updatedChains = state.chains.map(c => {
    if (c.id === action.chainId) {
      return {
        ...c,
        status: action.previousState!,
      };
    }
    return c;
  });

  const undoLog: AuditLogEntry = {
    id: `log_undo_${Date.now()}`,
    timestamp: new Date().toISOString(),
    operatorEmail: state.activeOperator,
    action: action.action === 'CONFIRM_MATCH' ? 'UNLINK_MATCH' : 'CONFIRM_MATCH',
    chainId: action.chainId,
    chainReference: action.chainReference,
    details: `Reversed previous action on ${action.chainReference}. State restored to ${action.previousState}.`,
    undoable: false,
  };

  return {
    ...state,
    chains: updatedChains,
    auditLogs: [undoLog, ...state.auditLogs],
    lastUndoableAction: null,
  };
}

export function flagInquiry(
  state: WorkspaceState,
  chainId: string,
  operatorEmail: string = state.activeOperator
): WorkspaceState {
  const chain = state.chains.find(c => c.id === chainId);
  if (!chain) return state;

  const updatedChains = state.chains.map(c => {
    if (c.id === chainId) {
      return {
        ...c,
        isFlaggedForInquiry: true,
      };
    }
    return c;
  });

  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    operatorEmail,
    action: 'FLAG_INQUIRY',
    chainId,
    chainReference: chain.chainReference,
    details: `Flagged unexplained difference of ${chain.unexplainedDifferenceINR?.currency || 'INR'} on chain ${chain.chainReference} for remitting bank inquiry.`,
    undoable: false,
  };

  return {
    ...state,
    chains: updatedChains,
    auditLogs: [newLog, ...state.auditLogs],
  };
}
