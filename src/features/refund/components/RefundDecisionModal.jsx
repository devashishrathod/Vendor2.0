import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { approveRefund, rejectRefund } from "../services/refundService";

const formatINR = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Approve / Reject modal for one refund request.
 * Approve → PATCH /refunds/:id/approve { approvedAmount, note }
 * Reject  → PATCH /refunds/:id/reject  { note }
 * @param {{ mode: "approve"|"reject", row: Object, onClose: Function, onDone: Function }} props
 */
export default function RefundDecisionModal({ mode, row, onClose, onDone }) {
  const isApprove = mode === "approve";
  const requested = Number(row.raw?.requestedAmount || 0);

  const [amount, setAmount] = useState(String(requested));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const amountNum = Number(amount);
  const amountInvalid = isApprove && (!amount || Number.isNaN(amountNum) || amountNum <= 0 || amountNum > requested);
  const noteMissing = !isApprove && !note.trim();
  const disabled = submitting || amountInvalid || noteMissing;

  const handleSubmit = async () => {
    if (disabled) return;
    setError("");
    try {
      setSubmitting(true);
      if (isApprove) {
        await approveRefund(row.refundId, { approvedAmount: amountNum, note: note.trim() });
      } else {
        await rejectRefund(row.refundId, { note: note.trim() });
      }
      onDone(isApprove ? "Refund approved successfully." : "Refund rejected successfully.");
    } catch (err) {
      console.error(`Refund ${mode} failed:`, err.message);
      setError(err.message || `Failed to ${mode} refund.`);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isApprove
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isApprove ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {isApprove ? "Approve Refund" : "Reject Refund"}
              </h3>
              <p className="text-xs text-gray-400">Claim {row.claimCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Requested Amount</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{row.requestedAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Reason</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{row.reason}</span>
          </div>
          {row.reasonNote && (
            <p className="text-gray-500 dark:text-gray-400 pt-1">“{row.reasonNote}”</p>
          )}
        </div>

        {isApprove && (
          <label className="block mb-3">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Approved Amount (₹)</span>
            <input
              type="number"
              min="1"
              max={requested}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <span className={`mt-1 block text-[11px] ${amountInvalid ? "text-rose-500" : "text-gray-400"}`}>
              Enter up to {formatINR(requested)} — less than that is a partial refund.
            </span>
          </label>
        )}

        <label className="block mb-4">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Note {isApprove ? "(optional)" : ""}
          </span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isApprove ? "e.g. Only the starter was wrong." : "Why is this refund being rejected?"}
            className="mt-1 w-full resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        {error && (
          <p className="mb-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-500/15 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${
              isApprove ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {submitting ? "Please wait..." : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
