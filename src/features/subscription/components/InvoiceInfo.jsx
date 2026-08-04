import React from 'react';
import { InfoSection, InfoGrid } from './InfoGrid';

export default function InvoiceInfo({ subscription, onRaiseQuery, onViewHistory }) {
  const { orderId, invoiceUrl, ticketStatus, purchasedListLabel } = subscription;

  const items = [
    {
      label: 'Order ID',
      value: orderId,
      link: { text: 'View Invoice', href: invoiceUrl },
    },
    {
      label: 'Create Ticket',
      value: ticketStatus,
      link: { text: 'Raise Query', onClick: onRaiseQuery },
    },
    {
      label: 'Subscription Invoice',
      value: purchasedListLabel,
      link: { text: 'View History', onClick: onViewHistory },
    },
  ];

  return (
    <InfoSection title="Invoice Information">
      <InfoGrid items={items} />
    </InfoSection>
  );
}
