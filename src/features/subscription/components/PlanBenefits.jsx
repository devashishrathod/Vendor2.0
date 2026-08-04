import React from 'react';
import { InfoSection } from './InfoGrid';
import UpgradeButton from './UpgradeButton';

export default function PlanBenefits({ subscription, onViewDetails, onUpgrade }) {
  return (
    <InfoSection title="Plan Benefit's">
      <div className="sub-info-item" style={{ marginBottom: 40 }}>
        <dt>Current Plan Benefit's</dt>
        <dd>
          <span className="sub-sub-label">List Details</span>
          <a
            href={subscription.currentPlanBenefitsUrl || '#'}
            onClick={(e) => {
              if (!subscription.currentPlanBenefitsUrl) {
                e.preventDefault();
                onViewDetails?.();
              }
            }}
          >
            View Details
          </a>
        </dd>
      </div>

      <UpgradeButton onClick={onUpgrade} />
    </InfoSection>
  );
}
