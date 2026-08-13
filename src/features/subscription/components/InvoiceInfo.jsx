import React, { useState } from 'react';
import { InfoSection } from './InfoGrid';
import InvoiceModal from './InvoiceModal';
import InvoiceHistoryModal from './InvoiceHistoryModal';
import RaiseQueryModal from './RaiseQueryModal';

export default function InvoiceInfo({ subscription }) {
  const { orderId, ticketStatus, purchasedListLabel } = subscription;

  // Only one of these is ever open at a time, but they're independent
  // booleans (rather than a single "activeModal" enum) so History can open
  // Invoice on top of itself without them fighting over shared state.
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [historyInvoiceOrderId, setHistoryInvoiceOrderId] = useState(orderId);

  return (
    <InfoSection title="Invoice Information">
      <dl className="sub-info-grid">
        <div className="sub-info-item">
          <dt>Order ID</dt>
          <dd>
            <span className="sub-sub-label">{orderId}</span>
            <a
              href="#view-invoice"
              onClick={(e) => {
                e.preventDefault();
                setHistoryInvoiceOrderId(orderId);
                setIsInvoiceOpen(true);
              }}
            >
              View Invoice
            </a>
          </dd>
        </div>

        <div className="sub-info-item">
          <dt>Create Ticket</dt>
          <dd>
            <span className="sub-sub-label">{ticketStatus}</span>
            <a
              href="#raise-query"
              onClick={(e) => {
                e.preventDefault();
                setIsQueryOpen(true);
              }}
            >
              Raise Query
            </a>
          </dd>
        </div>

        <div className="sub-info-item">
          <dt>Subscription Invoice</dt>
          <dd>
            <span className="sub-sub-label">{purchasedListLabel}</span>
            <a
              href="#view-history"
              onClick={(e) => {
                e.preventDefault();
                setIsHistoryOpen(true);
              }}
            >
              View History
            </a>
          </dd>
        </div>
      </dl>

      <InvoiceModal
        open={isInvoiceOpen}
        orderId={historyInvoiceOrderId}
        onClose={() => setIsInvoiceOpen(false)}
      />

      <InvoiceHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onViewInvoice={(clickedOrderId) => {
          // Swap to the invoice modal for the row that was clicked, and
          // close the history modal underneath it.
          setHistoryInvoiceOrderId(clickedOrderId);
          setIsHistoryOpen(false);
          setIsInvoiceOpen(true);
        }}
      />

      <RaiseQueryModal open={isQueryOpen} onClose={() => setIsQueryOpen(false)} orderId={orderId} />
    </InfoSection>
  );
}
