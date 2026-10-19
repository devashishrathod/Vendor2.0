import { OUTLET_STATUS, OUTLET_TYPES } from "../constants/outletConstants";

/**
 * Which storefront awning colors an outlet gets: green for an own outlet,
 * amber for a franchise, grey when the outlet isn't active.
 * @param {{ status: string, outletType: string }} outlet
 * @returns {"own" | "franchise" | "closed"}
 */
export function getAwningVariant(outlet) {
  if (outlet?.status !== OUTLET_STATUS.ACTIVE) return "closed";
  return outlet?.outletType === OUTLET_TYPES.FRANCHISE ? "franchise" : "own";
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatJoinedDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * "2026-10-06T…" → "06 Oct 2026" (compact form for outlet cards).
 * @param {string} dateStr
 * @returns {string}
 */
export function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr || "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * "MYNTRA" / "myntra" / "big bazaar" → "Myntra" / "Big Bazaar".
 * @param {string} text
 * @returns {string}
 */
export function toTitleCase(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/(^|[\s\-(/])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

export function maskStoreId(id) {
  return `#${id}`;
}
