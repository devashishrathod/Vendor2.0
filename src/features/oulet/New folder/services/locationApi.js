import axios from 'axios';

// ── Base URL ────────────────────────────────────────────────
// Matches the Postman env variable {{TryDood2.0BaseUrl}}
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically (same pattern as authApi.js / planApi.js /
// CategoryApi.js / showcaseApi.js). NOTE: adjust this relative path to
// wherever authStore.js actually lives in your project.
api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../../onboarding/store/authStore');
    const token = useAuthStore.getState().token; // authStore stores it as `token`
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Normalize error responses so callers get a consistent shape
function handleError(error) {
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong. Please try again.';
    throw new Error(message);
}

export const ADDRESS_TYPES = { HOME: 'HOME', WORK: 'WORK', OTHER: 'OTHER' };

// ══════════════════════════════════════════════════════════════
// LOCATIONS
// ══════════════════════════════════════════════════════════════

// ── Create Location ─────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/locations/create
//
// Confirmed live schema (per Postman collection docs):
//   {
//     userId?,              // only if admin creates on behalf of a user
//     brandId?,              // only if this is a Brand-level address
//     subBrandId?,            // only if this is a subBrand/outlet-level address — ⚠️ REQUIRED for outlet flow
//     addressLine1,          // REQUIRED
//     addressLine2?,
//     landmark?,
//     city,                  // REQUIRED
//     district,              // REQUIRED — ⚠️ backend 422s with "Body.district is not allowed to be empty" if missing
//     state,                 // REQUIRED
//     zipcode,               // REQUIRED
//     country?,
//     formattedAddress?,     // priority field, send whenever available
//     coordinates: [lng, lat], // REQUIRED
//     addressType,           // "HOME" | "WORK" | "OTHER" — brand/subBrand always send "WORK"
//     isBrandAddress,        // true when this address belongs to a particular Brand
//     isSubBrandAddress,     // true when it belongs to a subBrand
//     isDefault,             // usually true
//   }
//
// NOTE: what comes BACK from the server (see getAllLocations) nests the
// coordinates differently — under `geo.coordinates` (GeoJSON Point), not a
// top-level `coordinates` key. That's just how the backend stores/returns
// it; the CREATE payload itself still takes a flat `coordinates: [lng,lat]`.
export async function createLocation(payload) {
    console.log('[locationApi] createLocation → sending payload:', JSON.stringify(payload, null, 2));
    try {
        const { data } = await api.post('/locations/create', payload);
        console.log('[locationApi] createLocation ← SUCCESS response:', data);
        return data;
    } catch (error) {
        console.error('[locationApi] createLocation ✗ FAILED');
        console.error('  → payload that was sent:', JSON.stringify(payload, null, 2));
        console.error('  ← HTTP status:', error?.response?.status);
        console.error('  ← backend response.data:', error?.response?.data);
        console.error('  ← full axios error:', error);
        handleError(error);
    }
}

// ── Upsert Customer Location ────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/locations/upsert
// Same body shape as createLocation, minus brandId — this is the
// customer-side "save my HOME/WORK address" flow (addressType usually
// HOME/OTHER for a customer, not the Brand/Outlet creation flow above).
// Kept here for completeness since it's the sibling endpoint in the same
// Postman folder, but the Brand Outlet page below uses createLocation.
export async function upsertCustomerLocation(payload) {
    console.log('[locationApi] upsertCustomerLocation → sending payload:', payload);
    try {
        const { data } = await api.post('/locations/upsert', payload);
        console.log('[locationApi] upsertCustomerLocation ← SUCCESS response:', data);
        return data;
    } catch (error) {
        console.error('[locationApi] upsertCustomerLocation ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}

// ── Get Single Location ─────────────────────────────────────────
// GET {{TryDood2.0BaseUrl}}/locations/:id
export async function getLocation(id) {
    console.log('[locationApi] getLocation → id:', id);
    try {
        const { data } = await api.get(`/locations/${id}`);
        console.log('[locationApi] getLocation ← response:', data);
        return data;
    } catch (error) {
        console.error('[locationApi] getLocation ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}

// ── Get All Locations (paginated + filterable) ──────────────────
// GET {{TryDood2.0BaseUrl}}/locations?page=&limit=&brandId=&userId=&subBrandId=
//
// CONFIRMED response shape (real payload):
// {
//   "success": true,
//   "message": "Locations fetched successfully",
//   "data": {
//     "total": 1, "totalPages": 1, "page": 1, "limit": 10,
//     "data": [ { _id, userId, brandId, subBrandId, addressLine1, ...,
//                 geo: { type: "Point", coordinates: [lng, lat] },
//                 isBrandAddress, isSubBrandAddress, isDefault, ... } ]
//   }
// }
//
// i.e. the actual array of location docs lives at res.data.data.data, and
// each doc's coordinates live at doc.geo.coordinates (NOT doc.coordinates).
export async function getAllLocations({ page = 1, limit = 10, brandId, userId, subBrandId } = {}) {
    console.log('[locationApi] getAllLocations → params:', { page, limit, brandId, userId, subBrandId });
    try {
        const params = { page, limit };
        if (brandId) params.brandId = brandId;
        if (userId) params.userId = userId;
        if (subBrandId) params.subBrandId = subBrandId;
        const { data } = await api.get('/locations/getAll', { params });
        console.log('[locationApi] getAllLocations ← response:', data);
        return data;
    } catch (error) {
        console.error('[locationApi] getAllLocations ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}

// ── Update Location ──────────────────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/locations/update/:id
// body: any subset of the createLocation fields.
//
// ⚠️ FIXED: was calling PUT /locations/:id — confirmed via Postman that
// the real route is PUT /locations/update/:id (same pattern as
// /locations/create, not a bare REST /locations/:id).
export async function updateLocation(id, patch = {}) {
    console.log('[locationApi] updateLocation → id:', id, 'patch:', patch);
    try {
        const { data } = await api.put(`/locations/update/${id}`, patch);
        console.log('[locationApi] updateLocation ← response:', data);
        return data;
    } catch (error) {
        console.error('[locationApi] updateLocation ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}

// ── Delete Location ───────────────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/locations/:id
export async function deleteLocation(id) {
    console.log('[locationApi] deleteLocation → id:', id);
    try {
        const { data } = await api.delete(`/locations/${id}`);
        console.log('[locationApi] deleteLocation ← response:', data);
        return data;
    } catch (error) {
        console.error('[locationApi] deleteLocation ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// PREFILL HELPER — converts a saved location doc (now sourced from
// brands/get?brandId= → data.firstSubBrand.location, NOT a separate
// locations/getAll call) back into the `{ name, address, lat, lng,
// placeId, addressComponents, source }` shape OutletLocationSearch /
// MapModal / persistSelectedPlace expect — the inverse of
// buildLocationPayloadFromPlace.
//
// Reads coordinates from `loc.geo.coordinates` (confirmed shape — matches
// firstSubBrand.location.geo.coordinates in the brands/get response), with
// a fallback to a flat `loc.coordinates` in case some other source ever
// returns that instead.
// ══════════════════════════════════════════════════════════════
export function mapLocationToSelectedPlace(loc) {
    if (!loc) return null;
    const [lng, lat] = loc.geo?.coordinates || loc.coordinates || [];
    return {
        name: loc.addressLine1 || loc.formattedAddress || 'Saved Location',
        address:
            loc.formattedAddress ||
            [loc.addressLine1, loc.addressLine2, loc.city, loc.state, loc.zipcode].filter(Boolean).join(', '),
        lat: typeof lat === 'number' ? lat : null,
        lng: typeof lng === 'number' ? lng : null,
        placeId: loc.placeId || null,
        addressComponents: null,
        source: 'saved',
    };
}

// ══════════════════════════════════════════════════════════════
// PAYLOAD BUILDERS
//
// Turns whatever OutletLocationSearch / LiveLocationPicker resolve (a
// Google Places result with address_components) — or the brand's existing
// GST address — into the exact body shape locations/create expects.
// ══════════════════════════════════════════════════════════════

// Pulls one component's long_name out of Google's address_components array
// by its `types` entry (e.g. "locality", "postal_code", ...).
function extractAddressComponent(components, type) {
    const value = components?.find((c) => c.types?.includes(type))?.long_name || '';
    return value;
}

// postal_code is sometimes missing from Places/Geocode results (common for
// point-of-interest results, or a bare locality like "Alirajpur" / "Ahmedabad"
// with no specific building/shop — city-level results NEVER carry a
// postal_code component from Google). Fall back to pulling a 6-digit Indian
// PIN straight out of the formatted address string; if that's also absent,
// this returns '' and the caller MUST block submission via hasValidZipcode
// below and prompt the user to type the pincode manually, rather than let
// the backend 422 on it.
function extractZipcode(comps, formattedAddress) {
    const fromComponents = extractAddressComponent(comps, 'postal_code');
    if (fromComponents) {
        console.log('[locationApi] extractZipcode: found postal_code component →', fromComponents);
        return fromComponents;
    }
    const match = formattedAddress?.match(/\b\d{6}\b/);
    if (match) {
        console.log('[locationApi] extractZipcode: found 6-digit PIN in formattedAddress →', match[0]);
        return match[0];
    }
    console.warn('[locationApi] extractZipcode: NO zipcode found (no postal_code component, no 6-digit PIN in)', formattedAddress);
    return '';
}

// city is REQUIRED by the backend. `locality` is Google's normal match,
// but some results (a specific building, a POI deep inside a small town)
// omit it — fall back down through progressively broader components
// before giving up.
function extractCity(comps) {
    const city =
        extractAddressComponent(comps, 'locality') ||
        extractAddressComponent(comps, 'postal_town') ||
        extractAddressComponent(comps, 'sublocality_level_1') ||
        extractAddressComponent(comps, 'sublocality') ||
        extractAddressComponent(comps, 'administrative_area_level_2') ||
        extractAddressComponent(comps, 'administrative_area_level_3') ||
        '';
    console.log('[locationApi] extractCity →', city || '(empty)');
    return city;
}

// ⚠️ FIXED — this is the actual cause of "Body.district is not allowed to
// be empty". `district` used to be sent as a bare
// `administrative_area_level_2` read straight off the components with no
// fallback at all. Google frequently doesn't return that component
// (common for a plain locality pick, or when administrative_area_level_2
// isn't meaningful for that region), so district silently came through as
// '' and the backend rejected the whole save.
//
// Now falls back through: admin_area_level_2 → admin_area_level_3 →
// the resolved city → the resolved state → a hardcoded non-empty
// placeholder as an absolute last resort, so this can never be ''.
function extractDistrict(comps, cityFallback, stateFallback) {
    const district =
        extractAddressComponent(comps, 'administrative_area_level_2') ||
        extractAddressComponent(comps, 'administrative_area_level_3') ||
        cityFallback ||
        stateFallback ||
        'NA';
    console.log('[locationApi] extractDistrict →', district, '(cityFallback:', cityFallback, 'stateFallback:', stateFallback, ')');
    return district;
}

// addressLine1 is REQUIRED by the backend. Google doesn't have a single
// "line 1" component, so build it from street_number + route (the closest
// equivalent). Falls back to premise, then the place's own name (e.g. a
// business/POI name or a bare city name from text search), then the raw
// formatted address — so this is only ever '' if literally nothing usable
// came back. NOTE: for city-level picks (e.g. "Ahmedabad") this will
// legitimately fall back to the city name itself — that's expected and
// fine for addressLine1 (backend just needs a non-empty string here), it's
// zipcode that's the real blocker for those picks.
function extractAddressLine1(comps, placeName, formattedAddress) {
    const streetNumber = extractAddressComponent(comps, 'street_number');
    const route = extractAddressComponent(comps, 'route');
    const streetLine = [streetNumber, route].filter(Boolean).join(' ').trim();
    if (streetLine) {
        console.log('[locationApi] extractAddressLine1: street_number+route →', streetLine);
        return streetLine;
    }

    const premise = extractAddressComponent(comps, 'premise') || extractAddressComponent(comps, 'subpremise');
    if (premise) {
        console.log('[locationApi] extractAddressLine1: premise/subpremise →', premise);
        return premise;
    }

    if (placeName) {
        console.log('[locationApi] extractAddressLine1: placeName fallback →', placeName);
        return placeName;
    }

    const fallback = formattedAddress?.split(',')[0]?.trim() || '';
    console.log('[locationApi] extractAddressLine1: formattedAddress chunk fallback →', fallback);
    return fallback;
}

// addressLine2 is optional — sublocality (e.g. "Andheri West") is the
// closest Google equivalent.
function extractAddressLine2(comps) {
    return (
        extractAddressComponent(comps, 'sublocality_level_1') ||
        extractAddressComponent(comps, 'sublocality') ||
        extractAddressComponent(comps, 'neighborhood') ||
        ''
    );
}

/**
 * Builds a locations/create body from a resolved Google place — the same
 * `{ name, address, lat, lng, placeId, addressComponents, source }` object
 * that OutletLocationSearch's `onSelectPlace` and LiveLocationPicker's
 * `onSelectPlace` already hand back.
 *
 * Sends the FULL schema the backend accepts (see note on createLocation
 * above) — addressLine1/2, landmark, formattedAddress, addressType,
 * isBrandAddress/isSubBrandAddress/isDefault are all real fields, not
 * dropped.
 *
 * ⚠️ FIXED: now accepts `overrides.subBrandId`. Per the confirmed Postman
 * schema, the Brand Outlet flow creates a SUBBRAND-level address, so:
 *   - subBrandId gets sent in the body (was missing entirely before)
 *   - isBrandAddress / isSubBrandAddress now default off of whether a
 *     subBrandId was passed, instead of hardcoding isBrandAddress: true.
 *
 * ⚠️ FIXED: `district` now goes through extractDistrict's fallback chain
 * instead of a bare, unguarded administrative_area_level_2 read — fixes
 * the "Body.district is not allowed to be empty" 422.
 *
 * @param {object} place
 * @param {object} [overrides]
 * @param {string} [overrides.userId]
 * @param {string} [overrides.brandId]         only pass this for a pure brand-level address
 * @param {string} [overrides.subBrandId]      pass this for the outlet flow — REQUIRED per backend schema
 * @param {string} [overrides.addressType]        default: ADDRESS_TYPES.WORK
 * @param {boolean} [overrides.isBrandAddress]     default: true only if no subBrandId given
 * @param {boolean} [overrides.isSubBrandAddress]  default: true if subBrandId given
 * @param {boolean} [overrides.isDefault]          default: true
 * @param {string} [overrides.landmark]            manual landmark input, if you add one to the UI
 * @param {string} [overrides.manualZipcode]        user-typed pincode fallback, used when Google gives none
 */
export function buildLocationPayloadFromPlace(place, overrides = {}) {
    console.log('[locationApi] buildLocationPayloadFromPlace ← raw place object:', place);
    console.log('[locationApi] buildLocationPayloadFromPlace ← addressComponents:', place?.addressComponents);
    console.log('[locationApi] buildLocationPayloadFromPlace ← overrides:', overrides);

    const comps = place?.addressComponents || [];
    const formattedAddress = place?.address || '';
    const hasSubBrand = !!overrides.subBrandId;

    const city = extractCity(comps);
    const state = extractAddressComponent(comps, 'administrative_area_level_1');
    const district = extractDistrict(comps, city, state);

    const result = {
        ...(overrides.userId ? { userId: overrides.userId } : {}),
        ...(overrides.brandId ? { brandId: overrides.brandId } : {}),
        ...(overrides.subBrandId ? { subBrandId: overrides.subBrandId } : {}), // ⚠️ NEW
        addressLine1: extractAddressLine1(comps, place?.name, formattedAddress),
        addressLine2: extractAddressLine2(comps),
        ...(overrides.landmark ? { landmark: overrides.landmark } : {}),
        city,
        district, // ⚠️ FIXED — was a bare administrative_area_level_2 read with no fallback
        state,
        zipcode: overrides.manualZipcode || extractZipcode(comps, formattedAddress),
        country: extractAddressComponent(comps, 'country') || 'India',
        formattedAddress,
        coordinates: [place?.lng, place?.lat], // [lng, lat]
        addressType: overrides.addressType || ADDRESS_TYPES.WORK,
        // ⚠️ FIXED: was hardcoded isBrandAddress: true always — now flips
        // based on whether this is actually a subBrand/outlet address.
        isBrandAddress: overrides.isBrandAddress ?? !hasSubBrand,
        isSubBrandAddress: overrides.isSubBrandAddress ?? hasSubBrand,
        isDefault: overrides.isDefault ?? true,
    };

    console.log('[locationApi] buildLocationPayloadFromPlace → BUILT PAYLOAD:', result);
    return result;
}

/**
 * Builds a locations/create body from the brand's existing GST address,
 * used when the merchant checks "GST Address Is The Same As The Outlet
 * Location".
 *
 * Only sends fields the backend currently accepts — see note above.
 *
 * ⚠️ NOTE: this builder is no longer called automatically by the Brand
 * Outlet page — the GST checkbox now only prefills the search input's text
 * (see prefillGstAddress in CreateBrandOutlet.jsx) and requires the vendor
 * to confirm the address via the search dropdown, which routes through
 * buildLocationPayloadFromPlace instead (that's the one with real
 * address_components to build district/city/state/zipcode from). This
 * function is kept for any other caller that still wants to build a
 * payload directly off gst.address, but note that gst.address data alone
 * still won't reliably have a district — same underlying problem, just
 * with GST-sourced fields instead of Google's.
 *
 * ⚠️ FIXED: same subBrandId / isBrandAddress / isSubBrandAddress fix as
 * buildLocationPayloadFromPlace above, plus the same district fallback
 * (gst.district → city → state → 'NA') so this can't post an empty
 * district either.
 *
 * ⚠️ ADJUST: the exact shape of `brand.gst.address` wasn't fully visible in
 * the original code (only `.location` — a formatted string — was read from
 * it), so this reads a handful of likely field names defensively and falls
 * back to empty strings. Confirm the real field names with your backend
 * and tighten this once known.
 *
 * @param {object} gstAddress - e.g. brand?.gst?.address
 * @param {object} [overrides] - userId, brandId, subBrandId, manualZipcode currently forwarded.
 */
export function buildLocationPayloadFromGstAddress(gstAddress = {}, overrides = {}) {
    console.log('[locationApi] buildLocationPayloadFromGstAddress ← raw gstAddress:', gstAddress);
    console.log('[locationApi] buildLocationPayloadFromGstAddress ← overrides:', overrides);

    const [lng, lat] = gstAddress.coordinates || [gstAddress.lng, gstAddress.lat];
    const formattedAddress = gstAddress.formattedAddress || gstAddress.location || '';
    const hasSubBrand = !!overrides.subBrandId;

    const city = gstAddress.city || '';
    const state = gstAddress.state || '';
    // ⚠️ FIXED — was `gstAddress.district || ''` with no further fallback.
    const district = gstAddress.district || city || state || 'NA';

    const result = {
        ...(overrides.brandId ? { brandId: overrides.brandId } : {}),
        ...(overrides.subBrandId ? { subBrandId: overrides.subBrandId } : {}), // ⚠️ NEW
        addressLine1: gstAddress.addressLine1 || gstAddress.line1 || formattedAddress?.split(',')[0]?.trim() || '',
        addressLine2: gstAddress.addressLine2 || gstAddress.line2 || '',
        city,
        district,
        state,
        zipcode: overrides.manualZipcode || gstAddress.zipcode || gstAddress.pincode || extractZipcode([], formattedAddress),
        country: gstAddress.country || 'India',
        formattedAddress,
        coordinates: [lng, lat],
        addressType: overrides.addressType || ADDRESS_TYPES.WORK,
        // ⚠️ FIXED: same flip as buildLocationPayloadFromPlace
        isBrandAddress: overrides.isBrandAddress ?? !hasSubBrand,
        isSubBrandAddress: overrides.isSubBrandAddress ?? hasSubBrand,
        isDefault: overrides.isDefault ?? true,
        ...(overrides.userId ? { userId: overrides.userId } : {}),
    };

    console.log('[locationApi] buildLocationPayloadFromGstAddress → BUILT PAYLOAD:', result);
    return result;
}

/**
 * A location payload is only postable once it has real coordinates —
 * `coordinates` is a required field on locations/create. Use this before
 * calling createLocation with a GST-sourced payload, since GST addresses
 * don't always carry lat/lng.
 */
export function hasValidCoordinates(payload) {
    const [lng, lat] = payload?.coordinates || [];
    const valid = typeof lng === 'number' && typeof lat === 'number' && !Number.isNaN(lng) && !Number.isNaN(lat);
    console.log('[locationApi] hasValidCoordinates:', valid, '(coordinates:', payload?.coordinates, ')');
    return valid;
}

/**
 * Guards against the "Zipcode is not allowed to be empty" backend 422.
 * Some picked places (bare localities / city-level picks like "Ahmedabad"
 * with no building-level result) never carry a postal_code, and there's no
 * 6-digit PIN in the formatted address either — extractZipcode then
 * returns ''. MUST be called alongside hasValidCoordinates before
 * persistLocationPayload so the user gets a friendly inline message (and a
 * chance to type the pincode manually) instead of a raw 422 from
 * /locations/create.
 */
export function hasValidZipcode(payload) {
    const valid = typeof payload?.zipcode === 'string' && payload.zipcode.trim().length > 0;
    console.log('[locationApi] hasValidZipcode:', valid, '(zipcode:', JSON.stringify(payload?.zipcode), ')');
    return valid;
}

/**
 * Same idea as hasValidZipcode, for addressLine1 — required by the
 * backend. In practice this rarely fails (it falls back to the place
 * name), but a fully custom/manual coordinate drop with no place object at
 * all could still produce ''.
 */
export function hasValidAddressLine1(payload) {
    const valid = typeof payload?.addressLine1 === 'string' && payload.addressLine1.trim().length > 0;
    console.log('[locationApi] hasValidAddressLine1:', valid, '(addressLine1:', JSON.stringify(payload?.addressLine1), ')');
    return valid;
}

/**
 * city and state are also required by the backend. Bare lat/lng drops or
 * unusual Places results can occasionally leave these empty too.
 */
export function hasValidCityAndState(payload) {
    const validCity = typeof payload?.city === 'string' && payload.city.trim().length > 0;
    const validState = typeof payload?.state === 'string' && payload.state.trim().length > 0;
    console.log('[locationApi] hasValidCityAndState:', validCity && validState, '(city:', JSON.stringify(payload?.city), 'state:', JSON.stringify(payload?.state), ')');
    return validCity && validState;
}

/**
 * ⚠️ NEW — `district` is REQUIRED by the backend ("Body.district is not
 * allowed to be empty"), same as city/state, but there was previously no
 * corresponding check for it here. Both payload builders now guarantee a
 * non-empty district via their fallback chains, but this exists so
 * validateLocationPayload can still catch the (very unlikely) case where
 * it somehow comes through blank, instead of only discovering it via a
 * backend 422.
 */
export function hasValidDistrict(payload) {
    const valid = typeof payload?.district === 'string' && payload.district.trim().length > 0;
    console.log('[locationApi] hasValidDistrict:', valid, '(district:', JSON.stringify(payload?.district), ')');
    return valid;
}

/**
 * subBrandId is required for the Brand Outlet flow per the confirmed
 * backend schema — a location with neither brandId nor subBrandId is a
 * dangling/customer-style address, not an outlet address. Use this
 * alongside the other hasValid* checks before persistLocationPayload in
 * the outlet creation flow specifically.
 */
export function hasValidSubBrandId(payload) {
    const valid = typeof payload?.subBrandId === 'string' && payload.subBrandId.trim().length > 0;
    console.log('[locationApi] hasValidSubBrandId:', valid, '(subBrandId:', JSON.stringify(payload?.subBrandId), ')');
    return valid;
}

/**
 * Runs every required-field check at once and returns a list of problems
 * (empty array = payload is postable). Use this right before
 * persistLocationPayload for a single, complete validation pass instead of
 * calling each hasValid* function separately.
 *
 * @param {object} payload
 * @param {object} [opts]
 * @param {boolean} [opts.requireSubBrandId] pass true in the outlet flow so a
 *   missing subBrandId is caught here instead of silently posting a
 *   brand-level address by mistake.
 */
export function validateLocationPayload(payload, opts = {}) {
    const errors = [];
    if (!hasValidCoordinates(payload)) errors.push('coordinates');
    if (!hasValidAddressLine1(payload)) errors.push('addressLine1');
    if (!hasValidCityAndState(payload)) errors.push('city/state');
    if (!hasValidDistrict(payload)) errors.push('district'); // ⚠️ NEW
    if (!hasValidZipcode(payload)) errors.push('zipcode');
    if (opts.requireSubBrandId && !hasValidSubBrandId(payload)) errors.push('subBrandId');
    console.log('[locationApi] validateLocationPayload → errors:', errors.length ? errors : 'NONE (valid)');
    return errors;
}