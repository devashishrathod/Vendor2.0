// src/features/onboarding/services/api/deviceToken.api.js
import { request } from "./client";
import { getDeviceName, PLATFORM, APP_VERSION } from "../deviceInfo";
import { getPushToken, getBrowserDeviceId, FCM_TOKEN_STORAGE_KEY } from "@/config/firebaseMessaging";

/**
 * Register this device for push notifications. Called once, right after
 * OTP verification succeeds (Step2VerifyOTP.jsx) — see registerCurrentDevice().
 * POST /deviceTokens/register
 */
export async function registerDeviceToken({ token, platform, deviceId, deviceName, appVersion }) {
  return request(
    "/deviceTokens/register",
    "POST",
    { token, platform, deviceId, deviceName, appVersion },
    true
  );
}

/**
 * Unregister this device. Called from useLogout.js so every logout button
 * (header, everywhere) stops push notifications to this device.
 * PUT /deviceTokens/unregister
 */
export async function unregisterDeviceToken({ token, allDevices = false }) {
  return request(
    "/deviceTokens/unregister",
    "PUT",
    { token, allDevices },
    true
  );
}

/**
 * Best-effort — a denied permission or a missing VAPID key must never block
 * an actual login, so every failure is caught and logged, not thrown.
 * Already registered this browser (FCM_TOKEN_STORAGE_KEY set) → skip;
 * unregisterCurrentDevice() clears that key on logout.
 */
export async function registerCurrentDevice() {
  try {
    if (window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY)) return;

    const { token: fcmToken, isReal } = await getPushToken();
    console.log(`[deviceToken] Push token (${isReal ? "real FCM" : "placeholder"}):`, fcmToken);

    await registerDeviceToken({
      token: fcmToken,
      platform: PLATFORM,
      deviceId: getBrowserDeviceId(),
      deviceName: getDeviceName(),
      appVersion: APP_VERSION,
    });
    window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
  } catch (err) {
    console.warn("[deviceToken] Could not register this browser for push:", err.message);
  }
}

/**
 * Best-effort — same reasoning as registerCurrentDevice(): must never block
 * an actual logout.
 */
export async function unregisterCurrentDevice() {
  try {
    const token = window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (!token) return;

    await unregisterDeviceToken({ token, allDevices: false });
    window.localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  } catch (err) {
    console.warn("[deviceToken] Could not unregister this browser from push:", err.message);
  }
}
