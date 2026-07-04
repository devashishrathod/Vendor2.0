import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore'; // apna actual path yahan adjust karo

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
    logout();            // authStore + onboardingStore dono reset, localStorage clear
    navigate('/');       // landing / login page pe bhejo (apna route yahan likhna)
  }, [logout, navigate]);

  return { handleLogout };
}