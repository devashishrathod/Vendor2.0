import { DOCUMENT_RULES, NAME_LIMITS } from "../constants/onboardingOptions";

// Each `*Rules` function returns the live checklist a step shows:
// [{ label, passed }]. A field is valid when every rule passes.

const NAME_CHARS = /^[A-Za-z&.'\-,() ]+$/;
const PAN_FORMAT = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC_FORMAT = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// GST state codes: 01–38 (38 = Ladakh) plus 97 (other territory).
const isGstStateCode = (code) => (code >= 1 && code <= 38) || code === 97;

export const allPassed = (rules) => rules.every((rule) => rule.passed);

export const toUpperAlphanumeric = (value, maxLength) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxLength);

export const toDigits = (value, maxLength) => value.replace(/\D/g, "").slice(0, maxLength);

/**
 * Brand name on screen 03: 2–15 characters, letters, spaces and & . ' - , ( ),
 * at least one letter.
 * @param {string} brandName
 */
export function brandNameRules(brandName) {
  const brand = brandName.trim();
  return [
    { label: "Shown on vouchers and your outlet page", passed: brand.length > 0 },
    { label: "Only letters and & . ' - , ( )", passed: brand.length > 0 && NAME_CHARS.test(brand) },
    {
      label: `Brand name: ${NAME_LIMITS.brandMin}–${NAME_LIMITS.brandMax} characters`,
      passed: brand.length >= NAME_LIMITS.brandMin && brand.length <= NAME_LIMITS.brandMax,
    },
    { label: "Brand name has at least one letter", passed: /[A-Za-z]/.test(brand) },
  ];
}

/** Shown under the PAN checklist: a personal PAN works too. */
export const PAN_ACCEPTED_NOTE = "Use your business PAN, or your personal PAN if you run the business yourself.";

/** Business or personal PAN — any 4th letter (P included) is accepted. @param {string} pan */
export function panRules(pan) {
  return [
    { label: "10 characters", passed: pan.length === 10 },
    { label: "5 letters + 4 numbers + 1 letter", passed: PAN_FORMAT.test(pan) },
    { label: "No spaces or special characters", passed: pan.length > 0 && /^[A-Z0-9]+$/.test(pan) },
  ];
}

/**
 * GSTIN checklist. With a known `pan`, characters 3–12 must equal it;
 * without one they only need to be a valid PAN.
 * @param {string} gstin @param {{ pan?: string }} context
 */
export function gstRules(gstin, { pan = "" } = {}) {
  const stateCode = Number(gstin.slice(0, 2));
  return [
    { label: "15 characters", passed: gstin.length === 15 },
    { label: "Valid GSTIN format", passed: GSTIN_FORMAT.test(gstin) },
    { label: "Valid state code (01–38)", passed: /^\d{2}/.test(gstin) && isGstStateCode(stateCode) },
    {
      label: pan ? "Characters 3–12 match your PAN" : "Characters 3–12 are a valid PAN",
      passed: gstin.length >= 12 && (pan ? gstin.slice(2, 12) === pan : PAN_FORMAT.test(gstin.slice(2, 12))),
    },
  ];
}

/** @param {{ accountNumber: string, ifsc: string, accountType: string }} bank */
export function bankRules({ accountNumber, ifsc, accountType }) {
  return [
    { label: "Account number: 9–18 digits", passed: accountNumber.length >= 9 && accountNumber.length <= 18 },
    { label: "Valid IFSC (e.g. HDFC0001234)", passed: IFSC_FORMAT.test(ifsc) },
    { label: "Account type selected", passed: Boolean(accountType) },
  ];
}

// Image dimensions need decoding, so this is async. Resolves to an error
// message, or "" when the file is fine.
/** @param {File} file @returns {Promise<string>} */
export async function checkDocumentFile(file) {
  if (!DOCUMENT_RULES.acceptedTypes.includes(file.type)) return "Use a PDF, JPG or PNG file.";
  if (file.size > DOCUMENT_RULES.maxSizeBytes) return "This file is over 5 MB. Please use a smaller one.";
  if (file.type === "application/pdf") return "";

  try {
    const bitmap = await createImageBitmap(file);
    const shortSide = Math.min(bitmap.width, bitmap.height);
    bitmap.close();
    return shortSide < DOCUMENT_RULES.minImageSidePx
      ? `Image is too small — at least ${DOCUMENT_RULES.minImageSidePx} px on the short side.`
      : "";
  } catch {
    return "We couldn't read this image. Try another file.";
  }
}

/** @param {number} bytes */
export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** @param {string} accountNumber */
export const maskAccountNumber = (accountNumber) =>
  accountNumber.length > 4 ? `${"•".repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}` : accountNumber;
