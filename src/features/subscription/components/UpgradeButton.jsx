import React from 'react';
import { STATIC_TEXT } from '../constants/subscription.constants';

export default function UpgradeButton({ onClick, isLoading = false }) {
  return (
    <button
      type="button"
      className="sub-upgrade-btn"
      onClick={onClick}
      disabled={isLoading}
      aria-label="Upgrade your plan"
    >
      <span aria-hidden="true" role="img">
        🚀
      </span>
      {isLoading ? 'Loading…' : STATIC_TEXT.UPGRADE_LABEL}
    </button>
  );
}
