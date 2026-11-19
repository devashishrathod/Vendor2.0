import { BRANCHES } from "@/features/onboarding-v2/config/onboardingFlow";
import { ENTITY_VALUES, PRIMARY_ENTITY_TYPES } from "@/features/onboarding-v2/constants/onboardingOptions";

// Corrections for a rejected brand, following the onboarding v2 rules.
// Everything is read from the saved brand record (GET /brands/get, API doc
// #31), not the wizard's local store — that's often empty by now.

/**
 * The onboarding path the brand is on.
 * @param {object|null} brand - brands/get `data`
 * @returns {string} a BRANCHES value
 */
export function brandBranch(brand) {
  if (brand?.businessRegistrationStatus === "UNREGISTERED") return BRANCHES.UNREGISTERED;
  return brand?.gst?.gstNumber ? BRANCHES.GST : BRANCHES.REG_NO_GST;
}

export const BRANCH_LABELS = {
  [BRANCHES.GST]: "Registered with GST",
  [BRANCHES.REG_NO_GST]: "Registered, no GST",
  [BRANCHES.UNREGISTERED]: "Not registered",
};

/** Business status dropdown options. */
export const STATUS_OPTIONS = Object.entries(BRANCH_LABELS).map(([value, label]) => ({ value, label }));

/** The backend only knows REGISTERED / UNREGISTERED ("no GST" is REGISTERED without a GST record). */
export const registrationStatusOf = (branch) => (branch === BRANCHES.UNREGISTERED ? "UNREGISTERED" : "REGISTERED");

/**
 * Same rule as the wizard (utils/statusLock.js): business status locks once
 * that path's verification is saved — the GST record on the GST path, the
 * PAN on the others.
 * @param {object|null} brand @param {string} branch
 */
export function isStatusLocked(brand, branch) {
  if (branch === BRANCHES.GST) return Boolean(brand?.gst?.gstNumber);
  return Boolean(brand?.pan?.pan);
}

/** A reference field may come back as an id or a populated `{ _id }`. */
export const idOf = (value) => String((value && typeof value === "object" ? value._id ?? value.id : value) ?? "");

/** Whether a value is one of the wizard's 5 business entities. @param {string|null|undefined} value */
export const isPickableEntity = (value) => ENTITY_VALUES.includes(value);

/** Dropdown options: the wizard's 5 entities with their full description. */
export const ENTITY_OPTIONS = PRIMARY_ENTITY_TYPES.map((t) => ({ value: t.value, label: `${t.label} — ${t.description}` }));

/** "Pvt. Ltd. — Private limited company" for a saved value. @param {string|null|undefined} value */
export const entityFullLabel = (value) => ENTITY_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "";

// update-basic-details accepts a legal name of 3–120 characters (API doc #27).
const LEGAL_NAME_MIN = 3;

/** @param {string|null|undefined} name */
export const isSavableLegalName = (name) => (name || "").trim().length >= LEGAL_NAME_MIN;
