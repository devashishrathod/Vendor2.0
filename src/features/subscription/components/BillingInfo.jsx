import React from 'react';
import { InfoSection, InfoGrid } from './InfoGrid';

export default function BillingInfo({ subscription }) {
  const { brandName, billingAddress, gstDetails, panDetails } = subscription;

  const items = [
    { label: 'Brand Name', value: brandName },
    { label: 'Billing Address', value: billingAddress },
    { label: 'GST Details', value: gstDetails },
    { label: 'PAN Details', value: panDetails },
  ];

  return (
    <InfoSection title="Billing Information">
      <InfoGrid items={items} />
    </InfoSection>
  );
}
