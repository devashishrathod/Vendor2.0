import { useState } from "react";

/**
 * PromoCodePanel
 * The "have a code? apply here" entry prompt — only rendered by
 * OrderSummary while no code is applied yet. `onApply(code)` is async: it
 * re-runs POST /transactions/subscribe/preview with `promoCode` set and
 * the parent swaps in whatever the server returns (a "Trydood Discount"
 * row, updated payable amount, etc.). Once applied, OrderSummary shows the
 * code + a Remove control directly under that discount row instead of
 * here — see SummaryRow's `sub` prop.
 */
export default function PromoCodePanel({ onApply, applying, error }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const handleApply = () => {
    const key = code.trim().toUpperCase();
    if (!key) return;
    onApply(key);
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Have a promo code?
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          {open ? "Hide" : "Apply Here"}
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Have a promo code? Type here"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
            <button
              onClick={handleApply}
              disabled={applying}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? "Applying…" : "Apply"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setCode("");
              }}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
}
