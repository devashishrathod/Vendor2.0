import { ROLES } from "@/constants";
import { clearLegacyToken } from "@/services/api/authToken";
import { request } from "./client";

export const sendOTP = (whatsappNumber, role = ROLES.VENDOR) =>
  request("/auth/loginOrSignUp-with-whatsapp", "POST", {
    whatsappNumber,
    role,
  });

// No `currentScreen` in the body — the server owns the screen (API doc #2 note 2).
// The token is kept by the auth store only (services/api/authToken.js).
export const verifyOTP = (whatsappNumber, otp, role) =>
  request("/auth/verify-otp-whatsapp", "POST", { whatsappNumber, otp, role }, false);

export const logout = () => clearLegacyToken();

const authAPI = { sendOTP, verifyOTP, logout };
export default authAPI;
