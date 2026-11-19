// Display readers for GST / PAN verification results. They read the v2
// verify response (`details`, API doc #28 / #29) and, for the outlet /
// remediation pages still on older records (Milestone B), the old shape.
// No saving here — saves send only the verificationId (onboardingApi).

import { OWNER_ID_TYPES } from "../../constants/onboardingOptions";
import { onboardingErrorMessage } from "../../utils/errorMessages";

const clean = (value) => {
  const text = typeof value === "string" ? value.trim() : value;
  return text && text !== "NA" ? text : null;
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? clean(value) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** The mapped fields of a v2 verify result, or an older record as is. @param {object|null} record */
const fieldsOf = (record) => record?.details ?? record?.data ?? record ?? {};

/**
 * Display fields of a GST verification (verify-gst `details`).
 * @param {object|null} gstDetails
 */
export function readGstRecord(gstDetails) {
  const raw = fieldsOf(gstDetails);
  const a = raw.address || {};
  const addressParts = [a.buildingNumber, a.building_number, a.floor_number, a.building_name, a.location, a.city, a.district, a.state, a.pin]
    .map(clean)
    .filter(Boolean);
  return {
    gstNumber: clean(raw.gstNumber),
    legalName: clean(raw.legalName),
    tradeName: clean(raw.tradeName),
    constitution: clean(raw.constitutionOfBusiness),
    taxpayerType: clean(raw.taxpayerType),
    registrationDate: formatDate(raw.registrationDate),
    registrationStatus: clean(raw.registrationStatus),
    natureOfBusiness: Array.isArray(raw.natureOfBusiness) && raw.natureOfBusiness.length ? raw.natureOfBusiness.join(", ") : null,
    address: clean(gstDetails?.addressOnRecord) || [...new Set(addressParts)].join(", ") || null,
  };
}

/**
 * Whether a GST verification is an active registration — the server's
 * `isActive` (verify-gst #29).
 * @param {object|null} gstDetails
 */
export function isGstActive(gstDetails) {
  if (typeof gstDetails?.isActive === "boolean") return gstDetails.isActive;
  const status = String(fieldsOf(gstDetails).registrationStatus || "").toUpperCase();
  return status === "SUCCESS" || status === "ACTIVE";
}

// PAN 4th letter → who holds it (Income Tax "PAN holder type").
const PAN_HOLDER_TYPES = {
  P: "Individual",
  C: "Company",
  F: "Firm / LLP",
  E: "LLP",
  H: "Hindu undivided family",
  A: "Association of persons",
  B: "Body of individuals",
  T: "Trust",
  G: "Government",
  L: "Local authority",
  J: "Artificial juridical person",
};

// PAN 4th letter → suggested business entity (guide §4.6). Same rule the
// server uses for verify-pan's `suggestedEntity`; other letters suggest nothing.
const PAN_TO_ENTITY = {
  P: "PROPRIETORSHIP",
  C: "PRIVATE_LIMITED",
  F: "PARTNERSHIP",
  E: "LLP",
  T: "TRUST",
};

/**
 * The entity to suggest from a saved PAN — for the NO_GST entity screen after
 * a page refresh, when verify-pan's `suggestedEntity` is no longer in memory.
 * @param {string|null|undefined} pan
 * @returns {string|null}
 */
export const suggestedEntityFromPan = (pan) => PAN_TO_ENTITY[String(pan || "").charAt(3).toUpperCase()] ?? null;

/**
 * Display fields of a PAN verification (verify-pan `details`, `panType`).
 * @param {object|null} panDetails
 */
export function readPanRecord(panDetails) {
  const raw = fieldsOf(panDetails);
  const pan = clean(raw.pan);
  return {
    pan,
    name: clean(raw.fullName) || clean(panDetails?.nameOnRecord) || clean(raw.lastName),
    panType: (clean(panDetails?.panType) || clean(raw.panType))?.toUpperCase() ?? null,
    holderType: PAN_HOLDER_TYPES[String(pan || "").charAt(3).toUpperCase()] ?? null,
  };
}

/**
 * How the owner proved identity on the not-registered path (owner ID upload).
 * @param {object} [kyc] - form.ownerKyc (outlet review page, Milestone B)
 * @returns {{ method: string|null, detailLabel: string, detail: string|null }}
 */
export function readOwnerIdentity(kyc = {}) {
  const label = OWNER_ID_TYPES.find((t) => t.value === kyc.idType)?.label;
  return { method: label ? `${label} uploaded` : null, detailLabel: "ID file", detail: kyc.idFileName || null };
}

/** Message for a failed GST verify / save — by `details.code`, never by text. @param {unknown} err */
export const gstErrorMessage = (err) => onboardingErrorMessage(err, "Something went wrong while verifying the GSTIN. Please try again.");

/** Message for a failed PAN verify / save — by `details.code`, never by text. @param {unknown} err */
export const panErrorMessage = (err) => onboardingErrorMessage(err, "PAN verification failed. Please try again.");

/** Uppercase, letter-spaced style for code-like inputs (GSTIN, PAN). */
export const CODE_INPUT_CLASS = "font-bold uppercase tracking-[0.14em] placeholder:font-medium placeholder:tracking-normal sm:text-[15px]";
