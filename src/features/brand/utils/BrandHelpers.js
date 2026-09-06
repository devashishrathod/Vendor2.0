// BrandHelpers.js
// Small, pure helper functions & shared constants used across the Brand Page feature.

// Tabs shown in the Brand Page nav bar.
export const BRAND_TABS = [
  { id: "brand-profile", label: "Brand Profile" },
  { id: "description", label: "Description" },
  { id: "showcase-details", label: "Showcase Details" },
  { id: "bank-account-details", label: "Bank Account Details" },
  { id: "listing-features", label: "Listing Features" },
  { id: "business-hours", label: "Business Hours" },
  { id: "gst-pan-information", label: "GST & PAN Information" },
  { id: "scan-qr-code", label: "Scan QR Code" },
];

/**
 * Formats a raw mobile number string into a consistent "+91 XXXXXXXXXX" style.
 * Falls back to the raw value if it doesn't look like a plain digit string.
 */
export const formatMobileNumber = (value = "") => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2)}`;
  }
  return value;
};

/**
 * Lowercases + trims an email for consistent display/comparison.
 */
export const normalizeEmail = (email = "") => email.trim().toLowerCase();

/**
 * Returns initials from a brand name, e.g. "Yoga Education And Research" -> "YE"
 */
export const getBrandInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const initials = words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return initials;
};

/**
 * Lets one DOM node serve as multiple React refs at once (e.g. dnd-kit's
 * `ref` and `handleRef` on the same element), so a whole element can be
 * both the sortable boundary and the drag handle instead of needing a
 * separate dedicated handle icon.
 */
export function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((r) => {
      if (typeof r === "function") r(node);
      else if (r) r.current = node;
    });
  };
}

/**
 * Ref callback for any element (e.g. a button/menu) nested inside a dnd-kit
 * drag handle that must stay independently clickable — dnd-kit's own
 * pointerdown listener is a real `addEventListener` sitting directly on the
 * handle's DOM node, which fires during the native BUBBLE phase, and it
 * activates a drag immediately on a mouse press with no movement threshold
 * at all once the event reaches it. Two things that do NOT work here:
 *   - `onPointerDown={(e) => e.stopPropagation()}` — that's a bubble-phase
 *     stop too, so it runs at the same time as (and racing against) dnd-kit's
 *     own listener, too late to reliably win.
 *   - passing `preventActivation` to `useSortable(...)` — dnd-kit only reads
 *     that option from a sensor DESCRIPTOR in its `sensors` array, not from
 *     arbitrary useSortable props, so it's silently ignored there.
 * A CAPTURE-phase listener is the one thing guaranteed to run before dnd-kit
 * sees the event at all, since the full capture phase (root -> target)
 * always completes before the bubble phase (target -> root) even begins.
 */
export function noDragRef(node) {
  if (!node) return undefined;
  const stop = (e) => e.stopPropagation();
  node.addEventListener("pointerdown", stop, { capture: true });
  return () => node.removeEventListener("pointerdown", stop, { capture: true });
}

/**
 * Basic validation used before submitting brand profile edits.
 * Returns an object of { fieldName: errorMessage } — empty object means valid.
 */
export const validateBrandProfile = (profile = {}) => {
  const errors = {};

  if (!profile.brandName || !profile.brandName.trim()) {
    errors.brandName = "Brand name is required.";
  }
  if (!profile.shortName || !profile.shortName.trim()) {
    errors.shortName = "Short name is required.";
  }
  if (!profile.mailId || !/^\S+@\S+\.\S+$/.test(profile.mailId)) {
    errors.mailId = "A valid email address is required.";
  }
  if (!profile.mobileNo || profile.mobileNo.replace(/\D/g, "").length < 10) {
    errors.mobileNo = "A valid mobile number is required.";
  }

  return errors;
};