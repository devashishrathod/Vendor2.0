// Edit an EXISTING outlet — outletType/description/isActive (PUT
// subBrands/update/:id) and, if the merchant picks a new address, its
// location (PUT locations/update/:id). Deliberately self-contained (its
// own small Google Places search, same pattern AddOutletModal already
// uses) rather than reworking AddOutletModal, so the Add Outlet flow is
// untouched.
import { useState } from "react";
import { useEditOutletForm } from "../hooks/useEditOutletForm";
import ErrorToast from "@/components/common/ErrorToast";
import SuccessToast from "@/components/common/SuccessToast";

const inputBase =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const OUTLET_TYPE_OPTIONS = [
  { value: "outlet", label: "Outlet" },
  { value: "franchise", label: "Franchise" },
];

// Same key/loader as AddOutletModal — duplicated on purpose rather than
// shared, to avoid touching that file at all.
const GOOGLE_MAPS_API_KEY = "AIzaSyBmg8zWrXA_taDUSrpWRN2sbd7csdPgKLM";

let googleMapsLoadingPromise = null;
function loadGoogleMapsScript() {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

function textSearchPlaces(query) {
  return loadGoogleMapsScript().then(
    (google) =>
      new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.textSearch({ query }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        });
      })
  );
}

function getPlaceDetails(placeId) {
  return loadGoogleMapsScript().then(
    (google) =>
      new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.getDetails(
          { placeId, fields: ["name", "formatted_address", "geometry", "address_components"] },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error(`Place details fetch failed: ${status}`));
            }
          }
        );
      })
  );
}

// ─── Change Location — Google Places text search + pick ────────────────
function LocationEditor({ location, onSelectPlace }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    setError("");
    setHasSearched(true);
    try {
      const places = await textSearchPlaces(trimmed);
      setResults(places);
    } catch {
      setError("Couldn't fetch results. Check your connection and try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  const pickPlace = async (place) => {
    if (!place.place_id) return;
    setDetailsLoading(true);
    setError("");
    try {
      const details = await getPlaceDetails(place.place_id);
      const loc = details.geometry?.location;
      if (!loc) {
        setError("This place has no location data. Try another result.");
        return;
      }
      onSelectPlace({
        name: details.name,
        address: details.formatted_address,
        lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
        lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
        addressComponents: details.address_components || [],
        source: "search",
      });
      setResults([]);
      setQuery("");
      setHasSearched(false);
    } catch {
      setError("Couldn't fetch details for that place. Try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a new address to replace the current one"
          className={inputBase}
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching || !query.trim()}
          className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            searching || !query.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-500 mb-3">{error}</p>}

      {results.length > 0 && (
        <div className="mb-4 max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
          {results.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => pickPlace(place)}
              disabled={detailsLoading}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 transition-colors disabled:opacity-60"
            >
              <span className="block text-sm font-semibold text-gray-800">{place.name}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{place.formatted_address}</span>
            </button>
          ))}
        </div>
      )}

      {detailsLoading && <p className="text-xs text-gray-400 mb-3">Fetching place details…</p>}

      {hasSearched && !searching && results.length === 0 && !error && (
        <p className="text-xs text-gray-400 mb-3">No matches found. Try a different search term.</p>
      )}

      <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          {location?.source === "existing" ? "Current Location" : "New Location"}
        </p>
        {location ? (
          <>
            <p className="text-sm font-bold text-gray-900">{location.name}</p>
            <p className="text-sm text-gray-600 mt-0.5">{location.address}</p>
          </>
        ) : (
          <p className="text-xs text-gray-400">No location saved for this outlet yet.</p>
        )}
      </div>
    </div>
  );
}

export default function EditOutletModal({ outlet, onClose, onUpdated }) {
  const {
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
    clearError,
    successMessage,
    clearSuccessMessage,
  } = useEditOutletForm(outlet, () => onUpdated?.());

  const handleSave = async () => {
    await submit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="flex-1 text-base font-bold text-gray-900">Edit Outlet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Type *</label>
            <div className="relative">
              <select
                value={outletType}
                onChange={(e) => setOutletType(e.target.value)}
                className={`${inputBase} appearance-none`}
              >
                {OUTLET_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="eg : Main city outlet of the brand"
              rows={2}
              className={`${inputBase} resize-none`}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            Active
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Location</label>
            <LocationEditor location={location} onSelectPlace={setLocation} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || !outletType}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm tracking-wide shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none"
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

      <ErrorToast error={error ? { message: error } : null} onDismiss={clearError} />
      <SuccessToast message={successMessage} onDismiss={clearSuccessMessage} />
    </div>
  );
}
