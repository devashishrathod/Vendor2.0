import { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import PageHeader from '../components/PageHeader';
import PlanStatusBanner from '../components/PlanStatusBanner';
import SubscriptionInfo from '../components/SubscriptionInfo';
import InvoiceInfo from '../components/InvoiceInfo';
import BillingInfo from '../components/BillingInfo';
import PlanBenefits from '../components/PlanBenefits';
import UpgradeBanner from '../components/UpgradeBanner';
import PlanBenefitsModal from '../components/PlanBenefitsModal';
// Still needed — InvoiceModal/InvoiceHistoryModal/PlanBenefitsModal
// (rendered by the components above and below) use these classes; only
// the static sections were converted to Tailwind.
import '../components/subscription.css';
import '../components/invoice.css';

export default function SubscriptionPage() {
  const { subscription, isLoading, error, refetch, goToPlans } = useSubscription();
  // Lifted up so both PlanStatusBanner's "View Plan Details" and
  // PlanBenefits' "View All Benefits" open the exact same modal instance.
  const [benefitsModalOpen, setBenefitsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading your subscription…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <PageHeader planTypeLabel={subscription.planTypeLabel} />

        <PlanStatusBanner
          subscription={subscription}
          onUpgrade={goToPlans}
          onViewDetails={() => setBenefitsModalOpen(true)}
        />

        <SubscriptionInfo subscription={subscription} />
        <InvoiceInfo subscription={subscription} />
        <BillingInfo subscription={subscription} />
        <PlanBenefits subscription={subscription} onViewAll={() => setBenefitsModalOpen(true)} />

        <UpgradeBanner onClick={goToPlans} planName={subscription.planName} />
      </div>

      <PlanBenefitsModal
        open={benefitsModalOpen}
        onClose={() => setBenefitsModalOpen(false)}
        planName={subscription.planName}
        features={subscription.features}
        benefits={subscription.benefits}
        usage={subscription.usage}
      />
    </div>
  );
}
