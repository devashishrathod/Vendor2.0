// src/features/onboarding/services/deviceInfo.js
// deviceId now lives in firebaseMessaging.js's getBrowserDeviceId() —
// this file only owns deviceName/platform/appVersion for the
// deviceTokens/register and deviceTokens/unregister calls (see
// deviceToken.api.js).
export function getDeviceName() {
  if (typeof navigator === "undefined") return "Web Browser";
  return navigator.userAgent.slice(0, 80);
}

export const PLATFORM = "WEB";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
