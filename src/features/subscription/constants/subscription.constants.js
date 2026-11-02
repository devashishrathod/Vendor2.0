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

// Reasons offered in the Request Refund modal's dropdown. `OTHER` makes the
// details box required. Swap the values for the backend's own reason codes
// once the subscription refund API is confirmed.
export const REFUND_REASONS = [
  { value: 'NOT_USING_FEATURES', label: 'Not using the features' },
  { value: 'PURCHASED_BY_MISTAKE', label: 'Purchased by mistake' },
  { value: 'FOUND_ALTERNATIVE', label: 'Found a better alternative' },
  { value: 'TOO_EXPENSIVE', label: 'Too expensive' },
  { value: 'TECHNICAL_ISSUES', label: 'Technical issues' },
  { value: 'OTHER', label: 'Other' },
];

export const CURRENCY = {
  INR: 'INR',
};

// "Bill From" on every subscription invoice — Trydood's own registered
// details. The subscription API doesn't return the seller block, so it
// lives here (same values the invoice screen used before).
export const TRYDOOD_BILLING = {
  companyName: 'TRYDOOD RETAIL PRIVATE LIMITED',
  address: 'No 38, College Road, Old College Buildings, Chennai, Tamil Nadu, India, 600006',
  gstin: '33AAKCT3750H1ZB',
  pan: 'AAKCT3750H',
};

// GET /subscribeds/history `action` values → what the history table shows.
// Anything not listed is shown title-cased.
export const HISTORY_ACTION_LABELS = {
  ORDER_CREATED: 'Order created',
  ACTIVATED: 'Activated',
  RENEWED: 'Renewed',
  UPGRADED: 'Upgraded',
  DOWNGRADED: 'Downgraded',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  SCHEDULED: 'Scheduled',
  SCHEDULE_STARTED: 'Scheduled plan started',
  SCHEDULE_MOVED: 'Schedule moved',
  SCHEDULE_CANCELLED: 'Schedule cancelled',
  PLAN_TERMS_APPLIED: 'Plan terms updated',
};

export const HISTORY_PERFORMER_LABELS = {
  VENDOR: 'You',
  ADMIN: 'Trydood admin',
  SUPER_ADMIN: 'Trydood admin',
  SYSTEM: 'System',
};

export const API_ENDPOINTS = {
  // Swap these out for your real backend endpoints. The service layer is the
  // only place that needs to change if the URL/shape changes.
  GET_SUBSCRIPTION: '/api/subscription/current',
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
