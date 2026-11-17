// Onboarding v3 covers login → partnership deed. Everything after the deed
// (plan, checkout, brand outlet, under review) is the existing production UI.

export const ONBOARDING_ROUTES = Object.freeze({
  LOGIN: "/",
  WIZARD: "/onboarding",
  PLAN: "/subscription",
  CHECKOUT: "/subscription/checkout",
  OUTLET: "/brand-outlet",
  VERIFY: "/verification",
  STATUS: "/under-review",
});

// Production dashboard a live vendor lands on.
export const LIVE_DASHBOARD_ROUTE = "/analysis-report";

// Backend `user.currentScreen` → the page a returning vendor resumes on.
// Screens not listed here are wizard screens (→ ONBOARDING_ROUTES.WIZARD).
export const SCREEN_ROUTES = Object.freeze({
  SUBSCRIBE_PLAN: ONBOARDING_ROUTES.PLAN,
  OUTLET_PAGE: ONBOARDING_ROUTES.OUTLET,
  UNDER_REVIEW: ONBOARDING_ROUTES.STATUS,
  DASHBOARD: LIVE_DASHBOARD_ROUTE,
});
