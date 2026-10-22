import { useState } from "react";
import {
  resendSubBrandWhatsappOtp,
  signUpSubBrandWithWhatsapp,
  updateSubBrand,
  updateSubBrandWhatsappNumber,
} from "../services/subBrandApi";
import {
  createLocation,
  buildLocationPayloadFromPlace,
  buildLocationPayloadFromSavedLocation,
  validateLocationPayload,
  getAllLocations,
  mapLocationToSelectedPlace,
} from "../services/locationApi";

// Add Outlet:
//   1. requestOtp() — "Send OTP" creates the outlet AND sends its OTP in one
//      call (subBrands/signUp-with-whatsapp, isFirstOutlet: false). This is
//      the only way to register a new outlet number: auth/loginOrSignUp-
//      with-whatsapp refuses to create SUB_VENDOR accounts. The plan slot is
//      used here. Resend = resendSubBrandWhatsappOtp (a repeat signUp call
//      — the doc's resend); a changed number = PATCH
//      subBrands/:id/whatsapp-number (same outlet, same slot). Each number
//      can only ever belong to one outlet, so the first outlet's can't be reused.
//   2. a location is only PICKED here (kept locally, not saved);
//   3. submit() then validates the location, creates it (locations/create)
//      and sends the final subBrands/update (outletType / isActive).
// If a later step fails, locationId is kept so Create Outlet resumes.

const initialState = {
  outletType: "", // "outlet" | "franchise"
  isActive: true,

  // `verified` flips true after the OTP is confirmed.
  whatsapp: { number: "", verified: false },

  brandId: null,

  // Set by requestOtp() — the outlet and the number it currently holds.
  subBrandId: null,
  subBrandNumber: "",
  locationId: null,

  locationMode: "search", // "search" | "live"
  // { name, address, lat, lng, placeId, addressComponents, source, savedDoc? }
  location: null,
  manualZipcode: "",
  locationError: "",
};

// Pull the outlet id out of signUp-with-whatsapp's confirmed response:
// { data: { subBrand: { _id }, user: { subBrandId }, otpSent, ... } }.
function extractSubBrandId(res) {
  const data = res?.data ?? res ?? {};
  return data.subBrand?._id ?? data.user?.subBrandId ?? data.subBrandId ?? null;
}

