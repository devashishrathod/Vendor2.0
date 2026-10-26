import { Landmark } from "lucide-react";
import { SCREENS } from "../../config/onboardingFlow";
import { BANK_ACCOUNT_TYPES } from "../../constants/onboardingOptions";
import { maskAccountNumber } from "../../validation/rules";

const accountTypeLabel = (value) => BANK_ACCOUNT_TYPES.find((t) => t.value === value)?.label ?? "";

/**
 * Bank review screen (entry is BankDetailsStep — it has more fields than
 * the single-ID PAN/GST entry). `form.bankDetails` is the verified record,
 * normalised to { bankName, branch, micr, holderName, nameMatches, address }
 * when verify-bank is wired in.
 */
export const bankConfig = {
  review: {
    title: "Bank account verified",
    subtitle: "Check the details. Payouts go to this account.",
    badge: "₹1 test passed",
    heroIcon: Landmark,
    heroLabel: (form) => [form.bankDetails?.bankName ?? "Bank account", accountTypeLabel(form.bank.accountType)].filter(Boolean).join(" · "),
    heroValue: (form) => maskAccountNumber(form.bank.accountNumber),
    heroAside: (form) => ({
      label: "Account holder",
      value: form.bankDetails?.holderName || form.bank.beneficiary || "—",
    }),
    columns: 4,
    details: (form) => [
      { label: "IFSC", value: form.bank.ifsc },
      { label: "Branch", value: form.bankDetails?.branch },
      { label: "MICR", value: form.bankDetails?.micr },
      form.bankDetails?.nameMatches
        ? { label: "Name match", value: "✓ Matches business", tone: "success" }
        : { label: "Name match", value: null },
      { label: "Bank address", value: form.bankDetails?.address, wide: true },
    ],
    notice: "After approval, the bank account can only be changed through support.",
    continueLabel: "Continue",
    editScreen: SCREENS.BANK_VERIFICATION,
  },
};
