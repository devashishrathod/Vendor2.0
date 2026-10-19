// Thin wrapper over the global gtag() loaded in index.html. Every call is a
// no-op when gtag isn't there (ad blockers, script failed to load), so
// tracking can never break a vendor's flow.

function callGtag(...args) {
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag(...args);
  } catch (error) {
    console.error("gtag call failed:", error);
  }
}

/**
 * Send a GA4 page_view. index.html sets `send_page_view: false`, so every
 * page view — including the first one — comes from here.
 * @param {string} path  path (+ query) to report, e.g. "/onboarding/pan-verification"
 * @param {string} [title]
 */
export function trackPageView(path, title = document.title) {
  callGtag("event", "page_view", {
    page_path:     path,
    page_location: window.location.origin + path,
    page_title:    title,
  });
}

/**
 * @param {string} name   one of ANALYTICS_EVENTS
 * @param {Object} [params]
 */
export function trackEvent(name, params = {}) {
  callGtag("event", name, params);
}

/**
 * Tie later events to the logged-in vendor. Pass the backend user id only —
 * never a phone number or email (GA forbids PII). Pass null on logout.
 * @param {string|null} userId
 */
export function setAnalyticsUser(userId) {
  callGtag("set", { user_id: userId ?? null });
}
