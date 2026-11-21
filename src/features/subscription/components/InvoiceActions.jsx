import { DownloadIcon } from './icons';

/**
 * Print (browser print dialog, scoped to `.inv-print-area` by invoice.css)
 * and Download. Download opens the real invoice PDF from
 * POST /transactions/invoice/regenerate (`invoiceUrl`); it's disabled until
 * that URL is known.
 */
export default function InvoiceActions({ onPrint, invoiceUrl }) {
  return (
    <div className="inv-actions">
      <button type="button" className="inv-action-btn" onClick={onPrint}>
        Print Out
      </button>
      {invoiceUrl ? (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inv-action-btn inv-action-btn--icon-only"
          aria-label="Download invoice PDF"
          title="Download PDF"
        >
          <DownloadIcon />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="inv-action-btn inv-action-btn--icon-only cursor-not-allowed opacity-40"
          aria-label="Invoice PDF not available yet"
          title="PDF not available yet"
        >
          <DownloadIcon />
        </button>
      )}
    </div>
  );
}
