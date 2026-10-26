import { CreditCard, IdCard } from "lucide-react";
import { SCREENS } from "../../config/onboardingFlow";
import { panRules, toUpperAlphanumeric } from "../../validation/rules";

const PAN_LENGTH = 10;

/**
 * PAN entry + review screens. `form.panDetails` is the verified record,
 * normalised to { legalName, panType, incorporationDate, address } when
 * the verify-pan API is wired in.
 */
export const panConfig = {
  field: "pan",
  maxLength: PAN_LENGTH,
  normalize: (value) => toUpperAlphanumeric(value, PAN_LENGTH),
  rules: (value) => panRules(value),
  enter: {
    icon: CreditCard,
    title: "Verify your business PAN",
    subtitle: "Enter your business PAN to fetch your registered details.",
    label: "Business PAN",
    hint: "10 characters · 5 letters · 4 numbers · 1 letter",
    placeholder: "ABCDE1234F",
    rulesTitle: "PAN requirements",
    tips: ["Enter the PAN linked to your business.", "It should match your registration details.", "Verification is instant."],
    previewTitle: "PAN details",
    previewEmpty: "Your verified PAN details will appear here.",
    headerBadge: () => null,
  },
  review: {
    title: "Business PAN verified",
    subtitle: "Review the verified details before continuing.",
    badge: "Verified",
    heroIcon: IdCard,
    heroLabel: () => "Business PAN",
    heroValue: (form) => form.pan,
    heroAside: () => null,
    columns: 3,
    details: (form) => [
      { label: "Legal business name", value: form.panDetails?.legalName },
      { label: "PAN type", value: form.panDetails?.panType },
      { label: "Date of incorporation", value: form.panDetails?.incorporationDate },
      { label: "Address", value: form.panDetails?.address, wide: true },
    ],
    notice: "Please confirm that these details match your business records.",
    continueLabel: "Continue",
    editScreen: SCREENS.PAN_VERIFICATION,
  },
};
