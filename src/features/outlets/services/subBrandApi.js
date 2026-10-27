import axios from 'axios';

// ── Base URL ────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically
api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../onboarding/store/authStore');
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

    // One WhatsApp number = one outlet: the backend's unique index is
    // { whatsappNumber, role }, so a number already on an outlet (e.g. the
    // first outlet's) can never be reused for another. Older backends leaked
    // that as this Mongo-style message — translate it.
    if (/is already registered for userid/i.test(message)) {
        throw new Error('This WhatsApp number is already registered to another outlet. Please use a different number.');
    }

    const err = new Error(message);
    // Carries e.g. { retryAfterSeconds } on the OTP rate-limit (429) and
    // { code } on outlet errors, so callers can tell "a code already went
    // out" apart from a real failure.
    if (error?.response?.data?.details) err.details = error.response.data.details;
    throw err;
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
// Confirmed body: { brandId, whatsappNumber, outletType: "OUTLET" | "FRANCHISE", isFirstOutlet: false }
// Confirmed response (Outlets page → Add Outlet): { success, message: "OTP sent to subBrand whatsapp
// number successfully.", data: { isNewOutlet, otpSent, otpError, retryAfterSeconds,
// user: { _id, ..., subBrandId }, subBrand: { _id, outletType, storeId, ... }, usage } }
// → the outlet id is data.subBrand._id (== data.user.subBrandId), and this call ALREADY sends the OTP.
//
// Add Outlet (a brand that already has its first outlet) always sends
// isFirstOutlet: false. Calling it again with the same number for an
// unverified outlet of this brand just RESENDS the OTP (data.isNewOutlet:
// false) — no new outlet, no extra plan slot. New SUB_VENDOR numbers can't go
// through auth/loginOrSignUp-with-whatsapp ("This account type cannot be
// created here") — that endpoint only logs existing outlet managers in.
// If the OTP couldn't be sent, the outlet still exists: 200 with
// data.otpSent: false + data.otpError / data.retryAfterSeconds.
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
export async function signUpSubBrandWithWhatsapp({ brandId, whatsappNumber, outletType, isFirstOutlet = false } = {}) {
    try {
        const body = { brandId, whatsappNumber, isFirstOutlet: !!isFirstOutlet };
        if (outletType) body.outletType = String(outletType).toUpperCase();
        const { data } = await api.post('/subBrands/signUp-with-whatsapp', body);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// A fresh subBrand shell and the very next "send OTP" call are two
// separate backend requests fired back-to-back — if the OTP endpoint
// doesn't yet see the just-created shell (a brief consistency lag) it can
// fail on the very first attempt even though the shell itself was created
// fine. One short, silent retry absorbs that instead of surfacing an
// error the merchant would just clear by clicking "Verify"/"Resend" again.
async function sendLoginOtpWithRetry(whatsappNumber) {
    try {
        return await loginOrSignUpWithWhatsapp({ whatsappNumber });
    } catch {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return loginOrSignUpWithWhatsapp({ whatsappNumber });
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
    try {
        await sendLoginOtpWithRetry(whatsappNumber);
    } catch (err) {
        const shell = subBrandRes?.data ?? subBrandRes;
        err.subBrandId = shell?.subBrandId || null;
        throw err;
    }
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

// ── Resend an unverified Outlet's WhatsApp OTP ────────────────────
// POST {{TryDood2.0BaseUrl}}/subBrands/signUp-with-whatsapp
// body: { brandId, whatsappNumber, isFirstOutlet: false }
// There's no separate resend endpoint — per the API doc (§34 note 2, §34a
// note 2) the resend IS a repeat of the signUp call for this brand's
// unverified outlet: 200 with message "OTP resent…" + data.isNewOutlet:
// false, nothing new created, no slot used. outletType is ignored on a
// repeat call, so it isn't sent. 429 (60s cooldown / 5 per hour) carries
// details.retryAfterSeconds. auth/whatsapp/send-verification isn't usable
// here — it needs the outlet manager's own session.
export function resendSubBrandWhatsappOtp({ brandId, whatsappNumber } = {}) {
    return signUpSubBrandWithWhatsapp({ brandId, whatsappNumber, isFirstOutlet: false });
}

// ── Change an unverified Outlet's WhatsApp Number ─────────────────
// PATCH {{TryDood2.0BaseUrl}}/subBrands/:subBrandId/whatsapp-number
// body: { whatsappNumber }
// Fixes a mistyped number BEFORE it's verified — same outlet, same plan slot,
// and a new OTP goes to the new number. Response: { success, message, data:
// { subBrand, user, otpSent, otpError, retryAfterSeconds } }.
// 409 OUTLET_ALREADY_VERIFIED once verified; 422 WHATSAPP_UNCHANGED if it's
// already this outlet's number (resend via signUpSubBrandWithWhatsapp instead).
export async function updateSubBrandWhatsappNumber(subBrandId, whatsappNumber) {
    try {
        const { data } = await api.patch(`/subBrands/${subBrandId}/whatsapp-number`, { whatsappNumber });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get All SubBrands (Outlets) for a Brand ─────────────────────
// GET {{TryDood2.0ServerUrl}}/subBrands/get-all?brandId=:brandId
// Confirmed response shape:
// { success, message, data: { total, totalPages, page, limit, data: [subBrandDoc, ...] } }
export async function getSubBrandsByBrandId(brandId) {
    if (!brandId) return null;
    try {
        const { data } = await api.get('/subBrands/get-all', { params: { brandId } });
        return data;
    } catch (error) {
        handleError(error);
    }
}


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
    console.log('[subBrandApi] getBrandById → brandId:', brandId);
    if (!brandId) return null;
    try {
        const { data } = await api.get('/brands/get', { params: { brandId } });
        console.log('[subBrandApi] getBrandById ← response:', data);
        return data;
    } catch (error) {
        console.error('[subBrandApi] getBrandById ✗ FAILED', error?.response?.data || error);
        handleError(error);
    }
}