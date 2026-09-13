import { useState } from "react";
import {
  createLocation,
  updateLocation,
  buildLocationPayloadFromPlace,
  validateLocationPayload,
} from "../services/locationApi";

// Same shape useEditOutletForm's existingLocationToPlace produces — turns
// a subBrand doc's embedded `location` into the `{ name, address, lat,
// lng, addressComponents, source }` shape the location-picker UI expects.
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

// Same location-update mechanics as useEditOutletForm (real PUT
// /locations/update/:id, or POST /locations/create if the outlet had none
// yet) — but scoped to ONLY the outlet's location, no outletType/
// description/isActive, so the Location card's own "Edit" action can't
// touch anything else about the outlet.
export function useEditOutletLocation(outlet, onSuccess) {
  const raw = outlet?.raw || {};
  const existingLocation = raw.location || null;

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
    if (!outlet?.id || !locationChanged || !location) return;
    setSubmitting(true);
    setError("");
    try {
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

      setSuccessMessage("Location updated successfully.");
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Couldn't update the location. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    location,
    setLocation,
    locationChanged,
    submit,
    submitting,
    error,
    clearError: () => setError(""),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
  };
}
