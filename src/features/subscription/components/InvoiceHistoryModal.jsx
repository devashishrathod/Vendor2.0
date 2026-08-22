import React from 'react';
import Modal from './Modal';
import { CloseIcon } from './icons';
import { useInvoiceHistory } from '../hooks/useInvoiceHistory';
import InvoiceHistoryTable from './InvoiceHistoryTable';

export default function InvoiceHistoryModal({ open, onClose, onViewInvoice }) {
  const { invoices, isLoading, error, refetch } = useInvoiceHistory({ enabled: open });

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Purchase history" widthVariant="wide">
      <div className="inv-modal__header">
        <h3>Purchase History</h3>
        <button className="inv-modal__close" onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      {isLoading && <p style={{ padding: '24px 0', color: '#6b7280' }}>Loading history…</p>}

      {error && (
        <div className="sub-state-message sub-state-message--error" style={{ padding: '24px 0' }}>
          {error}
          <div>
            <button className="sub-retry-btn" onClick={refetch}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <InvoiceHistoryTable invoices={invoices} onViewInvoice={onViewInvoice} />
      )}
    </Modal>
  );
}
