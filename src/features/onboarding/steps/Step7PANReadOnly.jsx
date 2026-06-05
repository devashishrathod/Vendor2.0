
import { useState } from 'react';
import { validatePAN, PAN_RULES } from '../validation';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

// ── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = '', variant = 'emerald' }) {
  const base = 'py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2';
  const styles = {
    emerald: disabled || loading
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
      : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]',
    outline: 'border border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${styles[variant]} ${className}`}>
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

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-xs font-medium text-gray-800 text-right ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ── Rule Row ──────────────────────────────────────────────────────────────────
function RuleRow({ label, passed, touched }) {
  const color = !touched ? 'text-gray-400' : passed ? 'text-emerald-600' : 'text-red-500';
  const bg    = !touched ? 'bg-gray-100'   : passed ? 'bg-emerald-100'   : 'bg-red-100';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        {!touched ? (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        ) : passed ? (
          <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  );
}

// ── Update PAN Modal ──────────────────────────────────────────────────────────
function UpdateModal({ currentPAN, onCancel, onConfirm }) {
  const [pan, setPan]       = useState(currentPAN || '');
  const [touched, setTouched] = useState(false);
  const [step, setStep]     = useState('edit'); // 'edit' | 'confirm'
  const [saving, setSaving] = useState(false);

  const upper   = pan.toUpperCase();
  const error   = validatePAN(upper);
  const isValid = !error && upper.length === 10;
  const rules   = PAN_RULES.map(r => ({ label: r.label, passed: r.test(upper) }));

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(val);
    if (!touched && val.length > 0) setTouched(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    onConfirm(upper);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-sm">

        {step === 'edit' ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-medium text-gray-900">Update PAN number</h3>
                <p className="text-xs text-gray-400 mt-0.5">Enter your corrected PAN</p>
              </div>
              <button onClick={onCancel}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input + rules side by side in modal */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">PAN Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={upper}
                  onChange={handleChange}
                  onBlur={() => pan && setTouched(true)}
                  maxLength={10}
                  className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl text-xs font-mono font-semibold text-gray-800 tracking-widest
                    placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
                    ${!touched ? 'border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                      : isValid ? 'border-emerald-400 ring-2 ring-emerald-100'
                      : 'border-red-300 ring-2 ring-red-100'}`}
                />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                <div className="space-y-1.5">
                  {rules.map((r, i) => <RuleRow key={i} label={r.label} passed={r.passed} touched={touched} />)}
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updating will re-verify your PAN and may incur charges.
              </p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton variant="outline" onClick={onCancel} className="flex-1">Cancel</PrimaryButton>
              <PrimaryButton onClick={() => setStep('confirm')} disabled={!isValid || upper === currentPAN} className="flex-1">
                Next →
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900">Confirm PAN update</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Are you sure you want to update PAN details?<br />
                This will re-verify and may incur charges.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5 text-center">
              <p className="text-xs text-gray-400 mb-1">New PAN</p>
              <p className="text-base font-mono font-medium text-gray-900 tracking-widest">{upper}</p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton variant="outline" onClick={() => setStep('edit')} className="flex-1">Back</PrimaryButton>
              <PrimaryButton onClick={handleUpdate} loading={saving} className="flex-1">
                {saving ? 'Updating…' : 'Yes, update'}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mock PAN data ─────────────────────────────────────────────────────────────
const DEFAULT_PAN_DATA = {
  panNumber: 'ABCDE1234F',
  name:      'ABC PRIVATE LIMITED',
  legalName: 'ABC PRIVATE LIMITED',
  dob:       '15/06/2020',
  status:    'Active',
  panType:   'Company',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Step7PANReadOnly({ panData = DEFAULT_PAN_DATA }) {
  const { goToStep } = useOnboardingStore();
  const [data, setData]           = useState(panData);
  const [showModal, setShowModal] = useState(false);

  const handleConfirmUpdate = (newPAN) => {
    setData(prev => ({ ...prev, panNumber: newPAN }));
    setShowModal(false);
  };

  return (
    <div className="flex items-center justify-center p-0">
      <div className="w-full max-w-4xl ">

        {/* Icon + Title */}
        <div className="text-center mb-8">
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your PAN details</h2>
          {/* <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span> */}
        </div>

        {/* Horizontal layout: left = details card, right = status + actions */}
        <div className="grid grid-cols-2 gap-5 mb-6">

          {/* LEFT — Detail rows */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-1">
            <DetailRow label="PAN number"            value={data.panNumber}  mono />
            <DetailRow label="Name (as per PAN)"     value={data.name} />
            <DetailRow label="Legal name"            value={data.legalName} />
            <DetailRow label="Date of incorporation" value={data.dob} />
            <DetailRow label="Status"                value={data.status} />
            <DetailRow label="PAN type"              value={data.panType} />
          </div>

          {/* RIGHT — Status pills + info */}
          <div className="flex flex-col justify-between gap-4">
            {/* Status pills */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium w-full
                ${data.status === 'Active' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {data.status}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium w-full bg-blue-50 border border-blue-100 text-blue-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
                {data.panType}
              </div>
            </div>

            {/* Info note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-3">
              <p className="text-xs text-amber-700 leading-relaxed flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Please verify these details carefully before continuing. Incorrect PAN details may cause issues later.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <PrimaryButton variant="outline" onClick={() => setShowModal(true)} className="flex-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Update PAN
          </PrimaryButton>
          <PrimaryButton
            onClick={() => goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.GST_ENTER)}
            className="flex-1"
          >
            Continue →
          </PrimaryButton>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">Step 7 of 13</p>
      </div>

      {showModal && (
        <UpdateModal
          currentPAN={data.panNumber}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </div>
  );
}

