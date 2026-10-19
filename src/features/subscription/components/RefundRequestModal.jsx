import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, X } from 'lucide-react';
import Select from '@/components/common/Select';
import { REFUND_REASONS } from '../constants/subscription.constants';
import { requestSubscriptionRefund } from '../services/subscriptionService';
import { formatCurrencyINR } from '../utils/formatters';

const MIN_NOTE_LENGTH = 10;

function AmountRow({ label, value, muted = false, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-xs ${muted ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
      <span
        className={
          strong
            ? 'text-base font-extrabold text-emerald-600 dark:text-emerald-400'
            : `text-sm font-semibold ${muted ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Request Refund modal for the current subscription. Shows the refund
 * breakdown (full paid amount minus GST), a reason dropdown, a details box
 * (required for "Other"), and an acknowledgement checkbox before the
 * Confirm button enables.
 *
 * @param {{ subscription: object, onClose: () => void, onRefunded?: () => void }} props
 */
export default function RefundRequestModal({ subscription, onClose, onRefunded }) {
  const { planName, orderId, paidAmount, gstAmount, gstPercentage, refundableAmount } = subscription;

  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const noteRequired = reason === 'OTHER';
  const noteValid = !noteRequired || note.trim().length >= MIN_NOTE_LENGTH;
  const canSubmit = !!reason && noteValid && acknowledged && refundableAmount != null && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError('');
      await requestSubscriptionRefund({
        transactionId: orderId,
        amount: refundableAmount,
        reason,
        note: note.trim() || undefined,
      });
      setDone(true);
      onRefunded?.();
    } catch (err) {
      console.error('Subscription refund request failed:', err);
      setError(err.message || 'Failed to request refund. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    if (!loading) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={close}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
              <RotateCcw size={16} className="text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {done ? 'Refund Requested' : 'Request Refund'}
            </h3>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {done ? (
          <div className="px-6 pb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Your refund request of <strong>{formatCurrencyINR(refundableAmount)}</strong> has been submitted.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            <p className="text-xs text-gray-400 mb-4">
              You're requesting a full refund for your <strong className="capitalize text-gray-600 dark:text-gray-300">{planName}</strong> plan.
              GST is non-refundable.
            </p>

            <div className="space-y-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 p-4">
              <AmountRow label="Amount paid" value={formatCurrencyINR(paidAmount)} />
              <AmountRow
                label={`GST${gstPercentage != null ? ` (${gstPercentage}%)` : ''} · non-refundable`}
                value={gstAmount != null ? `− ${formatCurrencyINR(gstAmount)}` : '—'}
                muted
              />
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2.5">
                <AmountRow
                  label="Refund amount"
                  value={refundableAmount != null ? formatCurrencyINR(refundableAmount) : '—'}
                  strong
                />
              </div>
            </div>

            <label className="mt-5 block text-xs font-semibold text-gray-900 dark:text-gray-100">
              Reason for refund <span className="text-red-400">*</span>
            </label>
            <div className="mt-1.5">
              <Select
                value={reason}
                onChange={setReason}
                options={REFUND_REASONS}
                placeholder="Select a reason"
                className="bg-emerald-50 dark:bg-emerald-500/10 text-gray-800 dark:text-gray-100"
              />
            </div>

            <label className="mt-4 block text-xs font-semibold text-gray-900 dark:text-gray-100">
              Details {noteRequired ? <span className="text-red-400">*</span> : <span className="font-normal text-gray-400">(optional)</span>}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell us a bit more about why you're requesting a refund"
              className="mt-1.5 w-full resize-none no-scrollbar rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-500/30"
            />
            {noteRequired && !noteValid && (
              <p className="mt-1 text-[11px] text-red-500">Please add at least {MIN_NOTE_LENGTH} characters.</p>
            )}

            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <label className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                I understand my subscription and its features will end once the refund is processed, and GST will not be refunded.
              </label>
            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Submitting…' : 'Confirm Refund'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
