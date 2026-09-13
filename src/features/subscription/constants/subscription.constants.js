// subscription.constants.js
// Central place for route paths, enums, and any hard-coded copy used by the
// Subscription feature. Keeping these here means components/services never
// hard-code magic strings inline.

export const ROUTES = {
  // Where the "Upgrade" button takes the user — the real plan-selection
  // page (features/subscriptions, plural) also used during onboarding
  // checkout. '/plans' was never a registered route, so Upgrade previously
  // hit the app's catch-all and bounced to the landing page.
  PLANS: '/subscription',
  SUBSCRIPTION: '/subscription',
  INVOICE_DETAIL: '/invoices/:orderId', // Route pattern for router registration
  INVOICE_HISTORY: '/subscription/invoice-history',
};

/**
 * Builds a concrete invoice detail URL from an order id,
 * e.g. buildInvoiceRoute('O11001') -> '/invoices/O11001'
 */
export function buildInvoiceRoute(orderId) {
  return `/invoices/${orderId}`;
}

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
  // Swap these out for your real backend endpoints. The service layer is the
  // only place that needs to change if the URL/shape changes.
  GET_SUBSCRIPTION: '/api/subscription/current',
  GET_INVOICE_BY_ID: (orderId) => `/api/invoices/${orderId}`,
  GET_INVOICE_HISTORY: '/api/invoices/history',
  GET_PLAN_BENEFITS: (planName) => `/api/plans/${planName}/benefits`,
  RAISE_QUERY: '/api/support/queries',
};

export const STATIC_TEXT = {
  PAGE_TITLE: 'Subscription Plan',
  PAGE_SUBTITLE: 'Unlock premium features, exclusive offers, and grow your business with Trydood.',
  SECTION_TITLE: 'Plan & Billing',
  SECTION_SUBTITLE: 'Manage your subscription, view invoices, and explore upgrade options',
  UPGRADE_LABEL: 'Upgrade Now',
};
