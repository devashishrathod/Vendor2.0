import axios from 'axios';
import { uploadFileViaPresign, uploadFilesViaPresign, UPLOAD_PURPOSES } from '@/services/uploadApi';

// ── Base URL ────────────────────────────────────────────────
// Matches the Postman env variable {{TryDood2.0BaseUrl}}
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically (same pattern as authApi.js / planApi.js /
// CategoryApi.js / showcaseApi.js). NOTE: adjust this relative path to
// wherever authStore.js actually lives in your project (e.g.
// "../store/authStore").
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


// Appends a repeated multipart field so the backend's parser reliably
// builds a real array out of it. Confirmed from testing: the backend
// only turns a repeated field name into an actual array once 2+
// occurrences of that exact key arrive (this is standard multer/busboy
// behavior) — a bracket suffix like "tags[]" is NOT recognized at all
// here (it came back as "required", i.e. a different/unknown key), and a
// single combined JSON string wasn't parsed either. `offers` already
// works fine even with just one item, which only makes sense if that
// field's schema allows a lone value (e.g. Joi's `.single()`) while
// `tags`/`subBrandIds` don't — so for exactly one value we send it twice
// under the same key to force genuine array parsing. The backend is
// expected to de-duplicate: a voucher applying twice to the same outlet,
// or the same search tag listed twice, means nothing extra either way.
function appendArrayField(formData, key, values) {
    if (values.length === 1) {
        formData.append(key, values[0]);
        formData.append(key, values[0]);
    } else {
        values.forEach((value) => formData.append(key, value));
    }
}

// Confirmed from vendor_panel_api_doc.md #54 (V-4/U-4): images and the
// banner now go through the presigned-upload flow — `imageUploadIds`,
// `bannerUploadId`, `bannerPosterUploadId` — instead of raw multipart
// files. `bannerType` is gone too: the banner is a single `media` file,
// image/GIF/video told apart from its own bytes on the backend.
function buildVoucherFormData({
    brandId,
    name,
    description = '',
    tags = [],
    startAt,
    endAt,
    subBrandIds = [],
    isSaveAsDraft = false,
    offers = [],
    imageUploadIds = [],
    bannerUploadId,
    bannerPosterUploadId,
} = {}) {
    const formData = new FormData();

    if (brandId) formData.append('brandId', brandId);
    if (name !== undefined) formData.append('name', name);
    if (description !== undefined) formData.append('description', description);
    if (bannerUploadId) formData.append('bannerUploadId', bannerUploadId);
    if (bannerPosterUploadId) formData.append('bannerPosterUploadId', bannerPosterUploadId);

    appendArrayField(formData, 'tags', tags);

    if (startAt) formData.append('startAt', startAt);
    if (endAt) formData.append('endAt', endAt);

    appendArrayField(formData, 'subBrandIds', subBrandIds);

    formData.append('isSaveAsDraft', String(!!isSaveAsDraft));

    offers.forEach((offer) => {
        formData.append('offers', typeof offer === 'string' ? offer : JSON.stringify(offer));
    });

    if (imageUploadIds.length) appendArrayField(formData, 'imageUploadIds', imageUploadIds);

    return formData;
}

// ══════════════════════════════════════════════════════════════
// CREATE
// Uploads images + banner (+ poster) via presign first — see uploadApi.js
// — then sends the resulting uploadIds to POST /vouchers/create. Progress
// spans the whole flow: 0-90% is the presign/S3/confirm uploads, 90-100%
// is the final (small, fast) create request.
export async function createVoucher(voucher, onUploadProgress) {
    try {
        if (!voucher?.brandId) throw new Error('brandId is required');
        if (!voucher?.name) throw new Error('name is required');

        const images = (voucher.images || []).filter(Boolean);
        const bannerMedia = voucher.bannerMedia || null;
        const bannerPoster = voucher.bannerPoster || null;

        const reportUploadProgress = (percent) => onUploadProgress?.(Math.round(percent * 0.9));

        const imageUploadIds = images.length
            ? await uploadFilesViaPresign(images, UPLOAD_PURPOSES.VOUCHER_IMAGE, {
                onProgress: reportUploadProgress,
            })
            : [];

        let bannerUploadId;
        if (bannerMedia) {
            bannerUploadId = await uploadFileViaPresign(bannerMedia, UPLOAD_PURPOSES.VOUCHER_BANNER, {
                onProgress: reportUploadProgress,
            });
        }

        let bannerPosterUploadId;
        if (bannerPoster) {
            bannerPosterUploadId = await uploadFileViaPresign(bannerPoster, UPLOAD_PURPOSES.VOUCHER_BANNER_POSTER, {
                onProgress: reportUploadProgress,
            });
        }

        onUploadProgress?.(90);

        const formData = buildVoucherFormData({ ...voucher, imageUploadIds, bannerUploadId, bannerPosterUploadId });

        // NOTE: no explicit Content-Type header here — the browser must set
        // it itself when the body is a FormData instance, because it needs
        // to append the multipart boundary string (e.g.
        // "multipart/form-data; boundary=----WebKitFormBoundaryXXXX").
        // Setting a bare 'multipart/form-data' header overrides that and
        // omits the boundary, which makes the backend's multer/busboy
        // parser fail to split the body into fields at all — req.body ends
        // up empty even though DevTools' Payload tab still shows every
        // field (it parses the raw bytes for display, independent of
        // whether the boundary-less header would let a real server do so).
        if (import.meta.env.DEV) {
            console.log('[VoucherService] createVoucher → outgoing FormData:');
            for (const [key, value] of formData.entries()) {
                console.log(' ', key, '=', value instanceof File ? `File(${value.name})` : value);
            }
        }
        const { data } = await api.post('/vouchers/create', formData, {
            onUploadProgress: (evt) => onUploadProgress?.(90 + Math.round((evt.loaded / (evt.total || 1)) * 10)),
        });
        onUploadProgress?.(100);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// READ
// ══════════════════════════════════════════════════════════════

// ── Get All Voucher Versions (list/table view) ──────────────────
// GET {{TryDood2.0BaseUrl}}/vouchers/versions/get-all?page=&limit=&...
// Confirmed from Postman — the list endpoint returns voucher *versions*
// (each with its own `status` plus the parent `voucher.status`), not bare
// vouchers. Response envelope: { success, message, data: { total,
// totalPages, page, limit, data: [...] } }.
export async function getVouchers({
    page = 1,
    limit = 20,
    brandId,
    search,
    status,
    voucherId,
    categoryId,
    subCategoryId,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
} = {}) {
    try {
        const params = { page, limit };
        if (brandId) params.brandId = brandId;
        if (search) params.search = search;
        if (status) params.status = status;
        if (voucherId) params.voucherId = voucherId;
        if (categoryId) params.categoryId = categoryId;
        if (subCategoryId) params.subCategoryId = subCategoryId;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;
        const { data } = await api.get('/vouchers/versions/get-all', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get Single Voucher (for View/Edit prefill) ──────────────────
// There's no confirmed standalone "get one" endpoint — reuse the confirmed
// GET /vouchers/versions/get-all list endpoint filtered by voucherId
// instead of guessing an unconfirmed route. Returns the same envelope as
// getVouchers(); callers should read res.data.data[0] for the version.
export async function getVoucherById(voucherId) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        const { data } = await api.get('/vouchers/versions/get-all', {
            params: { voucherId, page: 1, limit: 1 },
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get Single Voucher (for the VoucherDetails page) ──────────────
// CONFIRMED real route: GET {{TryDood2.0BaseUrl}}/vouchers/get/:voucherId
// — a genuine single-resource fetch, unlike getVoucherById() above (which
// still reuses the versions/get-all list endpoint for the Edit form's
// prefill, on purpose — that "version" shape is what formToPayload/
// voucherToForm are built around, so it's left untouched here).
// ⚠️ NOT independently confirmed from a real Postman response body — only
// the path was given. Assumed to return the voucher object directly under
// `data` (the standard single-GET shape every other "get one" endpoint in
// this codebase uses — showcase, location, etc.), matching the flat
// name/status/voucherId/analysis/... fields VoucherDetails.jsx already
// reads. Verify against a real response and adjust here if any field
// comes back under a different key or nested differently.
export async function getVoucherDetails(voucherId) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        const { data } = await api.get(`/vouchers/get/${voucherId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get Voucher Stats (e.g. counts for dashboard cards) ──────────
// GET {{TryDood2.0BaseUrl}}/vouchers/stats?brandId=
// NOTE: NOT confirmed from Postman — this endpoint wasn't in the shared
// screenshot. Added only because useVoucher.js imports fetchVoucherStats
// from VoucherService.js. Adjust the path/params/return shape once you
// confirm the real "stats" request in Postman. Assumed response shape:
//   { total, active, draft, expired }
export async function getVoucherStats({ brandId } = {}) {
    try {
        const params = {};
        if (brandId) params.brandId = brandId;
        const { data } = await api.get('/vouchers/stats', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// SUB-BRANDS / OUTLETS (for the "Applicable Outlets" picker modal)
// ══════════════════════════════════════════════════════════════

// ── Get All Sub-Brands (Outlets) for a Brand ────────────────────
// GET {{TryDood2.0ServerUrl}}/subBrands/get-all?brandId=&page=&limit=&search=
// Confirmed from Postman. Response envelope: { success, message, data:
// { total, totalPages, page, limit, data: [...] } } — each item is a
// sub-brand/outlet doc (storeId, uniqueId, outletType, whatsappNumber,
// isActive, geo, and optionally location/workHours once set up).
export async function getSubBrands({ brandId, page = 1, limit = 50, search } = {}) {

    console.log(brandId)
    try {
        if (!brandId) throw new Error('brandId is required');
        const params = { brandId, page, limit };
        
        if (search) params.search = search;
        const { data } = await api.get('/subBrands/get-all', { params });
        console.table(data)
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// UPDATE
// ══════════════════════════════════════════════════════════════

// Builds the vouchers/update/:id form-data body. Confirmed from Postman —
// this is a DIFF-style contract, not a full resend like createVoucher's:
// add/remove lists for tags, offers, images, and sub-brands, plus a few
// directly-overwritable fields (name/description/startAt/endAt). It's
// deliberately its own builder rather than reusing buildVoucherFormData —
// the field names and shapes genuinely differ (e.g. `newOffers` is ONE
// JSON-stringified array in a single field here, vs. createVoucher's
// `offers` which is one repeated field per offer object) — so createVoucher
// itself is untouched.
// Confirmed from vendor_panel_api_doc.md #55 (V-4/U-4): `newImages` can
// now also arrive as `newImageUploadIds` — a presigned batch mixes fine
// with a multipart one, floor applies to the combined total. This service
// always uploads via presign first (see updateVoucher below), so only the
// uploadIds variant is built here.
function buildVoucherUpdateFormData({
    name,
    description,
    startAt,
    endAt,
    newTags = [],
    removedTags = [],
    newOffers = [],
    removedOfferIds = [],
    newImageUploadIds = [],
    removeImageIds = [],
    newSubBrandIds = [],
    removeSubBrandIds = [],
} = {}) {
    const formData = new FormData();

    if (name !== undefined) formData.append('name', name);
    if (description !== undefined) formData.append('description', description);
    if (startAt) formData.append('startAt', startAt);
    if (endAt) formData.append('endAt', endAt);

    if (newTags.length) appendArrayField(formData, 'newTags', newTags);
    if (removedTags.length) appendArrayField(formData, 'removedTags', removedTags);

    // Confirmed shape: a single field holding a JSON-stringified ARRAY of
    // new offer objects (same object shape as createVoucher's offers) —
    // unlike createVoucher, which appends one `offers` field per offer.
    if (newOffers.length) {
        const offers = newOffers.map((offer) => (typeof offer === 'string' ? JSON.parse(offer) : offer));
        formData.append('newOffers', JSON.stringify(offers));
    }

    if (removedOfferIds.length) appendArrayField(formData, 'removedOfferIds', removedOfferIds);
    if (removeImageIds.length) appendArrayField(formData, 'removeImageIds', removeImageIds);
    if (newSubBrandIds.length) appendArrayField(formData, 'newSubBrandIds', newSubBrandIds);
    if (removeSubBrandIds.length) appendArrayField(formData, 'removeSubBrandIds', removeSubBrandIds);

    if (newImageUploadIds.length) appendArrayField(formData, 'newImageUploadIds', newImageUploadIds);

    return formData;
}

// ── Update Voucher (diff-style patch, multipart) ─────────────────
// PUT {{TryDood2.0BaseUrl}}/vouchers/update/:id   (multipart/form-data)
// Confirmed from Postman. Only send what actually changed — e.g. to add a
// tag and drop an offer: updateVoucher(id, { newTags: ['diwali'],
// removedOfferIds: ['<offerSubdocId>'] }).
//
// @param {string} voucherId
// @param {object} patch
// @param {string} [patch.name]
// @param {string} [patch.description]
// @param {string} [patch.startAt] - ISO date string
// @param {string} [patch.endAt] - ISO date string
// @param {string[]} [patch.newTags]
// @param {string[]} [patch.removedTags]
// @param {object[]} [patch.newOffers] - new offer objects to add (same shape as createVoucher's offers)
// @param {string[]} [patch.removedOfferIds] - _id of an offer subdocument on the CURRENT version
// @param {File[]} [patch.newImages]
// @param {string[]} [patch.removeImageIds] - _id of an image subdocument on the CURRENT version
// @param {string[]} [patch.newSubBrandIds]
// @param {string[]} [patch.removeSubBrandIds]
// @param {(percent:number)=>void} [onUploadProgress]
export async function updateVoucher(voucherId, patch, onUploadProgress) {
    try {
        if (!voucherId) throw new Error('voucherId is required');

        const newImages = (patch?.newImages || []).filter(Boolean);
        const reportUploadProgress = (percent) => onUploadProgress?.(Math.round(percent * 0.9));
        const newImageUploadIds = newImages.length
            ? await uploadFilesViaPresign(newImages, UPLOAD_PURPOSES.VOUCHER_IMAGE, {
                entityId: voucherId,
                onProgress: reportUploadProgress,
            })
            : [];
        onUploadProgress?.(90);

        const formData = buildVoucherUpdateFormData({ ...patch, newImageUploadIds });

        // See createVoucher's comment — no explicit Content-Type header,
        // the browser needs to attach its own multipart boundary.
        if (import.meta.env.DEV) {
            console.log('[VoucherService] updateVoucher → outgoing FormData:');
            for (const [key, value] of formData.entries()) {
                console.log(' ', key, '=', value instanceof File ? `File(${value.name})` : value);
            }
        }
        const { data } = await api.put(`/vouchers/update/${voucherId}`, formData, {
            onUploadProgress: (evt) => onUploadProgress?.(90 + Math.round((evt.loaded / (evt.total || 1)) * 10)),
        });
        onUploadProgress?.(100);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Submit Voucher Banner for review (dedicated endpoint) ─────────
// POST {{TryDood2.0BaseUrl}}/vouchers/:id/banner   (multipart/form-data)
// Confirmed from vendor_panel_api_doc.md #59 (V-4) — lets a vendor submit
// a new banner for an already-created voucher without resending the whole
// form. `bannerType` and the three typed file fields are gone: `media` is
// one file (image, GIF or video — told apart from its own bytes), `poster`
// is required only when it's a video. Uploaded via presign first (see
// uploadApi.js) → `bannerUploadId` / `bannerPosterUploadId`. The banner
// does NOT go live immediately — it's held as `pending` until admin
// review; the previously-approved `current` banner keeps showing to
// customers in the meantime. There is no DELETE any more — changing a
// banner always means submitting a new one.
function buildVoucherBannerFormData({ bannerUploadId, bannerPosterUploadId } = {}) {
    const formData = new FormData();
    if (bannerUploadId) formData.append('bannerUploadId', bannerUploadId);
    if (bannerPosterUploadId) formData.append('bannerPosterUploadId', bannerPosterUploadId);
    return formData;
}

export async function updateVoucherBanner(voucherId, { media, poster } = {}, onUploadProgress) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        if (!media) throw new Error('media is required');

        const reportUploadProgress = (percent) => onUploadProgress?.(Math.round(percent * 0.9));
        const bannerUploadId = await uploadFileViaPresign(media, UPLOAD_PURPOSES.VOUCHER_BANNER, {
            entityId: voucherId,
            onProgress: reportUploadProgress,
        });
        let bannerPosterUploadId;
        if (poster) {
            bannerPosterUploadId = await uploadFileViaPresign(poster, UPLOAD_PURPOSES.VOUCHER_BANNER_POSTER, {
                entityId: voucherId,
                onProgress: reportUploadProgress,
            });
        }
        onUploadProgress?.(90);

        const formData = buildVoucherBannerFormData({ bannerUploadId, bannerPosterUploadId });
        const { data } = await api.post(`/vouchers/${voucherId}/banner`, formData, {
            onUploadProgress: (evt) => onUploadProgress?.(90 + Math.round((evt.loaded / (evt.total || 1)) * 10)),
        });
        onUploadProgress?.(100);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Lightweight status patch (e.g. draft → published, or isActive) ──
// PATCH {{TryDood2.0BaseUrl}}/vouchers/:id/update
// Use this instead of updateVoucher() when you're only flipping a flag
// (isSaveAsDraft, isActive) and don't want to resend the whole form +
// images. NOTE: adjust path if the real endpoint differs.
export async function patchVoucherStatus(voucherId, patch = {}) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        const { data } = await api.patch(`/vouchers/${voucherId}/update`, patch);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// WORKFLOW ACTIONS (draft → review → approve → publish)
// ══════════════════════════════════════════════════════════════

// ── Submit a DRAFT voucher version for review ───────────────────
// POST {{TryDood2.0BaseUrl}}/vouchers/submit-review/:voucherId
// Shown when a version's own `status` is "DRAFT" (this also covers a
// version that was re-edited after the parent voucher was REJECTED).
// Takes the parent voucherId, not the version's _id.
export async function submitVoucherForReview(voucherId) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        const { data } = await api.post(`/vouchers/submit-review/${voucherId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Publish an APPROVED voucher ───────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/vouchers/publish/:versionId
// Shown when the parent `voucher.status` is "APPROVED". Takes the
// specific version's _id (the version being made live), not voucherId.
export async function publishVoucher(versionId) {
    try {
        if (!versionId) throw new Error('versionId is required');
        const { data } = await api.post(`/vouchers/publish/${versionId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ══════════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════════

// ── Delete Voucher ───────────────────────────────────────────────
// DELETE {{TryDood2.0BaseUrl}}/vouchers/:id
// Confirmed from Postman — body: { reason }. Success 200; 409 when the
// voucher can't be deleted in its current state.
export async function deleteVoucher(voucherId, reason) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        const { data } = await api.delete(`/vouchers/${voucherId}`, { data: { reason } });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Delete a single already-uploaded voucher image ──────────────
// DELETE {{TryDood2.0BaseUrl}}/vouchers/:id/images/:imageId/delete
// NOTE: not in the Postman screenshot — included as a convenience for the
// edit flow (remove one image without resubmitting the whole form).
// Adjust/remove if your backend doesn't support per-image deletion.
export async function deleteVoucherImage(voucherId, imageId) {
    try {
        if (!voucherId) throw new Error('voucherId is required');
        if (!imageId) throw new Error('imageId is required');
        const { data } = await api.delete(`/vouchers/${voucherId}/images/${imageId}/delete`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// `DELETE /vouchers/:voucherId/banner` no longer exists (confirmed from
// vendor_panel_api_doc.md #59/#60, V-4) — a banner's slot is never empty,
// so "delete" isn't a real state any more. Changing a banner always means
// submitting a new one via updateVoucherBanner above.









// // src/services/voucher/voucherService.js
// // Swap the mock logic below with real axios/fetch calls to your backend.
// // Keeping the function signatures the same means nothing else in the app
// // needs to change when you wire up the real API.

// const DEFAULT_DETAILS = {
//   createdDate: "17/12/2025",
//   startTime: "01:30 AM",
//   endTime: "12:10 PM",
//   shortTitle: "Flat 10% off up to 500",
//   percentageOfDiscount: 30,
//   singleUsePerUser: false,
//   multipleUseUntilExpiry: true,
//   applicableOutlets: {
//     selectedBrandOutletCount: 30,
//     totalOutletsCount: 59,
//     subBrandCount: 59,
//     franchiseCount: 9,
//   },
//   searchTags: [
//     "Best voucher",
//     "Discount voucher",
//     "Best Deal",
//     "Yoga Deal",
//     "Yoga Offer",
//     "Offers",
//     "Deals",
//   ],
//   whoCanUse: "android_ios_membership",
//   whoCanClaim: "all_users",
//   keySummary: {
//     totalAudiencePercent: 20,
//     totalEngagementClicks: 450,
//     totalImpressionReach: 1002,
//   },
//   analysis: {
//     overAllEarning: 34980.0,
//     totalBillValue: 42989.0,
//     totalDiscountAmount: 6455.0,
//     additionalDiscount: 3290.0,
//     paidAmount: 34980.0,
//   },
//   outletUsage: {
//     outletIds: [
//       "#14503219",
//       "#14683125",
//       "#14382019",
//       "#14503219",
//       "#14683125",
//       "#14503323",
//       "#14382019",
//       "#14503016",
//       "#14382019",
//     ],
//     subBrand: [69, 0, 76, 0, 60, 60, 71, 0, 10],
//     franchiseOutlet: [80, 0, 45, 0, 80, 0, 60, 0, 25],
//   },
//   revenueWeekly: {
//     days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
//     current: [22, 30, 18, 35, 28, 45, 38],
//     last: [15, 26, 32, 20, 30, 24, 33],
//   },
//   customerFlowWeekly: {
//     days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
//     current: [55, 50, 42, 30, 58, 62, 48],
//     last: [70, 65, 68, 66, 72, 66, 70],
//   },
//   storePerformance: [
//     { storeName: "Andheri West Outlet", revenue: 12980.0 },
//     { storeName: "Bandra Sub-Brand Store", revenue: 9820.0 },
//     { storeName: "Powai Franchise Outlet", revenue: 7460.0 },
//     { storeName: "Thane Sub-Brand Store", revenue: 4720.0 },
//   ],
//   transactions: [
//     {
//       id: "TXN10021",
//       date: "20-05-2025, 10:12 AM",
//       customer: "Ravi Sharma",
//       amount: 1600.0,
//       paymentMethod: "UPI",
//       status: "Success",
//     },
//     {
//       id: "TXN10045",
//       date: "22-05-2025, 04:45 PM",
//       customer: "Priya Nair",
//       amount: 1600.0,
//       paymentMethod: "Card",
//       status: "Success",
//     },
//     {
//       id: "TXN10098",
//       date: "25-05-2025, 09:05 AM",
//       customer: "Aman Verma",
//       amount: 1600.0,
//       paymentMethod: "UPI",
//       status: "Failed",
//     },
//   ],
//   transactionSummary: {
//     overallEarnings: 252899.0,
//     overallBillAmount: 157729.0,
//     discountAmount: 52899.0,
//     paidAmount: 152899.0,
//     totalUserCount: 858,
//   },
//   orderTransactions: [
//     {
//       orderId: "VC086324",
//       customerName: "Chitra Yalp",
//       customerId: "#xxx41721",
//       outletName: "Anna Nagar, Chennai",
//       storeId: "#1245829",
//       storeType: "Sub-Brand",
//       date: "17/02/2026",
//       time: "10:30 am",
//       status: "Success",
//       amount: 675.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Manami Suda",
//       customerId: "#xxx77770",
//       outletName: "Sadipet, Chennai",
//       storeId: "#1245830",
//       storeType: "Franchise",
//       date: "17/02/2026",
//       time: "10:30 am",
//       status: "Success",
//       amount: 675.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Christina Yalp",
//       customerId: "#xxx52521",
//       outletName: "Anna Nagar, Chennai 39",
//       storeId: "#1245879",
//       storeType: "Sub-Brand",
//       date: "17/02/2026",
//       time: "10:23 am",
//       status: "Success",
//       amount: 1099.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Kyjiseal Neitorn",
//       customerId: "#xxx63212",
//       outletName: "Goring Nagar, Trivpini",
//       storeId: "#1245879",
//       storeType: "Sub-Brand",
//       date: "17/02/2026",
//       time: "10:23 am",
//       status: "Success",
//       amount: 675.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Nanami Kanto",
//       customerId: "#xxx98212",
//       outletName: "Ayanavaram, Chennai",
//       storeId: "#1245880",
//       storeType: "Sub-Brand",
//       date: "17/02/2026",
//       time: "10:12 am",
//       status: "Success",
//       amount: 675.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Tsykhqurs Meguml",
//       customerId: "#xxx43212",
//       outletName: "West Anna Nagar, Chennai",
//       storeId: "#1245879",
//       storeType: "Franchise",
//       date: "17/02/2026",
//       time: "10:05 am",
//       status: "Failed",
//       amount: 675.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Nrtsi Akani",
//       customerId: "#xxx11212",
//       outletName: "Girei, Chennai",
//       storeId: "#1245881",
//       storeType: "Franchise",
//       date: "17/02/2026",
//       time: "09:58 am",
//       status: "Success",
//       amount: 675.0,
//     },
//     {
//       orderId: "VC086324",
//       customerName: "Inumesli Tegai",
//       customerId: "#xxx22212",
//       outletName: "Eci, Chennai",
//       storeId: "#1245882",
//       storeType: "Franchise",
//       date: "17/02/2026",
//       time: "09:50 am",
//       status: "Success",
//       amount: 675.0,
//     },
//   ],
// };

// const MOCK_VOUCHERS = [
//   {
//     id: "JVR39304309",
//     title: "Wednesday Sepical Deal's Yoga Class 25%",
//     publishedDate: "01-05-2025",
//     expiredDate: "30-05-2025",
//     discount: "30 %",
//     valueOfAmount: 25000.0,
//     earnAmount: 14239.0,
//     status: "Active",
//     startDate: "01-05-2025",
//     endDate: "30-05-2025",
//     ...DEFAULT_DETAILS,
//   },
//   {
//     id: "JVR38258384",
//     title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
//     publishedDate: "01-05-2025",
//     expiredDate: "30-05-2025",
//     discount: "30 %",
//     valueOfAmount: 25000.0,
//     earnAmount: 14239.0,
//     status: "Expired",
//     startDate: "01-05-2025",
//     endDate: "30-05-2025",
//     ...DEFAULT_DETAILS,
//   },
//   {
//     id: "JVR39362309",
//     title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
//     publishedDate: "01-05-2025",
//     expiredDate: "30-05-2025",
//     discount: "30 %",
//     valueOfAmount: 25000.0,
//     earnAmount: 14239.0,
//     status: "Active",
//     startDate: "01-05-2025",
//     endDate: "30-05-2025",
//     ...DEFAULT_DETAILS,
//   },
//   {
//     id: "JVR39340B1",
//     title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
//     publishedDate: "01-05-2025",
//     expiredDate: "30-05-2025",
//     discount: "30 %",
//     valueOfAmount: 1099.0,
//     earnAmount: 0.0,
//     status: "Under Review",
//     startDate: "01-05-2025",
//     endDate: "30-05-2025",
//     ...DEFAULT_DETAILS,
//   },
//   {
//     id: "JVR39352303",
//     title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
//     publishedDate: "01-05-2025",
//     expiredDate: "30-05-2025",
//     discount: "30 %",
//     valueOfAmount: 25000.0,
//     earnAmount: 0.0,
//     status: "Under Review",
//     startDate: "01-05-2025",
//     endDate: "30-05-2025",
//     ...DEFAULT_DETAILS,
//   },
// ];

// const MOCK_STATS = {
//   overallCollectionAmount: 1629.0,
//   overallPaidAmount: 634.0,
//   discountAmount: 336.0,
//   additionalDiscount: -83.0,
//   gstAmount: 0.0,
//   activeVoucherCount: 75,
//   expiredVoucherCount: 33,
//   pendingVoucherCount: 3,
// };

// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// export async function fetchVoucherStats() {
//   await delay(250);
//   return MOCK_STATS;
// }

// export async function fetchVouchers({ page = 1, rowsPerPage = 10, search = "" } = {}) {
//   await delay(250);

//   const filtered = search
//     ? MOCK_VOUCHERS.filter(
//       (v) =>
//         v.id.toLowerCase().includes(search.toLowerCase()) ||
//         v.title.toLowerCase().includes(search.toLowerCase())
//     )
//     : MOCK_VOUCHERS;

//   const start = (page - 1) * rowsPerPage;
//   const paginated = filtered.slice(start, start + rowsPerPage);

//   return {
//     data: paginated,
//     total: filtered.length,
//     page,
//     rowsPerPage,
//     totalPages: Math.max(1, Math.ceil(filtered.length / rowsPerPage)),
//   };
// }

// export async function fetchVoucherById(id) {
//   await delay(250);
//   const voucher = MOCK_VOUCHERS.find((v) => v.id === id);
//   if (!voucher) throw new Error("Voucher not found");
//   return voucher;
// }

// export async function createDiscountVoucher(payload) {
//   await delay(300);
//   const newVoucher = {
//     id: `JVR${Math.floor(10000000 + Math.random() * 89999999)}`,
//     status: "Under Review",
//     createdDate: new Date().toLocaleDateString("en-GB"),
//     ...DEFAULT_DETAILS,
//     ...payload,
//   };
//   MOCK_VOUCHERS.unshift(newVoucher);
//   return newVoucher;
// }

// export async function updateDiscountVoucher(id, payload) {
//   await delay(300);
//   const index = MOCK_VOUCHERS.findIndex((v) => v.id === id);
//   if (index === -1) throw new Error("Voucher not found");
//   MOCK_VOUCHERS[index] = { ...MOCK_VOUCHERS[index], ...payload };
//   return MOCK_VOUCHERS[index];
// }