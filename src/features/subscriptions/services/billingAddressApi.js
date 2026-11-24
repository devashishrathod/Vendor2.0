import { request } from "../../../services/api/client";

// Brand billing address — the "Bill to" on every invoice (API doc #32a / #32b,
// onboarding v2 P4). Separate from outlet addresses; no delete.

/**
 * GET /brands/billing-address.
 * @returns {Promise<{ data: import('@/features/onboarding-v2/types').BillingAddressResponse }>}
 */
export const getBillingAddress = () => request("/brands/billing-address", "GET", null, true);

/**
 * PUT /brands/billing-address (upsert). `coordinates` is [longitude, latitude].
 * A GST brand's state must be its GSTIN's state (422 BILLING_STATE_GSTIN_MISMATCH).
 * @param {{ addressLine1: string, addressLine2?: string, city: string, state: string, zipcode: string, country?: string, coordinates: number[] }} address
 * @returns {Promise<{ data: { billingAddress: import('@/features/onboarding-v2/types').BillingAddress } }>}
 */
export const saveBillingAddress = (address) => request("/brands/billing-address", "PUT", address, true);
