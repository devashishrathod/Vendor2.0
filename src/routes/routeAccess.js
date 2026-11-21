import { routeForScreen } from '@/features/onboarding-v2/config/routes';

// Pages a DASHBOARD vendor may be on: the whole ProtectedRoute><DashboardLayout>
// block in App.jsx (Transactions, Vouchers, Settlements, More, Account
// Information, Outlets, Music, Subscription Page, Settings), plus the Plan &
// Billing "Upgrade" side-flow (/subscription, /subscription/checkout — not
// wrapped in DashboardLayout, but still a legitimate place for a
// DASHBOARD-screen vendor to be). A page missing here meant one browser
// back/forward press force-redirected to /analysis-report instead of moving
// through that page's own history. `startsWith` means one entry also covers
// its own sub-routes (e.g. "/vouchers" covers "/vouchers/:id/edit").
const DASHBOARD_GROUP_PREFIXES = [
  "/analysis-report",
  "/transactions",
  "/vouchers",
  "/settlement", // covers both /settlements (list) and /settlement/:id (detail)
  "/more",
  "/account-information",
  "/outlets",
  "/music",
  "/subscription-plan",
  "/settings",
  "/subscription", // Upgrade flow: /subscription (plan picker) + /subscription/checkout
  "/under-review", // revoked / re-approved vendors stay on DASHBOARD; the page itself sends others back
];

// The Plan & Billing "Upgrade" side-flow (/subscription →
// /subscription/checkout) is reachable whatever onboarding screen a vendor
// is on — it isn't tied to one SCREEN_ROUTES entry.
const ALWAYS_ALLOWED_PREFIXES = ["/subscription"];

/**
 * Whether a vendor on `currentScreen` (GET /brands/onboarding/status) may be
 * on `pathname`. The back / forward guard and the notification-click route
 * both ask this.
 * @param {string|null|undefined} currentScreen
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPathAllowed(currentScreen, pathname) {
  if (ALWAYS_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (currentScreen === "DASHBOARD") {
    return DASHBOARD_GROUP_PREFIXES.some((p) => pathname.startsWith(p));
  }
  return pathname === routeForScreen(currentScreen);
}
