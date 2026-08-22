// googleMapsService.js

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsLoadingPromise = null;

// ─────────────────────────────────────────────
// LOAD GOOGLE MAPS
// ─────────────────────────────────────────────

export function loadGoogleMapsScript() {
  console.log("🗺️ [GoogleMaps] Loading...");

  if (window.google?.maps?.places) {
    console.log("✅ [GoogleMaps] Already loaded");
    return Promise.resolve(window.google);
  }

  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error(
        "VITE_GOOGLE_MAPS_API_KEY is missing"
      )
    );
  }

  googleMapsLoadingPromise = new Promise(
    (resolve, reject) => {
      const script =
        document.createElement("script");

      script.src =
        `https://maps.googleapis.com/maps/api/js` +
        `?key=${GOOGLE_MAPS_API_KEY}` +
        `&libraries=places`;

      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log(
          "✅ [GoogleMaps] Script loaded"
        );

        resolve(window.google);
      };

      script.onerror = () => {
        googleMapsLoadingPromise = null;

        reject(
          new Error(
            "Google Maps script failed"
          )
        );
      };

      document.head.appendChild(script);
    }
  );

  return googleMapsLoadingPromise;
}

// ─────────────────────────────────────────────
// TEXT SEARCH
// ─────────────────────────────────────────────

export async function textSearchPlaces(query) {
  console.log(
    "🔎 [GooglePlaces] Searching:",
    query
  );

  const google =
    await loadGoogleMapsScript();

  return new Promise(
    (resolve, reject) => {
      const service =
        new google.maps.places.PlacesService(
          document.createElement("div")
        );

      console.log(
        "🚀 [GooglePlaces] textSearch()"
      );

      service.textSearch(
        {
          query: query.trim(),
        },
        (results, status) => {
          console.log(
            "📡 [GooglePlaces] Search status:",
            status
          );

          console.log(
            "📦 Raw results:",
            results
          );

          if (
            status ===
              google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            const normalized =
              results.map(
                (place, index) => {
                  const location =
                    place.geometry?.location;

                  const lat =
                    typeof location?.lat ===
                    "function"
                      ? location.lat()
                      : location?.lat ??
                        null;

                  const lng =
                    typeof location?.lng ===
                    "function"
                      ? location.lng()
                      : location?.lng ??
                        null;

                  return {
                    id:
                      place.place_id ||
                      `place-${index}`,

                    name:
                      place.name || "",

                    address:
                      place.formatted_address ||
                      "",

                    lat,

                    lng,

                    placeId:
                      place.place_id || "",

                    addressComponents:
                      place.address_components ||
                      [],

                    source: "search",

                    rawPlace: place,
                  };
                }
              );

            console.log(
              "✅ [GooglePlaces] Normalized:",
              normalized
            );

            resolve(normalized);
            return;
          }

          if (
            status ===
            google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve([]);
            return;
          }

          console.error(
            "❌ [GooglePlaces] Search failed:",
            status
          );

          reject(
            new Error(
              `Places search failed: ${status}`
            )
          );
        }
      );
    }
  );
}

// ─────────────────────────────────────────────
// PLACE DETAILS
// ─────────────────────────────────────────────

