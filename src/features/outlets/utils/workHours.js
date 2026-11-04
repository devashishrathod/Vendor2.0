// Shared working-hours helpers for the outlet screens (Add Outlet step 3,
// Edit Outlet, and the Working Hours card's own edit modal). Shape on the
// wire is POST /workHours/upsert's (vendor doc #37): top-level day keys
// { monday..sunday: { start, end, isOpen } }.
import {
  WEEK_DAYS,
  DEFAULT_WORKING_HOURS,
} from "@/features/oulet/New folder/constants/brandOutletConstants";

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * A subBrand doc's embedded `workHours` (or nothing) → the editor shape.
 * Days missing on the server fall back to the onboarding default
 * (closed, 09:00–18:00).
 * @param {object|null} workHours
 * @returns {object}
 */
export function toEditorHours(workHours) {
  return WEEK_DAYS.reduce((acc, { key }) => {
    const day = workHours?.[key];
    acc[key] = {
      start: day?.start || DEFAULT_WORKING_HOURS[key].start,
      end: day?.end || DEFAULT_WORKING_HOURS[key].end,
      isOpen: !!day?.isOpen,
    };
    return acc;
  }, {});
}

/**
 * Same rules POST /workHours/upsert enforces: an open day needs HH:mm start
 * + end, and start must be before end (overnight hours like 22:00 → 02:00
 * are not supported). Returns the first problem, or "".
 * @param {object} hours
 * @returns {string}
 */
export function validateHours(hours) {
  for (const { key, label } of WEEK_DAYS) {
    const day = hours[key];
    if (!day?.isOpen) continue;
    if (!HH_MM.test(day.start || "") || !HH_MM.test(day.end || "")) {
      return `${label}: set both an opening and a closing time.`;
    }
    if (day.start >= day.end) {
      return `${label}: opening time must be before closing time (overnight hours aren't supported — use 23:59).`;
    }
  }
  return "";
}

/**
 * Clean upsert body: open days carry start/end, closed days only
 * `isOpen: false` (start/end are optional for a closed day).
 * @param {object} hours
 * @returns {object}
 */
export function toPayloadHours(hours) {
  return WEEK_DAYS.reduce((acc, { key }) => {
    const day = hours[key];
    acc[key] = day?.isOpen ? { isOpen: true, start: day.start, end: day.end } : { isOpen: false };
    return acc;
  }, {});
}

/** True when at least one day is open. */
export function hasOpenDay(hours) {
  return WEEK_DAYS.some(({ key }) => hours?.[key]?.isOpen);
}
