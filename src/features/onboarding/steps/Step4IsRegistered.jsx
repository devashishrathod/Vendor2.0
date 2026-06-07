import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore, BASIC_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

// ── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = '', variant = 'emerald' }) {
  const variants = {
    emerald: disabled || loading
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
      : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]',
    danger: 'bg-red-500 hover:bg-red-600 text-white active:scale-[0.98]',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-[0.98]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────
function OptionCard({ selected, onClick, icon, title, subtitle, badge, accent }) {
  const styles = {
    emerald: {
      card: selected
        ? 'border-2 border-emerald-500 bg-emerald-50/60'
        : 'border border-gray-200 hover:border-emerald-200 hover:bg-gray-50/40',
      iconWrap: selected ? 'bg-emerald-100' : 'bg-gray-100',
      iconColor: selected ? 'text-emerald-600' : 'text-gray-400',
      title: selected ? 'text-emerald-700' : 'text-gray-700',
      radio: selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white',
      badge: selected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
    },
    blue: {
      card: selected
        ? 'border-2 border-blue-500 bg-blue-50/60'
        : 'border border-gray-200 hover:border-blue-200 hover:bg-gray-50/40',
      iconWrap: selected ? 'bg-blue-100' : 'bg-gray-100',
      iconColor: selected ? 'text-blue-600' : 'text-gray-400',
      title: selected ? 'text-blue-700' : 'text-gray-700',
      radio: selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white',
      badge: selected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
    },
  };
  const s = styles[accent] || styles.emerald;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-3 p-4 rounded-xl transition-all duration-200 text-left w-full ${s.card}`}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${s.iconWrap}`}>
          <span className={`transition-colors duration-200 ${s.iconColor}`}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium transition-colors duration-200 ${s.title}`}>{title}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{subtitle}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${s.radio}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <span className={`self-start text-xs font-medium px-2.5 py-1 rounded-full transition-colors duration-200 ${s.badge}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Blocking Modal ────────────────────────────────────────────────────────────
function BlockingModal({ onDelete, onClose }) {
  const { goToStep } = useOnboardingStore();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 1200));
    setDeleting(false);
    onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-sm">

        {/* Close */}
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Icon + Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-900 leading-snug">
            Trydood needs a <span className="text-red-500">registered vendor/brand</span>
          </h3>
        </div>

        {/* Why link + list */}
        <button className="text-xs font-medium text-emerald-600 underline underline-offset-2 mb-3 block">
          Why Trydood requires a registered brand?
        </button>
        <ul className="space-y-2 mb-5">
          {[
            'Registered businesses build trust and credibility on our platform.',
            'It ensures legal compliance and secure transactions for all users.',
            'It helps us maintain quality and transparency in our ecosystem.',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
              <span className="text-xs text-gray-500 leading-snug">{text}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 mb-4" />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <PrimaryButton variant="danger" onClick={handleDelete} loading={deleting}>
            {deleting ? 'Deleting account…' : 'Delete my unregistered account'}
          </PrimaryButton>
          <button
            onClick={() => { goToStep(STEPS.BUSINESS_TYPE); onClose(); }}
            className="w-full py-2.5 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            Continue as registered account
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          This action is permanent and cannot be undone.
        </p>
      </div>
    </div>
  );
}
export default function Step4IsRegistered() {
  const { setSubStep } = useOnboardingStore();
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected === 'unregistered') { setShowModal(true); return; }
    if (selected === 'registered') { setSubStep(BASIC_SUB.BUSINESS_TYPE); }
  };

  const handleDeleteAccount = () => {
    setShowModal(false);
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-5xl py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Is your business registered?</h2>
          <p className="text-sm text-gray-400">Select the most applicable option to continue</p>
        </div>

        {/* Options — centered, max-w-2xl */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <OptionCard
              selected={selected === 'registered'}
              onClick={() => setSelected('registered')}
              accent="emerald"
              title="Registered"
              subtitle="My business is officially registered"
              badge="Recommended"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <OptionCard
              selected={selected === 'unregistered'}
              onClick={() => setSelected('unregistered')}
              accent="blue"
              title="Unregistered"
              subtitle="My business is not yet registered"
              badge="Not eligible"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              }
            />
          </div>

          <div className="px-8">
            <div className="max-w-md mx-auto">
              {/* CTA */}
              <PrimaryButton onClick={handleContinue} disabled={!selected}>
                Continue →
              </PrimaryButton>
            </div>
            <p className="text-center text-xs text-gray-300 mt-4">Step 5 of 13</p>
          </div>







          <p className="text-center text-xs text-gray-300 mt-4">Step 4 of 13</p>
        </div>

      </div>

      {showModal && (
        <BlockingModal onDelete={handleDeleteAccount} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}