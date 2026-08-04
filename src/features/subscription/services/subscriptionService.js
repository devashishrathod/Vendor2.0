// subscriptionService.js
// This is the ONLY file that should know about network/API details.
// Swap MOCK_SUBSCRIPTION + the fake delay below for a real `fetch`/axios
// call to API_ENDPOINTS.GET_SUBSCRIPTION and nothing else in the feature
// needs to change.

import { API_ENDPOINTS, PLAN_STATUS } from '../constants/subscription.constants';

const MOCK_SUBSCRIPTION = {
  status: PLAN_STATUS.ACTIVE,
  planName: 'Basic Plane',
  nextRenewalDate: '2025-03-15',
  createdOnDate: '2022-02-12',
  subscriptionTermYears: 1,
  expirationDate: '2025-03-15',
  originalPrice: 4000.0,
  discountedPrice: 1999.0,
  paidAmount: 2358.0,
  brandName: 'Yoga Education And Research Pvt Ltd',
  orderId: 'O11001',
  billingAddress:
    'New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040',
  gstDetails: '09AAKFF2211N2ZA',
  panDetails: 'ABCDE1234F',
  invoiceUrl: '/invoices/O11001',
  ticketStatus: 'Issue Reported',
  purchasedListLabel: 'Purchased List',
  currentPlanBenefitsUrl: '/subscription/benefits/current',
};

/**
 * Fetches the current user's subscription details.
 * Replace the body of this function with a real call, e.g.:
 *
 *   const res = await fetch(API_ENDPOINTS.GET_SUBSCRIPTION);
 *   if (!res.ok) throw new Error('Failed to load subscription');
 *   return res.json();
 */
export async function fetchCurrentSubscription() {
  // Simulated network latency so loading states are visible/testable.
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Simulated failure path — throw if you want to test the error UI:
  // throw new Error('Network error');

  return MOCK_SUBSCRIPTION;
}

export const subscriptionApiEndpoints = API_ENDPOINTS;
