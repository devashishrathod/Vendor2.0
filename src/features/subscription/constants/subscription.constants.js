// subscription.constants.js
// Central place for route paths, enums, and any hard-coded copy used by the
// Subscription feature. Keeping these here means components/services never
// hard-code magic strings inline.

export const ROUTES = {
  PLANS: '/plans', // Where the "Upgrade" button should take the user
  SUBSCRIPTION: '/subscription',
};

export const PLAN_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  TRIAL: 'TRIAL',
};

export const CURRENCY = {
  INR: 'INR',
};

export const API_ENDPOINTS = {
  // Swap this out for your real backend endpoint. The service layer is the
  // only place that needs to change if the URL/shape changes.
  GET_SUBSCRIPTION: '/api/subscription/current',
};

export const STATIC_TEXT = {
  PAGE_TITLE: 'Subscription Page',
  PAGE_SUBTITLE:
    'Select a subscription plan to unlock premium features, exclusive offers, and additional benefits.',
  SECTION_TITLE: 'Plan & Billing',
  SECTION_SUBTITLE: 'Manage your subscription, view invoices, and explore upgrade options',
  UPGRADE_LABEL: 'Upgrade',
};
