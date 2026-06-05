import { useState } from 'react';
import { validateBankDetails } from '../validation';
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

// ── Per-field inline rules for the Update modal ──────────────────────────────
const FIELD_RULES = {
  accountNumber:     { label: 'Valid account number (9–18 digits)', test: v => /^\d{9,18}$/.test(v) },
  ifsc:              { label: 'Valid IFSC code (e.g. HDFC0001234)',  test: v => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v) },
  accountHolderName: { label: 'Account holder name required',        test: v => v.trim().length >= 3 },
};

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

// ── Mini Input for Update Modal ──────────────────────────────────────────────
function ModalInput({ label, placeholder, value, onChange, onBlur, touched, isValid, mono, maxLength, inputMode }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        maxLength={maxLength}
        inputMode={inputMode}
        className={`w-full px-4 py-2.5 bg-white border-2 rounded-xl text-sm font-semibold text-gray-800
          ${mono ? 'font-mono tracking-widest' : ''}
          placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
          ${!touched
            ? 'border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
            : isValid
              ? 'border-emerald-400 ring-2 ring-emerald-100'
              : 'border-red-300 ring-2 ring-red-100'
          }`}
      />
    </div>
  );
}

// ── Update Bank Modal ────────────────────────────────────────────────────────
function UpdateModal({ currentData, onCancel, onConfirm }) {
  const [fields, setFields] = useState({
    accountNumber:     currentData.accountNumber     || '',
    ifsc:              currentData.ifsc              || '',
    accountHolderName: currentData.accountHolderName || '',
  });
  const [touched, setTouched] = useState({
    accountNumber: false, ifsc: false, accountHolderName: false,
  });
  const [step, setStep]     = useState('edit'); // 'edit' | 'confirm'
  const [saving, setSaving] = useState(false);

  const normalised = {
    accountNumber:     fields.accountNumber.replace(/\D/g, '').slice(0, 18),
    ifsc:              fields.ifsc.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11),
    accountHolderName: fields.accountHolderName,
  };

  const fieldValid = {
    accountNumber:     FIELD_RULES.accountNumber.test(normalised.accountNumber),
    ifsc:              FIELD_RULES.ifsc.test(normalised.ifsc),
    accountHolderName: FIELD_RULES.accountHolderName.test(normalised.accountHolderName),
  };

  const errors  = validateBankDetails(normalised);
  const isValid = !errors && Object.values(fieldValid).every(Boolean);

  const hasChanged =
    normalised.accountNumber     !== (currentData.accountNumber     || '') ||
    normalised.ifsc              !== (currentData.ifsc              || '') ||
    normalised.accountHolderName !== (currentData.accountHolderName || '');

  const handleChange = (key) => (e) => {
    let val = e.target.value;
    if (key === 'accountNumber') val = val.replace(/\D/g, '').slice(0, 18);
    if (key === 'ifsc')          val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setFields(prev => ({ ...prev, [key]: val }));
    if (!touched[key] && val.length > 0) setTouched(prev => ({ ...prev, [key]: true }));
  };

  const handleBlur = (key) => () => {
    if (fields[key]) setTouched(prev => ({ ...prev, [key]: true }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    // TODO: real API
    // await fetch('/api/bank/update', { method:'POST', body: JSON.stringify(normalised) });
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    onConfirm(normalised);
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Update Bank Details</h3>
                <p className="text-xs text-gray-400 mt-0.5">Enter your corrected bank details</p>
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

            <ModalInput
              label="Account Number" placeholder="Enter account number"
              value={normalised.accountNumber}
              onChange={handleChange('accountNumber')} onBlur={handleBlur('accountNumber')}
              touched={touched.accountNumber} isValid={fieldValid.accountNumber}
              mono maxLength={18} inputMode="numeric"
            />
            <ModalInput
              label="IFSC Code" placeholder="e.g. HDFC0001234"
              value={normalised.ifsc}
              onChange={handleChange('ifsc')} onBlur={handleBlur('ifsc')}
              touched={touched.ifsc} isValid={fieldValid.ifsc}
              mono maxLength={11}
            />
            <ModalInput
              label="Account Holder Name" placeholder="Enter account holder name"
              value={fields.accountHolderName}
              onChange={handleChange('accountHolderName')} onBlur={handleBlur('accountHolderName')}
              touched={touched.accountHolderName} isValid={fieldValid.accountHolderName}
              maxLength={80}
            />

            <div className="mb-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="space-y-2">
                {Object.entries(FIELD_RULES).map(([key, rule]) => (
                  <RuleRow key={key} label={rule.label} passed={fieldValid[key]} touched={touched[key]} />
                ))}
              </div>
            </div>

            <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updating will re-verify your bank details and may incur charges.
              </p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton variant="outline" onClick={onCancel} className="flex-1">Cancel</PrimaryButton>
              <PrimaryButton onClick={() => setStep('confirm')} disabled={!isValid || !hasChanged} className="flex-1">
                Next →
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Confirm Bank Update</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Are you sure you want to update bank details?<br />
                This will re-verify and may incur charges.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Account Number</span>
                <span className="font-mono font-bold text-gray-800">{normalised.accountNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">IFSC Code</span>
                <span className="font-mono font-bold text-gray-800">{normalised.ifsc}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Holder Name</span>
                <span className="font-semibold text-gray-800 text-right max-w-[160px]">{normalised.accountHolderName}</span>
              </div>
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

// ── Mock bank data (replace with store / API response) ───────────────────────
const DEFAULT_BANK_DATA = {
  bankName:          'HDFC BANK',
  accountNumber:     'XXXX XXXX 1234',
  ifsc:              'HDFC0001234',
  accountHolderName: 'ABC PRIVATE LIMITED',
  accountType:       'Current Account',
};

// ── Main component ───────────────────────────────────────────────────────────
export default function Step12BankReadOnly({ bankData = DEFAULT_BANK_DATA }) {
  const { goToStep } = useOnboardingStore();
  const [data, setData]           = useState(bankData);
  const [showModal, setShowModal] = useState(false);

  const handleConfirmUpdate = (newFields) => {
    setData(prev => ({
      ...prev,
      accountNumber:     newFields.accountNumber,
      ifsc:              newFields.ifsc,
      accountHolderName: newFields.accountHolderName,
    }));
    setShowModal(false);
    // useOnboardingStore.getState().setBankData({ ...data, ...newFields });
    goToStep(STEPS.COMPLETE);
  };

  const rawForModal = {
    accountNumber:     data.accountNumber.replace(/\s/g, '').replace(/X/g, ''),
    ifsc:              data.ifsc,
    accountHolderName: data.accountHolderName,
  };

  return (
    <div className=" flex flex-col items-center justify-center  ">

   

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

          {/* ── LEFT: Bank details ── */}
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
                <h2 className="text-base font-bold text-gray-900 leading-tight">Your Bank Details</h2>
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
              <DetailRow label="Bank Name"           value={data.bankName} />
              <DetailRow label="Account Number"      value={data.accountNumber} mono />
              <DetailRow label="IFSC Code"           value={data.ifsc}          mono />
              <DetailRow label="Account Holder Name" value={data.accountHolderName} />
              <DetailRow label="Account Type"        value={data.accountType} />
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {data.accountType}
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
                  { icon: 'M5 13l4 4L19 7',         label: 'Bank account verified successfully' },
                  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Account details saved to your profile' },
                  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Proceeding to partner contract' },
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
                If details look incorrect, use Update to correct your bank details before continuing.
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
              <PrimaryButton onClick={() => goToStep(STEPS.PARTNER_CONTRACT)} className="flex-1">
                Continue →
              </PrimaryButton>
            </div>
          </div>

        </div>
      </div>

      {/* Update modal — unchanged */}
      {showModal && (
        <UpdateModal
          currentData={rawForModal}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </div>
  );
}