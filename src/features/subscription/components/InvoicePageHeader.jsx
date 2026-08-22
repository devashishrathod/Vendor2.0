import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';

export function InvoicePageHeader({ title, subtitle }) {
  const navigate = useNavigate();

  return (
    <div className="inv-top-header">
      <button
        type="button"
        className="inv-back-btn"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <ArrowLeftIcon />
      </button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export function BillingDetailsBar({ orderId, children }) {
  return (
    <div className="inv-billing-bar">
      <h2>Billing Details Order ID: {orderId}</h2>
      <div className="inv-billing-bar__actions">{children}</div>
    </div>
  );
}
