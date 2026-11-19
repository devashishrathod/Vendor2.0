import { getErrorCode, getErrorDetails, getErrorStatus } from "@/services/http/apiError";
import { ONBOARDING_ERROR_CODES as C } from "../config/screens";

// `details.code` → what the vendor sees (guide §12). The panel branches on
// the code only; without a known code the server's own message is shown.

/**
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function onboardingErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const details = getErrorDetails(error) ?? {};
  switch (getErrorCode(error)) {
    case C.LOCKED:
      return "Your profile is under review. Right now you can only add details that are missing.";
    case C.LEGAL_FIELD_LOCKED:
      return "This detail can only be changed through support.";
    case C.DETAIL_ALREADY_PROVIDED:
      return "This detail is already saved. Contact support to change it.";
    case C.REGISTRATION_STATUS_LOCKED:
      return "Your GST / PAN is already saved, so the business status is locked. Contact support to change it.";
    case C.SUBCATEGORY_LIMIT:
      return details.limit ? `You can pick up to ${details.limit} sub-categories.` : "You've picked more sub-categories than allowed.";
    case C.GSTIN_NOT_ACTIVE:
      return "This GSTIN isn't active. If you don't have an active GST, choose “Registered, no GST”.";
    case C.PAN_NOT_IN_GSTIN:
      if (details.panFromGstin) return `The PAN must be the one inside your GSTIN (${details.panFromGstin}).`;
      if (details.panOnBrand) return `This GSTIN doesn't contain your saved PAN (${details.panOnBrand}). Contact support to change it.`;
      return "The PAN must be the one inside your GSTIN.";
    case C.ENTITY_FROM_GST:
      return "Your business entity has to match your GST registration.";
    case C.KYC_DOCUMENT_LIMIT:
      return details.limit ? `You can add up to ${details.limit} documents.` : "You've reached the document limit.";
    case C.OWNER_PAN_NOT_PERSONAL:
      return "This is a business PAN. Give the owner's personal PAN or an ID document — or, if the business is registered, choose “Registered, no GST”.";
    case C.OWNER_ID_DOCUMENT:
      return "The owner's ID can't be changed here — change it in Owner verification.";
    case C.KYC_FILE_TYPE:
      return "Only PDF, JPG or PNG files can be uploaded.";
    case C.KYC_IMAGE_TOO_SMALL:
      return details.minShortSidePx
        ? `The image is too small — its shorter side must be at least ${details.minShortSidePx} px.`
        : "The image is too small. Use a sharper photo or a PDF.";
    case C.KYC_STORAGE_UNAVAILABLE:
      return "Uploads are paused right now. Please try again in a little while.";
    case C.VERIFICATION_NOT_FOUND:
      return "That verification wasn't found. Please verify again.";
    case C.VERIFICATION_FAILED:
      // The provider's reason is the message (guide §12) — show it as is.
      return error?.message || "This verification failed. Please check the number and verify again.";
    case C.DOCUMENT_IN_USE:
      return "This PAN / GSTIN / bank account is already registered with another brand.";
    case C.BILLING_STATE_GSTIN_MISMATCH:
      return details.gstinState
        ? `Your billing address must be in ${details.gstinState}, the state of your GSTIN.`
        : "Your billing address must be in the same state as your GSTIN.";
    default:
      break;
  }
  // 413 comes without a code (guide §12).
  if (getErrorStatus(error) === 413) return "The file is larger than 5 MB.";
  return error?.message || fallback;
}
