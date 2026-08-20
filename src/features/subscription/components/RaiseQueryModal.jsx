import React, { useState } from 'react';
import Modal from './Modal';
import { CloseIcon, CheckCircleIcon } from './icons';
import { useRaiseQuery } from '../hooks/useRaiseQuery';

const CATEGORIES = ['Billing', 'Subscription', 'Technical Issue', 'Refund', 'Other'];

export default function RaiseQueryModal({ open, onClose, orderId }) {
  const { submit, reset, isSubmitting, error, ticket } = useRaiseQuery();
  const [form, setForm] = useState({ category: CATEGORIES[0], subject: '', description: '' });

  const handleClose = () => {
    reset();
    setForm({ category: CATEGORIES[0], subject: '', description: '' });
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submit({ ...form, orderId });
  };

  return (
    <Modal open={open} onClose={handleClose} ariaLabel="Raise a query" widthVariant="narrow">
      <div className="inv-modal__header">
        <h3>Raise Query</h3>
        <button className="inv-modal__close" onClick={handleClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      {ticket ? (
        <div className="inv-query-success">
          <CheckCircleIcon width={36} height={36} />
          <h4>Query submitted</h4>
          <p>
            Your ticket <strong>#{ticket.ticketId}</strong> has been raised. Our support team
            will get back to you shortly.
          </p>
          <button type="button" className="inv-action-btn" onClick={handleClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="inv-query-form">
          {orderId && (
            <p className="inv-query-order-tag">
              Regarding order <strong>{orderId}</strong>
            </p>
          )}

          <label className="inv-query-field">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="inv-query-field">
            <span>Subject</span>
            <input
              type="text"
              placeholder="Briefly describe the issue"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              required
            />
          </label>

          <label className="inv-query-field">
            <span>Description</span>
            <textarea
              rows={5}
              placeholder="Add any details that will help us help you"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </label>

          {error && <p className="inv-query-error">{error}</p>}

          <button type="submit" className="sub-upgrade-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit Query'}
          </button>
        </form>
      )}
    </Modal>
  );
}
