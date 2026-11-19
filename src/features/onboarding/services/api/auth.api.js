import { ROLES } from "@/constants";
import { request, setToken, clearToken } from "./client";

export const sendOTP = (whatsappNumber, role = ROLES.VENDOR) =>
  request("/auth/loginOrSignUp-with-whatsapp", "POST", {
    whatsappNumber,
    role,
  });

// No `currentScreen` in the body — the server owns the screen (API doc #2 note 2).
export const verifyOTP = async (whatsappNumber, otp, role) => {
  const data = await request("/auth/verify-otp-whatsapp", "POST", { whatsappNumber, otp, role }, false);
  if (data?.data?.token) setToken(data.data.token);
  return data;
};

export const logout = () => clearToken();

const authAPI = { sendOTP, verifyOTP, logout };
export default authAPI;
