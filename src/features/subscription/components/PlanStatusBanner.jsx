import React from 'react';
import { formatDateLong } from '../utils/formatters';
import { PLAN_STATUS } from '../constants/subscription.constants';

const STATUS_COPY = {
  [PLAN_STATUS.ACTIVE]: { label: 'Success', verb: 'Active' },
  [PLAN_STATUS.EXPIRED]: { label: 'Expired', verb: 'Expired' },
  [PLAN_STATUS.CANCELLED]: { label: 'Cancelled', verb: 'Cancelled' },
  [PLAN_STATUS.TRIAL]: { label: 'Trial', verb: 'On Trial' },
};

export default function PlanStatusBanner({ subscription }) {
  const { status, planName, brandName, nextRenewalDate } = subscription;
  const copy = STATUS_COPY[status] || STATUS_COPY[PLAN_STATUS.ACTIVE];

  return (
    <div className="sub-status-banner">
      <div className="sub-status-banner__main">
        <div className="sub-status-badge">
          <span className="sub-status-badge__icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {copy.label}
        </div>
        <h3 className="sub-status-banner__title">
          {planName} {copy.verb}
        </h3>
        <p className="sub-status-banner__desc">
          Thank you, <strong>{brandName}</strong>! Your purchase was successful. You now have full
          access to all {planName} features.
        </p>
      </div>
      <div className="sub-status-banner__renewal">
        <span className="sub-status-banner__renewal-label">Next Renewal</span>
        <span className="sub-status-banner__renewal-date">{formatDateLong(nextRenewalDate)}</span>
      </div>
    </div>
  );
}
