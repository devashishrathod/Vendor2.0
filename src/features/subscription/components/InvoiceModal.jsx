import React from 'react';
import Modal from './Modal';
import { CloseIcon } from './icons';
import { useInvoice } from '../hooks/useInvoice';
import InvoiceActions, { buildDownloadHandler } from './InvoiceActions';
import InvoiceCard from './InvoiceCard';

export default function InvoiceModal({ open, onClose, orderId }) {
  const { invoice, isLoading, error, refetch } = useInvoice(orderId, { enabled: open });

  const handlePrint = () => window.print();
  const handleDownload = buildDownloadHandler(invoice);

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Invoice details" widthVariant="wide">
      <div className="inv-modal__header">
        <h3>Invoice {orderId}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {invoice && <InvoiceActions onPrint={handlePrint} onDownload={handleDownload} />}
          <button className="inv-modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon width={16} height={16} stroke="#fff" />
          </button>
        </div>
      </div>

      {isLoading && <p style={{ padding: '24px 0', color: '#6b7280' }}>Loading invoice…</p>}

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

      {!isLoading && !error && invoice && <InvoiceCard invoice={invoice} />}
    </Modal>
  );
}
