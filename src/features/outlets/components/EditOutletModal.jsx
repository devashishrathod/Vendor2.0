// Edit an EXISTING outlet — outletType/isActive (PUT subBrands/update/:id)
// and, if the merchant picks a new address, its location (PUT
// locations/update/:id). The location section is the same shared UI Add
// Outlet uses (Search / Live tabs, saved locations, picked-location card);
// unlike Add, a new pick is only staged here and saved on "Save Changes".
import { useState } from "react";
import { useEditOutletForm } from "../hooks/useEditOutletForm";
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

const OUTLET_TYPE_OPTIONS = [
  { value: "outlet", label: "Outlet" },
  { value: "franchise", label: "Franchise" },
];

// Chips for the picked-location card: the outlet's saved address vs a new
// pick that will replace it on Save Changes.
const CURRENT_CHIP = {
  label: "Current",
  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};
const CHANGED_CHIP = {
  label: "Updates on save",
  className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

export default function EditOutletModal({ outlet, onClose, onUpdated }) {
  const {
    outletType,
    setOutletType,
    isActive,
    setIsActive,
    location,
    locationChanged,
    setLocation,
    selectSavedLocation,
    locationMode,
    setLocationMode,
    savedLocations,
    loadingSavedLocations,
    submit,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
  } = useEditOutletForm(outlet, () => onUpdated?.());

  const [showMap, setShowMap] = useState(false);
  const [selectedSavedLocationId, setSelectedSavedLocationId] = useState(null);

  const handleSelectPlace = (place) => {
    setSelectedSavedLocationId(null);
    setLocation(place);
  };

  const handleSelectSavedLocation = (loc) => {
    setSelectedSavedLocationId(loc._id);
    selectSavedLocation(loc);
  };

  const pickerProps = {
    selectedPlace: location,
    onSelectPlace: handleSelectPlace,
    onShowMap: () => setShowMap(true),
    locationSaving: false,
    locationSaved: false,
    locationError: "",
    createLocationButton: null,
    statusOverride: locationChanged ? CHANGED_CHIP : CURRENT_CHIP,
    waitingNote: locationChanged ? "This new address replaces the current one when you click Save Changes." : null,
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="flex-1 text-base font-bold text-gray-900 dark:text-gray-100">Edit Outlet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Outlet Type *</label>
            <Select
              value={outletType}
              onChange={setOutletType}
              options={OUTLET_TYPE_OPTIONS}
              placeholder="eg : Outlet"
              className="bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            Active
          </label>

          {/* ── Outlet Location — same UI as Add Outlet ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Outlet Location</label>

            <SavedLocationsList
              locations={savedLocations}
              loading={loadingSavedLocations}
              selectedId={selectedSavedLocationId}
              onSelect={handleSelectSavedLocation}
            />

            <LocationModeTabs mode={locationMode} onChange={setLocationMode} />

            {locationMode === "search" ? (
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
          <button
            onClick={submit}
            disabled={submitting || !outletType}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm tracking-wide shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {showMap && location && typeof location.lat === "number" && (
        <MapModal lat={location.lat} lng={location.lng} label={location.name} onClose={() => setShowMap(false)} />
      )}

      <ErrorToast error={error ? { message: error } : null} onDismiss={clearError} />
      <SuccessToast message={successMessage} onDismiss={clearSuccessMessage} />
    </div>
  );
}
