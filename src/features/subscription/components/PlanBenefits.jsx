import React, { useState } from 'react';
import { InfoSection } from './InfoGrid';
import UpgradeButton from './UpgradeButton';
import PlanBenefitsModal from './PlanBenefitsModal';
import { usePlanBenefits } from '../hooks/usePlanBenefits';

export default function PlanBenefits({ subscription, onUpgrade }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // `enabled` means benefits are only fetched once the user actually opens
  // the modal, not on initial page load.
  const { benefits, isLoading, error } = usePlanBenefits(subscription.planName, {
    enabled: isModalOpen,
  });

  return (
    <InfoSection title="Plan Benefit's">
      <div className="sub-info-item" style={{ marginBottom: 40 }}>
        <dt>Current Plan Benefit's</dt>
        <dd>
          <span className="sub-sub-label">List Details</span>
          <a
            href="#view-details"
            onClick={(e) => {
              e.preventDefault();
              setIsModalOpen(true);
            }}
          >
            View Details
          </a>
        </dd>
      </div>

      <UpgradeButton onClick={onUpgrade} />

      <PlanBenefitsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planName={subscription.planName}
        benefits={benefits}
        isLoading={isLoading}
        error={error}
      />
    </InfoSection>
  );
}
