import { useState } from 'react';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

function PrimaryButton({ children, onClick, disabled, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-xl font-medium text-base tracking-wide transition-all duration-200
        flex items-center justify-center gap-2
        ${disabled || loading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]'
        } ${className}`}
    >
      {loading && (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
      <svg className={`w-7 h-7 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
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
      <svg className={`w-7 h-7 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
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
      <svg className={`w-7 h-7 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
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
      <svg className={`w-7 h-7 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
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
      <svg className={`w-7 h-7 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
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
      className={`relative flex flex-col items-center justify-between gap-3 p-6 rounded-2xl border-2 transition-all duration-200 w-full text-center min-h-[180px]
        ${isActive
          ? 'border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-100'
          : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50/50'
        }`}
    >
      {/* Badge */}
      {type.badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
          {type.badge}
        </span>
      )}

      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200
        ${isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
        {type.icon(isActive)}
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1">
        <span className={`text-sm font-semibold leading-tight transition-colors duration-200
          ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>
          {type.label}
        </span>
        <p className="text-xs text-gray-400 leading-tight">{type.description}</p>
      </div>

      {/* Radio dot */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
        ${isActive ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white'}`}>
        {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
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
   
<div className="flex items-center justify-center p-4">
  <div className="w-full max-w-5xl ">

    {/* Icon */}
    <div className="px-8">
     

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Select your business type</h2>
        <p className="text-sm text-gray-400">Please select your business structure</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {BUSINESS_TYPES.map((type) => (
          <TypeCard key={type.id} type={type} selected={selected} onClick={setSelected} />
        ))}
      </div>

      {/* Selected summary chip */}
      <div className={`mb-6 transition-all duration-300 overflow-hidden ${selected ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-emerald-700">
            Selected: <span className="font-semibold">{selectedType?.label}</span>
            {selectedType && <span className="text-emerald-500"> — {selectedType.description}</span>}
          </p>
        </div>
      </div>
    </div>

    {/* CTA — max-w-2xl centered */}
<div className="px-8">
  <div className="max-w-xl mx-auto">
    <PrimaryButton onClick={handleContinue} disabled={!selected}>
      Continue →
    </PrimaryButton>
  </div>

  <p className="text-center text-xs text-gray-300 mt-4">Step 5 of 13</p>
</div>
    <p className="text-center text-xs text-gray-300 mt-4">Step 5 of 13</p>
  </div>
</div>

  );
}