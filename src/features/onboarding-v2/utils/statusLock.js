import { BRANCHES } from "../config/onboardingFlow";

/**
 * Business status is locked once that path's business verification is done
 * (GSTIN verified on "I have GST", business PAN on "Registered, no GST",
 * owner PAN on "Not registered") — changing it then would throw that
 * verification away. Zustand selector for useOnboardingV2Store.
 * @param {{ branch: string|null, form: object }} state
 * @returns {boolean}
 */
export function selectStatusLocked(state) {
  const { branch, form } = state;
  if (branch === BRANCHES.GST) return Boolean(form.gstDetails);
  if (branch === BRANCHES.REG_NO_GST) return Boolean(form.panDetails);
  if (branch === BRANCHES.UNREGISTERED) return Boolean(form.ownerKyc?.panDetails);
  return false;
}
