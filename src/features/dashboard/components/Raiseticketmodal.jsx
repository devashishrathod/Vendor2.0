import { useState } from "react";

// ─── Raise Ticket Modal ─────────────────────────────────────────────────
// Order Detail page ke "Create Ticket" button se open hota hai.
// User bata sakta hai ticket kis section(s) se related hai (multi-select
// chips — Billing Info / Purchase Summary / Payment Info / Customer Info /
// Transaction Info), phir problem describe karke submit karta hai.
//
// Usage:
//   <RaiseTicketModal
//     open={ticketModalOpen}
//     onClose={() => setTicketModalOpen(false)}
//     onSubmit={(payload) => { ... }}   // optional, payload = { categories, description }
//   />

const CATEGORIES = [
  "Billing Info",
  "Purchase Summary",
  "Payment Info",
  "Customer Info",
  "Transaction Info",
];

export default function RaiseTicketModal({ open, onClose, onSubmit }) {
  const [selected, setSelected] = useState(new Set());
  const [description, setDescription] = useState("");

  if (!open) return null;

  const toggleCategory = (cat) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleClose = () => {
    setSelected(new Set());
    setDescription("");
    onClose?.();
  };

  const handleSubmit = () => {
    onSubmit?.({ categories: Array.from(selected), description });
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-bold tracking-[0.15em] text-gray-900">RAISE TICKET</h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 hover:bg-black text-white flex-shrink-0"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Category chips */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="flex items-center gap-2 text-xs font-semibold text-white bg-emerald-700 rounded-full px-4 py-2">
              Selected
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-emerald-700 text-[10px] font-bold">
                {selected.size}
              </span>
            </span>

            {CATEGORIES.map((cat) => {
              const isSelected = selected.has(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs font-semibold rounded-full px-4 py-2 border transition-colors ${
                    isSelected
                      ? "border-emerald-600 text-gray-900 bg-white"
                      : "border-gray-200 text-gray-700 bg-white hover:border-gray-300"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="DESCRIBE THE PROBLEM"
            className="w-full h-64 resize-none bg-gray-100 rounded-xl px-4 py-4 text-xs font-semibold tracking-[0.1em] text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            className="w-full bg-gray-900 hover:bg-black text-white text-sm font-bold tracking-wide rounded-xl py-3.5"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}