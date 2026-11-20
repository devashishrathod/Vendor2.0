// Where a notification (bell row or push) takes the vendor, and what its
// button says. The link is the top-level `deepLink` (push payloads) or
// `meta.deepLink` (GET /notifications/get-all — API doc #18 note 5). It can be
// a token ("outlets") or a server path ("/dashboard", "/onboarding/status")
// that isn't a panel route, so both go through one map; anything unknown
// falls back to the notification type.

// Tokens and server paths seen on stage / in the docs → panel routes.
const LINK_ROUTES = Object.freeze({
  outlets: "/outlets",
  "/outlets": "/outlets",
  dashboard: "/analysis-report",
  "/dashboard": "/analysis-report",
  subscription: "/subscription-plan",
  "/dashboard/subscription": "/subscription-plan",
  "onboarding/status": "/under-review",
  "/onboarding/status": "/under-review",
  refunds: "/refunds",
  vouchers: "/vouchers",
});

// Panel routes a path may already be.
const PANEL_PREFIXES = [
  "/analysis-report",
  "/vouchers",
  "/transactions",
  "/settlement",
  "/refunds",
  "/outlets",
  "/account-information",
  "/subscription-plan",
  "/subscription",
  "/under-review",
  "/more",
  "/music",
];

// Type → default target + button label (first match wins).
const TYPE_TARGETS = [
  [/^SUBSCRIPTION_|^LIMIT_REACHED$/, { to: "/subscription-plan", label: "View plan" }],
  [/^REFUND/, { to: "/refunds", label: "Open refunds" }],
  [/^OUTLET_/, { to: "/outlets", label: "View outlets" }],
  [/^BRAND_DOCUMENT_REVIEWED$/, { to: "/account-information?tab=documents", label: "Open documents" }],
  [/^BRAND_DETAILS_UPDATED_BY_ADMIN$/, { to: "/account-information", label: "See your details" }],
  [/^BRAND_APPROVED$/, { to: "/under-review", label: "Continue" }],
  [/^BRAND_/, { to: "/under-review", label: "See review status" }],
];

const typeTarget = (type) => TYPE_TARGETS.find(([pattern]) => pattern.test(String(type ?? "")))?.[1] ?? null;

/** A raw link → panel route, or null when it isn't one the panel knows. */
function routeForLink(raw) {
  if (!raw || typeof raw !== "string") return null;
  const link = raw.replace(/^https?:\/\/[^/]+/i, "").trim();
  if (LINK_ROUTES[link]) return LINK_ROUTES[link];
  if (link.startsWith("/onboarding")) return "/under-review";
  if (PANEL_PREFIXES.some((prefix) => link === prefix || link.startsWith(`${prefix}/`) || link.startsWith(`${prefix}?`))) return link;
  return null;
}

/**
 * @param {{ type?: string, deepLink?: string, meta?: { deepLink?: string, deeplink?: string } }} notification
 * @returns {{ to: string, label: string } | null}
 */
export function notificationTarget(notification) {
  if (!notification) return null;
  const byType = typeTarget(notification.type);
  const to = routeForLink(notification.deepLink ?? notification.meta?.deepLink ?? notification.meta?.deeplink) ?? byType?.to ?? null;
  return to ? { to, label: byType?.label ?? "Open" } : null;
}

/**
 * Notices that change what the panel shows (review state, legal details,
 * documents, outlets) — the onboarding status and profile are read again
 * when one arrives or is opened.
 * @param {string|undefined} type
 */
export const refreshesProfile = (type) => /^(BRAND_|OUTLET_)/.test(String(type ?? ""));
