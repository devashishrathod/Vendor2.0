// Where a notification (bell row, push toast or OS notification click) takes
// the vendor, and what its button says. The link is the top-level `deepLink`
// (push payloads) or `meta.deepLink` (GET /notifications/get-all — API doc
// #18 note 5). It is a token ("outlets"), a logical path ("onboarding/status",
// "onboarding/review", "dashboard" — API doc NOTIFICATION_TYPES), or a path,
// with or without the leading slash; all of them go through one map, and
// anything unknown falls back to the notification type.

/**
 * Where an OS notification click lands (`?type=…&link=…`); the app resolves it
 * with notificationTarget(). public/firebase-messaging-sw.js opens this path.
 */
export const NOTIFICATION_OPEN_PATH = "/notifications/open";

// Logical / server paths that aren't panel routes → panel routes.
const LINK_ROUTES = Object.freeze({
  "/dashboard": "/analysis-report",
  "/dashboard/subscription": "/subscription-plan",
  "/subscription": "/subscription-plan",
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

// Review / legal notices carry a logical path, not a panel route. The panel's
// own page for the type wins; /under-review then settles the final screen
// from GET /brands/onboarding/status (congrats, remediation or dashboard).
const TYPE_FIRST = /^BRAND_/;

const typeTarget = (type) => TYPE_TARGETS.find(([pattern]) => pattern.test(String(type ?? "")))?.[1] ?? null;

/** A raw link → panel route, or null when it isn't one the panel knows. */
function routeForLink(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.replace(/^https?:\/\/[^/]+/i, "").trim();
  if (!trimmed) return null;
  const link = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (LINK_ROUTES[link]) return LINK_ROUTES[link];
  if (link.startsWith("/onboarding")) return "/under-review";
  if (PANEL_PREFIXES.some((prefix) => link === prefix || link.startsWith(`${prefix}/`) || link.startsWith(`${prefix}?`))) return link;
  return null;
}

/**
 * @param {{ type?: string|null, deepLink?: string|null, meta?: { deepLink?: string, deeplink?: string } }} notification
 * @returns {{ to: string, label: string } | null}
 */
export function notificationTarget(notification) {
  if (!notification) return null;
  const byType = typeTarget(notification.type);
  const byLink = routeForLink(notification.deepLink ?? notification.meta?.deepLink ?? notification.meta?.deeplink);
  const to = TYPE_FIRST.test(String(notification.type ?? "")) ? byType?.to ?? byLink : byLink ?? byType?.to;
  return to ? { to, label: byType?.label ?? "Open" } : null;
}

/**
 * Notices that change what the panel shows (review state, legal details,
 * documents, outlets) — the onboarding status and profile are read again
 * when one arrives or is opened.
 * @param {string|undefined|null} type
 */
export const refreshesProfile = (type) => /^(BRAND_|OUTLET_)/.test(String(type ?? ""));
