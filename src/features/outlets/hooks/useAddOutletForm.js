import { useState } from "react";
import { signUpSubBrandWithWhatsapp, updateSubBrand } from "../services/subBrandApi";
import {
  createLocation,
  buildLocationPayloadFromPlace,
  buildLocationPayloadFromSavedLocation,
  validateLocationPayload,
  getAllLocations,
  mapLocationToSelectedPlace,
} from "../services/locationApi";

// Add Outlet — NOTHING is created on the server until "Create Outlet":
//   1. the WhatsApp number is verified first (OTP, or the first outlet's
//      already-verified number) — the modal handles that, no outlet yet;
//   2. a location is only PICKED here (kept locally, not saved);
//   3. submit() then, in order: validates the location (so a bad address
//      can't leave a half-created outlet), creates the outlet
//      (subBrands/signUp-with-whatsapp), creates its location
//      (locations/create), and sends the final subBrands/update.
// If a later step fails, the ids already created (subBrandId / locationId)
// are kept, so clicking Create Outlet again resumes instead of duplicating.

const initialState = {
  outletType: "", // "outlet" | "franchise"
  isActive: true,

  // Different-number path only: `verified` flips true after the OTP is
  // confirmed. The first outlet's number needs no OTP (see the modal).
  whatsapp: { number: "", verified: false },

  brandId: null,

  // Set during submit() — kept so a retry doesn't re-create the outlet.
  subBrandId: null,
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

  /**
   * Creates the outlet: validate location → signUp-with-whatsapp →
   * locations/create → subBrands/update.
   * @param {{ whatsappNumber: string, numberVerified: boolean }} number
   *   the number to register and whether it's verified (first outlet's
   *   number, or a different number whose OTP was confirmed)
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const submit = async ({ whatsappNumber, numberVerified }) => {
    if (!form.outletType || !numberVerified || !whatsappNumber || !form.location) {
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
      let subBrandId = form.subBrandId;
      if (!subBrandId) {
        const res = await signUpSubBrandWithWhatsapp({
          brandId: form.brandId,
          whatsappNumber,
          outletType: form.outletType,
          isFirstOutlet: false,
        });
        subBrandId = extractSubBrandId(res);
        if (!subBrandId) throw new Error("Couldn't create the outlet. Please try again.");
        setForm((prev) => ({ ...prev, subBrandId }));
      }

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
    submit,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
    reset,
  };
}
