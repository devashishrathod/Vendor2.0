export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatJoinedDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
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
