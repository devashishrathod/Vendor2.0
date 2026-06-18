import { create } from "zustand";
import { authAPI } from "../services/api/index";
import { ROLES } from "@/constants";

const SCREEN_MAP = {
  LANDING_SCREEN: "BUSINESS_NAME",
  BUSINESS_NAME: "BUSINESS_NAME",
  REGISTRATION_STATUS: "REGISTRATION_STATUS",
  REGISTRATION_ENTITY_TYPE: "REGISTRATION_ENTITY_TYPE",
  BUSINESS_VERIFICATION: "PAN_VERIFICATION",
  PAN_VERIFICATION: "PAN_VERIFICATION",
  GST_VERIFICATION: "GST_VERIFICATION",
  BANK_VERIFICATION: "BANK_VERIFICATION",
  SYSTEM_VERIFICATION: "SYSTEM_VERIFICATION",
  PARTNERSHIP_DEED: "PARTNERSHIP_DEED",
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isFirst: null,
  currentScreen: "BUSINESS_NAME", // safe default
  loading: false,
  error: null,

  sendOTP: async (whatsappNumber, role = ROLES.VENDOR) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.sendOTP(whatsappNumber, role);
      const isFirst = res?.data?.isFirst ?? null;
      const rawScreen = res?.data?.user?.currentScreen ?? "";
      const currentScreen = SCREEN_MAP[rawScreen] ?? "BUSINESS_NAME";
      set({ isFirst, currentScreen, loading: false });
      return res;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  verifyOTP: async (whatsappNumber, otp, role = ROLES.VENDOR) => {
    set({ loading: true, error: null });
    try {
      const { isFirst, currentScreen } = get();

      // isFirst=true  → fresh vendor   → BUSINESS_NAME
      // isFirst=false → returning      → mapped currentScreen from sendOTP response
      // both cases mein currentScreen hamesha valid string hai
      const screenToSend = isFirst ? "BUSINESS_NAME" : currentScreen;

      const res = await authAPI.verifyOTP(
        whatsappNumber,
        otp,
        role,
        screenToSend,
      );
      const token = res?.data?.token;
      const user = res?.data?.user;
      if (!token) throw new Error("Token not received. Please try again.");
      set({ token, user, loading: false });
      return { ...res, isFirst };
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  logout: () => {
    authAPI.logout();
    set({
      user: null,
      token: null,
      isFirst: null,
      currentScreen: null,
      error: null,
    });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
