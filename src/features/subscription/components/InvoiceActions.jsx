import React from 'react';
import { PrintIcon, DownloadIcon } from './icons';

/**
 * `onPrint` defaults to the browser print dialog (scoped to the page via
 * the `.inv-print-area` CSS class + print media query in invoice.css).
 * `onDownload` defaults to downloading a plain-text summary of the invoice
 * as a quick, dependency-free stand-in — swap it for a real PDF export
 * (e.g. hitting a backend endpoint that returns a PDF blob) when ready.
 */
export default function InvoiceActions({ onPrint, onDownload }) {
  return (
    <div className="inv-actions">
      <button type="button" className="inv-action-btn" onClick={onPrint}>
        Print Out
      </button>
      <button
        type="button"
        className="inv-action-btn inv-action-btn--icon-only"
        onClick={onDownload}
        aria-label="Download invoice"
      >
        <DownloadIcon />
      </button>
    </div>
  );
}

export function buildDownloadHandler(invoice) {
  return () => {
    if (!invoice) return;
    const content = [
      `TAX INVOICE`,
      `Invoice No: #${invoice.invoiceNumber}`,
      `Date: ${invoice.invoiceDate}`,
      `Amount: Rs. ${invoice.amount}`,
      ``,
      `Bill From: ${invoice.billFrom.companyName}`,
      invoice.billFrom.address,
      `GSTIN: ${invoice.billFrom.gstin}  PAN: ${invoice.billFrom.pan}`,
      ``,
      `Bill To: ${invoice.billTo.companyName}`,
      invoice.billTo.address,
      `GSTIN: ${invoice.billTo.gstin}  PAN: ${invoice.billTo.pan}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
}
