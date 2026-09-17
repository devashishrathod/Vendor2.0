import { useState } from "react";
import {
  sendOutletWhatsappOtp,
  loginOrSignUpWithWhatsapp,
  verifyOtpWhatsapp,
} from "../services/brandOutletApi";

export const isValidPhone = (v) => /^[0-9]{10}$/.test((v || "").replace(/\D/g, ""));

/**
 * Encapsulates the "outlet WhatsApp number + OTP verification" flow,
 * including the "same as brand number" shortcut.
 *
 * Three flows this hook supports (mirrors the three brands/get outcomes):
 *
 *   Case 1 — firstSubBrand exists AND is already verified
 *     → call hydrateVerified() on mount. No network call, no OTP needed.
 *
 *   Case 2 — firstSubBrand exists but is NOT verified yet
 *     → call hydrateUnverifiedShell() on mount. This sets subBrandId
 *       (the shell already exists on the backend) WITHOUT marking
 *       whatsappVerified. The caller's "Verify" button must then call
 *       resetOtp() (NOT sendOtp()) the first time, since re-running
 *       subBrands/signUp-with-whatsapp would try to recreate a shell
 *       that's already there. resetOtp() only hits
 *       auth/loginOrSignUp-with-whatsapp to (re)send the OTP.
 *
 *   Case 3 — no firstSubBrand at all (brand-new outlet)
 *     → nothing to hydrate. The first "Verify" click calls sendOtp(),
 *       which creates the subBrand shell (subBrands/signUp-with-whatsapp)
 *       AND sends the first OTP (auth/loginOrSignUp-with-whatsapp).
 *
 * The caller is expected to decide sendOtp vs resetOtp for the "Verify"
 * button based on whether subBrandId is already truthy (see
 * CreateBrandOutlet.jsx's handleVerifyClick) — this hook just exposes
 * both primitives plus the hydrate helpers for cases 1 and 2.
 *
 * @param {object} opts
 * @param {string} opts.brandId
 * @param {string} opts.brandWhatsappNumber
 * @param {boolean} [opts.isFirstOutlet] - forwarded to subBrands/signUp-with-whatsapp
 */
