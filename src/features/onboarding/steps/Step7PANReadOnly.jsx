import { useState } from 'react';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-gray-800 text-right ${mono ? 'font-mono tracking-widest' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

const DEFAULT_PAN_DATA = {
  panNumber: 'ABCDE1234F',
  name:      'ABC PRIVATE LIMITED',
  legalName: 'ABC PRIVATE LIMITED',
  dob:       '15/06/2020',
  status:    'Active',
  panType:   'Company',
};

export default function Step7PANReadOnly({ panData = DEFAULT_PAN_DATA }) {
  const { setSubStep } = useOnboardingStore();
  const [data] = useState(panData);

  return (
    <div className="w-full" style={{ animation: 'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}>
      <style>{`
        @keyframes stepIn {
          from { opacity:0; transform:translateY(14px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Page title ── */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">PAN Verified</h2>
        <p className="text-xs text-gray-400 mt-0.5">Review your details carefully before continuing</p>
      </div>

      {/* ── Horizontal layout ── */}
      <div className="grid grid-cols-2 gap-5 mb-5">

        {/* LEFT — Hero card + detail rows */}
        <div className="flex flex-col gap-4">

          {/* PAN hero */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl px-5 py-4
            flex items-center justify-between shadow-md shadow-emerald-100">
            <div>
              <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-widest mb-1">
                PAN Number
              </p>
              <p className="text-white text-lg font-mono font-bold tracking-[0.18em]">
                {data.panNumber}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Detail rows */}
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm flex-1">
            <DetailRow label="Name (as per PAN)"     value={data.name} />
            <DetailRow label="Legal name"            value={data.legalName} />
            <DetailRow label="Date of incorporation" value={data.dob} />
            <DetailRow label="PAN type"              value={data.panType} />
          </div>
        </div>

        {/* RIGHT — Status + warning + actions */}
        <div className="flex flex-col gap-4">

          {/* Verified pill */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white
            text-[10px] font-bold px-3 py-1.5 rounded-full w-fit">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </div>

          {/* Status badges */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>

            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border
              ${data.status === 'Active'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-600'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {data.status === 'Active'
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />}
              </svg>
              {data.status}
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border
              bg-blue-50 border-blue-100 text-blue-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              </svg>
              {data.panType}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5 flex-1">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700 leading-relaxed">
              Please verify these details carefully. Incorrect PAN details may cause issues during payment processing.
            </p>
          </div>

          {/* Actions — pushed to bottom */}
          <div className="flex gap-3 mt-auto">
            <button
              onClick={() => setSubStep(BIZ_SUB.PAN_ENTER)}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300
                hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-all duration-200
                active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Update PAN
            </button>

            <button
              onClick={() => setSubStep(BIZ_SUB.GST_ENTER)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white
                text-sm font-semibold transition-all duration-200 active:scale-[0.98]
                shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
            >
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}