// planBenefitsService.js
// Powers the "Basic Plan Benefit's Details" modal.

import { API_ENDPOINTS } from '../constants/subscription.constants';

const MOCK_BENEFITS_BY_PLAN = {
  'Basic Plane': [
    {
      id: 'plan-valid',
      icon: 'checkSquare',
      name: 'Plan Valid',
      description:
        'This plan is valid for 12 months from the date of activation. During the validity period, users can access all features and benefits included in the selected plan. Renewal is required after the 12-month period to continue using the services without interruption.',
      condition: '12 / Month',
      included: true,
    },
    {
      id: 'transactions',
      icon: 'receipt',
      name: 'Transactions',
      description:
        'Improved cash flow management helps vendors track incoming and outgoing payments efficiently.',
      condition: 'Unlimited',
      included: true,
    },
    {
      id: 'settlements',
      icon: 'swap',
      name: 'Settlements',
      description:
        "Settlements refer to the process of transferring collected payments to the vendor's account.",
      condition: 'On - Time',
      included: true,
    },
    {
      id: 'sub-brand',
      icon: 'layers',
      name: 'Sub Brand',
      description:
        'A sub brand is a secondary brand created under a main brand to represent a specific product, service, or business category.',
      condition: 'Count 01',
      included: true,
    },
    {
      id: 'franchise',
      icon: 'franchise',
      name: 'Franchise',
      description:
        'Enjoy brand recognition, business support, training, marketing assistance, exclusive offers, and growth opportunities to help you build a successful business.',
      condition: null,
      included: false,
    },
    {
      id: 'verified-mark',
      icon: 'verified',
      name: 'Verified Mark',
      description:
        'A Verified Mark indicates that a business, outlet, franchise, or user has been reviewed and authenticated by the platform. It helps build trust and assures customers that the profile or business information is genuine, accurate, and officially approved.',
      condition: null,
      included: false,
    },
  ],
};

/**
 * Fetches the benefit rows for a given plan name.
 * Real version:
 *   const res = await fetch(API_ENDPOINTS.GET_PLAN_BENEFITS(planName));
 *   if (!res.ok) throw new Error('Failed to load plan benefits');
 *   return res.json();
 */
export async function fetchPlanBenefits(planName) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_BENEFITS_BY_PLAN[planName] || MOCK_BENEFITS_BY_PLAN['Basic Plane'];
}

export const planBenefitsApiEndpoints = {
  byPlan: API_ENDPOINTS.GET_PLAN_BENEFITS,
};
