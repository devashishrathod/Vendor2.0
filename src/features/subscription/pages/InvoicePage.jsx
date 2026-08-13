import React from 'react';
import { useParams } from 'react-router-dom';
import { useInvoice } from '../hooks/useInvoice';
import { InvoicePageHeader, BillingDetailsBar } from '../components/InvoicePageHeader';
import InvoiceActions, { buildDownloadHandler } from '../components/InvoiceActions';
import InvoiceCard from '../components/InvoiceCard';
import { STATIC_TEXT } from '../constants/subscription.constants';
import '../components/invoice.css';

export default function InvoicePage() {
  const { orderId } = useParams();
  const { invoice, isLoading, error, refetch } = useInvoice(orderId);

  const handlePrint = () => window.print();
  const handleDownload = buildDownloadHandler(invoice);

  return (
    <div className="inv-page">
      <InvoicePageHeader title={STATIC_TEXT.PAGE_TITLE} subtitle={STATIC_TEXT.PAGE_SUBTITLE} />

      {isLoading && <div className="sub-state-message">Loading invoice…</div>}

      {error && (
        <div className="sub-state-message sub-state-message--error">
          {error}
          <div>
            <button className="sub-retry-btn" onClick={refetch}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && invoice && (
        <>
          <BillingDetailsBar orderId={invoice.orderId}>
            <InvoiceActions onPrint={handlePrint} onDownload={handleDownload} />
          </BillingDetailsBar>

          <InvoiceCard invoice={invoice} />
        </>
      )}
    </div>
  );
}
