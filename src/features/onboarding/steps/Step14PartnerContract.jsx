import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

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

// ── Terms & Conditions content ───────────────────────────────────────────────
const TERMS = [
  {
    title: "Partnership Scope",
    body: "This agreement governs the relationship between Trydood and the Partner for the purpose of delivering services as outlined in the onboarding documentation.",
  },
  {
    title: "Roles & Responsibilities",
    body: "The Partner agrees to maintain accurate business information, comply with applicable laws, and fulfil all obligations as described in the Trydood Partner Handbook.",
  },
  {
    title: "Revenue & Payments",
    body: "Payouts will be processed per the agreed schedule. Trydood reserves the right to withhold payments in case of policy violations or disputed transactions.",
  },
  // {
  //   title: "Confidentiality",
  //   body: "Both parties agree to keep proprietary business information confidential and not disclose it to third parties without prior written consent.",
  // },
  // {
  //   title: "Termination",
  //   body: "Either party may terminate this agreement with 30 days' written notice. Trydood may terminate immediately in cases of fraud or material breach.",
  // },
];

export default function Step5PartnerContract() {
  const [agreed, setAgreed] = useState(false);
  // const navigate = useNavigate();
  const { goToStep } = useOnboardingStore();

  return (
    <div className=" flex flex-col items-center justify-center ">

      

      {/* Horizontal card */}
      <div
        className="w-full max-w-6xl  overflow-hidden"
        style={{ animation: "stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both" }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── LEFT: Agreement action ── */}
          <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Partner Agreement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Review and accept to complete onboarding</p>
              </div>
            </div>

            {/* DocuSign block */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Partnership Deed Document
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                You're nearly there! Review and sign the digital contract below to finish onboarding with Trydood.
              </p>
              <a
                href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Trydood Partner Agreement ↗
              </a>
            </div>

            {/* Terms & Conditions link */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Also review the full{" "}
              <a
                href="#"
                className="text-emerald-500 font-semibold hover:text-emerald-600 hover:underline transition-colors"
              >
                Terms &amp; Conditions
              </a>
              {" "}before accepting.
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
              border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40
              has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/60"
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-gray-600">
                I have read and agree to the{" "}
                <a
                  href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 font-semibold hover:underline cursor-pointer"
                >
                  Trydood Partner Agreement
                </a>{" "}
                and all associated{" "}
                <a
                  href="#"
                  className="text-emerald-500 font-semibold hover:underline cursor-pointer"
                >
                  terms and conditions
                </a>.
              </span>
            </label>

            {/* CTA — pinned to bottom */}
            <div className="mt-auto">
              <button
                onClick={() => goToStep(STEPS.COMPLETE)}
                disabled={!agreed}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
                  ${agreed
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm shadow-emerald-200"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }`}
              >
                {agreed && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Subscription Plan
              </button>
            </div>
          </div>

          {/* ── RIGHT: Terms summary ── */}
          <div className="p-7 bg-gray-50/50 flex flex-col gap-4">

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Terms &amp; Conditions Summary
            </p>

            <div className="flex flex-col gap-3">
              {TERMS.map((term, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold" style={{ fontSize: '9px' }}>{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">{term.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{term.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                For the full legal document, open the partner agreement link. Contact{" "}
                <a href="mailto:support@trydood.com" className="text-emerald-500 font-semibold hover:underline">
                  support@trydood.com
                </a>{" "}
                for any queries.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}