export function useWhatsappOtp({ brandId, brandWhatsappNumber, isFirstOutlet } = {}) {
  const [outletWhatsapp, setOutletWhatsapp] = useState("");
  const [useBrandNumber, setUseBrandNumber] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  // Set once sendOtp's signUp-with-whatsapp call succeeds, OR once
  // hydrateVerified / hydrateUnverifiedShell confirms an existing
  // subBrand on mount (verified or not). finalizeOutlet / upsertWorkHours
  // downstream both need this — and it MUST be the outlet's subBrandId,
  // never the user/login _id.
  const [subBrandId, setSubBrandId] = useState(null);

  const [otpStage, setOtpStage] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Real backend doesn't return a dev OTP — this stays null/undefined in
  // production. Left wired through in case a non-prod response ever
  // includes one (e.g. a `data.devOtp` field on a staging environment),
  // so OtpVerifyModal doesn't need to change either way.
  const [devOtpHint, setDevOtpHint] = useState(null);

  // True only when the current verified state came from hydrateVerified
  // (an existing, already-verified outlet on mount) rather than a fresh
  // OTP confirm in this session. Lets the UI show "already verified" copy
  // if you want it. NOT set by hydrateUnverifiedShell, since that case
  // still needs a live OTP confirm before it's actually verified.
  const [hydrated, setHydrated] = useState(false);

  const resetOtpUiState = () => {
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
    setDevOtpHint(null);
  };

  const handleUseBrandNumberToggle = (checked) => {
    setUseBrandNumber(checked);
    resetOtpUiState();
    // Always require a fresh OTP verification for this outlet, even when the
    // number is copied over from the brand profile.
    setWhatsappVerified(false);
    setSubBrandId(null);
    setHydrated(false);
    setOutletWhatsapp(checked ? brandWhatsappNumber : "");
  };

  const handleOutletWhatsappChange = (value) => {
    setOutletWhatsapp(value);
    setWhatsappVerified(false);
    setSubBrandId(null);
    setHydrated(false);
    resetOtpUiState();
  };

  // ── First send (Case 3 — no shell exists yet): create the subBrand
  // shell + trigger the OTP. ─────────────────────────────────────────
  const sendOtp = async (outletType) => {
    if (!isValidPhone(outletWhatsapp)) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await sendOutletWhatsappOtp({
        brandId,
        whatsappNumber: outletWhatsapp,
        outletType,
        isFirstOutlet,
      });
      const created = res?.data ?? res;
      // ⚠️ FIXED: was created?._id (the SUB_VENDOR user id) — must be
      // subBrandId (the actual outlet doc id), per brandOutletApi.js's
      // own warning comments on this response shape.
      setSubBrandId(created?.subBrandId || null);
      setDevOtpHint(created?.devOtp || res?.devOtp || null);
      setOtpStage(true);
    } catch (err) {
      setOtpError(err.message || "Couldn't send OTP. Try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // ── Resend / reset (Case 2 — shell already exists, OR mid-flow resend
  // in Case 3 after sendOtp already ran once): subBrand shell already
  // exists, just re-fire the OTP via loginOrSignUp-with-whatsapp. Doesn't
  // touch subBrandId, doesn't call signUp-with-whatsapp again. ─────────
  const resetOtp = async () => {
    if (!isValidPhone(outletWhatsapp)) return;
    setOtpSending(true);
    setOtpError("");
    setOtpValue("");
    try {
      const res = await loginOrSignUpWithWhatsapp({ whatsappNumber: outletWhatsapp });
      setDevOtpHint(res?.data?.devOtp || res?.devOtp || null);
      setOtpStage(true);
    } catch (err) {
      setOtpError(err.message || "Couldn't resend OTP. Try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const confirmOtp = async () => {
    if (otpValue.length < 4) return;
    setOtpError("");
    try {
      await verifyOtpWhatsapp({ whatsappNumber: outletWhatsapp, otp: otpValue });
      setWhatsappVerified(true);
      setHydrated(false); // this verification happened live, not from prefill
      setOtpStage(false);
      setOtpValue("");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP. Try again.");
    }
  };

  const closeOtpModal = () => {
    resetOtpUiState();
  };

  // ── Case 1: hydrate from an already-verified outlet (call on mount) ──
  // Skips OTP entirely: sets outletWhatsapp/subBrandId/whatsappVerified
  // directly from a prior sendOutletWhatsappOtp result found via
  // getBrandById()'s firstSubBrand. Does NOT call sendOtp / resetOtp /
  // confirmOtp — no network request, no new OTP token generated.
  //
  // @param {object} info
  // @param {string} info.subBrandId  - MUST be the real subBrandId, not _id
  // @param {string} [info.whatsappNumber]
  const hydrateVerified = ({ subBrandId: id, whatsappNumber } = {}) => {
    if (!id) return;
    resetOtpUiState();
    setSubBrandId(id);
    setWhatsappVerified(true);
    setHydrated(true);
    if (whatsappNumber) {
      setOutletWhatsapp(whatsappNumber);
      // If the hydrated number matches the brand's number, keep the
      // "use brand number" checkbox in sync so the UI doesn't look off.
      if (whatsappNumber === brandWhatsappNumber) setUseBrandNumber(true);
    }
  };

  // ── Case 2: hydrate from an EXISTING-but-UNVERIFIED outlet (call on
  // mount). The subBrand shell already exists on the backend (so we must
  // NOT call sendOtp / signUp-with-whatsapp again — that would try to
  // recreate it) but its WhatsApp number was never confirmed with an OTP.
  //
  // This only sets subBrandId + outletWhatsapp; whatsappVerified stays
  // false and hydrated stays false, so the UI still shows the "Verify"
  // button and still requires an OTP confirm. The caller's "Verify"
  // click, however, should route to resetOtp() instead of sendOtp() once
  // subBrandId is already known — see CreateBrandOutlet.jsx.
  //
  // @param {object} info
  // @param {string} info.subBrandId  - MUST be the real subBrandId, not _id
  // @param {string} [info.whatsappNumber]
  const hydrateUnverifiedShell = ({ subBrandId: id, whatsappNumber } = {}) => {
    if (!id) return;
    resetOtpUiState();
    setSubBrandId(id);
    setWhatsappVerified(false);
    setHydrated(false);
    if (whatsappNumber) {
      setOutletWhatsapp(whatsappNumber);
      if (whatsappNumber === brandWhatsappNumber) setUseBrandNumber(true);
    }
  };

  return {
    outletWhatsapp,
    useBrandNumber,
    whatsappVerified,
    subBrandId,
    otpStage,
    otpValue,
    otpSending,
    otpError,
    devOtpHint,
    hydrated,
    setOtpValue,
    handleUseBrandNumberToggle,
    handleOutletWhatsappChange,
    sendOtp,
    resetOtp,
    confirmOtp,
    closeOtpModal,
    hydrateVerified,
    hydrateUnverifiedShell,
  };
}