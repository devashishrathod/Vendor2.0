import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore'; // apna actual path yahan adjust karo
import { unregisterCurrentDevice } from '@/features/onboarding/services/api/deviceToken.api';

/**
 * useLogout — ek jagah se logout logic handle karo
 *
 * Usage:
 *   const { handleLogout, isLoading } = useLogout();
 *   <button onClick={handleLogout}>Logout</button>
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    // Unregister this device BEFORE clearing the token — the call needs
    // the still-valid Bearer token to authenticate. Not awaited: logout
    // shouldn't hang on this, and a failure here shouldn't block it.
    unregisterCurrentDevice().catch((err) =>
      console.error('[Logout] unregisterCurrentDevice failed:', err.message)
    );
    logout();            // authStore + onboardingStore dono reset, localStorage clear
    navigate('/');       // landing / login page pe bhejo (apna route yahan likhna)
  }, [logout, navigate]);

  return { handleLogout };
}