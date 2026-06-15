// ─────────────────────────────────────────────────────────────────────────────
// services/api/vendor.api.js
// All vendor / business related API calls
// ─────────────────────────────────────────────────────────────────────────────

import { request } from './client';

/**
 * Get vendor profile / business details
 * GET /vendor/profile
 */
export const getVendorProfile = () =>
  request('/vendor/profile', 'GET', null, true);

/**
 * Update vendor / business profile
 * PUT /vendor/profile
 *
 * @param {object} data
 * @example
 * await vendorAPI.updateVendorProfile({ businessName: 'My Shop', category: 'Food' });
 */
export const updateVendorProfile = (data) =>
  request('/vendor/profile', 'PUT', data, true);

/**
 * Get all services listed by this vendor
 * GET /vendor/services
 */
export const getVendorServices = () =>
  request('/vendor/services', 'GET', null, true);

/**
 * Add a new service
 * POST /vendor/services
 *
 * @param {object} serviceData
 */
export const addService = (serviceData) =>
  request('/vendor/services', 'POST', serviceData, true);

/**
 * Update an existing service
 * PUT /vendor/services/:id
 *
 * @param {string} serviceId
 * @param {object} serviceData
 */
export const updateService = (serviceId, serviceData) =>
  request(`/vendor/services/${serviceId}`, 'PUT', serviceData, true);

/**
 * Delete a service
 * DELETE /vendor/services/:id
 *
 * @param {string} serviceId
 */
export const deleteService = (serviceId) =>
  request(`/vendor/services/${serviceId}`, 'DELETE', null, true);

const vendorAPI = {
  getVendorProfile,
  updateVendorProfile,
  getVendorServices,
  addService,
  updateService,
  deleteService,
};
export default vendorAPI;