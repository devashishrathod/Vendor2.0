// ─────────────────────────────────────────────────────────────────────────────
// services/api/index.js
// Single entry point — import any API from here
//
// Usage:
//   import { authAPI }   from '@/services/api';
//   import { userAPI }   from '@/services/api';
//   import { vendorAPI } from '@/services/api';
//
//   OR named function import:
//   import { sendOTP, verifyOTP } from '@/services/api/auth.api';
// ─────────────────────────────────────────────────────────────────────────────

export { default as authAPI }   from './auth.api';
export { default as userAPI }   from './user.api';
export { default as vendorAPI } from './vendor.api';

// Also export token utils for convenience
export { getToken, setToken, clearToken } from './client';