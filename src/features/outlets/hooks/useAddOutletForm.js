import { useState } from "react";
import {
  resendSubBrandWhatsappOtp,
  signUpSubBrandWithWhatsapp,
  updateSubBrand,
  updateSubBrandWhatsappNumber,
  upsertWorkHours,
} from "../services/subBrandApi";
import { toEditorHours, validateHours, toPayloadHours, hasOpenDay } from "../utils/workHours";
import {
  createLocation,
  buildLocationPayloadFromPlace,
  buildLocationPayloadFromSavedLocation,
  validateLocationPayload,
  getAllLocations,
  mapLocationToSelectedPlace,
} from "../services/locationApi";

// Add Outlet — 3 steps, each saved before the next one opens:
//   Step 1 (type, active, WhatsApp number):
//     requestOtp() — "Send OTP" creates the outlet AND sends its OTP in one
//     call (subBrands/signUp-with-whatsapp, isFirstOutlet: false). This is
//     the only way to register a new outlet number: auth/loginOrSignUp-
//     with-whatsapp refuses to create SUB_VENDOR accounts. The plan slot is
//     used here. Resend = resendSubBrandWhatsappOtp (a repeat signUp call
//     — the doc's resend); a changed number = PATCH
//     subBrands/:id/whatsapp-number (same outlet, same slot). Each number
//     can only ever belong to one outlet, so the first outlet's can't be reused.
//     saveBasics() (Next) — subBrands/update with outletType / isActive.
//   Step 2: saveLocation() — validates the picked location, locations/create.
//   Step 3: saveWorkHours() — workHours/upsert with this outlet's id.
// The backend only allows location / hours once the manager's OTP is
// verified (409 OUTLET_NOT_VERIFIED), which is why step 1 comes first.

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

  // Step 3 — same { monday..sunday: { start, end, isOpen } } shape the
  // WorkingHoursEditor edits.
  workHours: toEditorHours(null),
};

export const ADD_OUTLET_STEPS = [
  { key: "details", label: "Outlet Details" },
  { key: "location", label: "Location" },
  { key: "hours", label: "Working Hours" },
];

// Pull the outlet id out of signUp-with-whatsapp's confirmed response:
// { data: { subBrand: { _id }, user: { subBrandId }, otpSent, ... } }.
function extractSubBrandId(res) {
  const data = res?.data ?? res ?? {};
  return data.subBrand?._id ?? data.user?.subBrandId ?? data.subBrandId ?? null;
}

export function useAddOutletForm(onSuccess) {
  const [form, setForm] = useState(initialState);
  // 0 = details, 1 = location, 2 = working hours. Only moves forward, and
  // only after the current step has been saved.
  const [step, setStep] = useState(0);
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

  const reset = () => {
    setForm(initialState);
    setStep(0);
  };

  const setWorkHours = (workHours) => setForm((prev) => ({ ...prev, workHours }));

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

  // Runs one step's save; moves to the next step only if it succeeded.
  const runStep = async (save, fallbackMessage) => {
    setSubmitting(true);
    setError("");
    try {
      await save();
      return { success: true };
    } catch (err) {
      const message = err?.message || fallbackMessage;
      setError(message);
      return { success: false, error: message };
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Step 1 → 2. Needs the type chosen and the number's OTP verified (the
   * outlet itself was already created by requestOtp). Saves outletType /
   * isActive via subBrands/update.
   * @param {{ numberVerified: boolean }} args
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const saveBasics = async ({ numberVerified }) => {
    if (!form.outletType || !numberVerified || !form.subBrandId) {
      const message = "Choose the outlet type and verify the WhatsApp number first.";
      setError(message);
      return { success: false, error: message };
    }
    const result = await runStep(
      () =>
        updateSubBrand(form.subBrandId, {
          outletType: form.outletType.toUpperCase(),
          isActive: form.isActive,
        }),
      "Couldn't save the outlet details. Please try again."
    );
    if (result.success) setStep(1);
    return result;
  };

  /**
   * Step 2 → 3. Validates the picked location and creates it
   * (locations/create) for this outlet. If it was already saved (e.g. the
   * step was retried), it isn't created twice.
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const saveLocation = async () => {
    if (!form.location) {
      const message = "Pick the outlet's location first.";
      setError(message);
      return { success: false, error: message };
    }
    const locationProblem = validateLocation(form);
    if (locationProblem) {
      setForm((prev) => ({ ...prev, locationError: locationProblem }));
      setError(locationProblem);
      return { success: false, error: locationProblem };
    }
    const result = await runStep(async () => {
      if (form.locationId) return;
      const res = await createLocation(buildLocationPayload(form, form.subBrandId));
      const locationId = res?.data?._id ?? res?._id ?? "created";
      setForm((prev) => ({ ...prev, locationId, locationError: "" }));
    }, "Couldn't save the location. Please try again.");
    if (result.success) setStep(2);
    return result;
  };

  /**
   * Step 3 → done. Needs at least one open day, each with a valid
   * start < end. Saves via workHours/upsert with this outlet's id.
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const saveWorkHours = async () => {
    const problem = !hasOpenDay(form.workHours)
      ? "Open the outlet on at least one day."
      : validateHours(form.workHours);
    if (problem) {
      setError(problem);
      return { success: false, error: problem };
    }
    const { subBrandId } = form;
    const result = await runStep(
      () => upsertWorkHours({ subBrandId, hours: toPayloadHours(form.workHours) }),
      "Couldn't save the working hours. Please try again."
    );
    if (result.success) {
      reset();
      setSuccessMessage("Outlet created successfully.");
      onSuccess?.({ subBrandId });
    }
    return result;
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
    step,
    setWorkHours,
    saveBasics,
    saveLocation,
    saveWorkHours,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
    reset,
  };
}
