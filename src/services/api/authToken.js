// The session token lives in one place: the auth store (useAuthStore), which
// persists it under "auth-storage". The axios clients read the store; the
// fetch clients read the same persisted value here, so no client can send a
// token the store no longer has.

const AUTH_STORAGE_KEY = "auth-storage";

// Older builds also wrote the token under its own key. Nothing reads it now;
// logout removes it so an old session leaves nothing behind.
const LEGACY_TOKEN_KEY = "token";

/**
 * The signed-in vendor's token, or null.
 * @returns {string|null}
 */
export function getAuthToken() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null")?.state?.token ?? null;
  } catch {
    return null;
  }
}

/** Removes the token key older builds wrote. */
export function clearLegacyToken() {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* storage blocked — nothing to clear */
  }
}
