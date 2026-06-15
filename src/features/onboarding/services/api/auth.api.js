import { request, setToken, clearToken } from './client';

export const sendOTP = (whatsappNumber, role = 'VENDOR') =>
  request('/auth/loginOrSignUp-with-whatsapp', 'POST', { whatsappNumber, role });

export const verifyOTP = async (whatsappNumber, otp, role, screenToSend) => {
  const data = await request(
    '/auth/verify-otp-whatsapp',
    'POST',
    { whatsappNumber, otp, role, currentScreen: screenToSend },  // hamesha present
    false
  );
  if (data?.data?.token) setToken(data.data.token);
  return data;
};

export const logout = () => clearToken();

const authAPI = { sendOTP, verifyOTP, logout };
export default authAPI;