// Edit ONLY an existing outlet's location — real PUT /locations/update/:id
// (or POST /locations/create if it had none yet, via useEditOutletLocation).
// Deliberately self-contained (its own small Google Places search, same
// pattern AddOutletModal/EditOutletModal already use) rather than reusing
// EditOutletModal, since that one also edits outletType/description/
// isActive — this is scoped to just the address, opened from the Location
// card's own "Edit" action.
import { useState } from "react";
import { MapPin, X, Search, Loader2 } from "lucide-react";
import { useEditOutletLocation } from "../hooks/useEditOutletLocation";
import ErrorToast from "@/components/common/ErrorToast";
import SuccessToast from "@/components/common/SuccessToast";

const inputBase =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

// Same key/loader as AddOutletModal/EditOutletModal — duplicated on
// purpose rather than shared, to keep this modal self-contained.
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

function LocationSearch({ location, onSelectPlace }) {
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
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search a new address to replace the current one"
            className={`${inputBase} pl-10`}
          />
        </div>
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

      {detailsLoading && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching place details…
        </p>
      )}

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

export default function EditLocationModal({ outlet, onClose, onUpdated }) {
  const { location, setLocation, locationChanged, submit, submitting, error, clearError, successMessage, clearSuccessMessage } =
    useEditOutletLocation(outlet, () => onUpdated?.());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50">
            <MapPin className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="flex-1 text-base font-bold text-gray-900">Edit Location</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <LocationSearch location={location} onSelectPlace={setLocation} />
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !locationChanged}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm tracking-wide shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Location"
            )}
          </button>
        </div>
      </div>

      <ErrorToast error={error ? { message: error } : null} onDismiss={clearError} />
      <SuccessToast message={successMessage} onDismiss={clearSuccessMessage} />
    </div>
  );
}
