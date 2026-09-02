import { useEffect, useState } from "react";

import {
  loadGoogleMapsScript,
  textSearchPlaces,
  getPlaceDetails,
} from "../../services/googleMapsService";

export default function OutletLocationSearch({
  selectedPlace,
  onSelectPlace,
  onShowMap,
}) {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState([]);

  const [searching, setSearching] =
    useState(false);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [hasSearched, setHasSearched] =
    useState(false);

  // ─────────────────────────────────────────────
  // PRELOAD GOOGLE MAPS
  // ─────────────────────────────────────────────

  useEffect(() => {
    console.log(
      "🚀 [OutletLocationSearch] Component mounted"
    );

    loadGoogleMapsScript()
      .then(() => {
        console.log(
          "✅ [OutletLocationSearch] Google Maps loaded"
        );
      })
      .catch((err) => {
        console.error(
          "❌ [OutletLocationSearch] Google Maps preload failed:",
          err
        );
      });
  }, []);

  // ─────────────────────────────────────────────
  // GST AUTOFILL
  // When the parent sets selectedPlace from the brand's GST address
  // (source === "gst" — see CreateBrandOutlet.jsx's persistGstAddress),
  // mirror that address into the search input too, so the box isn't
  // left blank while a GST-sourced place is actually selected. This
  // does NOT re-trigger a search — it's just filling the text field.
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (selectedPlace?.source === "gst") {
      console.log(
        "📋 [OutletLocationSearch] Autofilling query from GST address:",
        selectedPlace.address
      );
      setQuery(selectedPlace.address || selectedPlace.name || "");
      setResults([]);
      setHasSearched(false);
    }
  }, [selectedPlace]);

  // ─────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────

  const runSearch = async () => {
    const trimmed =
      query.trim();

    console.log("");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "🔎 [OutletLocationSearch] SEARCH START"
    );

    console.log(
      "Query:",
      trimmed
    );

    if (!trimmed) {
      console.warn(
        "⚠️ Empty search"
      );

      return;
    }

    setSearching(true);
    setError("");
    setHasSearched(true);

    try {
      const places =
        await textSearchPlaces(
          trimmed
        );

      console.log(
        "🎯 [OutletLocationSearch] Search results:",
        places
      );

      setResults(
        Array.isArray(places)
          ? places
          : []
      );
    } catch (err) {
      console.error(
        "❌ [OutletLocationSearch] Search error:",
        err
      );

      setError(
        err?.message ||
          "Couldn't fetch results."
      );

      setResults([]);
    } finally {
      setSearching(false);

      console.log(
        "🏁 [OutletLocationSearch] SEARCH END"
      );
    }
  };

  // ─────────────────────────────────────────────
  // ENTER KEY
  // ─────────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      console.log(
        "⌨️ Enter pressed"
      );

      runSearch();
    }
  };

  // ─────────────────────────────────────────────
  // PICK PLACE
  // ─────────────────────────────────────────────

  const pickPlace = async (place) => {
    console.log("");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "👆 [OutletLocationSearch] USER SELECTED PLACE"
    );

    console.log(
      "Selected normalized place:",
      place
    );

    console.log(
      "Place ID:",
      place?.placeId
    );

    if (!place?.placeId) {
      console.error(
        "❌ PLACE ID IS MISSING"
      );

      setError(
        "Selected place has no Place ID. Please try again."
      );

      return;
    }

    setDetailsLoading(true);
    setError("");

    try {
      console.log(
        "🚀 STEP 13: Fetching details for:",
        place.placeId
      );

      const details =
        await getPlaceDetails(
          place.placeId
        );

      console.log(
        "✅ STEP 14: Details received:",
        details
      );

      if (!details) {
        throw new Error(
          "No place details received"
        );
      }

     const finalPlace = {
  // Basic information
  name:
    details.name ||
    place.name ||
    "",

  address:
    details.address ||
    place.address ||
    "",

  // Location
  lat:
    details.lat ??
    place.lat ??
    null,

  lng:
    details.lng ??
    place.lng ??
    null,

  // Google Place ID
  placeId:
    details.placeId ||
    place.placeId,

  // Address components
  addressComponents:
    details.addressComponents ||
    place.addressComponents ||
    [],

  // ⭐ PLACE PHOTO
  photos:
    details.photos ||
    [],

  // ⭐ RATING
  rating:
    details.rating ??
    null,

  // ⭐ TOTAL REVIEWS
  userRatingsTotal:
    details.userRatingsTotal ??
    null,

  // ⭐ OPENING HOURS
  openingHours:
    details.openingHours ||
    null,

  // ⭐ PHONE
  phone:
    details.phone ||
    "",

  // ⭐ WEBSITE
  website:
    details.website ||
    "",

  // ⭐ GOOGLE MAPS URL
  googleMapsUrl:
    details.googleMapsUrl ||
    "",

  // ⭐ BUSINESS STATUS
  businessStatus:
    details.businessStatus ||
    "",

  // ⭐ PLACE TYPES
  types:
    details.types ||
    [],

  source: "search",
};

      console.log(
        "🎯 STEP 15: FINAL selectedPlace:"
      );

      console.log(
        finalPlace
      );

      console.log(
        "Name:",
        finalPlace.name
      );

      console.log(
        "Address:",
        finalPlace.address
      );

      console.log(
        "Latitude:",
        finalPlace.lat
      );

      console.log(
        "Longitude:",
        finalPlace.lng
      );

      console.log(
        "Place ID:",
        finalPlace.placeId
      );

      onSelectPlace(
        finalPlace
      );

      console.log(
        "✅ STEP 16: onSelectPlace() called"
      );

      setResults([]);
      setQuery("");
      setHasSearched(false);
    } catch (err) {
      console.error(
        "❌ STEP 17: Place details error:",
        err
      );

      setError(
        err?.message ||
          "Couldn't fetch place details."
      );
    } finally {
      setDetailsLoading(false);

      console.log(
        "🏁 PLACE SELECTION END"
      );
    }
  };

  // ─────────────────────────────────────────────
  // SHOW MAP
  // ─────────────────────────────────────────────

  const handleShowMap = () => {
    console.log("");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "🗺️ SHOW MAP BUTTON CLICKED"
    );

    console.log(
      "selectedPlace:",
      selectedPlace
    );

    console.log(
      "onShowMap:",
      onShowMap
    );

    if (!selectedPlace) {
      console.error(
        "❌ Cannot open map: selectedPlace missing"
      );

      return;
    }

    if (
      typeof selectedPlace.lat !==
        "number" ||
      typeof selectedPlace.lng !==
        "number"
    ) {
      console.error(
        "❌ Cannot open map: invalid coordinates",
        {
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
        }
      );

      return;
    }

    if (
      typeof onShowMap !==
      "function"
    ) {
      console.error(
        "❌ onShowMap is not a function"
      );

      return;
    }

    console.log(
      "✅ Calling parent onShowMap()"
    );

    onShowMap();

    console.log(
      "✅ Parent onShowMap() called"
    );
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">
        Find Your Outlet Location Using Google Maps.
      </h3>

      <p className="text-xs text-gray-500 mb-4">
        Search your outlet name and city,
        then pick it from the results.
      </p>

      {/* SEARCH */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="eg : Toni & Guy Ahmedabad"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
        />

        <button
          type="button"
          onClick={runSearch}
          disabled={
            searching ||
            !query.trim()
          }
          className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            searching ||
            !query.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {searching
            ? "Searching..."
            : "Search"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <p className="text-xs text-red-500 mb-3">
          {error}
        </p>
      )}

      {/* RESULTS */}

      {results.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
          {results.map(
            (place, index) => (
              <button
                type="button"
                key={
                  place.placeId ||
                  `place-${index}`
                }
                onClick={() =>
                  pickPlace(place)
                }
                disabled={
                  detailsLoading
                }
                className="w-full text-left px-4 py-3 hover:bg-[#f3f6fb] transition-colors flex items-start gap-3 disabled:opacity-60"
              >
                {/* ICON */}

                <svg
                  className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>

                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    {place.name ||
                      "Unnamed place"}
                  </span>

                  <span className="block text-xs text-gray-500 mt-0.5">
                    {place.address ||
                      "Address unavailable"}
                  </span>
                </span>
              </button>
            )
          )}
        </div>
      )}

      {/* DETAILS LOADING */}

      {detailsLoading && (
        <p className="text-xs text-gray-400 mb-4">
          Fetching place details...
        </p>
      )}

      {/* NO RESULTS */}

      {hasSearched &&
        !searching &&
        results.length === 0 &&
        !error && (
          <p className="text-xs text-gray-400 mb-4">
            No matches found. Try a
            different search term.
          </p>
        )}

      {/* SELECTED PLACE */}

      {selectedPlace ? (
        <div className="bg-[#f3f6fb] rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {selectedPlace.source === "gst"
              ? "GST Address (used as Outlet Location)"
              : "Selected Outlet Location"}
          </p>

          <p className="text-sm font-bold text-gray-900">
            {selectedPlace.name}
          </p>

          <p className="text-sm text-gray-600 mt-0.5">
            {selectedPlace.address}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Lat: {selectedPlace.lat}
            {" · "}
            Lng: {selectedPlace.lng}
          </p>

          {selectedPlace.placeId && (
            <p className="text-xs text-gray-400 mt-1 break-all">
              Place ID:{" "}
              {selectedPlace.placeId}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            {/* SHOW MAP — only once the vendor has actually picked a result
                from search ("source" is "search"). A GST-address autofill
                ("source" is "gst") is just a provisional suggestion shown
                in this same box before any deliberate selection, so it
                shouldn't get the same "confirmed" action available to it. */}

            {selectedPlace.source === "search" && (
              <button
                type="button"
                onClick={handleShowMap}
                className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
              >
                Show on Google Map
              </button>
            )}

            {/* CLEAR */}

            <button
              type="button"
              onClick={() => {
                console.log(
                  "🧹 Clearing selected place"
                );

                onSelectPlace(null);
                setQuery("");
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors ${
                selectedPlace.source === "search" ? "" : "flex-1"
              }`}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          Search above and select your
          outlet to pin its location
        </p>
      )}
    </div>
  );
}