// ─────────────────────────────────────────────────────────────────────────────
// services/api/user.api.js
// All user / profile related API calls
// ─────────────────────────────────────────────────────────────────────────────

import { request } from './client';

/**
 * Get logged-in user's profile
 * GET /user/profile
 *
 * @example
 * const { data } = await userAPI.getProfile();
 */
export const getProfile = () =>
  request('/user/profile', 'GET', null, true);

/**
 * Update user profile
 * PUT /user/profile
 *
 * @param {object} data - fields to update
 * @example
 * await userAPI.updateProfile({ name: 'John', email: 'j@example.com' });
 */
export const updateProfile = (data) =>
  request('/user/profile', 'PUT', data, true);

const userAPI = { getProfile, updateProfile };
export default userAPI;