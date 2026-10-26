import { DOCUMENT_RULES, NAME_LIMITS } from "../constants/onboardingOptions";

// Each `*Rules` function returns the live checklist a step shows:
// [{ label, passed }]. A field is valid when every rule passes.

const LEGAL_NAME_CHARS = /^[A-Za-z&.'\-,() ]+$/;
const PAN_FORMAT = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC_FORMAT = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const allPassed = (rules) => rules.every((rule) => rule.passed);

export const toUpperAlphanumeric = (value, maxLength) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxLength);

export const toDigits = (value, maxLength) => value.replace(/\D/g, "").slice(0, maxLength);

/** @param {string} legalName @param {string} brandName */
export function businessNameRules(legalName, brandName) {
  const legal = legalName.trim();
  const brand = brandName.trim();
  return [
    { label: "Legal name: at least 3 characters", passed: legal.length >= 3 },
    { label: "Only letters and & . ' - , ( )", passed: legal.length > 0 && LEGAL_NAME_CHARS.test(legal) },
    {
      label: `Brand name: ${NAME_LIMITS.brandMin}–${NAME_LIMITS.brandMax} characters`,
      passed: brand.length >= NAME_LIMITS.brandMin && brand.length <= NAME_LIMITS.brandMax,
    },
    { label: "Brand name has at least one letter", passed: /[A-Za-z]/.test(brand) },
  ];
}

/** @param {string} pan */
export function panRules(pan) {
  return [
    { label: "10 characters", passed: pan.length === 10 },
    { label: "5 letters + 4 numbers + 1 letter", passed: PAN_FORMAT.test(pan) },
    { label: "No spaces or special characters", passed: pan.length > 0 && /^[A-Z0-9]+$/.test(pan) },
    { label: "Business PAN (4th letter isn't P)", passed: pan.length >= 4 && pan[3] !== "P" },
  ];
}

/** @param {string} gstin @param {{ pan?: string }} context */
export function gstRules(gstin, { pan = "" } = {}) {
  const stateCode = Number(gstin.slice(0, 2));
  return [
    { label: "15 characters", passed: gstin.length === 15 },
    { label: "Valid GSTIN format", passed: GSTIN_FORMAT.test(gstin) },
    { label: "Valid state code (01–37)", passed: gstin.length >= 2 && stateCode >= 1 && stateCode <= 37 },
    {
      label: "Characters 3–12 match your PAN",
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
