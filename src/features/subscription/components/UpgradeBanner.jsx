import { useState } from 'react';
import { Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';

// Same top-plan gating as PlanStatusBanner's "Upgrade Plan" button — "Pro
// Plus" is Trydood's top tier, so this banner's own upgrade CTA (further
// down the page) goes muted too instead of sending the vendor to a
// plan-selection page with no real upgrade to offer.
export default function UpgradeBanner({ onClick, isLoading = false, planName }) {
  const [showTopPlanModal, setShowTopPlanModal] = useState(false);
  const isTopPlan = planName === 'Pro Plus';

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-bold">
              {isTopPlan ? "You're on our top plan" : 'Take your business to the next level'}
            </p>
            <p className="text-emerald-100 text-sm mt-0.5">
              {isTopPlan
                ? `${planName} already includes everything Trydood offers.`
                : 'Upgrade to a higher plan for more outlets, better visibility and exclusive features.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (isTopPlan ? setShowTopPlanModal(true) : onClick())}
          disabled={isLoading}
          className={`flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
            isTopPlan ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {isLoading ? 'Loading…' : isTopPlan ? 'Current Plan' : 'Upgrade Now'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showTopPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTopPlanModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">You're on our top plan</h3>
            <p className="text-sm text-gray-500 mb-5">
              {planName} already includes everything Trydood offers — there's no higher plan to upgrade to right
              now.
            </p>
            <button
              onClick={() => setShowTopPlanModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
