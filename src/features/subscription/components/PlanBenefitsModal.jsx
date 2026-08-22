import React, { useEffect } from 'react';
import { CloseIcon, BENEFIT_ICON_MAP, XCircleIcon } from './icons';

export default function PlanBenefitsModal({ open, onClose, planName, benefits, isLoading, error }) {
  // Close on Escape for basic accessibility/keyboard support.
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
      <div className="inv-modal inv-modal--wide" role="dialog" aria-modal="true" aria-label="Plan benefit details">
        <div className="inv-modal__header">
          <h3>{planName} Benefit's Details</h3>
          <button className="inv-modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {isLoading && <p style={{ padding: '24px 0', color: '#6b7280' }}>Loading benefits…</p>}
        {error && <p style={{ padding: '24px 0', color: '#b91c1c' }}>{error}</p>}

        {!isLoading && !error && (
          <table className="inv-benefits-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Benefit's Name</th>
                <th>Description</th>
                <th>Conditions</th>
              </tr>
            </thead>
            <tbody>
              {benefits.map((benefit) => {
                const Icon = BENEFIT_ICON_MAP[benefit.icon];
                return (
                  <tr key={benefit.id}>
                    <td>{Icon && <Icon className="inv-benefit-icon" width={22} height={22} />}</td>
                    <td>{benefit.name}</td>
                    <td>{benefit.description}</td>
                    <td>
                      {benefit.included ? (
                        benefit.condition
                      ) : (
                        <XCircleIcon className="inv-benefit-excluded" width={22} height={22} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
