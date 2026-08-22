// Public entry point for the subscription feature.
// Other parts of the app should only ever import from here.

export { default as SubscriptionPage } from './pages/SubscriptionPage';

// Standalone pages, kept for direct/deep-linking (e.g. shared invoice URLs).
// The default in-app UX (via InvoiceInfo) uses the modal versions instead.
export { default as InvoicePage } from './pages/InvoicePage';
export { default as InvoiceHistoryPage } from './pages/InvoiceHistoryPage';

// Modals
export { default as InvoiceModal } from './components/InvoiceModal';
export { default as InvoiceHistoryModal } from './components/InvoiceHistoryModal';
export { default as RaiseQueryModal } from './components/RaiseQueryModal';
export { default as PlanBenefitsModal } from './components/PlanBenefitsModal';

export { useSubscription } from './hooks/useSubscription';
export { useInvoice } from './hooks/useInvoice';
export { useInvoiceHistory } from './hooks/useInvoiceHistory';
export { usePlanBenefits } from './hooks/usePlanBenefits';
export { useRaiseQuery } from './hooks/useRaiseQuery';

export { mapBrandToSubscription } from './services/subscriptionService';
export { fetchInvoiceByOrderId, fetchInvoiceHistory } from './services/invoiceService';
export { fetchPlanBenefits } from './services/planBenefitsService';
export { submitQuery } from './services/queryService';

export * from './constants/subscription.constants';
