import { useCallback, useState } from "react";
import EmailVerifyModal from "@/features/brand/components/EmailVerifyModal";
import MobileVerifyModal from "@/features/brand/components/MobileVerifyModal";
import { useSavedBrand, useSavedBrandStore } from "../store/brandStore";
import { useOnboardingStatusStore } from "../store/statusStore";

/**
 * Profile strength items confirmed with an OTP (POST /auth/email/* and
 * /auth/mobile/*), not on a wizard screen. On the dashboard they link to
 * /account-information; during onboarding that page isn't open, so the same
 * modals open right where the strength card is.
 */
export const CONTACT_VERIFY_KEYS = Object.freeze(["EMAIL_VERIFIED", "MOBILE_VERIFIED"]);

/**
 * `open(key)` shows the email / mobile OTP modal, prefilled with the brand's
 * saved address / number. A verify re-reads the status (strength) and the
 * brand, then closes — the item leaves the card.
 * @returns {{ open: (key: string) => void, modal: import('react').ReactNode }}
 */
export function useContactVerify() {
  const { brand } = useSavedBrand();
  const loadBrand = useSavedBrandStore((s) => s.load);
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const [openKey, setOpenKey] = useState(null);

  const close = useCallback(() => setOpenKey(null), []);

  const onVerified = useCallback(async () => {
    try {
      await Promise.all([fetchStatus(), loadBrand({ force: true })]);
    } catch (error) {
      console.error("Refresh after contact verify failed:", error);
    } finally {
      setOpenKey(null);
    }
  }, [fetchStatus, loadBrand]);

  let modal = null;
  if (openKey === "EMAIL_VERIFIED") {
    modal = <EmailVerifyModal currentEmail={brand?.email ?? ""} onClose={close} onVerified={onVerified} />;
  } else if (openKey === "MOBILE_VERIFIED") {
    modal = <MobileVerifyModal currentMobile={brand?.mobile ?? ""} onClose={close} onVerified={onVerified} />;
  }

  return { open: setOpenKey, modal };
}
