// ─────────────────────────────────────────────────────────────────────────────
// utils/priceCalculator.js
// ─────────────────────────────────────────────────────────────────────────────

// The subscription API doesn't send a GST rate yet — using a fixed default
// until the backend exposes one per plan. Swap this out (or read
// `plan.igstRate` if you add it server-side) once that's available.
export const DEFAULT_IGST_RATE = 0.18; // 18%

/**
 * NaN-safe INR formatter. Anything non-numeric renders as 0.00 instead of
 * "NaN" so a bad/missing field never leaks into the UI as text.
 */
export const formatINR = (n) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹ ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(safe)}`;
};

/**
 * @param {{ price?: number, igstRate?: number }} plan - normalized plan object
 * @param {number} promoDiscountPct - 0-100, applied before tax
 * @returns {{ billValue:number, promoSaving:number, igst:number, totalPayable:number, totalSaved:number, igstRate:number }}
 */
export function calculateOrderTotals(plan, promoDiscountPct = 0) {
  const billValue = Number(plan?.price) || 0;
  const igstRate = Number(plan?.igstRate) || DEFAULT_IGST_RATE;
  const pct = Number(promoDiscountPct) || 0;

  const promoSaving = (billValue * pct) / 100;
  const discountedBill = billValue - promoSaving;
  const igst = discountedBill * igstRate;
  const totalPayable = discountedBill + igst;
  const totalSaved = promoSaving;

  return { billValue, promoSaving, igst, totalPayable, totalSaved, igstRate };
}