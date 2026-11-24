import { clearLegacyToken } from "@/services/api/authToken";

// Keys older builds wrote that nothing reads any more. One of them held the
// subscription order with the brand's PAN / GSTIN; the other a second copy of
// the session token. Removed once at start-up so an existing browser keeps no
// copy (the current builds never write them).
const LEGACY_SESSION_KEYS = ["trydood_pending_order"];

export function purgeLegacyStorage() {
  clearLegacyToken();
  try {
    LEGACY_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* storage blocked — nothing to clear */
  }
}
