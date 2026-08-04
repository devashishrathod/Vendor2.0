export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatJoinedDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function maskStoreId(id) {
  return `#${id}`;
}