export function useAddOutletForm(onSuccess) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Brand's previously-saved addresses — picking one can never hit
  // "missing zipcode" (each already passed validation once).
  const [savedLocations, setSavedLocations] = useState([]);
  const [loadingSavedLocations, setLoadingSavedLocations] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateWhatsapp = (patch) =>
    setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, ...patch } }));
  const setBrandId = (brandId) => setForm((prev) => ({ ...prev, brandId }));

  const clearError = () => setError("");
  const clearSuccessMessage = () => setSuccessMessage("");

  // ── Location: picks are local only ─────────────────────────────────────
  const setLocation = (location) =>
    setForm((prev) => ({ ...prev, location, manualZipcode: "", locationError: "", locationId: null }));

  const selectSavedLocation = (loc) =>
    setLocation({ ...mapLocationToSelectedPlace(loc), savedDoc: loc });

  const buildLocationPayload = (state, subBrandId) => {
    const overrides = { subBrandId, brandId: state.brandId || undefined };
    if (state.location?.savedDoc) return buildLocationPayloadFromSavedLocation(state.location.savedDoc, overrides);
    return buildLocationPayloadFromPlace(state.location, {
      ...overrides,
      ...(state.manualZipcode ? { manualZipcode: state.manualZipcode } : {}),
    });
  };

  // Returns an error message for the picked location, or "" if it's valid.
  const validateLocation = (state) => {
    const errors = validateLocationPayload(buildLocationPayload(state, "pending"), { requireSubBrandId: true });
    if (!errors.length) return "";
    return errors.length === 1 && errors[0] === "zipcode"
      ? "This location is missing a zipcode. Enter it below to use this address."
      : `This location is missing ${errors.join(", ")}. Try picking a more specific result.`;
  };

  // The pincode fix for a Google result without a postal code — re-checks
  // the same pick with the typed pincode (still nothing saved yet).
  const retryLocationWithZipcode = (zipcode) => {
    const next = { ...form, manualZipcode: zipcode };
    const message = validateLocation(next);
    setForm({ ...next, locationError: message });
    return { success: !message, error: message };
  };

  const loadSavedLocations = async ({ brandId: brandIdOverride } = {}) => {
    const brandId = brandIdOverride ?? form.brandId;
    if (!brandId) {
      setSavedLocations([]);
      return;
    }
    setLoadingSavedLocations(true);
    try {
      const res = await getAllLocations({ brandId, limit: 20 });
      const list = res?.data?.data ?? res?.data ?? [];
      setSavedLocations(Array.isArray(list) ? list : []);
    } catch {
      setSavedLocations([]);
    } finally {
      setLoadingSavedLocations(false);
    }
  };

  const reset = () => setForm(initialState);

  const sendOtpFor = (whatsappNumber) => {
    // No outlet yet → create it (this also sends the OTP).
    if (!form.subBrandId) {
      return signUpSubBrandWithWhatsapp({
        brandId: form.brandId,
        whatsappNumber,
        outletType: form.outletType,
        isFirstOutlet: false,
      });
    }
    // Same outlet, same number → resend.
    if (form.subBrandNumber === whatsappNumber) {
      return resendSubBrandWhatsappOtp({ brandId: form.brandId, whatsappNumber });
    }
    // Same outlet, corrected number → move it (sends a new OTP).
    return updateSubBrandWhatsappNumber(form.subBrandId, whatsappNumber);
  };

  /**
   * Sends or resends the outlet's WhatsApp OTP — creates the outlet on the
   * first send, resends for the same number, moves it for a new number.
   * Throws the API error (err.details.retryAfterSeconds on a 429).
   * @param {string} whatsappNumber
   * @returns {Promise<{ otpSent: boolean, otpError: string|null, retryAfterSeconds: number|null }>}
   */
  const requestOtp = async (whatsappNumber) => {
    const res = await sendOtpFor(whatsappNumber);

    const data = res?.data ?? {};
    const subBrandId = extractSubBrandId(res) ?? form.subBrandId;
    if (!subBrandId) throw new Error("Couldn't create the outlet. Please try again.");
    setForm((prev) => ({ ...prev, subBrandId, subBrandNumber: whatsappNumber }));

    return {
      otpSent: data.otpSent !== false,
      otpError: data.otpError ?? null,
      retryAfterSeconds: data.retryAfterSeconds ?? null,
    };
  };

  /**
   * Finishes the outlet created by requestOtp(): validate location →
   * locations/create → subBrands/update.
   * @param {{ whatsappNumber: string, numberVerified: boolean }} number
   *   the outlet's number and whether its OTP was confirmed
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const submit = async ({ whatsappNumber, numberVerified }) => {
    if (!form.outletType || !numberVerified || !whatsappNumber || !form.subBrandId || !form.location) {
      const message = "Choose the outlet type, verify the WhatsApp number, and pick a location.";
      setError(message);
      return { success: false, error: message };
    }

    const locationProblem = validateLocation(form);
    if (locationProblem) {
      setForm((prev) => ({ ...prev, locationError: locationProblem }));
      setError(locationProblem);
      return { success: false, error: locationProblem };
    }

    setSubmitting(true);
    setError("");
    try {
      const { subBrandId } = form;

      if (!form.locationId) {
        const res = await createLocation(buildLocationPayload(form, subBrandId));
        const locationId = res?.data?._id ?? res?._id ?? "created";
        setForm((prev) => ({ ...prev, locationId, locationError: "" }));
      }

      const subBrand = await updateSubBrand(subBrandId, {
        outletType: form.outletType.toUpperCase(),
        isActive: form.isActive,
      });

      reset();
      setSuccessMessage("Outlet created successfully.");
      onSuccess?.({ subBrand });
      return { success: true };
    } catch (err) {
      const message = err?.message || "Couldn't create the outlet. Please try again.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
    requestOtp,
    submit,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
    reset,
  };
}
