'use client';

import React from 'react';
import { ReconciliationStatus } from '../lib/types';
import {
  Check,
  Sparkles,
  GitFork,
  AlertTriangle,
  Layers,
  MinusCircle,
  Receipt,
  HelpCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ReconciliationStatus;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  switch (status) {
    case 'confirmed':
      return (
        <span className={`badge confirmed ${className}`}>
          {showIcon && <Check size={13} strokeWidth={2.5} />}
          Confirmed
        </span>
      );
    case 'suggested':
      return (
        <span className={`badge suggested ${className}`}>
          {showIcon && <Sparkles size={13} strokeWidth={2} />}
          Suggested
        </span>
      );
    case 'partial':
      return (
        <span className={`badge partial ${className}`}>
          {showIcon && <GitFork size={13} strokeWidth={2} />}
          Partial Match
        </span>
      );
    case 'needs_review':
      return (
        <span className={`badge review ${className}`}>
          {showIcon && <AlertTriangle size={13} strokeWidth={2} />}
          Needs Review
        </span>
      );
    case 'duplicate_suspected':
      return (
        <span className={`badge duplicate ${className}`}>
          {showIcon && <Layers size={13} strokeWidth={2} />}
          Duplicate Suspected
        </span>
      );
    case 'unmatched':
      return (
        <span className={`badge unmatched ${className}`}>
          {showIcon && <MinusCircle size={13} strokeWidth={2} />}
          Unmatched
        </span>
      );
    case 'documented_difference':
      return (
        <span className={`badge documented ${className}`}>
          {showIcon && <Receipt size={13} strokeWidth={2} />}
          Documented Diff
        </span>
      );
    case 'unexplained_difference':
      return (
        <span className={`badge unexplained ${className}`}>
          {showIcon && <HelpCircle size={13} strokeWidth={2} />}
          Unexplained Gap
        </span>
      );
    default:
      return <span className={`badge unmatched ${className}`}>{status}</span>;
  }
};
