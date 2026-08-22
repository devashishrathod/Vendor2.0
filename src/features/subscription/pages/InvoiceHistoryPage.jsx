import React from 'react';
import { useInvoiceHistory } from '../hooks/useInvoiceHistory';
import { InvoicePageHeader } from '../components/InvoicePageHeader';
import InvoiceHistoryTable from '../components/InvoiceHistoryTable';
import '../components/invoice.css';

export default function InvoiceHistoryPage() {
  const { invoices, isLoading, error, refetch } = useInvoiceHistory();

  return (
    <div className="inv-page">
      <InvoicePageHeader
        title="Purchase History"
        subtitle="All past subscription purchases and their invoices."
      />

      {isLoading && <div className="sub-state-message">Loading history…</div>}

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

      {!isLoading && !error && <InvoiceHistoryTable invoices={invoices} />}
    </div>
  );
}
