import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';

/**
 * PublicRoute
 * Token hai     → already logged in → /onboarding pe bhejo
 * Token nahi    → children render karo (login page dikhao)
 */
export default function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/onboarding" replace />;
  return children;
}