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
import '../components/invoice.css'; // needed for the Plan Benefits modal styles


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
  
      <div className="sub-page">
      <PageHeader />

      <SectionHeader />

      <PlanStatusBanner subscription={subscription} />

      <SubscriptionInfo subscription={subscription} />
      <hr className="sub-divider" />

      <InvoiceInfo subscription={subscription} />

      <BillingInfo subscription={subscription} />
      <hr className="sub-divider" />

      <PlanBenefits subscription={subscription} onUpgrade={goToPlans} />
    </div>
  </div>
  );
}
