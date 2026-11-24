import axios from 'axios';
import { ApiError, attachApiErrorInterceptor, getErrorDetails, getErrorStatus } from '@/services/http/apiError';

// Outlet edits from the Outlets page. Adding an outlet, the manager's code,
// resend / fix number / cancel, location and work hours go through the
// onboarding-v2 brandSetupApi (one implementation for both places).

// ── Base URL ────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});
attachApiErrorInterceptor(api);

// Attach auth token automatically
api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../onboarding/store/authStore');
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// The server's message with `status` and `details` kept, so callers branch
// on `details.code` (409 OUTLET_NOT_VERIFIED…).
function handleError(error) {
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong. Please try again.';
    throw new ApiError(message, { status: getErrorStatus(error), details: getErrorDetails(error) });
}

// ── Update a SubBrand (Outlet) ─────────────────────────────────────
// PUT /subBrands/update/:subBrandId (API doc #36)
// body: any subset of { outletType, description, isActive, ... }.
// Locked until the manager has verified (409 OUTLET_NOT_VERIFIED).
/**
 * @param {string} subBrandId
 * @param {object} patch
 */
export async function updateSubBrand(subBrandId, patch = {}) {
    try {
        const { data } = await api.put(`/subBrands/update/${subBrandId}`, patch);
        return data;
    } catch (error) {
        handleError(error);
    }
}
