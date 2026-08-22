import axios from 'axios';

// ── Base URL ────────────────────────────────────────────────
// Matches the Postman env variable {{TryDood2.0BaseUrl}}
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically (same pattern as authApi.js / planApi.js)
// NOTE: adjust this relative path to wherever authStore.js actually lives
// in your project (e.g. "../store/authStore").
api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../../onboarding/store/authStore');
    const token = useAuthStore.getState().token; // ← was `accessToken`, authStore actually stores it as `token`
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

// ── Get All Categories (paginated + searchable) ──────────────
// GET {{TryDood2.0BaseUrl}}/categories/getAll?page=&limit=&search=
export async function getCategories({ page = 1, limit = 10, search = '' } = {}) {
    try {
        const params = { page, limit };
        if (search) params.search = search;
        const { data } = await api.get('/categories/getAll', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get Single Category (for View) ────────────────────────────
// GET {{TryDood2.0BaseUrl}}/categories/:id
// NOTE: adjust path if your real "get one" endpoint differs.
export async function getCategoryById(id) {
    try {
        const { data } = await api.get(`/categories/${id}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get All Sub-Categories (paginated + filterable) ────────────
// GET {{TryDood2.0BaseUrl}}/subCategories/getAll
// query params: page, limit, type, sortBy, sortOrder, isActive, categoryId, search
export async function getSubCategories({
    page = 1,
    limit = 10,
    search = '',
    categoryId,
    isActive,
    type,
    sortBy,
    sortOrder,
} = {}) {
    try {
        const params = { page, limit };
        if (search) params.search = search;
        if (categoryId) params.categoryId = categoryId;
        if (isActive !== undefined) params.isActive = isActive;
        if (type) params.type = type;
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;

        const { data } = await api.get('/subCategories/getAll', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}