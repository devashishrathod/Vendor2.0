import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';

/**
 * ProtectedRoute
 * Token nahi hai → /login (Step1WhatsApp) pe bhejo
 * Token hai     → children render karo
 */
export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/" replace />;
  return children;
}