export async function getPlaceDetails(
  placeId
) {
  console.log(
    "📌 [GooglePlaces] Getting details:",
    placeId
  );

  if (!placeId) {
    throw new Error(
      "Place ID is required"
    );
  }

  const google =
    await loadGoogleMapsScript();

  return new Promise(
    (resolve, reject) => {
      const service =
        new google.maps.places.PlacesService(
          document.createElement("div")
        );

      const fields = [
        "name",
        "formatted_address",
        "geometry",
        "address_components",

        // Place information
        "photos",
        "rating",
        "user_ratings_total",
        "opening_hours",
        "formatted_phone_number",
        "website",
        "url",
        "business_status",
        "types",
      ];

      console.log(
        "🚀 [GooglePlaces] getDetails()",
        {
          placeId,
          fields,
        }
      );

      service.getDetails(
        {
          placeId,
          fields,
        },
        (place, status) => {
          console.log(
            "📡 [GooglePlaces] Details status:",
            status
          );

          console.log(
            "📦 [GooglePlaces] Details response:",
            place
          );

          if (
            status !==
              google.maps.places.PlacesServiceStatus.OK ||
            !place
          ) {
            console.error(
              "❌ [GooglePlaces] Details failed:",
              status
            );

            reject(
              new Error(
                `Place details failed: ${status}`
              )
            );

            return;
          }

          const location =
            place.geometry?.location;

          const lat =
            typeof location?.lat ===
            "function"
              ? location.lat()
              : location?.lat ?? null;

          const lng =
            typeof location?.lng ===
            "function"
              ? location.lng()
              : location?.lng ?? null;

          const details = {
            name:
              place.name || "",

            address:
              place.formatted_address || "",

            lat,

            lng,

            placeId,

            addressComponents:
              place.address_components ||
              [],

            photos:
              place.photos || [],

            rating:
              place.rating ?? null,

            userRatingsTotal:
              place.user_ratings_total ??
              null,

            openingHours:
              place.opening_hours || null,

            phone:
              place.formatted_phone_number ||
              "",

            website:
              place.website || "",

            googleMapsUrl:
              place.url || "",

            businessStatus:
              place.business_status || "",

            types:
              place.types || [],

            rawPlace: place,
          };

          console.log(
            "✅ [GooglePlaces] FINAL DETAILS:",
            details
          );

          resolve(details);
        }
      );
    }
  );
}

// ─────────────────────────────────────────────
// FORWARD GEOCODE (address text → lat/lng)
// ─────────────────────────────────────────────
// Same google.maps.Geocoder as reverseGeocode below, just run the other
// direction: geocoder.geocode({ address }) instead of
// geocoder.geocode({ location }). Used to resolve an address STRING (e.g.
// the brand's GST address, which carries city/state/pin but no lat/lng)
// into real coordinates, instead of failing outright and forcing the
// vendor to search/pin manually.
//
// Resolves to the raw Google GeocoderResult — same shape as
// reverseGeocode's results[0]:
//   { formatted_address, geometry: { location }, address_components,
//     place_id, ... }
// NOTE: geometry.location.lat()/lng() are FUNCTIONS, not plain numbers —
// callers must invoke them (see CreateBrandOutlet.jsx's persistGstAddress).
export async function geocodeAddress(address) {
  console.log(
    "📍 [GoogleMaps] Forward geocode:",
    address
  );

  if (!address || !address.trim()) {
    throw new Error(
      "Address is required for geocoding"
    );
  }

  const google =
    await loadGoogleMapsScript();

  return new Promise(
    (resolve, reject) => {
      const geocoder =
        new google.maps.Geocoder();

      geocoder.geocode(
        {
          address: address.trim(),
        },
        (results, status) => {
          console.log(
            "📡 [GoogleMaps] Forward geocode status:",
            status
          );

          console.log(
            "📦 [GoogleMaps] Forward geocode results:",
            results
          );

          if (
            status === "OK" &&
            results?.[0]
          ) {
            resolve(results[0]);
          } else {
            reject(
              new Error(
                `Geocoding failed: ${status}`
              )
            );
          }
        }
      );
    }
  );
}

// ─────────────────────────────────────────────
// REVERSE GEOCODE
// ─────────────────────────────────────────────

export async function reverseGeocode(
  lat,
  lng
) {
  console.log(
    "📍 [GoogleMaps] Reverse geocode:",
    {
      lat,
      lng,
    }
  );

  const google =
    await loadGoogleMapsScript();

  return new Promise(
    (resolve, reject) => {
      const geocoder =
        new google.maps.Geocoder();

      geocoder.geocode(
        {
          location: {
            lat,
            lng,
          },
        },
        (results, status) => {
          console.log(
            "📡 Reverse geocode:",
            status
          );

          if (
            status === "OK" &&
            results?.[0]
          ) {
            resolve(results[0]);
          } else {
            reject(
              new Error(
                `Reverse geocoding failed: ${status}`
              )
            );
          }
        }
      );
    }
  );
}