import { onSessionEnd } from "@/services/http/apiError";
import { useAuthStore } from "../store/authStore";

// What the panel does when any request comes back with a session-end code
// (401 TOKEN_EXPIRED / SESSION_EXPIRED / ACCOUNT_DEACTIVATED / … or 403
// TOKEN_INVALID): log out and go back to login, showing the server's message
// there once (e.g. "Your account is deactivated. Please contact support.").

const NOTICE_KEY = "session-end-notice";

let ending = false;

/** Registers the session-end handler. Call once, before the app renders. */
export function installSessionEndHandler() {
  onSessionEnd((error) => {
    // Several requests can fail at once — log out only the first time.
    if (ending) return;
    ending = true;
    try {
      sessionStorage.setItem(NOTICE_KEY, error?.message || "Your session has ended. Please log in again.");
    } catch {
      /* storage blocked — the login screen just shows no notice */
    }
    useAuthStore.getState().logout();
    window.location.replace("/");
  });
}

/** The message to show on the login screen after a forced logout, if any. */
export function readSessionEndNotice() {
  try {
    return sessionStorage.getItem(NOTICE_KEY);
  } catch {
    return null;
  }
}

export function clearSessionEndNotice() {
  try {
    sessionStorage.removeItem(NOTICE_KEY);
  } catch {
    /* storage blocked — nothing to clear */
  }
}
