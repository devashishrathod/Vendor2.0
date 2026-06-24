import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { approvePartnership } from "@/features/onboarding/services/api/verify.api";

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
];

export default function Step5PartnerContract() {
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit() {
    setLoading(true);
    setApiError(null);
    try {
      await approvePartnership();
      navigate("/subscription");
    } catch (err) {
      setApiError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="w-full max-w-6xl overflow-hidden"
        style={{ animation: "stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both" }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* LEFT */}
          <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  Partner Deed Agreement
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Review and accept to complete onboarding
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Partnership Deed Document
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                You're nearly there! Review and sign the digital contract below
                to finish onboarding with Trydood.
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

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Also review the full{" "}
              <a
              
                href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 font-semibold hover:text-emerald-600 hover:underline transition-colors"
              >
                Terms &amp; Conditions
              </a>{" "}
              before accepting.
            </div>

            {/* ── Checkbox — sirf UI, no API ── */}
            <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
              border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40
              ${agreed ? "border-emerald-300 bg-emerald-50/60" : ""}`}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
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
                
                  href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 font-semibold hover:underline cursor-pointer"
                >
                  terms and conditions
                </a>
                .
              </span>
            </label>

            {/* ── API Error ── */}
            {apiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-500">{apiError}</p>
              </div>
            )}

            <div className="mt-auto">
              <button
                onClick={handleSubmit}
                disabled={!agreed || loading}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${agreed && !loading
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm shadow-emerald-200"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }`}
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : agreed ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
                {loading ? "Processing..." : "Subscription Plan"}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="p-7 bg-gray-50/50 flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Terms &amp; Conditions Summary
            </p>
            <div className="flex flex-col gap-3">
              {TERMS.map((term, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold" style={{ fontSize: "9px" }}>
                      {i + 1}
                    </span>
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