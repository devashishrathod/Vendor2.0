import axios from 'axios';

// ── Base URL ────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically
api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../../onboarding/store/authStore');
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function handleError(error) {
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong. Please try again.';
    throw new Error(message);
}

export const OUTLET_TYPES = { OUTLET: 'OUTLET', FRANCHISE: 'FRANCHISE' };

// ══════════════════════════════════════════════════════════════
// AUTH — WhatsApp OTP (send/resend + verify)
// ══════════════════════════════════════════════════════════════

// ── Send / Resend Outlet WhatsApp OTP ──────────────────────────
// POST {{TryDood2.0BaseUrl}}/auth/loginOrSignUp-with-whatsapp
// body: { whatsappNumber, role }
export async function loginOrSignUpWithWhatsapp({ whatsappNumber, role = 'SUB_VENDOR' } = {}) {
    try {
        const { data } = await api.post('/auth/loginOrSignUp-with-whatsapp', { whatsappNumber, role });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Verify Outlet WhatsApp OTP ────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/auth/verify-otp-whatsapp
// body: { otp, whatsappNumber, role, currentScreen? }
export async function verifyOtpWhatsapp({ whatsappNumber, otp, role = 'SUB_VENDOR', currentScreen } = {}) {
    try {
        const body = { otp, whatsappNumber, role };
        if (currentScreen) body.currentScreen = currentScreen;
        const { data } = await api.post('/auth/verify-otp-whatsapp', body);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// SUBBRAND (Outlet)
// ══════════════════════════════════════════════════════════════

// ── Sign Up a SubBrand (Outlet) With WhatsApp ────────────────────
// POST {{TryDood2.0BaseUrl}}/subBrands/signUp-with-whatsapp
// body: { brandId, isFirstOutlet?, whatsappNumber }
//
// ⚠️ IMPORTANT — response shape has TWO different ids, don't confuse them:
//   response.data._id         -> the SUB_VENDOR *user/login* account created
//                                 for this outlet (has password hash,
//                                 referralCode, uniqueId, walletBalance, etc.
//                                 — none of that belongs to the outlet itself)
//   response.data.subBrandId  -> the ACTUAL SubBrand document id.
//                                 THIS is what updateSubBrand() and
//                                 upsertWorkHours({ subBrandId, ... }) need.
//
// Using response.data._id anywhere a subBrandId is expected (e.g. the
// Working Hours payload) will silently send the wrong id — the request
// won't necessarily error, it'll just attach hours to nothing or to the
// wrong record.
export async function signUpSubBrandWithWhatsapp({ brandId, whatsappNumber, isFirstOutlet } = {}) {
    try {
        const body = { brandId, whatsappNumber };
        if (isFirstOutlet) body.isFirstOutlet = true;
        const { data } = await api.post('/subBrands/signUp-with-whatsapp', body);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Combined helper: creates the subBrand shell AND sends the OTP ──
// Creating the shell (signUp-with-whatsapp) and triggering the OTP
// (loginOrSignUp-with-whatsapp) are two separate backend calls; this
// wraps both since they always happen together the first time the
// merchant hits "Verify".
//
// Return shape: { success, message, data: { _id /* user id, NOT the outlet */, subBrandId /* the real outlet id */, ... } }
// Callers must read res.data.subBrandId, never res.data._id, when they
// need the outlet's id for updateSubBrand / upsertWorkHours.
export async function sendOutletWhatsappOtp({ brandId, whatsappNumber, isFirstOutlet } = {}) {
    const subBrandRes = await signUpSubBrandWithWhatsapp({ brandId, whatsappNumber, isFirstOutlet });
    await loginOrSignUpWithWhatsapp({ whatsappNumber });
    return subBrandRes;
}

// ── Update a SubBrand (Outlet) ─────────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/subBrands/update/:id
// body: any subset of { email, outletType, joinedDate, description, isActive }
// The `:id` in the URL must be response.data.subBrandId from
// sendOutletWhatsappOtp / signUpSubBrandWithWhatsapp — not response.data._id.
export async function updateSubBrand(subBrandId, patch = {}) {
    try {
        const { data } = await api.put(`/subBrands/update/${subBrandId}`, patch);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get All SubBrands for a Brand ───────────────────────────────
// GET {{TryDood2.0BaseUrl}}/subBrands/getAll?brandId=:brandId
// ⚠️ Path/params guessed to mirror locations/getAll's pattern — confirm
// the real route + response shape against your Postman collection and
// adjust the parsing in getBrandWithSubBrand below if it differs.
export async function getSubBrandsByBrandId(brandId) {
    if (!brandId) return null;
    try {
        const { data } = await api.get('/subBrands/getAll', { params: { brandId } });
        return data;
    } catch (error) {
        handleError(error);
    }
}

/**
 * Combined fetch: brand + its subBrand(s), so CreateBrandOutlet can
 * prefill both the brand form AND the "already verified WhatsApp" state
 * on mount, instead of forcing the merchant through OTP again every visit.
 *
 * Returns:
 * {
 *   brand,             // raw brand doc
 *   subBrand,          // most-recently-updated subBrand doc for this brand, or null
 *   subBrandId,        // subBrand._id — the real outlet id, NOT the SUB_VENDOR user id
 *   whatsappNumber,    // subBrand's verified WhatsApp number, if any
 *   whatsappVerified,  // boolean — true if this outlet's WhatsApp is already verified
 * }
 *
 * ⚠️ `whatsappVerified` reads `subBrand.whatsappVerified` as a placeholder
 * field name — paste one real subBrands/getAll response and confirm the
 * actual field name.
 */
export async function getBrandWithSubBrand(brandId) {
    if (!brandId) return null;
    try {
        const [brandRes, subBrandsRes] = await Promise.all([
            getBrandById(brandId),
            getSubBrandsByBrandId(brandId),
        ]);

        const brand = brandRes?.data ?? brandRes;
        const list = subBrandsRes?.data?.data ?? subBrandsRes?.data ?? [];
        const subBrands = Array.isArray(list) ? list : [];

        const sorted = [...subBrands].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        );
        const subBrand = sorted[0] || null;

        return {
            brand,
            subBrand,
            subBrandId: subBrand?._id || null,
            whatsappNumber: subBrand?.whatsappNumber || null,
            whatsappVerified: !!subBrand?.whatsappVerified,
        };
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// WORKING HOURS
// ══════════════════════════════════════════════════════════════

// ── Upsert Working Hours ───────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/workHours/upsert
// body: { brandId?, subBrandId?, monday..sunday: { start, end, isOpen } }
// subBrandId here MUST be response.data.subBrandId from the OTP sign-up
// response — sending response.data._id (the user id) is the exact bug
// that was happening.
export async function upsertWorkHours({ brandId, subBrandId, hours } = {}) {
    try {
        const body = { ...hours };
        if (brandId) body.brandId = brandId;
        if (subBrandId) body.subBrandId = subBrandId;
        const { data } = await api.post('/workHours/upsert', body);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// BRAND
// ══════════════════════════════════════════════════════════════

// ── Update a Brand ──────────────────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/brands/update?brandId=:brandId
// multipart/form-data: logo(file), isOnboarding, subCategoryId,
// brandName, email, joinedDate, description, isActive
export async function updateBrandDetails(brandId, brandPayload = {}, logoFile = null) {
    try {
        const formData = new FormData();
        Object.entries(brandPayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, value);
            }
        });
        if (logoFile) formData.append('logo', logoFile);
        // No explicit Content-Type header — the browser must set it itself
        // for a FormData body so it can attach the multipart boundary;
        // overriding it with a boundary-less value makes the backend's
        // multer/busboy parser silently fail to read any fields.
        const { data } = await api.put(`/brands/update?brandId=${brandId}`, formData);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Add a Brand Feature ───────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/brandFeatures/add
// multipart/form-data: brandId, title, description, isActive, icon(file)
export async function addBrandFeature({ brandId, title, description, isActive, iconFile } = {}) {
    try {
        const formData = new FormData();
        formData.append('brandId', brandId);
        formData.append('title', title);
        formData.append('description', description ?? '');
        formData.append('isActive', String(!!isActive));
        if (iconFile) formData.append('icon', iconFile);
        // See updateBrandDetails's comment — no explicit Content-Type header.
        const { data } = await api.post('/brandFeatures/add', formData);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// COMBINED FLOW — final "Create" button
// ══════════════════════════════════════════════════════════════

/**
 * Finalizes the outlet + brand after WhatsApp OTP verification.
 * Confirmed order: subBrands/update fires FIRST, then brands/update.
 * Sequential on purpose (not Promise.all) — that's the confirmed order.
 *
 * NOTE: working hours are NOT upserted here — WorkingHoursEditor's own
 * "Save Working Hours" button already persists them independently via
 * upsertWorkHours as soon as the merchant clicks it, and CreateBrandOutlet
 * now gates the final Save button on that having happened
 * (workingHoursSaved must be true), so re-sending them here would just be
 * a redundant duplicate call.
 *
 * @param {string} subBrandId - MUST be the value from
 *   sendOutletWhatsappOtp's response.data.subBrandId, not response.data._id.
 * @param {object} subBrandPatch - see updateSubBrand
 * @param {string} brandId
 * @param {object} brandPayload - see updateBrandDetails
 * @param {File} [logoFile]
 */
export async function finalizeOutlet(subBrandId, subBrandPatch, brandId, brandPayload, logoFile) {
    const subBrand = await updateSubBrand(subBrandId, subBrandPatch);
    const brand = await updateBrandDetails(brandId, brandPayload, logoFile);
    return { subBrand, brand };
}

// ══════════════════════════════════════════════════════════════
// BRAND FEATURES (read)
// ══════════════════════════════════════════════════════════════

// ── Get All Brand Features (to prefill ListingFeaturesEditor) ─────
// GET {{TryDood2.0BaseUrl}}/brandFeatures/get-all?brandId=:brandId
export async function getBrandFeatures(brandId) {
    try {
        const { data } = await api.get('/brandFeatures/get-all', { params: { brandId } });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// BRAND (read)
// ══════════════════════════════════════════════════════════════

// GET {{TryDood2.0BaseUrl}}/brands/get?brandId=:brandId
export async function getBrandById(brandId) {
    console.log('[brandApi] getBrandById → brandId:', brandId);
    if (!brandId) return null;
    try {
        const { data } = await api.get('/brands/get', { params: { brandId } });
        console.log('[brandApi] getBrandById ← response:', data);
        return data;
    } catch (error) {
        console.error('[brandApi] getBrandById ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}