import { useState, useEffect } from "react";
import { useAddOutletForm } from "../hooks/useAddOutletForm";
import { useBrand } from "../../../hooks/useBrand";
import { loginOrSignUpWithWhatsapp, verifyOtpWhatsapp } from "../services/subBrandApi";
import OtpVerifyModal from "@/features/oulet/New folder/components/brandOutlet/modals/OtpVerifyModal";
import DisabledHint from "@/components/common/DisabledHint";
import ErrorToast from "@/components/common/ErrorToast";
import SuccessToast from "@/components/common/SuccessToast";
import Select from "../../../components/common/Select";
import {
  LiveLocationPicker,
  LocationModeTabs,
  MapModal,
  OutletLocationSearch,
  SavedLocationsList,
} from "./location/OutletLocationPicker";

const inputBase =
  "w-full rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-100 bg-emerald-50 dark:bg-emerald-500/10 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100";

// ─── Outlet Type options (Outlet vs Franchise) ─────────────────────────────
// Kept local to this file since it's only used here + in CreateBrandOutlet.
// Move to constants/outletConstants.js if you want a single shared source.
const OUTLET_TYPE_OPTIONS = [
  { value: "outlet", label: "Outlet" },
  { value: "franchise", label: "Franchise" },
];

const isValidPhone = (v) => /^[0-9]{10}$/.test((v || "").replace(/\D/g, ""));

