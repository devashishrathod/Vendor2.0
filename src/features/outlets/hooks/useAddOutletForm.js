import { useState } from "react";
import { updateSubBrand } from "../services/subBrandApi";
import { createLocation, buildLocationPayloadFromPlace, validateLocationPayload } from "../services/locationApi";

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

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
  const persistLocation = async (place, subBrandIdOverride, brandIdOverride) => {
    const subBrandId = subBrandIdOverride ?? form.subBrandId;
    if (!place || !subBrandId) return { success: false };

    setForm((prev) => ({ ...prev, locationSaving: true, locationError: "" }));

    const payload = buildLocationPayloadFromPlace(place, {
      subBrandId,
      brandId: (brandIdOverride ?? form.brandId) || undefined,
    });
    const errors = validateLocationPayload(payload, { requireSubBrandId: true });
    if (errors.length) {
      const message = `This location is missing ${errors.join(", ")}. Try picking a more specific result.`;
      setForm((prev) => ({ ...prev, locationSaving: false, locationError: message }));
      return { success: false, error: message };
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

      // Final Save button only sends what the confirmed subBrands/update
      // payload actually takes: outletType, description, isActive.
      const subBrand = await updateSubBrand(form.subBrandId, {
        outletType: form.outletType.toUpperCase(),
        description: form.description || undefined,
        isActive: form.isActive,
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
    submit,
    submitting,
    error,
    reset,
  };
}