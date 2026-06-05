import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateGST, GST_RULES } from '../validation';
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

// ── Shared: PrimaryButton ────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = '', variant = 'emerald' }) {
  const base = 'py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2';
  const styles = {
    emerald: disabled || loading
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
      : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98] shadow-sm shadow-emerald-200',
    outline: 'border-2 border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]',
    danger: 'bg-red-500 hover:bg-red-600 text-white active:scale-[0.98] shadow-sm shadow-red-200',
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

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-gray-800 text-right ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ── Validation Rule Row ──────────────────────────────────────────────────────
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

// ── Update GST Modal ─────────────────────────────────────────────────────────
function UpdateModal({ currentGSTIN, pan, onCancel, onConfirm }) {
  const [gstin, setGstin]     = useState(currentGSTIN || '');
  const [touched, setTouched] = useState(false);
  const [step, setStep]       = useState('edit'); // 'edit' | 'confirm'
  const [saving, setSaving]   = useState(false);

  const upper   = gstin.toUpperCase();
  const error   = validateGST(upper);
  const isValid = !error && upper.length === 15;
  const rules   = GST_RULES.map(r => ({ label: r.label, passed: r.test(upper, pan) }));

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstin(val);
    if (!touched && val.length > 0) setTouched(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    // TODO: call real API
    // await fetch('/api/gst/update', { method:'POST', body: JSON.stringify({ gstin: upper }) });
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    onConfirm(upper);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-7 w-full max-w-sm"
        style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both' }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.92) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {step === 'edit' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Update GST Number</h3>
                <p className="text-xs text-gray-400 mt-0.5">Enter your corrected GSTIN</p>
              </div>
              <button
                onClick={onCancel}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">GSTIN</label>
              <input
                type="text"
                placeholder="27ABCDE1234F1Z5"
                value={upper}
                onChange={handleChange}
                onBlur={() => gstin && setTouched(true)}
                maxLength={15}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-mono font-semibold text-gray-800 tracking-widest
                  placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
                  ${!touched
                    ? 'border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                    : isValid
                      ? 'border-emerald-400 ring-2 ring-emerald-100'
                      : 'border-red-300 ring-2 ring-red-100'
                  }`}
              />
            </div>

            {/* Rules */}
            <div className="mb-5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="space-y-2">
                {rules.map((r, i) => <RuleRow key={i} label={r.label} passed={r.passed} touched={touched} />)}
              </div>
            </div>

            {/* Warning */}
            <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updating will re-verify your GST and may incur charges.
              </p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton variant="outline" onClick={onCancel} className="flex-1">Cancel</PrimaryButton>
              <PrimaryButton
                onClick={() => setStep('confirm')}
                disabled={!isValid || upper === currentGSTIN}
                className="flex-1"
              >
                Next →
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            {/* Confirm step */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Confirm GST Update</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Are you sure you want to update GST details?<br />
                This will re-verify and may incur charges.
              </p>
            </div>

            {/* New GSTIN preview */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6 text-center">
              <p className="text-xs text-gray-400 mb-1">New GSTIN</p>
              <p className="text-base font-mono font-bold text-gray-900 tracking-widest">{upper}</p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton variant="outline" onClick={() => setStep('edit')} className="flex-1">Back</PrimaryButton>
              <PrimaryButton onClick={handleUpdate} loading={saving} className="flex-1">
                {saving ? 'Updating…' : 'Yes, Update'}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mock GST data (replace with store / API response) ────────────────────────
const DEFAULT_GST_DATA = {
  gstin:            '27ABCDE1234F1Z5',
  legalName:        'ABC PRIVATE LIMITED',
  tradeName:        'ABC PRIVATE LIMITED',
  registrationDate: '15/06/2020',
  gstType:          'Regular',
  status:           'Active',
};

// ── Main component ───────────────────────────────────────────────────────────
export default function Step9GSTReadOnly({ gstData = DEFAULT_GST_DATA, pan = 'ABCDE1234F' }) {
  const { goToStep } = useOnboardingStore();
  const [data, setData]           = useState(gstData);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleConfirmUpdate = (newGSTIN) => {
    setData(prev => ({ ...prev, gstin: newGSTIN }));
    setShowModal(false);
    // optionally re-fetch: useOnboardingStore.getState().setGSTData({ ...data, gstin: newGSTIN });
    goToStep(STEPS.SYSTEM_VERIFY);
  };

  return (
    <div className=" flex flex-col items-center justify-center ">

      

      {/* Horizontal card */}
      <div
        className="w-full max-w-3xl  overflow-hidden"
        style={{ animation: 'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── LEFT: GST details ── */}
          <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Your GST Details</h2>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full mt-1">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="bg-gray-50/60 border border-gray-100 rounded-xl px-4 py-1">
              <DetailRow label="GSTIN"            value={data.gstin}            mono />
              <DetailRow label="Legal Name"        value={data.legalName} />
              <DetailRow label="Trade Name"        value={data.tradeName} />
              <DetailRow label="Registration Date" value={data.registrationDate} />
              <DetailRow label="GST Type"          value={data.gstType} />
              <DetailRow label="Status"            value={data.status} />
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                ${data.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {data.status}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
                {data.gstType}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Actions + info ── */}
          <div className="p-7 bg-gray-50/50 flex flex-col gap-5">

            {/* Info block */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                What's next?
              </p>
              <div className="space-y-3">
                {[
                  { icon: 'M5 13l4 4L19 7', label: 'GST verified successfully' },
                  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Business details pre-filled' },
                  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Proceeding to system verification' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                If details look incorrect, use Update to correct your GSTIN before continuing.
              </p>
            </div>

            {/* Action buttons — pushed to bottom */}
            <div className="mt-auto flex gap-3">
              <PrimaryButton variant="outline" onClick={() => setShowModal(true)} className="flex-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update
              </PrimaryButton>
              <PrimaryButton onClick={() => goToStep(STEPS.SYSTEM_VERIFY)} className="flex-1">
                Continue →
              </PrimaryButton>
            </div>
          </div>

        </div>
      </div>

      {/* Update modal — unchanged */}
      {showModal && (
        <UpdateModal
          currentGSTIN={data.gstin}
          pan={pan}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </div>
  );
}