// Chip on the picked-location card: nothing is saved until Create Outlet.
const PICKED_CHIP = {
  label: "Selected",
  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export default function AddOutletModal({ onClose, onCreated }) {
  const { brand } = useBrand();
  const {
    form,
    update,
    updateWhatsapp,
    setBrandId,
    setLocation,
    selectSavedLocation,
    retryLocationWithZipcode,
    savedLocations,
    loadingSavedLocations,
    loadSavedLocations,
    submit,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
  } = useAddOutletForm((created) => {
    onCreated?.(created);
    onClose();
  });

  const brandId = brand?._id;

  useEffect(() => {
    if (brandId) {
      setBrandId(brandId);
      loadSavedLocations({ brandId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  // ── Outlet WhatsApp Number — verified BEFORE anything is created:
  //   • First outlet's number (default): brands/get's
  //     firstSubBrand.whatsappNumber — already verified, nothing to do.
  //   • A different number: "Send OTP" only sends an OTP
  //     (auth/loginOrSignUp-with-whatsapp) and "Confirm" verifies it
  //     (auth/verify-otp-whatsapp). No outlet is created here.
  // The outlet itself is only created by Create Outlet (see
  // useAddOutletForm's submit).
  //
  // (Variable names still say "brand number" — it's the first outlet's
  // number, NOT brand.whatsappNumber.)
  const brandWhatsappNumber = brand?.firstSubBrand?.whatsappNumber || "";
  // The backend may refuse to reuse a number ("already registered with this
  // number") when Create Outlet runs — then this flips, the error shows in a
  // toast, and the form moves to "different number".
  const [brandNumberTaken, setBrandNumberTaken] = useState(false);
  const [useBrandNumberChoice, setUseBrandNumberChoice] = useState(true);
  const useBrandNumber = useBrandNumberChoice && !!brandWhatsappNumber && !brandNumberTaken;
  const outletNumber = useBrandNumber ? brandWhatsappNumber : form.whatsapp.number;
  const numberVerified = useBrandNumber || form.whatsapp.verified;

  const [sendingOtp, setSendingOtp] = useState(false);
  const [numberError, setNumberError] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpConfirming, setOtpConfirming] = useState(false);

  // Any number change invalidates the verification — and an outlet made by
  // an earlier, failed Create Outlet attempt belongs to the OLD number.
  const resetNumberState = () => {
    updateWhatsapp({ verified: false });
    update("subBrandId", null);
    setNumberError("");
    setOtpOpen(false);
    setOtpValue("");
    setOtpError("");
  };

  const handleUseBrandNumberToggle = (checked) => {
    setUseBrandNumberChoice(checked);
    updateWhatsapp({ number: "" });
    resetNumberState();
  };

  const handleOutletWhatsappChange = (value) => {
    updateWhatsapp({ number: value.replace(/\D/g, "").slice(0, 10) });
    resetNumberState();
  };

  // Different number — send the OTP only (no outlet is created).
  const sendNumberOtp = async () => {
    setSendingOtp(true);
    setNumberError("");
    setOtpError("");
    try {
      await loginOrSignUpWithWhatsapp({ whatsappNumber: outletNumber });
      setOtpOpen(true);
    } catch (err) {
      // A rate-limited send still means a valid OTP already went out.
      if (err?.details?.retryAfterSeconds) setOtpOpen(true);
      setNumberError(err?.message || "Couldn't send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const resendNumberOtp = async () => {
    setSendingOtp(true);
    setOtpError("");
    try {
      await loginOrSignUpWithWhatsapp({ whatsappNumber: outletNumber });
    } catch (err) {
      setOtpError(err?.message || "Couldn't resend OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const confirmNumberOtp = async () => {
    if (otpValue.length < 4 || otpConfirming) return;
    setOtpConfirming(true);
    setOtpError("");
    try {
      await verifyOtpWhatsapp({ whatsappNumber: outletNumber, otp: otpValue });
      updateWhatsapp({ number: outletNumber, verified: true });
      setOtpOpen(false);
      setOtpValue("");
    } catch (err) {
      setOtpError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpConfirming(false);
    }
  };

  const closeOtp = () => {
    setOtpOpen(false);
    setOtpValue("");
    setOtpError("");
  };

  // "Change" / "Use a different number" — back to entering a number.
  const changeOutletNumber = () => {
    if (useBrandNumber) {
      handleUseBrandNumberToggle(false);
    } else {
      resetNumberState();
    }
  };

  const sendOtpBlockedReason = !isValidPhone(outletNumber) ? "Enter a 10-digit number" : "";

  // ── Outlet Location — picked only; saved by Create Outlet ──
  const [showMap, setShowMap] = useState(false);
  const [selectedSavedLocationId, setSelectedSavedLocationId] = useState(null);

  const handleSelectSavedLocation = (loc) => {
    setSelectedSavedLocationId(loc._id);
    selectSavedLocation(loc);
  };

  const handleSelectPlace = (place) => {
    setSelectedSavedLocationId(null);
    setLocation(place);
  };

  const switchLocationMode = (mode) => {
    update("locationMode", mode);
    setLocation(null);
    setSelectedSavedLocationId(null);
  };

  const pickerProps = {
    selectedPlace: form.location,
    onSelectPlace: handleSelectPlace,
    onShowMap: () => setShowMap(true),
    locationSaving: false,
    locationSaved: false,
    locationError: form.locationError,
    onRetryZipcode: retryLocationWithZipcode,
    createLocationButton: null,
    // No override while there's an error, so the card shows its red "Not saved" chip.
    statusOverride: form.locationError ? undefined : PICKED_CHIP,
    waitingNote: form.locationError ? null : "This location is saved together with the outlet when you click Create Outlet.",
  };

  // ── Create Outlet ──
  const createBlockedReason = !form.outletType
    ? "Choose the outlet type first"
    : !numberVerified
      ? "Verify the outlet's WhatsApp number first"
      : !form.location
        ? "Pick the outlet's location first"
        : "";

  const handleCreateOutlet = async () => {
    const result = await submit({ whatsappNumber: outletNumber, numberVerified });
    // The first outlet's number can't be reused → switch to "different
    // number" so the vendor can verify a new one (toast shows the reason).
    if (!result.success && useBrandNumber && /already registered/i.test(result.error || "")) {
      setBrandNumberTaken(true);
      updateWhatsapp({ number: "", verified: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="no-scrollbar bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-4 sticky top-0 z-10 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="flex-1 text-base font-bold text-gray-900 dark:text-gray-100">Add Outlet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Outlet Type (Outlet vs Franchise) ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Outlet Type *</label>
            <Select
              value={form.outletType}
              onChange={(value) => update("outletType", value)}
              options={OUTLET_TYPE_OPTIONS}
              placeholder="eg : Outlet"
              className="bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
            />
          </div>

          {/* ── Active ── */}
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            Active
          </label>

          {/* ── Outlet WhatsApp Number ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Outlet WhatsApp Number *</label>

            {numberVerified ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100">{outletNumber}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    </span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                      {useBrandNumber ? "First outlet's WhatsApp number" : "Verified with OTP"}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={changeOutletNumber}
                  disabled={submitting}
                  className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                >
                  {useBrandNumber ? "Use a different number" : "Change"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={outletNumber}
                    onChange={(e) => handleOutletWhatsappChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !sendOtpBlockedReason && !sendingOtp) {
                        e.preventDefault();
                        sendNumberOtp();
                      }
                    }}
                    placeholder="eg : 9876543210"
                    className={inputBase}
                  />
                  <DisabledHint show={!!sendOtpBlockedReason && !sendingOtp} message={sendOtpBlockedReason}>
                    <button
                      type="button"
                      onClick={sendNumberOtp}
                      disabled={!!sendOtpBlockedReason || sendingOtp}
                      className="shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-colors bg-emerald-500 text-white hover:bg-emerald-600 disabled:pointer-events-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400"
                    >
                      {sendingOtp ? "Sending…" : "Send OTP"}
                    </button>
                  </DisabledHint>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  {brandNumberTaken
                    ? `${brandWhatsappNumber} is already registered to an outlet — enter a new number and verify it with an OTP.`
                    : "Verify this number with the OTP sent on WhatsApp. The outlet is only created when you click Create Outlet."}
                </p>

                {brandWhatsappNumber && !brandNumberTaken && (
                  <button
                    type="button"
                    onClick={() => handleUseBrandNumberToggle(true)}
                    disabled={sendingOtp}
                    className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    Use first outlet's number ({brandWhatsappNumber}) instead
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Outlet Location ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Outlet Location *</label>

            <SavedLocationsList
              locations={savedLocations}
              loading={loadingSavedLocations}
              selectedId={selectedSavedLocationId}
              onSelect={handleSelectSavedLocation}
            />

            <LocationModeTabs mode={form.locationMode} onChange={switchLocationMode} />

            {form.locationMode === "search" ? (
              <OutletLocationSearch {...pickerProps} />
            ) : (
              <LiveLocationPicker {...pickerProps} />
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-gray-600 dark:text-gray-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <DisabledHint show={!!createBlockedReason && !submitting} message={createBlockedReason} className="flex-1">
            <button
              onClick={handleCreateOutlet}
              disabled={submitting || !!createBlockedReason}
              className="flex w-full items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm tracking-wide shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors disabled:pointer-events-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating outlet…
                </>
              ) : (
                "Create Outlet"
              )}
            </button>
          </DisabledHint>
        </div>
      </div>

      {/* Wrapper stops clicks inside the OTP popup from bubbling up to
          this modal's own backdrop (which would close Add Outlet). */}
      {otpOpen && !form.whatsapp.verified && (
        <div onClick={(e) => e.stopPropagation()}>
          <OtpVerifyModal
            phone={outletNumber}
            otpValue={otpValue}
            onOtpChange={setOtpValue}
            otpError={otpError}
            onConfirm={confirmNumberOtp}
            onClose={closeOtp}
            onResend={resendNumberOtp}
            resending={sendingOtp}
            confirming={otpConfirming}
          />
        </div>
      )}

      {showMap && form.location && (
        <MapModal
          lat={form.location.lat}
          lng={form.location.lng}
          label={form.location.name}
          onClose={() => setShowMap(false)}
        />
      )}

      <ErrorToast
        error={error || numberError ? { message: error || numberError } : null}
        onDismiss={() => {
          clearError();
          setNumberError("");
        }}
      />
      <SuccessToast message={successMessage} onDismiss={clearSuccessMessage} />
    </div>
  );
}
