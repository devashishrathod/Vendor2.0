// formatters.js
// Small, pure, well-tested-in-spirit helper functions. No side effects,
// no API calls — just data shaping so components stay dumb.

/**
 * Formats a number as Indian Rupees, e.g. 1999 -> "₹ 1,999.00"
 */
export function formatCurrencyINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0.00';
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹ ${formatted}`;
}

/**
 * Formats an ISO date string into DD/MM/YYYY, e.g. "2022-02-12" -> "12/02/2022"
 */
export function formatDateDMY(isoDate) {
  if (!isoDate) return '--';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '--';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formats an ISO date string into a long human form, e.g. "March 15, 2025"
 */
export function formatDateLong(isoDate) {
  if (!isoDate) return '--';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Given an expiration ISO date, returns a human string like "250 Days To Go"
 * or "Expired" if the date has already passed.
 */
export function getExpirationStatus(expirationIsoDate) {
  if (!expirationIsoDate) return '--';
  const today = new Date();
  const expiry = new Date(expirationIsoDate);
  const diffMs = expiry.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires Today';
  return `${diffDays} Days To Go`;
}

/**
 * Computes discount percentage from original vs discounted price,
 * e.g. (4000, 1999) -> "50% Off"
 */
export function getDiscountPercentageLabel(originalPrice, discountedPrice) {
  if (!originalPrice || originalPrice <= 0) return '0% Off';
  const pct = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  return `${pct}% Off`;
}
