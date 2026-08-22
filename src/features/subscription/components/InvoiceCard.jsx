import React from 'react';
import BrandLogo from './BrandLogo';
import { CheckCircleIcon } from './icons';
import { formatCurrencyINR, formatDateLong } from '../utils/formatters';

export default function InvoiceCard({ invoice }) {
  const { invoiceNumber, invoiceDate, amount, paymentStatus, billFrom, billTo } = invoice;

  return (
    <div className="inv-card inv-print-area">
      <div className="inv-card__top">
        <div>
          <BrandLogo name={billFrom.companyName.split(' ').slice(0, 2).join(' ')} />
          <a href="#create" className="inv-create-link" onClick={(e) => e.preventDefault()}>
            Create Invoice
          </a>
        </div>
        <div className="inv-card__meta">
          <h2>Tax Invoice</h2>
          <p>Invoice No: #{invoiceNumber}</p>
          <p>Date: {formatDateLong(invoiceDate)}</p>
        </div>
      </div>

      <div className="inv-payment-banner">
        <span className="inv-payment-banner__amount">{formatCurrencyINR(amount)}</span>
        <span className="inv-payment-banner__status">
          <CheckCircleIcon width={22} height={22} />
          {paymentStatus === 'SUCCESS' ? 'Payment Successful' : 'Payment Pending'}
        </span>
      </div>

      <div className="inv-bill-grid">
        <BillBlock heading="Bill From" party={billFrom} />
        <BillBlock heading="Bill To" party={billTo} />
      </div>

      {invoice.lineItems?.length > 0 && (
        <div className="inv-line-items">
          {invoice.lineItems.map((item, idx) => (
            <div className="inv-line-item" key={idx}>
              <span>{item.label}</span>
              <span>{formatCurrencyINR(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BillBlock({ heading, party }) {
  return (
    <div>
      <p className="inv-bill-heading">{heading}</p>
      <p className="inv-bill-company">{party.companyName}</p>
      <p className="inv-bill-line">
        <strong>Registered Address:</strong> {party.address}
      </p>
      <p className="inv-bill-line">
        <strong>GSTIN:</strong> {party.gstin}
      </p>
      <p className="inv-bill-line">
        <strong>PAN:</strong> {party.pan}
      </p>
    </div>
  );
}
