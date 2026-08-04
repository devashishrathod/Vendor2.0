import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import PlanStatusBanner from '../components/PlanStatusBanner';
import SubscriptionInfo from '../components/SubscriptionInfo';
import InvoiceInfo from '../components/InvoiceInfo';
import BillingInfo from '../components/BillingInfo';
import PlanBenefits from '../components/PlanBenefits';
import '../components/subscription.css';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';

export default function SubscriptionPage() {
  const { subscription, isLoading, error, refetch, goToPlans } = useSubscription();

  if (isLoading) {
    return (
      <div className="sub-page">
        <div className="sub-state-message">Loading your subscription…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sub-page">
        <div className="sub-state-message sub-state-message--error">
          {error}
          <div>
            <button className="sub-retry-btn" onClick={refetch}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) return null;

  return (
<div>
  <DashboardHeader />
      <div className="sub-page">
      <PageHeader />

      <SectionHeader />

      <PlanStatusBanner subscription={subscription} />

      <SubscriptionInfo subscription={subscription} />
      <hr className="sub-divider" />

      <InvoiceInfo
        subscription={subscription}
        onRaiseQuery={() => console.log('Raise query clicked')}
        onViewHistory={() => console.log('View history clicked')}
      />

      <BillingInfo subscription={subscription} />
      <hr className="sub-divider" />

      <PlanBenefits
        subscription={subscription}
        onViewDetails={() => console.log('View plan benefit details clicked')}
        onUpgrade={goToPlans}
      />
    </div>
</div>
  );
}
