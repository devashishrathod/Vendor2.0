// Reading the GST / PAN verification records (same field names the
// production Step7PANReadOnly / Step9GSTReadOnly screens use) and the
// backend save chains run from the review screens.

import {
  entityTypeFromConstitution,
  entityTypeFromPan,
  fetchPanDetails,
  saveBusinessNames,
  saveBusinessStatus,
  saveEntityType,
  saveVerifiedGst,
  saveVerifiedPan,
} from "../../services/onboardingApi";
import { BRANCHES } from "../../config/onboardingFlow";
import { ENTITY_VALUES } from "../../constants/onboardingOptions";

const ACTIVE_STATUSES = ["active", "success"];

const clean = (value) => {
  const text = typeof value === "string" ? value.trim() : value;
  return text && text !== "NA" ? text : null;
};

/** The verify endpoints may wrap the record once more in `data`. @param {object|null} details */
export const unwrapRecord = (details) => details?.data ?? details ?? {};

/**
 * Display fields of a GST record.
 * @param {object|null} gstDetails
 */
export function readGstRecord(gstDetails) {
  const raw = unwrapRecord(gstDetails);
  const a = raw.address || {};
  const addressParts = [a.floor_number, a.building_number, a.building_name, a.location, a.city, a.district, a.state, a.pin]
    .map(clean)
    .filter(Boolean);
  return {
    gstNumber: clean(raw.gstNumber),
    legalName: clean(raw.legalName),
    tradeName: clean(raw.tradeName),
    constitution: clean(raw.constitutionOfBusiness),
    taxpayerType: clean(raw.taxpayerType),
    registrationDate: clean(raw.registrationDate),
    registrationStatus: clean(raw.registrationStatus),
    natureOfBusiness: Array.isArray(raw.natureOfBusiness) && raw.natureOfBusiness.length ? raw.natureOfBusiness.join(", ") : null,
    address: [...new Set(addressParts)].join(", ") || null,
  };
}

/**
 * Whether a GST record is an Active registration.
 * @param {object|null} gstDetails
 */
export function isGstActive(gstDetails) {
  const raw = unwrapRecord(gstDetails);
  const status = String(raw.registrationStatus || raw.status || "").toLowerCase();
  return ACTIVE_STATUSES.includes(status);
}

/**
 * Display fields of a PAN record.
 * @param {object|null} panDetails
 */
// PAN 4th letter → who holds it (Income Tax "PAN holder type").
const PAN_HOLDER_TYPES = {
  P: "Individual",
  C: "Company",
  F: "Firm / LLP",
  H: "Hindu undivided family",
  A: "Association of persons",
  B: "Body of individuals",
  T: "Trust",
  G: "Government",
  L: "Local authority",
  J: "Artificial juridical person",
};

// Verify APIs answer "SUCCESS" / "VALID" / "E" for a good PAN — shown as "Valid".
const VALID_PAN_STATUSES = new Set(["SUCCESS", "VALID", "E", "ACTIVE", "EXISTING AND VALID"]);
const readPanStatus = (value) => {
  const status = clean(value);
  if (!status) return null;
  return VALID_PAN_STATUSES.has(status.toUpperCase()) ? "Valid" : status;
};

export function readPanRecord(panDetails) {
  const raw = unwrapRecord(panDetails);
  const a = raw.addressDetails || {};
  const addressParts = [a.building_name, a.street_name, a.locality, a.city, a.state, a.pincode, a.country]
    .map(clean)
    .filter(Boolean);
  const aadhaarLinked = raw.aadhaarLinked ?? raw.isAadhaarLinked;
  return {
    pan: clean(raw.pan),
    name: clean(raw.fullName) || clean(raw.lastName),
    panType: clean(raw.panType)?.toUpperCase() ?? null,
    dateOfIncorporation: clean(raw.dob),
    status: readPanStatus(raw.panStatus) || readPanStatus(raw.status),
    holderType: PAN_HOLDER_TYPES[String(clean(raw.pan) || "").charAt(3).toUpperCase()] ?? null,
    gender: clean(raw.gender),
    aadhaarLinked: typeof aadhaarLinked === "boolean" ? (aadhaarLinked ? "Yes" : "No") : null,
    address: addressParts.join(", ") || null,
  };
}

/** Plain-language message for a failed GST lookup. @param {unknown} err */
export function gstErrorMessage(err) {
  const raw = err instanceof Error ? err.message : "";
  if (raw === "Invalid ID number or combination of inputs" || raw === "vender api error") {
    return "We couldn't find a GST record for this GSTIN. Check the number and try again.";
  }
  if (raw === "Insufficient wallet balance" || raw === "Forbidden: IP not allowed") {
    return "GST verification is temporarily unavailable. Please try again after some time.";
  }
  return raw || "Something went wrong while verifying the GSTIN. Please try again.";
}

