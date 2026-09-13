import { useState } from "react";
import { updateSubBrand } from "../services/subBrandApi";
import {
  createLocation,
  buildLocationPayloadFromPlace,
  buildLocationPayloadFromSavedLocation,
  validateLocationPayload,
  getAllLocations,
  mapLocationToSelectedPlace,
} from "../services/locationApi";

const initialState = {
  // ── Outlet Type (Outlet vs Franchise) ──
  outletType: "", // "outlet" | "franchise"

  // ── Fields that go on the FINAL subBrands/update body, per the
  // confirmed Postman request: { outletType, description, isActive }.
  // (email / joinedDate are commented out in that request — not sent.)
  description: "",
  isActive: true,

  // ── Outlet WhatsApp Number, verified via OTP (or copied + verified
  // from the brand's own number). subBrandId is set once the OTP
  // sign-up call (sendOutletWhatsappOtp) has returned — it is the id
  // updateSubBrand() and the location payload both need, and must be
  // response.data.subBrandId, never response.data._id.
  whatsapp: {
    number: "",
    isBrandNumber: false,
    verified: false,
  },

  // ── Mobile Number — separate contact number, optionally mirroring the
  // WhatsApp number via the "Same as WhatsApp Number" checkbox. ⚠️ NOT
  // independently confirmed from a Postman sample for subBrands/update
  // (only email/outletType/joinedDate/description/isActive are documented
  // there) — sent as a `mobile` key per explicit instruction; verify the
  // real saved value once tested and correct the key name here if wrong.
  mobile: "",
  mobileSameAsWhatsapp: false,

  subBrandId: null,
  brandId: null, // set from useBrand() by the modal — used as an optional reference on the location payload

  // ── Outlet Location. Unlike outletType/description/isActive, this is
  // its OWN separate API call (locations/create) that fires as soon as
  // the merchant picks a place — NOT bundled into the final Save. These
  // flags track that: locationSaving while the POST is in flight,
  // locationSaved once it succeeds, locationError if it fails and needs
  // a retry.
  locationMode: "search", // "search" | "live"
  location: null, // { name, address, lat, lng, placeId, addressComponents, source }
  locationId: null, // the created location doc's _id, once saved
  locationSaved: false,
  locationSaving: false,
  locationError: "",
};

