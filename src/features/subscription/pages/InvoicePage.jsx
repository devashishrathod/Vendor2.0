import { useSubscription } from '../hooks/useSubscription';
import { useInvoice } from '../hooks/useInvoice';
import { InvoicePageHeader, BillingDetailsBar } from '../components/InvoicePageHeader';
import InvoiceActions from '../components/InvoiceActions';
import InvoiceCard from '../components/InvoiceCard';
import { STATIC_TEXT } from '../constants/subscription.constants';
import '../components/invoice.css';

/** Standalone page for the current subscription's tax invoice. */
export default function InvoicePage() {
  const { subscription, isLoading: subLoading, error: subError } = useSubscription();
  const { invoice, isLoading, error, refetch } = useInvoice(subscription?.invoice);

  return (
    <div className="inv-page">
      <InvoicePageHeader title={STATIC_TEXT.PAGE_TITLE} subtitle={STATIC_TEXT.PAGE_SUBTITLE} />

      {subLoading && <div className="sub-state-message">Loading invoice…</div>}
      {subError && <div className="sub-state-message sub-state-message--error">{subError}</div>}

      {error && (
        <div className="sub-state-message sub-state-message--error">
          Couldn't fetch the invoice number / PDF: {error}
          <div>
            <button className="sub-retry-btn" onClick={refetch}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {invoice && (
        <>
          <BillingDetailsBar orderId={invoice.transactionId}>
            <InvoiceActions onPrint={() => window.print()} invoiceUrl={invoice.invoiceUrl} />
          </BillingDetailsBar>
          <InvoiceCard invoice={invoice} numberStatus={isLoading ? 'loading' : error ? 'error' : null} />
        </>
      )}
    </div>
  );
}
