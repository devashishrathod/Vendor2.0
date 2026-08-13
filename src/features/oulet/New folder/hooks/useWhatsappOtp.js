import { useState } from "react";
import {
  sendOutletWhatsappOtp,
  loginOrSignUpWithWhatsapp,
  verifyOtpWhatsapp,
} from "../services/brandOutletApi";

export const isValidPhone = (v) => /^[0-9]{10}$/.test((v || "").replace(/\D/g, ""));

/**
 * Encapsulates the "outlet WhatsApp number + OTP verification" flow,
 * including the "same as brand number" shortcut. A fresh OTP is required
 * the first time this outlet's number is set — UNLESS the outlet is
 * already verified (see hydrateVerified below), in which case we skip
 * straight to the verified state instead of re-sending an OTP.
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
  // hydrateVerified confirms an already-verified subBrand on mount.
  // finalizeOutlet / upsertWorkHours downstream both need this — and it
  // MUST be the outlet's subBrandId, never the user/login _id.
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
  // (an existing outlet on mount) rather than a fresh OTP confirm in this
  // session. Lets the UI show "already verified" copy if you want it.
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

  // ── First send: create the subBrand shell + trigger the OTP ────────
  const sendOtp = async () => {
    if (!isValidPhone(outletWhatsapp)) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await sendOutletWhatsappOtp({
        brandId,
        whatsappNumber: outletWhatsapp,
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

  // ── Resend / reset: subBrand shell already exists, just re-fire the
  // OTP via loginOrSignUp-with-whatsapp. Doesn't touch subBrandId. ──
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

  // ── Hydrate from an already-verified outlet (call on mount) ────────
  // Skips OTP entirely: sets outletWhatsapp/subBrandId/whatsappVerified
  // directly from a prior sendOutletWhatsappOtp result found via
  // getBrandWithSubBrand(). Does NOT call sendOtp / loginOrSignUpWithWhatsapp
  // / verifyOtpWhatsapp — no network request, no new OTP token generated.
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
  };
}