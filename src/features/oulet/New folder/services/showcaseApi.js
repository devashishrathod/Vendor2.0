import axios from 'axios';

// ── Base URL ────────────────────────────────────────────────
// Matches the Postman env variable {{TryDood2.0BaseUrl}}
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically (same pattern as authApi.js / planApi.js /
// CategoryApi.js). NOTE: adjust this relative path to wherever authStore.js
// actually lives in your project (e.g. "../store/authStore").
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

// ── Section Types ─────────────────────────────────────────────
// "CUSTOM" is the only value confirmed from the Postman example — add any
// other sectionType values your backend supports here.
export const SHOWCASE_SECTION_TYPES = {
    CUSTOM: 'CUSTOM',
};

// ══════════════════════════════════════════════════════════════
// SECTIONS  (a "Section" = one Showcase album, e.g. "Gallery",
// "Menu Photo", "Ambience Photo", "Event Photo")
// ══════════════════════════════════════════════════════════════

// ── Create Section ─────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/showcase/add-section
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
// GET {{TryDood2.0BaseUrl}}/showcase/sections?page=&limit=&search=
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
// GET {{TryDood2.0BaseUrl}}/showcase/section/:id
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
// PATCH {{TryDood2.0BaseUrl}}/showcase/section/:id/update
// body: any subset of { title, description, sortOrder, sectionType, isVisible, showVideosInClips, isActive }
// NOTE: adjust verb (PATCH vs PUT) / path if the real endpoint differs.
export async function updateShowcaseSection(sectionId, patch = {}) {
    try {
        const { data } = await api.patch(`/showcase/section/update/${sectionId}/update`, patch);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Delete Section ───────────────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/showcase/section/:id/delete
// NOTE: adjust path if the real endpoint differs. Confirm with backend
// whether this cascades and deletes the section's media too.
export async function deleteShowcaseSection(sectionId) {
    try {
        const { data } = await api.delete(`/showcase/section/delete/${sectionId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// MEDIA  (photos / videos that live inside a Section)
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

        const { data } = await api.post(`/showcase/section/${sectionId}/add-media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onUploadProgress
                ? (evt) => onUploadProgress(Math.round((evt.loaded * 100) / (evt.total || 1)))
                : undefined,
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Update a Media Item's Metadata ──────────────────────────────
// PATCH {{TryDood2.0BaseUrl}}/showcase/section/:sectionId/media/:mediaId/update
// body: e.g. { isShowInVideoClips, month, sortOrder }
// Does NOT replace the underlying file — delete + re-add for that.
// NOTE: adjust path if the real endpoint differs.
export async function updateShowcaseMedia(sectionId, mediaId, patch = {}) {
    try {
        const { data } = await api.patch(
            `/showcase/section/${sectionId}/media/update/${mediaId}`,
            patch
        );
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Delete a Media Item ──────────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/showcase/section/:sectionId/media/:mediaId/delete
// NOTE: adjust path if the real endpoint differs.
export async function deleteShowcaseMedia(sectionId, mediaId) {
    try {
        const { data } = await api.delete(
            `/showcase/section/${sectionId}/media/delete/${mediaId}`
        );
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// COMBINED HELPER
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