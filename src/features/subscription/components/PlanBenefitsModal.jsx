import { useEffect } from 'react';
import { CloseIcon } from './icons';

const USAGE_LABELS = {
  subBrands: 'Sub Brands',
  franchises: 'Franchises',
  vouchers: 'Vouchers',
  showcase: 'Showcase Sections',
};

export default function PlanBenefitsModal({ open, onClose, planName, features = [], benefits = [], usage = {} }) {
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

  const usageRows = Object.entries(usage).filter(([key]) => USAGE_LABELS[key]);

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

        {features.length === 0 && benefits.length === 0 && usageRows.length === 0 && (
          <p style={{ padding: '24px 0', color: '#6b7280' }}>No plan details available.</p>
        )}

        {features.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="sub-info-section__title" style={{ fontSize: 13, marginBottom: 12 }}>
              Plan Features
            </p>
            <div className="sub-feature-grid">
              {features.map((f) => (
                <div key={f.title} className="sub-feature-row">
                  <span className="sub-feature-row__title">{f.title}</span>
                  <span className={`sub-feature-row__value ${f.available ? '' : 'sub-feature-row__value--off'}`}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {benefits.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="sub-info-section__title" style={{ fontSize: 13, marginBottom: 12 }}>
              Benefits
            </p>
            <ul className="sub-benefit-list">
              {benefits.map((b) => (
                <li key={b} className="sub-benefit-list__item">
                  <span className="sub-benefit-list__check">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {usageRows.length > 0 && (
          <div>
            <p className="sub-info-section__title" style={{ fontSize: 13, marginBottom: 12 }}>
              Usage
            </p>
            <div className="sub-info-grid">
              {usageRows.map(([key, u]) => (
                <div className="sub-info-item" key={key}>
                  <dt>{USAGE_LABELS[key]}</dt>
                  <dd>
                    {u.used ?? 0}
                    {u.isUnlimited ? ' / Unlimited' : u.limit != null ? ` / ${u.limit}` : ''}
                    {u.overflowBy > 0 && (
                      <span className="sub-feature-row__value--off" style={{ marginLeft: 6 }}>
                        (+{u.overflowBy} over limit)
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
