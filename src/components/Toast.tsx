'use client';

import React from 'react';
import { RotateCcw, Check, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, actionLabel, onAction, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        background: 'var(--surface)',
        border: '1px solid var(--border-focus)',
        color: 'var(--text-primary)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-pill)',
        fontSize: '13px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'toastSpring var(--dur-base) var(--ease-spring)',
      }}
    >
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          className="btn btn-sm btn-ghost"
          style={{ color: 'var(--accent)', fontWeight: 600, padding: '0 6px', height: '24px' }}
          onClick={() => {
            onAction();
            onClose();
          }}
        >
          <RotateCcw size={12} />
          {actionLabel}
        </button>
      )}
      <button
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: '0 4px',
          fontSize: '14px',
        }}
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
};
