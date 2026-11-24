import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ANALYTICS_EVENTS, LOGIN_METHOD } from '@/constants/analytics';
import { setAnalyticsUser, trackEvent } from '@/utils/analytics';
import { authAPI } from '../services/api/index';
import { useOnboardingStore } from './onboardingStore';
import { useOnboardingV2Store } from '@/features/onboarding-v2/store/onboardingStore';
import { useOnboardingStatusStore } from '@/features/onboarding-v2/store/statusStore';
import { useSavedBrandStore } from '@/features/onboarding-v2/store/brandStore';
import { useVerifyStore } from '@/features/onboarding-v2/store/verifyStore';

// Session only. The onboarding screen is the server's: routing reads
// GET /brands/onboarding/status (useOnboardingStatusStore), never this store
// (onboarding v2 guide §2.1–§2.3).

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:    null,
      token:   null,
      // Analytics only (sign-up vs login). Never routed on: an admin-created
      // vendor is also isFirst but may be half-way through (guide §2.3).
      isFirst: null,
      loading: false,
      error:   null,

      // ─── sendOTP ─────────────────────────────────────────────────────────
      sendOTP: async (whatsappNumber, role = 'VENDOR') => {
        set({ loading: true, error: null });
        try {
          const res     = await authAPI.sendOTP(whatsappNumber, role);
          const isFirst = res?.data?.isFirst ?? null;
          set({ isFirst, loading: false });
          trackEvent(ANALYTICS_EVENTS.OTP_REQUESTED, { method: LOGIN_METHOD, is_new_vendor: !!isFirst });
          return res;
        } catch (e) {
          set({ error: e.message, loading: false });
          throw e;
        }
      },

      // ─── verifyOTP ───────────────────────────────────────────────────────
      // No currentScreen in the body: the server sets it (API doc #2 note 2).
      verifyOTP: async (whatsappNumber, otp, role = 'VENDOR') => {
        set({ loading: true, error: null });
        try {
          const { isFirst } = get();
          const res   = await authAPI.verifyOTP(whatsappNumber, otp, role);
          const token = res?.data?.token;
          const user  = res?.data?.user;
          if (!token) throw new Error('Token not received. Please try again.');
          set({ token, user, loading: false });
          setAnalyticsUser(user?._id ?? null);
          trackEvent(isFirst ? ANALYTICS_EVENTS.SIGN_UP : ANALYTICS_EVENTS.LOGIN, { method: LOGIN_METHOD });
          return { ...res, isFirst };
        } catch (e) {
          set({ error: e.message, loading: false });
          throw e;
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
          user:    null,
          token:   null,
          isFirst: null,
          loading: false,
          error:   null,
        });

        useOnboardingStore.getState().reset();
        useOnboardingV2Store.getState().reset();
        useOnboardingStatusStore.getState().reset();
        useSavedBrandStore.getState().reset();
        useVerifyStore.getState().reset();
        setAnalyticsUser(null);

        localStorage.removeItem('auth-storage');
        localStorage.removeItem('onboarding-store');
        localStorage.removeItem('onboarding-v2-store');
      },

      setError:   (error) => set({ error }),
      clearError: ()      => set({ error: null }),
    }),
    {
      name:       'auth-storage',
      storage:    createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token:   s.token,
        user:    s.user,
        isFirst: s.isFirst,
      }),
    }
  )
);
