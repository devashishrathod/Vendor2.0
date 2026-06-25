import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../services/api/index';
import { useOnboardingStore } from './onboardingStore';

// ─── SCREEN_MAP — backend string → frontend canonical screen name ─────────────
// Fix: SUBSCRIBE_PLAN, UNDER_REVIEW, DASHBOARD added (ye missing the isliye
//      Chrome clear karne ke baad BUSINESS_NAME pe reset ho raha tha)
const SCREEN_MAP = {
  LANDING_SCREEN:           "BUSINESS_NAME",
  BUSINESS_NAME:            "BUSINESS_NAME",
  REGISTRATION_STATUS:      "REGISTRATION_STATUS",
  REGISTRATION_ENTITY_TYPE: "REGISTRATION_ENTITY_TYPE",
  BUSINESS_VERIFICATION:    "PAN_VERIFICATION",
  PAN_VERIFICATION:         "PAN_VERIFICATION",
  PAN_READONLY:             "PAN_READONLY",
  GST_VERIFICATION:         "GST_VERIFICATION",
  GST_READONLY:             "GST_READONLY",
  BANK_VERIFICATION:        "BANK_VERIFICATION",
  BANK_READONLY:            "BANK_READONLY",
  SYSTEM_VERIFICATION:      "SYSTEM_VERIFICATION",
  PARTNERSHIP_DEED:         "PARTNERSHIP_DEED",
  SUBSCRIBE_PLAN:           "SUBSCRIBE_PLAN",   // ✅ added
  UNDER_REVIEW:             "UNDER_REVIEW",     // ✅ added
  DASHBOARD:                "DASHBOARD",        // ✅ added
};

// ─── SCREEN_ORDER — forward-only guard ke liye ────────────────────────────────
// auth-storage currentScreen kabhi peeche nahi jayega (advanceScreen check karta hai)
const SCREEN_ORDER = [
  "BUSINESS_NAME",
  "REGISTRATION_STATUS",
  "REGISTRATION_ENTITY_TYPE",
  "PAN_VERIFICATION",
  "PAN_READONLY",
  "GST_VERIFICATION",
  "GST_READONLY",
  "BANK_VERIFICATION",
  "BANK_READONLY",
  "SYSTEM_VERIFICATION",
  "PARTNERSHIP_DEED",
  "SUBSCRIBE_PLAN",   // ✅ added
  "UNDER_REVIEW",     // ✅ added
  "DASHBOARD",        // ✅ added
];

function screenIndex(screen) {
  return SCREEN_ORDER.indexOf(screen);
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:          null,
      token:         null,
      isFirst:       null,
      currentScreen: 'BUSINESS_NAME',
      loading:       false,
      error:         null,

      // ─── sendOTP ─────────────────────────────────────────────────────────
      // Backend se currentScreen fetch karke set karta hai login pe
      sendOTP: async (whatsappNumber, role = 'VENDOR') => {
        set({ loading: true, error: null });
        try {
          const res           = await authAPI.sendOTP(whatsappNumber, role);
          const isFirst       = res?.data?.isFirst ?? null;
          const rawScreen     = res?.data?.user?.currentScreen ?? '';
          // SCREEN_MAP mein key nahi mili → fallback BUSINESS_NAME
          // Ab SUBSCRIBE_PLAN/UNDER_REVIEW/DASHBOARD bhi map mein hain ✅
          const currentScreen = SCREEN_MAP[rawScreen] ?? 'BUSINESS_NAME';
          set({ isFirst, currentScreen, loading: false });
          return res;
        } catch (e) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      // ─── verifyOTP ───────────────────────────────────────────────────────
      verifyOTP: async (whatsappNumber, otp, role = 'VENDOR') => {
        set({ loading: true, error: null });
        try {
          const { isFirst, currentScreen } = get();
          const screenToSend = isFirst ? 'BUSINESS_NAME' : currentScreen;
          const res   = await authAPI.verifyOTP(whatsappNumber, otp, role, screenToSend);
          const token = res?.data?.token;
          const user  = res?.data?.user;
          if (!token) throw new Error('Token not received. Please try again.');
          set({ token, user, loading: false });
          return { ...res, isFirst };
        } catch (e) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      // ─── advanceScreen ───────────────────────────────────────────────────
      // onboardingStore ke syncAuthScreen se call hota hai har step pe.
      // Sirf FORWARD move karta hai — kabhi peeche nahi.
      advanceScreen: (newScreen) => {
        const mapped  = SCREEN_MAP[newScreen] ?? newScreen;
        const current = get().currentScreen;

        const newIdx  = screenIndex(mapped);
        const currIdx = screenIndex(current);

        if (newIdx > currIdx) {
          set({ currentScreen: mapped });

          // user object ke andar bhi sync karo (koi component user.currentScreen
          // read karta ho to consistent rahe)
          const user = get().user;
          if (user) {
            set({ user: { ...user, currentScreen: newScreen } });
          }
        }
      },

      // ─── logout ──────────────────────────────────────────────────────────
      logout: () => {
        try {
          authAPI.logout();
        } catch (e) {
          console.error('authAPI.logout failed:', e);
        }

        set({
          user:          null,
          token:         null,
          isFirst:       null,
          currentScreen: 'BUSINESS_NAME',
          loading:       false,
          error:         null,
        });

        useOnboardingStore.getState().reset();

        localStorage.removeItem('auth-storage');
        localStorage.removeItem('onboarding-store');
      },

      setError:   (error) => set({ error }),
      clearError: ()      => set({ error: null }),
    }),
    {
      name:       'auth-storage',
      storage:    createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token:         s.token,
        user:          s.user,
        isFirst:       s.isFirst,
        currentScreen: s.currentScreen,
      }),
    }
  )
);