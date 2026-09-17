import axios from 'axios';

// ── Base URL / Axios instance (same pattern as the other feature-level
// services — e.g. VoucherService.js, brandApi.js) ──────────────────────
const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../features/onboarding/store/authStore');
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

// ── Get Notifications (bell dropdown) ───────────────────────────────
// GET {{TryDood2.0BaseUrl}}/notifications/get-all?page=&limit=
// Confirmed from Postman — envelope: { success, message, data: { total,
// totalPages, page, limit, data: [{ _id, type, severity, title, body,
// channels, meta, isRead, createdAt }, ...] } }.
export async function getNotifications({ page = 1, limit = 20 } = {}) {
    try {
        const { data } = await api.get('/notifications/get-all', { params: { page, limit } });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Mark Notifications Read (bell dropdown) ─────────────────────────
// PUT {{TryDood2.0BaseUrl}}/notifications/mark-read
// Confirmed from Postman — body: { markAll: true }. Called when the bell
// dropdown opens so the unread badge actually clears instead of staying
// stuck forever (there was no mark-read call at all before).
export async function markAllNotificationsRead() {
    try {
        const { data } = await api.put('/notifications/mark-read', { markAll: true });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Notification Preferences (Settings page) ────────────────────────
// GET {{base_url}}/trydood/v1/notifications/preferences
// ⚠️ FIXED: VITE_BASE_URL already ends in "/trydood/v1" (same as every
// other service in this app — see brandApi.js etc., which only ever add
// the resource path on top of that base). This used to hardcode the
// "/trydood/v1" prefix AGAIN on top of the axios instance's baseURL,
// producing ".../trydood/v1/trydood/v1/notifications/preferences" and a
// 404 — now it's just the resource path, matching the working pattern.
//
// Confirmed from Postman — envelope: { success, message, data: { userId,
// role, audience, channels: { email: { preference, effective, blockedBy },
// push: {...}, whatsapp: {...} }, updatedBy, updatedAt } }. `effective`
// can be false even when `preference` is true (e.g. WhatsApp blocked at
// platform level via `blockedBy: "PLATFORM"`) — the Settings page surfaces
// that instead of hiding it.
export async function getNotificationPreferences() {
    try {
        const { data } = await api.get('/notifications/preferences');
        return data;
    } catch (error) {
        handleError(error);
    }
}

// PUT {{base_url}}/trydood/v1/notifications/preferences
// Confirmed body shape: one channel per call, e.g. { "email": false }.
// @param {"email"|"push"|"whatsapp"} channel
// @param {boolean} enabled
export async function updateNotificationPreference(channel, enabled) {
    try {
        const { data } = await api.put('/notifications/preferences', { [channel]: enabled });
        return data;
    } catch (error) {
        handleError(error);
    }
}
