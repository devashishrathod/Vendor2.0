import { useState } from 'react';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

function PrimaryButton({ children, onClick, disabled, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2
        ${disabled || loading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]'
        } ${className}`}
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

const BUSINESS_TYPES = [
  {
    id: 'pvt_ltd',
    label: 'Pvt. Ltd.',
    description: 'Private Limited Company',
    badge: 'Most Popular',
    icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'llp',
    label: 'LLP',
    description: 'Limited Liability Partnership',
    badge: null,
    icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'partnership',
    label: 'Partnership',
    description: 'General Partnership Firm',
    badge: null,
    icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'proprietorship',
    label: 'Proprietorship',
    description: 'Sole Proprietorship Business',
    badge: null,
    icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'others',
    label: 'Others',
    description: 'Trust, Society, NGO, etc.',
    badge: null,
    icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function TypeCard({ type, selected, onClick }) {
  const isActive = selected === type.id;
  return (
    <button
      onClick={() => onClick(type.id)}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 w-full text-center
        ${isActive
          ? 'border-2 border-emerald-500 bg-white shadow-sm'
          : 'border border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50/50'
        }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200
        ${isActive ? 'bg-emerald-50' : 'bg-gray-50'}`}>
        {type.icon(isActive)}
      </div>

      {/* Label */}
      <span className={`text-xs font-medium leading-tight transition-colors duration-200
        ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
        {type.label}
      </span>

      {/* Description */}
      <p className="text-[10px] text-gray-400 leading-tight">{type.description}</p>

      {/* Badge */}
      {type.badge && (
        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          {type.badge}
        </span>
      )}

      {/* Radio dot */}
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-auto transition-all duration-200
        ${isActive ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white'}`}>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}

export default function Step5BusinessType() {
  const { goToStep } = useOnboardingStore();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    useOnboardingStore.getState().setField('businessType', selected);
    goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.PAN_ENTER);
  };

  const selectedType = BUSINESS_TYPES.find(t => t.id === selected);

  return (
    <div className="flex items-center justify-center p-0">
      <div className="w-full  p-8">

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Select your business type</h2>
          <p className="text-sm text-gray-400">Please select your business structure</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {BUSINESS_TYPES.map((type) => (
            <TypeCard
              key={type.id}
              type={type}
              selected={selected}
              onClick={setSelected}
            />
          ))}
        </div>

        {/* Selected summary chip */}
        <div className={`mb-5 transition-all duration-300 overflow-hidden ${selected ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs font-medium text-emerald-700">
              Selected: <span className="font-semibold">{selectedType?.label}</span>
              {selectedType && <span className="text-emerald-500"> — {selectedType.description}</span>}
            </p>
          </div>
        </div>

        {/* CTA */}
        <PrimaryButton onClick={handleContinue} disabled={!selected}>
          Continue →
        </PrimaryButton>

        <p className="text-center text-xs text-gray-300 mt-4">Step 5 of 13</p>
      </div>
    </div>
  );
}