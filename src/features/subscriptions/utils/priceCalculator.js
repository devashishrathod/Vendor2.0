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

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], n % 10 ? ONES[n % 10] : ""].filter(Boolean).join(" ");
}

function threeDigitsToWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return [hundred ? `${ONES[hundred]} Hundred` : "", rest ? twoDigitsToWords(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/**
 * Converts a whole-rupee amount to Indian-numbering words (crore/lakh/
 * thousand), e.g. 1999 -> "One Thousand Nine Hundred Ninety Nine". Paise
 * are dropped — every amount shown here is a whole rupee value.
 */
export function amountToWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  return [
    crore ? `${threeDigitsToWords(crore)} Crore` : "",
    lakh ? `${threeDigitsToWords(lakh)} Lakh` : "",
    thousand ? `${threeDigitsToWords(thousand)} Thousand` : "",
    rest ? threeDigitsToWords(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The subscription list endpoint sends the plan's pre-discount `price`
 * plus either a flat `discountAmount` or a `discountPercent` (selected by
 * `discountType`) — never a ready-made "already discounted" total. This
 * computes the actual amount to display/charge from those raw fields.
 * `strikePrice` (when the backend sets one above the computed price) is a
 * separate, optional higher "was" reference — not used here.
 */
export function computeEffectivePrice(plan) {
  const price = Number(plan?.price) || 0;
  const discountPercent = Number(plan?.discountPercent) || 0;
  const discountAmount = Number(plan?.discountAmount) || 0;

  if (plan?.discountType === "PERCENT" && discountPercent > 0) {
    return Math.max(0, price - (price * discountPercent) / 100);
  }
  if (discountAmount > 0) {
    return Math.max(0, price - discountAmount);
  }
  return price;
}

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