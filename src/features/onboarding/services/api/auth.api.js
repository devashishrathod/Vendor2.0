import { ROLES } from "@/constants";
import { request, setToken, clearToken } from "./client";

export const sendOTP = (whatsappNumber, role = ROLES.VENDOR) =>
  request("/auth/loginOrSignUp-with-whatsapp", "POST", {
    whatsappNumber,
    role,
  });

// `currentScreen` is optional (API doc #2 note 2: the onboarding endpoints
// move the screen themselves). Send it only when given — for a returning
// vendor it would overwrite where they left off.
export const verifyOTP = async (whatsappNumber, otp, role, screenToSend) => {
  const data = await request(
    "/auth/verify-otp-whatsapp",
    "POST",
    { whatsappNumber, otp, role, ...(screenToSend ? { currentScreen: screenToSend } : {}) },
    false,
  );
  if (data?.data?.token) setToken(data.data.token);
  return data;
};

export const logout = () => clearToken();

const authAPI = { sendOTP, verifyOTP, logout };
export default authAPI;
