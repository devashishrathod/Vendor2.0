import { Check, Receipt } from "lucide-react";
import { SCREENS } from "../../config/onboardingFlow";
import { gstRules, toUpperAlphanumeric } from "../../validation/rules";

const GSTIN_LENGTH = 15;

/**
 * GST entry + review screens. `form.gstDetails` is the verified record,
 * normalised to { legalName, tradeName, structure, taxpayerType,
 * registrationDate, natureOfBusiness, address } when verify-gst is wired in.
 */
export const gstConfig = {
  field: "gstin",
  maxLength: GSTIN_LENGTH,
  normalize: (value) => toUpperAlphanumeric(value, GSTIN_LENGTH),
  // Characters 3–12 are checked against the PAN only when one was entered.
  rules: (value, { pan }) => gstRules(value, { pan }),
  enter: {
    icon: Receipt,
    title: "Verify your GST registration",
    subtitle: "Enter your 15-character GSTIN to verify your business registration.",
    label: "Business GSTIN",
    hint: "15 characters · includes your registered PAN",
    placeholder: "e.g., 27ABCDE1234F1Z5",
    rulesTitle: "GSTIN requirements",
    tips: ["Enter the GSTIN linked to your business.", "The first two digits are your state.", "It must match your GST certificate."],
    previewTitle: "GST registration details",
    previewEmpty: "Your verified GST details will appear here.",
    headerBadge: ({ isCompleted }) =>
      isCompleted(SCREENS.PAN_REVIEW) ? { tone: "info", icon: Check, label: "PAN verified" } : null,
  },
  review: {
    title: "GST registration verified",
    subtitle: "Review your verified business details before continuing.",
    badge: "Verified · Active",
    heroIcon: null,
    heroLabel: () => "Business GSTIN",
    heroValue: (form) => form.gstin,
    heroAside: () => null,
    columns: 3,
    details: (form) => [
      { label: "Legal business name", value: form.gstDetails?.legalName },
      { label: "Trade name", value: form.gstDetails?.tradeName },
      { label: "Business structure", value: form.gstDetails?.structure },
      { label: "Taxpayer type", value: form.gstDetails?.taxpayerType },
      { label: "Registration date", value: form.gstDetails?.registrationDate },
      { label: "Nature of business", value: form.gstDetails?.natureOfBusiness },
      { label: "Registered business address", value: form.gstDetails?.address, wide: true },
    ],
    notice: "Please confirm these details match your GST registration records before continuing.",
    continueLabel: "Continue to Business documents",
    editScreen: SCREENS.GST_VERIFICATION,
  },
};
