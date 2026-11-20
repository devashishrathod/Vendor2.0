// Onboarding v2 routes and the ONE map from the server's `currentScreen` to
// the page that shows it. Every routing decision (login, guards, back button,
// after a save) goes through routeForScreen() — the panel never works out the
// next screen itself.

import { SCREENS } from "./screens";

export const ONBOARDING_ROUTES = Object.freeze({
  LOGIN: "/",
  WIZARD: "/onboarding",
  PLAN: "/subscription",
  CHECKOUT: "/subscription/checkout",
  // Brand details, outlets and the review page (reworked in Milestone B).
  OUTLET: "/brand-outlet",
  STATUS: "/under-review",
});

// Approved vendors land on the dashboard group's default page.
export const LIVE_DASHBOARD_ROUTE = "/analysis-report";

/** All 17 server screens → page. */
export const SCREEN_ROUTES = Object.freeze({
  [SCREENS.BRAND_NAME]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.BUSINESS_CATEGORY]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.REGISTRATION_STATUS]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.GST_VERIFICATION]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.PAN_VERIFICATION]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.REGISTRATION_ENTITY_TYPE]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.OWNER_VERIFICATION]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.KYC_DOCUMENTS]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.BANK_VERIFICATION]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.PARTNERSHIP_DEED]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.SUBSCRIBE_PLAN]: ONBOARDING_ROUTES.PLAN,
  [SCREENS.BRAND_BASIC_DETAILS]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.BRAND_PROFESSIONAL_DETAILS]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.OUTLET_DETAILS]: ONBOARDING_ROUTES.WIZARD,
  [SCREENS.ONBOARDING_REVIEW]: ONBOARDING_ROUTES.OUTLET,
  [SCREENS.UNDER_REVIEW]: ONBOARDING_ROUTES.STATUS,
  [SCREENS.DASHBOARD]: LIVE_DASHBOARD_ROUTE,
});

/**
 * The page for a server screen. An unknown screen opens the wizard, which
 * says it can't show it (never guesses another screen).
 * @param {string|null|undefined} screen
 * @returns {string}
 */
export const routeForScreen = (screen) => SCREEN_ROUTES[screen] ?? ONBOARDING_ROUTES.WIZARD;

/** True when the screen is shown inside the wizard shell (/onboarding). */
export const isWizardScreen = (screen) => SCREEN_ROUTES[screen] === ONBOARDING_ROUTES.WIZARD;
