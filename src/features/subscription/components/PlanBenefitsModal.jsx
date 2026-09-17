import { useEffect } from 'react';
import { X, Crown, CheckCircle2, XCircle } from 'lucide-react';

const USAGE_LABELS = {
  subBrands: 'Sub Brands',
  franchises: 'Franchises',
  vouchers: 'Vouchers',
  showcase: 'Showcase Sections',
};

// Restyled to match the icon-tile layout used by the rest of the
// Subscription page (Subscription/Invoice/Billing Information sections)
// instead of the old plain dl/list styling.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Plan benefit details"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{planName} Plan Details</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {features.length === 0 && benefits.length === 0 && usageRows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No plan details available.</p>
          )}

          {features.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Plan Features</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((f) => (
                  <div key={f.title} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <span className="text-sm text-gray-600">{f.title}</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${f.available ? 'text-gray-800' : 'text-gray-400'}`}>
                      {f.available ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      )}
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {benefits.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Benefits</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usageRows.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Usage</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {usageRows.map(([key, u]) => {
                  const pct = !u.isUnlimited && u.limit ? Math.min(100, ((u.used ?? 0) / u.limit) * 100) : 0;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl px-3.5 py-3">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600">{USAGE_LABELS[key]}</span>
                        <span className="font-semibold text-gray-800">
                          {u.used ?? 0}
                          {u.isUnlimited ? ' / Unlimited' : u.limit != null ? ` / ${u.limit}` : ''}
                        </span>
                      </div>
                      {!u.isUnlimited && u.limit != null && (
                        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {u.overflowBy > 0 && <p className="text-xs text-rose-500 mt-1">+{u.overflowBy} over limit</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
