import {
  buildLocationPayloadFromPlace,
  hasValidCoordinates,
  hasValidZipcode,
} from "@/features/oulet/New folder/services/locationApi";
import { DEFAULT_WORKING_HOURS, WEEK_DAYS } from "@/features/oulet/New folder/constants/brandOutletConstants";

/** `verificationState` from GET /subBrands/get-all (API doc #35 note 5). */
export const OUTLET_STATES = Object.freeze({ NEVER_VERIFIED: "NEVER_VERIFIED", VERIFIED: "VERIFIED", REVERIFY: "REVERIFY" });

export const OUTLET_TYPES = Object.freeze({ OUTLET: "OUTLET", FRANCHISE: "FRANCHISE" });

/** A manager who has given the code — location and hours can be saved. */
export const isOutletVerified = (outlet) => outlet?.verificationState !== OUTLET_STATES.NEVER_VERIFIED;

export const MOBILE_FORMAT = /^[6-9]\d{9}$/;

/**
 * `continue` on OUTLET_DETAILS → 422 `missing` codes (API doc #23g):
 * OUTLET, OUTLET_NOT_VERIFIED:<id>, OUTLET_LOCATION:<id>, OUTLET_WORK_HOURS:<id>.
 * @param {string[]} missing
 * @returns {{ noOutlet: boolean, byOutlet: Record<string, { verify?: boolean, location?: boolean, hours?: boolean }> }}
 */
export function parseOutletMissing(missing = []) {
  const byOutlet = {};
  let noOutlet = false;
  const KIND = { OUTLET_NOT_VERIFIED: "verify", OUTLET_LOCATION: "location", OUTLET_WORK_HOURS: "hours" };
  missing.forEach((code) => {
    if (code === "OUTLET") {
      noOutlet = true;
      return;
    }
    const [prefix, id] = String(code).split(":");
    if (!KIND[prefix] || !id) return;
    byOutlet[id] = { ...(byOutlet[id] ?? {}), [KIND[prefix]]: true };
  });
  return { noOutlet, byOutlet };
}

/** Saved hours (or all closed) in the editor's `{ monday: { start, end, isOpen } … }` shape. */
export function hoursFromServer(workHours) {
  if (!workHours) return { ...DEFAULT_WORKING_HOURS };
  return Object.fromEntries(
    WEEK_DAYS.map(({ key }) => {
      const day = workHours[key] ?? {};
      return [key, { isOpen: Boolean(day.isOpen), start: day.start || "09:00", end: day.end || "18:00" }];
    }),
  );
}

/**
 * Checks hours before /workHours/upsert: at least one open day, and each open
 * day starts before it ends (24-hour HH:mm compares as text).
 * @returns {string} a message, or "" when fine
 */
export function hoursProblem(hours) {
  const open = WEEK_DAYS.filter(({ key }) => hours[key]?.isOpen);
  if (open.length === 0) return "Open the outlet on at least one day.";
  const bad = open.find(({ key }) => !(hours[key].start < hours[key].end));
  return bad ? `${bad.label}: the opening time must be before the closing time.` : "";
}

/** Closed days are sent as `{ isOpen: false }` only. */
export const hoursPayload = (hours) =>
  Object.fromEntries(WEEK_DAYS.map(({ key }) => [key, hours[key]?.isOpen ? { isOpen: true, start: hours[key].start, end: hours[key].end } : { isOpen: false }]));

/**
 * A picked Google place → POST /locations/create body for this outlet, or a
 * message when the place can't be saved (no coordinates / PIN code).
 * @returns {{ payload?: object, problem?: string }}
 */
export function outletLocationFromPlace(place, subBrandId) {
  const payload = buildLocationPayloadFromPlace(place, {
    subBrandId,
    addressType: "WORK",
    isBrandAddress: false,
    isSubBrandAddress: true,
  });
  if (!hasValidCoordinates(payload)) return { problem: "This place has no map position — pick it again from the list." };
  if (!hasValidZipcode(payload)) return { problem: "This result has no PIN code — pick a more exact address from the list." };
  return { payload };
}

/** One line for a saved location. */
export const locationText = (loc) =>
  loc ? loc.formattedAddress || [loc.addressLine1, loc.addressLine2, loc.city, loc.state, loc.zipcode].filter(Boolean).join(", ") : "";

/**
 * The GST address as one line, for the search box prefill. The server's
 * `addressLine1` can already hold the whole address — don't repeat its parts.
 */
export function gstAddressText(gst) {
  if (!gst) return "";
  const line1 = gst.addressLine1 ?? "";
  const rest = [gst.city, gst.state, gst.zipcode].filter((part) => part && !line1.includes(part));
  return [line1, ...rest].filter(Boolean).join(", ");
}
