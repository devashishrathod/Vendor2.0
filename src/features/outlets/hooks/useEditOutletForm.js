import { useState } from "react";
import { updateSubBrand } from "../services/subBrandApi";
import {
  createLocation,
  updateLocation,
  buildLocationPayloadFromPlace,
  validateLocationPayload,
} from "../services/locationApi";

// Turns a subBrand doc's embedded `location` (confirmed shape — see
// locationApi.js's mapLocationToSelectedPlace) into the same
// `{ name, address, lat, lng, addressComponents, source }` shape the
// location-picker UI already works with, so the "current location" can be
// shown/replaced the same way a fresh Google pick is.
function existingLocationToPlace(loc) {
  if (!loc) return null;
  const [lng, lat] = loc.geo?.coordinates || loc.coordinates || [];
  return {
    name: loc.addressLine1 || loc.formattedAddress || "Saved Location",
    address:
      loc.formattedAddress ||
      [loc.addressLine1, loc.addressLine2, loc.city, loc.state, loc.zipcode].filter(Boolean).join(", "),
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    addressComponents: null,
    source: "existing",
  };
}

// Edits an EXISTING outlet — outletType/description/isActive via
// subBrands/update, and (only if the merchant actually picks a new
// address) its location via locations/update. Unlike useAddOutletForm,
// there's no WhatsApp OTP step here — the outlet is already verified — and
// location changes are staged locally and only sent on "Save Changes",
// not persisted the moment a place is picked.
export function useEditOutletForm(outlet, onSuccess) {
  const raw = outlet?.raw || {};
  const existingLocation = raw.location || null;

  const [outletType, setOutletType] = useState((outlet?.outletType || "").toLowerCase());
  const [description, setDescription] = useState(raw.description || "");
  const [isActive, setIsActive] = useState(raw.isActive !== false);
  const [location, setLocationState] = useState(existingLocationToPlace(existingLocation));
  const [locationChanged, setLocationChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const setLocation = (place) => {
    setLocationState(place);
    setLocationChanged(true);
  };

  const submit = async () => {
    if (!outlet?.id) return;
    setSubmitting(true);
    setError("");
    try {
      await updateSubBrand(outlet.id, {
        outletType: outletType.toUpperCase(),
        description: description || undefined,
        isActive,
      });

      if (locationChanged && location) {
        const payload = buildLocationPayloadFromPlace(location, {
          subBrandId: outlet.id,
          brandId: raw.brandId || undefined,
        });
        const errors = validateLocationPayload(payload, { requireSubBrandId: true });
        if (errors.length) {
          throw new Error(`This location is missing ${errors.join(", ")}. Try picking a more specific result.`);
        }

        const locationId = raw.locationId || existingLocation?._id;
        if (locationId) {
          await updateLocation(locationId, payload);
        } else {
          await createLocation(payload);
        }
      }

      setSuccessMessage("Outlet updated successfully.");
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Couldn't update the outlet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    outletType,
    setOutletType,
    description,
    setDescription,
    isActive,
    setIsActive,
    location,
    setLocation,
    submit,
    submitting,
    error,
    clearError: () => setError(""),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
  };
}