/** Plain-language message for a failed PAN lookup. @param {unknown} err */
export function panErrorMessage(err) {
  const raw = err instanceof Error ? err.message : "";
  if (raw === "Invalid ID number or combination of inputs" || raw === "vender api error") {
    return "We couldn't find a PAN record for this number. Check it and try again.";
  }
  return raw || "PAN verification failed. Please try again.";
}

/**
 * GST path, GST review "Continue": names → status → entity type → PAN → GST.
 * The PAN (GSTIN chars 3–12) is fetched again here if the lookup during GST
 * verification failed; if it still can't be fetched the PAN save is left out
 * so the GST record can still be saved.
 * @param {{ brandName: string, gstDetails: object, panDetails: object|null, pan: string }} input
 * @returns {Promise<{ legalName: string, entityType: string, panDetails: object|null }>}
 */
export async function saveGstPath({ brandName, gstDetails, panDetails, pan }) {
  const record = readGstRecord(gstDetails);
  const legalName = record.legalName || record.tradeName || "";
  const entityType = entityTypeFromConstitution(record.constitution || "");

  let verifiedPan = panDetails;
  if (!verifiedPan && pan) {
    try {
      verifiedPan = await fetchPanDetails(pan);
    } catch (err) {
      console.error("GST path: PAN lookup failed, saving GST without it:", err);
      verifiedPan = null;
    }
  }

  await saveBusinessNames({ legalName, brandName: brandName.trim() });
  await saveBusinessStatus(BRANCHES.GST);
  await saveEntityType(entityType);
  if (verifiedPan) await saveVerifiedPan(verifiedPan);
  await saveVerifiedGst(gstDetails);

  return { legalName, entityType, panDetails: verifiedPan };
}

/**
 * Registered-no-GST path, PAN review "Continue" — the verified PAN is saved
 * straight away, like the production PAN step: names → status → entity
 * type (detected from the PAN's 4th letter) → PAN.
 * @param {{ brandName: string, panDetails: object, pan: string }} input
 * @returns {Promise<{ legalName: string, entityType: string }>}
 */
export async function savePanReviewPath({ brandName, panDetails, pan }) {
  const record = readPanRecord(panDetails);
  const legalName = record.name || "";
  const entityType = entityTypeFromPan(record.pan || pan) || "OTHERS";
  await saveBusinessNames({ legalName, brandName: brandName.trim() });
  await saveBusinessStatus(BRANCHES.REG_NO_GST);
  await saveEntityType(entityType);
  await saveVerifiedPan(panDetails);
  return { legalName, entityType };
}

/**
 * Business type "Continue". Saves the entity type, then re-sends whatever
 * was already saved after it (PAN, GST) so the backend's onboarding screen
 * moves forward again — an "already exists" reply counts as success.
 * @param {{ branch: string, entityType: string, panDetails?: object|null, gstDetails?: object|null }} input
 */
export async function saveChangedEntityType({ branch, entityType, panDetails, gstDetails }) {
  await saveEntityType(entityType);
  if (branch === BRANCHES.UNREGISTERED) return;
  if (panDetails) await saveVerifiedPan(panDetails);
  if (branch === BRANCHES.GST && gstDetails) await saveVerifiedGst(gstDetails);
}

/**
 * The business type to pre-select: from the GST "constitution of business",
 * the business PAN's 4th letter, or Proprietorship when not registered.
 * @param {{ branch: string, gstDetails?: object|null, pan?: string }} input
 * @returns {{ entityType: string|null, source: string }}
 */
export function detectEntityType(input) {
  const result = detectRawEntityType(input);
  // Only recommend one of the entities the vendor can actually pick.
  return ENTITY_VALUES.includes(result.entityType) ? result : { entityType: null, source: result.source };
}

function detectRawEntityType({ branch, gstDetails, pan }) {
  if (branch === BRANCHES.GST) {
    const constitution = readGstRecord(gstDetails).constitution || "";
    const fromGst = constitution ? entityTypeFromConstitution(constitution) : null;
    // GST didn't say clearly → fall back to the PAN's 4th letter.
    if (fromGst && ENTITY_VALUES.includes(fromGst)) return { entityType: fromGst, source: "GST" };
    const fromPan = entityTypeFromPan(pan || "");
    if (fromPan) return { entityType: fromPan, source: "PAN" };
    return { entityType: fromGst, source: "GST" };
  }
  if (branch === BRANCHES.UNREGISTERED) return { entityType: "PROPRIETORSHIP", source: "not registered" };
  return { entityType: entityTypeFromPan(pan || ""), source: "PAN" };
}

/** Uppercase, letter-spaced style for code-like inputs (GSTIN, PAN). */
export const CODE_INPUT_CLASS = "font-bold uppercase tracking-[0.14em] placeholder:font-medium placeholder:tracking-normal sm:text-[15px]";
