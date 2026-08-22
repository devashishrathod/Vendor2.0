import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrencyINR, formatDateLong } from '../utils/formatters';
import { buildInvoiceRoute } from '../constants/subscription.constants';

/**
 * `onViewInvoice(orderId)` is optional — pass it when this table is used
 * inside a modal (e.g. InvoiceHistoryModal) so "View Invoice" opens a
 * nested InvoiceModal instead of navigating away. Without it, each row
 * falls back to a real route link (for the standalone history page).
 */
export default function InvoiceHistoryTable({ invoices, onViewInvoice }) {
  if (!invoices?.length) {
    return <p style={{ color: '#6b7280', fontSize: 14 }}>No purchase history yet.</p>;
  }

  return (
    <div className="inv-history-table-wrap">
      <table className="inv-history-table">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Plan</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((row) => (
            <tr key={row.orderId}>
              <td>#{row.invoiceNumber}</td>
              <td>{row.planName}</td>
              <td>{formatDateLong(row.date)}</td>
              <td>{formatCurrencyINR(row.amount)}</td>
              <td>
                <span className="inv-status-pill">
                  {row.status === 'SUCCESS' ? 'Success' : row.status}
                </span>
              </td>
              <td>
                {onViewInvoice ? (
                  <button
                    type="button"
                    className="inv-history-link-btn"
                    onClick={() => onViewInvoice(row.orderId)}
                  >
                    View Invoice
                  </button>
                ) : (
                  <Link to={buildInvoiceRoute(row.orderId)}>View Invoice</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
