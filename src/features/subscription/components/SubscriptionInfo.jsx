import React from 'react';
import { InfoSection, InfoGrid } from './InfoGrid';
import {
  formatCurrencyINR,
  formatDateDMY,
  getExpirationStatus,
  getDiscountPercentageLabel,
} from '../utils/formatters';

export default function SubscriptionInfo({ subscription }) {
  const {
    planName,
    createdOnDate,
    subscriptionTermYears,
    expirationDate,
    originalPrice,
    discountedPrice,
    paidAmount,
  } = subscription;

  const row1 = [
    { label: 'Current Plan Name', value: planName },
    { label: 'Create On Date', value: formatDateDMY(createdOnDate) },
    { label: 'Subscription Term', value: `${subscriptionTermYears} (Year)` },
    { label: 'Expiration Status', value: getExpirationStatus(expirationDate) },
  ];

  const row2 = [
    { label: 'Plan Original Price', value: formatCurrencyINR(originalPrice) },
    { label: 'Plan Discount Price', value: formatCurrencyINR(discountedPrice) },
    {
      label: 'Discount Percentage',
      value: getDiscountPercentageLabel(originalPrice, discountedPrice),
    },
    { label: 'Paid Amount', value: formatCurrencyINR(paidAmount) },
  ];

  return (
    <InfoSection title="Subscription Information">
      <InfoGrid items={row1} />
      <div style={{ height: 28 }} />
      <InfoGrid items={row2} />
    </InfoSection>
  );
}
