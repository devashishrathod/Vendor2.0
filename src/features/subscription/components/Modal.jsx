import React, { useEffect } from 'react';

/**
 * Generic modal shell. Handles the backdrop, click-outside-to-close, and
 * Escape-to-close — the same behavior PlanBenefitsModal already has,
 * factored out so InvoiceModal / InvoiceHistoryModal / RaiseQueryModal
 * don't each reimplement it.
 */
export default function Modal({ open, onClose, ariaLabel, widthVariant = 'default', children }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="inv-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`inv-modal inv-modal--${widthVariant}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
