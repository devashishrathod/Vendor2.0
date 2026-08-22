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
    throw new Error(message);
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

// ══════════════════════════════════════════════════════════════
// LISTING FEATURES (a.k.a. Brand Features)
// ══════════════════════════════════════════════════════════════

// ── Get All Brand Features ────────────────────────────────────
// GET {{TryDood2.0ServerUrl}}/brandFeatures/get-all?brandId=xxx
export async function getListingFeatures(brandId) {
    try {
        const { data } = await api.get('/brandFeatures/get-all', {
            params: { brandId },
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Add a Brand Feature ───────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/brandFeatures/add   (multipart/form-data)
// fields: brandId, title, description, isActive, icon (file)
export async function addListingFeature(brandId, { title, description = '', isActive = true, iconFile }) {
    try {
        if (!title) throw new Error('Title is required');
        if (!iconFile) throw new Error('Icon file is required');

        const formData = new FormData();
        formData.append('brandId', brandId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('isActive', String(isActive));
        formData.append('icon', iconFile);

        // See updateBrandDetails's comment — no explicit Content-Type header.
        const { data } = await api.post('/brandFeatures/add', formData);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Update a Brand Feature ─────────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/brandFeatures/update/:id   (multipart/form-data)
// Confirmed from Postman — fields: title, description, isActive, icon
// (file, optional — omit it to keep the currently-uploaded icon).
export async function updateListingFeature(featureId, { title, description, isActive, iconFile } = {}) {
    try {
        if (!featureId) throw new Error('featureId is required');

        const formData = new FormData();
        if (title !== undefined) formData.append('title', title);
        if (description !== undefined) formData.append('description', description);
        if (isActive !== undefined) formData.append('isActive', String(!!isActive));
        if (iconFile) formData.append('icon', iconFile);

        // See updateBrandDetails's comment — no explicit Content-Type header.
        const { data } = await api.put(`/brandFeatures/update/${featureId}`, formData);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Delete a Brand Feature ────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/brandFeatures/delete/:id
// Confirmed from Postman.
export async function deleteListingFeature(featureId) {
    try {
        if (!featureId) throw new Error('featureId is required');
        const { data } = await api.delete(`/brandFeatures/delete/${featureId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// SHOWCASE — SECTIONS  (a "Section" = one Showcase album, e.g.
// "Gallery", "Menu Photo", "Ambience Photo", "Event Photo")
// ══════════════════════════════════════════════════════════════

// "CUSTOM" is the only value confirmed from the Postman example — add any
// other sectionType values your backend supports here.
export const SHOWCASE_SECTION_TYPES = {
    CUSTOM: 'CUSTOM',
};

// ── Create Section ─────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/showcase/section/add
// body: { title, description, sortOrder, sectionType }
export async function createShowcaseSection({
    title,
    description = '',
    sortOrder = 1,
    sectionType = SHOWCASE_SECTION_TYPES.CUSTOM,
} = {}) {
    try {
        const { data } = await api.post('/showcase/section/add', {
            title,
            description,
            sortOrder,
            sectionType,
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get All Sections (for a brand) ──────────────────────────────
// GET {{TryDood2.0BaseUrl}}/showcase/section/get-all?page=&limit=&search=
// Used to hydrate the ShowcaseAlbumsEditor with previously-saved albums
// when a merchant re-opens this page.
// NOTE: adjust path/params if the real "list" endpoint differs — this
// wasn't in the Postman screenshots, only add-section / add-media were.
export async function getShowcaseSections({ page = 1, limit = 20, search = '' } = {}) {
    try {
        const params = { page, limit };
        if (search) params.search = search;
        const { data } = await api.get('/showcase/section/get-all', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get Single Section (for View) ───────────────────────────────
// GET {{TryDood2.0BaseUrl}}/showcase/section/get/:id
// NOTE: adjust path if your real "get one" endpoint differs.
export async function getShowcaseSectionById(sectionId) {
    try {
        const { data } = await api.get(`/showcase/section/get/${sectionId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Update Section (title, description, sortOrder, sectionType, visibility) ──
// PUT {{TryDood2.0BaseUrl}}/showcase/section/update/:id   (raw JSON)
// Confirmed from Postman — every field is optional, send only what changed:
// { title, description, sortOrder, sectionType, isActive, isVisible,
//   isShowVideosInClips }.
export async function updateShowcaseSection(sectionId, patch = {}) {
    try {
        if (!sectionId) throw new Error('sectionId is required');
        const { data } = await api.put(`/showcase/section/update/${sectionId}`, patch);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Delete Section ───────────────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/showcase/section/delete/:id
// Confirmed from Postman.
export async function deleteShowcaseSection(sectionId) {
    try {
        if (!sectionId) throw new Error('sectionId is required');
        const { data } = await api.delete(`/showcase/section/delete/${sectionId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Reorder Showcase Sections ─────────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/showcase/section/reorder   (raw JSON)
// Confirmed from Postman — body: { sections: [{ id, sortOrder }, ...] }.
export async function reorderShowcaseSections(sections = []) {
    try {
        const { data } = await api.put('/showcase/section/reorder', {
            sections: sections.map(({ id, sortOrder }) => ({ id, sortOrder })),
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// SHOWCASE — MEDIA  (photos / videos that live inside a Section)
// ══════════════════════════════════════════════════════════════

// ── Add Media to a Section ──────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/showcase/section/:sectionId/add-media   (multipart/form-data)
// Matches the Postman request exactly:
//   - "isShowInVideoClips": "true" | "false"   (text field)
//   - "files": <file>                          (repeated file field, one per upload)
//
// @param {string} sectionId
// @param {File[]} files
// @param {object} [options]
// @param {boolean} [options.isShowInVideoClips=false]
// @param {Record<string,string>} [options.extraFields] - e.g. a "month" tag
//        for Ambience-style albums, if the backend accepts it per-upload.
// @param {(percent:number)=>void} [onUploadProgress]
export async function addShowcaseMedia(
    sectionId,
    files,
    { isShowInVideoClips = false, extraFields = {} } = {},
    onUploadProgress
) {
    try {
        if (!sectionId) throw new Error('sectionId is required');
        if (!files?.length) throw new Error('At least one file is required');

        const formData = new FormData();
        formData.append('isShowInVideoClips', String(isShowInVideoClips));

        Object.entries(extraFields).forEach(([key, value]) => {
            formData.append(key, value);
        });

        files.forEach((file) => {
            formData.append('files', file);
        });

        // See updateBrandDetails's comment — no explicit Content-Type header.
        const { data } = await api.post(`/showcase/section/${sectionId}/add-media`, formData, {
            onUploadProgress: onUploadProgress
                ? (evt) => onUploadProgress(Math.round((evt.loaded * 100) / (evt.total || 1)))
                : undefined,
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Replace a Media Item's File ──────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/showcase/section/:sectionId/media/replace/:mediaId
// (multipart/form-data, field: file)
// Confirmed from Postman — swaps the underlying file for an existing media
// item in place (keeps its position/sortOrder).
export async function replaceShowcaseMedia(sectionId, mediaId, file, onUploadProgress) {
    try {
        if (!sectionId) throw new Error('sectionId is required');
        if (!mediaId) throw new Error('mediaId is required');
        if (!file) throw new Error('file is required');

        const formData = new FormData();
        formData.append('file', file);

        // See updateBrandDetails's comment — no explicit Content-Type header.
        const { data } = await api.put(
            `/showcase/section/${sectionId}/media/replace/${mediaId}`,
            formData,
            {
                onUploadProgress: onUploadProgress
                    ? (evt) => onUploadProgress(Math.round((evt.loaded * 100) / (evt.total || 1)))
                    : undefined,
            }
        );
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Delete a Media Item ──────────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/showcase/section/:sectionId/media/delete/:mediaId
// Confirmed from Postman.
export async function deleteShowcaseMedia(sectionId, mediaId) {
    try {
        if (!sectionId) throw new Error('sectionId is required');
        if (!mediaId) throw new Error('mediaId is required');
        const { data } = await api.delete(
            `/showcase/section/${sectionId}/media/delete/${mediaId}`
        );
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Reorder Media within a Section ────────────────────────────────
// PUT {{TryDood2.0BaseUrl}}/showcase/section/:sectionId/media/reorder
// (raw JSON) — body: { medias: [{ id, sortOrder }, ...] }.
// Confirmed from Postman.
export async function reorderShowcaseMedia(sectionId, medias = []) {
    try {
        if (!sectionId) throw new Error('sectionId is required');
        const { data } = await api.put(`/showcase/section/${sectionId}/media/reorder`, {
            medias: medias.map(({ id, sortOrder }) => ({ id, sortOrder })),
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// SHOWCASE — COMBINED HELPERS
// ══════════════════════════════════════════════════════════════

// Convenience wrapper for the common "create an album and upload its first
// batch of media in one go" flow used by ShowcaseAlbumsEditor: creates the
// section, then immediately uploads the given files to it.
//
// If the section is created but the media upload fails, the section is NOT
// auto-deleted (so a flaky upload doesn't wipe out an otherwise-valid
// album) — both the created section and the error are returned so the
// caller can offer "album created, but upload failed — retry?".
//
// @param {object} sectionPayload - see createShowcaseSection
// @param {File[]} [files] - optional; omit to create an empty section
// @param {object} [mediaOptions] - see addShowcaseMedia's `options` param
// @param {(percent:number)=>void} [onUploadProgress]
// @returns {Promise<{ section: object, mediaError?: Error }>}
export async function createShowcaseSectionWithMedia(
    sectionPayload,
    files = [],
    mediaOptions = {},
    onUploadProgress
) {
    const sectionRes = await createShowcaseSection(sectionPayload);
    const section = sectionRes?.data ?? sectionRes;
    const sectionId = section?._id;

    if (!files.length) {
        return { section };
    }

    try {
        const mediaRes = await addShowcaseMedia(sectionId, files, mediaOptions, onUploadProgress);
        const updatedSection = mediaRes?.data ?? mediaRes;
        return { section: updatedSection };
    } catch (mediaError) {
        return { section, mediaError };
    }
}

// ── Get Full Brand Showcase (sections + their media, ONE call) ───
// GET {{TryDood2.0ServerUrl}}/showcase/get-brand-showcase/:brandId
// Replaces the separate getShowcaseSections() list call for hydration —
// this single endpoint returns every section AND its media already
// nested, which is exactly what ShowcaseAlbumsEditor needs to prefill.
export async function getBrandShowcase(brandId) {
    try {
        const { data } = await api.get(`/showcase/get-brand-showcase/${brandId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}