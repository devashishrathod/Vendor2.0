import { getErrorCode } from "@/services/http/apiError";

/**
 * The selling gate (guide §10): `403` on voucher submit-review / publish —
 * and on every paid feature after it — with one of these `details.code`s.
 * Drafts stay open; only selling is held back. One handler for all of them.
 */
const GATES = Object.freeze({
  BANK_REQUIRED: {
    title: "Add a bank account to sell vouchers",
    message: "Customers can buy your vouchers once a verified bank account is linked for payouts.",
    cta: { label: "Add bank account", to: "/account-information?tab=bank-account-details" },
  },
  BRAND_NOT_APPROVED: {
    title: "Vouchers go live after approval",
    message: "Your brand is still being reviewed. You can keep drafting — publishing opens once we approve it.",
    cta: { label: "See review status", to: "/under-review" },
  },
  PLAN_REQUIRED: {
    title: "An active plan is needed",
    message: "Selling vouchers needs a live plan. Pick or renew one to continue.",
    cta: { label: "View plans", to: "/subscription-plan" },
  },
});

/**
 * The gate a failed call hit, or null when it isn't a selling-gate error.
 * @param {unknown} error
 * @returns {{ code: string, title: string, message: string, cta: { label: string, to: string } } | null}
 */
export function sellingGateFor(error) {
  const code = getErrorCode(error);
  return GATES[code] ? { code, ...GATES[code] } : null;
}