export function useAddOutletForm(onSuccess) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Previously-saved locations for this brand — an alternative to a
  // fresh Google Places search. Each one already passed validation once
  // (real zipcode/district/coordinates), so picking one can never hit the
  // "missing zipcode" error a fresh search sometimes does.
  const [savedLocations, setSavedLocations] = useState([]);
  const [loadingSavedLocations, setLoadingSavedLocations] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const clearError = () => setError("");
  const clearSuccessMessage = () => setSuccessMessage("");

  // Patches the nested `whatsapp` object instead of replacing it outright,
  // so callers can update just `number`, `verified`, etc. one at a time.
  const updateWhatsapp = (patch) =>
    setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, ...patch } }));

  // Set once sendOutletWhatsappOtp() resolves — callers must pass
  // res.data.subBrandId here, NOT res.data._id.
  const setSubBrandId = (subBrandId) => setForm((prev) => ({ ...prev, subBrandId }));

  const setBrandId = (brandId) => setForm((prev) => ({ ...prev, brandId }));

  // ── Save the outlet's location the moment it's picked ──────────────
  // Separate API, separate timing from the "Save Outlet" button (same as
  // WhatsApp verification already being its own thing). Requires
  // subBrandId to already exist, i.e. the merchant must verify WhatsApp
  // BEFORE picking a location — if they haven't yet, this just stores the
  // pick locally and locationSaved stays false; submit() below retries it
  // as a fallback right before the final save.
  //
  // `manualZipcode` lets a caller retry the SAME place after the merchant
  // types a pincode by hand — this is the recovery path for Google Places
  // results that don't carry a postal_code (bare localities, some POIs),
  // so a missing zipcode becomes a quick manual fix instead of a dead end.
  const persistLocation = async (place, subBrandIdOverride, brandIdOverride, manualZipcode) => {
    const subBrandId = subBrandIdOverride ?? form.subBrandId;
    if (!place || !subBrandId) return { success: false };

    setForm((prev) => ({ ...prev, locationSaving: true, locationError: "" }));

    const payload = buildLocationPayloadFromPlace(place, {
      subBrandId,
      brandId: (brandIdOverride ?? form.brandId) || undefined,
      ...(manualZipcode ? { manualZipcode } : {}),
    });
    const errors = validateLocationPayload(payload, { requireSubBrandId: true });
    if (errors.length) {
      const message =
        errors.length === 1 && errors[0] === "zipcode"
          ? "This location is missing a zipcode. Enter it below to save this address."
          : `This location is missing ${errors.join(", ")}. Try picking a more specific result.`;
      setForm((prev) => ({ ...prev, locationSaving: false, locationError: message }));
      return { success: false, error: message, missingFields: errors };
    }

    try {
      const res = await createLocation(payload);
      const locationId = res?.data?._id ?? res?._id ?? null;
      setForm((prev) => ({
        ...prev,
        locationSaving: false,
        locationSaved: true,
        locationId,
        locationError: "",
      }));
      setSuccessMessage("Location saved successfully.");
      return { success: true, locationId };
    } catch (err) {
      const message = err?.message || "Couldn't save this location. Please try again.";
      setForm((prev) => ({ ...prev, locationSaving: false, locationError: message }));
      return { success: false, error: message };
    }
  };

  // Retries the currently-picked place with a merchant-typed pincode —
  // the fix for the "missing zipcode" dead end above.
  const retryLocationWithZipcode = (zipcode) => persistLocation(form.location, form.subBrandId, form.brandId, zipcode);

  // ── Saved locations (GET /locations) — an alternative to a fresh Google
  // search. Each doc already passed validation once (real zipcode/district/
  // coordinates), so reusing one can never hit "missing zipcode".
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

  // Reuses a previously-saved location doc for THIS outlet — builds a new
  // locations/create payload straight off its already-valid fields (no
  // Google address_components involved), so it can't fail zipcode/district
  // validation the way a fresh search sometimes does.
  const selectSavedLocation = async (loc) => {
    const subBrandId = form.subBrandId;
    const place = mapLocationToSelectedPlace(loc);

    if (!subBrandId) {
      setForm((prev) => ({ ...prev, location: place, locationId: null, locationSaved: false, locationError: "" }));
      return { success: false };
    }

    setForm((prev) => ({ ...prev, location: place, locationSaving: true, locationError: "" }));
    const payload = buildLocationPayloadFromSavedLocation(loc, {
      subBrandId,
      brandId: form.brandId || undefined,
    });

    try {
      const res = await createLocation(payload);
      const locationId = res?.data?._id ?? res?._id ?? null;
      setForm((prev) => ({ ...prev, locationSaving: false, locationSaved: true, locationId, locationError: "" }));
      setSuccessMessage("Location saved successfully.");
      return { success: true, locationId };
    } catch (err) {
      const message = err?.message || "Couldn't save this location. Please try again.";
      setForm((prev) => ({ ...prev, locationSaving: false, locationError: message }));
      return { success: false, error: message };
    }
  };

  // Called by the modal's onSelectPlace — updates the local pick AND
  // fires the real locations/create call right away. Passing `null`
  // (Clear) just resets local state without touching the server; the
  // previously-created location record is left as-is (no delete call
  // here — wire deleteLocation(form.locationId) in if you want Clear to
  // also remove it server-side).
  const setLocation = (location) => {
    setForm((prev) => ({
      ...prev,
      location,
      locationId: null,
      locationSaved: false,
      locationError: "",
    }));
    if (location) {
      persistLocation(location);
    }
  };

  const reset = () => setForm(initialState);

  const submit = async () => {
    if (!form.outletType || !form.whatsapp.verified || !form.location || !form.subBrandId) {
      setError("Please pick an outlet type, verify a WhatsApp number, and select a location.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // Fallback: location should already be saved (persistLocation fires
      // on selection), but if it somehow isn't yet — e.g. subBrandId
      // wasn't ready at selection time — retry it here before finishing.
      if (!form.locationSaved) {
        const result = await persistLocation(form.location);
        if (!result.success) {
          setError(result.error || "Couldn't save this location. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      // Final Save button sends the confirmed subBrands/update fields
      // (outletType, description, isActive) plus `mobile` — see the
      // initialState comment above on why that key isn't independently
      // Postman-confirmed yet.
      const subBrand = await updateSubBrand(form.subBrandId, {
        outletType: form.outletType.toUpperCase(),
        description: form.description || undefined,
        isActive: form.isActive,
        mobile: form.mobile || undefined,
      });

      reset();
      onSuccess?.({ subBrand });
    } catch (err) {
      setError(err?.message || "Couldn't save the outlet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    update,
    updateWhatsapp,
    setSubBrandId,
    setBrandId,
    setLocation,
    persistLocation,
    retryLocationWithZipcode,
    savedLocations,
    loadingSavedLocations,
    loadSavedLocations,
    selectSavedLocation,
    submit,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
    reset,
  };
}