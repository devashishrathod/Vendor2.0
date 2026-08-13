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
//     userId?,            // only if admin creates on behalf of a user
//     brandId?,            // only if this is a brand/subBrand address
//     addressLine1,        // REQUIRED
//     addressLine2?,
//     landmark?,
//     city,                // REQUIRED
//     district?,
//     state,               // REQUIRED
//     zipcode,             // REQUIRED
//     country?,
//     formattedAddress?,   // priority field, send whenever available
//     coordinates: [lng, lat], // REQUIRED
//     addressType,         // "HOME" | "WORK" | "OTHER" — brand/subBrand always send "WORK"
//     isBrandAddress,      // true when this address belongs to a particular Brand
//     isSubBrandAddress,   // true when it belongs to a subBrand
//     isDefault,           // usually true
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
// GET {{TryDood2.0BaseUrl}}/locations?page=&limit=&brandId=&userId=
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
// PUT {{TryDood2.0BaseUrl}}/locations/:id
// body: any subset of the createLocation fields.
export async function updateLocation(id, patch = {}) {
    console.log('[locationApi] updateLocation → id:', id, 'patch:', patch);
    try {
        const { data } = await api.put(`/locations/${id}`, patch);
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
// PREFILL HELPERS — hydrate CreateBrandOutlet from an already-saved
// location instead of making the merchant search/pin it again.
// ══════════════════════════════════════════════════════════════

// ── Get Brand's Saved Outlet Location ─────────────────────────────
// Convenience wrapper over getAllLocations — fetches this brand's WORK
// address so CreateBrandOutlet can pre-fill selectedPlace/savedLocationId
// on mount.
//
// Real docs can come back with isBrandAddress:false / isSubBrandAddress:true
// (e.g. an address created for a specific outlet, not the parent brand) —
// so this does NOT filter on isBrandAddress. It just takes the most
// recently updated WORK-type doc for this brandId, which covers both the
// "brand-level" and "sub-brand/outlet-level" address cases.
export async function getBrandLocation(brandId) {
    console.log('[locationApi] getBrandLocation → brandId:', brandId);
    if (!brandId) return null;
    try {
        const res = await getAllLocations({ brandId, limit: 20 });
        const list = res?.data?.data || [];
        const candidates = (Array.isArray(list) ? list : []).filter(
            (loc) => loc.addressType === ADDRESS_TYPES.WORK && !loc.isDeleted
        );
        const pool = candidates.length ? candidates : list;
        // Most recently updated first, so a later edit wins over an older save.
        const sorted = [...pool].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        );
        const picked = sorted[0] || null;
        console.log('[locationApi] getBrandLocation ← picked:', picked);
        return picked;
    } catch (error) {
        console.error('[locationApi] getBrandLocation ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}

/**
 * Converts a saved location document (from getBrandLocation /
 * getAllLocations) back into the `{ name, address, lat, lng, placeId,
 * addressComponents, source }` shape OutletLocationSearch / MapModal /
 * persistSelectedPlace expect — the inverse of buildLocationPayloadFromPlace.
 *
 * Reads coordinates from `loc.geo.coordinates` (confirmed shape), with a
 * fallback to a flat `loc.coordinates` in case an older/different endpoint
 * ever returns that instead.
 */
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
 * @param {object} place
 * @param {object} [overrides]
 * @param {string} [overrides.userId]
 * @param {string} [overrides.brandId]
 * @param {string} [overrides.addressType]        default: ADDRESS_TYPES.WORK
 * @param {boolean} [overrides.isBrandAddress]     default: true (brand outlet flow)
 * @param {boolean} [overrides.isSubBrandAddress]  default: false
 * @param {boolean} [overrides.isDefault]          default: true
 * @param {string} [overrides.landmark]            manual landmark input, if you add one to the UI
 * @param {string} [overrides.manualZipcode]        user-typed pincode fallback, used when Google gives none
 */
export function buildLocationPayloadFromPlace(place, overrides = {}) {
    console.log('[locationApi] buildLocationPayloadFromPlace ← raw place object:', place);
    console.log('[locationApi] buildLocationPayloadFromPlace ← addressComponents:', place?.addressComponents);

    const comps = place?.addressComponents || [];
    const formattedAddress = place?.address || '';

    const result = {
        ...(overrides.userId ? { userId: overrides.userId } : {}),
        ...(overrides.brandId ? { brandId: overrides.brandId } : {}),
        addressLine1: extractAddressLine1(comps, place?.name, formattedAddress),
        addressLine2: extractAddressLine2(comps),
        ...(overrides.landmark ? { landmark: overrides.landmark } : {}),
        city: extractAddressComponent(comps, 'locality') || extractAddressComponent(comps, 'administrative_area_level_2'),
        district: extractAddressComponent(comps, 'administrative_area_level_2'),
        state: extractAddressComponent(comps, 'administrative_area_level_1'),
        zipcode: overrides.manualZipcode || extractZipcode(comps, formattedAddress),
        country: extractAddressComponent(comps, 'country') || 'India',
        formattedAddress,
        coordinates: [place?.lng, place?.lat], // [lng, lat]
        addressType: overrides.addressType || ADDRESS_TYPES.WORK,
        isBrandAddress: overrides.isBrandAddress ?? true,
        isSubBrandAddress: overrides.isSubBrandAddress ?? false,
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
 * ⚠️ ADJUST: the exact shape of `brand.gst.address` wasn't fully visible in
 * the original code (only `.location` — a formatted string — was read from
 * it), so this reads a handful of likely field names defensively and falls
 * back to empty strings. Confirm the real field names with your backend
 * and tighten this once known.
 *
 * @param {object} gstAddress - e.g. brand?.gst?.address
 * @param {object} [overrides] - userId, brandId, manualZipcode currently forwarded.
 */
export function buildLocationPayloadFromGstAddress(gstAddress = {}, overrides = {}) {
    console.log('[locationApi] buildLocationPayloadFromGstAddress ← raw gstAddress:', gstAddress);

    const [lng, lat] = gstAddress.coordinates || [gstAddress.lng, gstAddress.lat];
    const formattedAddress = gstAddress.formattedAddress || gstAddress.location || '';

    const result = {
        ...(overrides.brandId ? { brandId: overrides.brandId } : {}),
        addressLine1: gstAddress.addressLine1 || gstAddress.line1 || formattedAddress?.split(',')[0]?.trim() || '',
        addressLine2: gstAddress.addressLine2 || gstAddress.line2 || '',
        city: gstAddress.city || '',
        district: gstAddress.district || '',
        state: gstAddress.state || '',
        zipcode: overrides.manualZipcode || gstAddress.zipcode || gstAddress.pincode || extractZipcode([], formattedAddress),
        country: gstAddress.country || 'India',
        formattedAddress,
        coordinates: [lng, lat],
        addressType: overrides.addressType || ADDRESS_TYPES.WORK,
        isBrandAddress: overrides.isBrandAddress ?? true,
        isSubBrandAddress: overrides.isSubBrandAddress ?? false,
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
 * Runs every required-field check at once and returns a list of problems
 * (empty array = payload is postable). Use this right before
 * persistLocationPayload for a single, complete validation pass instead of
 * calling each hasValid* function separately.
 */
export function validateLocationPayload(payload) {
    const errors = [];
    if (!hasValidCoordinates(payload)) errors.push('coordinates');
    if (!hasValidAddressLine1(payload)) errors.push('addressLine1');
    if (!hasValidCityAndState(payload)) errors.push('city/state');
    if (!hasValidZipcode(payload)) errors.push('zipcode');
    console.log('[locationApi] validateLocationPayload → errors:', errors.length ? errors : 'NONE (valid)');
    return errors;
}