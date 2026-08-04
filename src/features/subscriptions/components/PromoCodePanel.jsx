import { useState } from "react";
import { VALID_PROMO_CODES } from "../constants/plans"; // swap for a validate-promo API later

export default function PromoCodePanel({ appliedCode, onApply, onRemove }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleApply = () => {
    const key = code.trim().toUpperCase();
    const pct = VALID_PROMO_CODES[key];
    if (pct) {
      onApply(key, pct);
      setCode("");
      setError("");
      setOpen(false);
    } else {
      setError("Invalid promo code. Please try again.");
    }
  };

  const handleRemove = () => {
    onRemove();
    setCode("");
    setError("");
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Have a promo code?
        </span>
        {!appliedCode && (
          <button
            onClick={() => {
              setOpen((v) => !v);
              setError("");
            }}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            {open ? "Hide" : "Apply Here"}
          </button>
        )}
      </div>

      {open && !appliedCode && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Have a promo code? Type here"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
            <button
              onClick={handleApply}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setError("");
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
