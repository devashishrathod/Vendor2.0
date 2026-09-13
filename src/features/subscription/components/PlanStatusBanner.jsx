import { useState } from 'react';
import { CheckCircle2, CalendarDays, ArrowRight } from 'lucide-react';
import { formatDateLong, getExpirationStatus } from '../utils/formatters';
import { PLAN_STATUS } from '../constants/subscription.constants';

const STATUS_COPY = {
  [PLAN_STATUS.ACTIVE]: { label: 'Active Plan', verb: 'is active', positive: true },
  [PLAN_STATUS.EXPIRED]: { label: 'Expired Plan', verb: 'has expired', positive: false },
  [PLAN_STATUS.CANCELLED]: { label: 'Cancelled Plan', verb: 'was cancelled', positive: false },
  [PLAN_STATUS.TRIAL]: { label: 'Trial Plan', verb: 'is on trial', positive: true },
};

export default function PlanStatusBanner({ subscription, onUpgrade, onViewDetails }) {
  const { status, planName, brandName, nextRenewalDate } = subscription;
  const copy = STATUS_COPY[status] || STATUS_COPY[PLAN_STATUS.ACTIVE];
  const [showTopPlanModal, setShowTopPlanModal] = useState(false);

  // "Pro Plus" is Trydood's top tier — there's nowhere higher to send the
  // vendor, so "Upgrade Plan" goes gray and explains that instead of
  // opening the plan-selection page with no real upgrade to offer.
  const isTopPlan = planName === 'Pro Plus';

  return (
    <>
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shrink-0 ${
              copy.positive ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1.5 ${
                copy.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
              }`}
            >
              {copy.label}
            </span>
            <h3 className="text-2xl font-bold text-gray-900">{planName}</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Thank you, <strong className="text-gray-700">{brandName}</strong>! Your subscription {copy.verb}. You
              now have full access to all {planName} features.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-emerald-100 pt-4 lg:pt-0 lg:pl-6 lg:mx-2">
          <div className="w-10 h-10 rounded-lg bg-white text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Next Renewal</p>
            <p className="text-base font-bold text-gray-900 whitespace-nowrap">{formatDateLong(nextRenewalDate)}</p>
            <p className="text-xs text-gray-400">{getExpirationStatus(nextRenewalDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => (isTopPlan ? setShowTopPlanModal(true) : onUpgrade())}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
              isTopPlan
                ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            Upgrade Plan <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onViewDetails}
            className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            View Plan Details
          </button>
        </div>
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
