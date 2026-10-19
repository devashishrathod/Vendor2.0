// gstPanApi.js
// "Change PAN" / "Change GST" on Account Information → Business Profile.
// Same verify + save endpoints the onboarding wizard uses (verify.api.js +
// verificationDetails.api.js), routed through brandApi's shared axios
// instance, with the request bodies built by the onboarding payload
// builders so both flows always send an identical shape.

import {
    buildGstDetailsPayload,
    buildPanDetailsPayload,
} from '../../onboarding/services/api/verificationDetails.api';
import { api, handleError } from './brandApi';

// The onboarding builders set `currentScreen` to the NEXT wizard screen
// (GST_VERIFICATION / BANK_VERIFICATION). This flow runs after onboarding
// is finished, so sending it could move the vendor's currentScreen back
// into the wizard — it's left out here on purpose.
const withoutCurrentScreen = (payload) => {
    const rest = { ...payload };
    delete rest.currentScreen;
    return rest;
};

// ── Verify PAN ──────────────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/verification/brands/onboarding/verify-pan
// body: { pan }
/**
 * @param {string} pan
 * @returns {Promise<Object>} raw verify response
 */
export async function verifyBrandPan(pan) {
    try {
        const { data } = await api.post('/verification/brands/onboarding/verify-pan', { pan });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Verify GST ──────────────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/verification/brands/onboarding/verify-gst
// body: { gstNumber }
/**
 * @param {string} gstNumber
 * @returns {Promise<Object>} raw verify response
 */
export async function verifyBrandGst(gstNumber) {
    try {
        const { data } = await api.post('/verification/brands/onboarding/verify-gst', { gstNumber });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Save verified PAN ───────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/brands/onboarding/add-pan-details
/**
 * @param {string} brandId
 * @param {Object} panDetails - verifyBrandPan()'s `response.data`
 */
export async function updateBrandPanDetails(brandId, panDetails) {
    try {
        const payload = withoutCurrentScreen(buildPanDetailsPayload(brandId, panDetails));
        const { data } = await api.post('/brands/onboarding/add-pan-details', payload);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Save verified GST ───────────────────────────────────────────────
// POST {{TryDood2.0BaseUrl}}/brands/onboarding/add-gst-details
// Same tradeName handling as Step9GSTReadOnly: a blank trade name is
// dropped, and if the backend rejects the lookup's trade name (it has a
// 3-character minimum, and lookups can return e.g. "NA") the request is
// retried once without it.
/**
 * @param {Object} gstDetails - verifyBrandGst()'s `response.data`
 */
export async function updateBrandGstDetails(gstDetails) {
    const built = withoutCurrentScreen(buildGstDetailsPayload(gstDetails));
    const payload = { ...built, tradeName: built.tradeName?.trim() || undefined };

    try {
        const { data } = await api.post('/brands/onboarding/add-gst-details', payload);
        return data;
    } catch (error) {
        const message = String(error?.response?.data?.message || '').toLowerCase();
        if (!payload.tradeName || !message.includes('trade name')) handleError(error);
    }

    try {
        const { data } = await api.post('/brands/onboarding/add-gst-details', {
            ...payload,
            tradeName: undefined,
        });
        return data;
    } catch (error) {
        handleError(error);
    }
}
