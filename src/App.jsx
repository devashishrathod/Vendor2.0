import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute        from './routes/ProtectedRoute';
import PublicRoute           from './routes/PublicRoute';

import Step1WhatsApp         from './features/onboarding/steps/Step1WhatsApp';
import OnboardingPage        from './features/onboarding/pages/VendorOnboarding';
import SubscriptionPlan      from './features/subscription/SubscriptionPlan';
import SubscriptionCheckout  from './features/checkout/Subscriptioncheckout';
import CreateBrandOutlet     from './features/oulet/pages/Createbrandoutlet';
import YourOutlet            from './features/oulet/pages/Youroutlet';
import TrydoodOutlet         from './features/oulet/pages/Outlet';
import Dashboard             from './features/dashboard/pages/Dashboard';
import AnalysisReport        from './features/dashboard/pages/AnalysisReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ─── PUBLIC ─── */}
        <Route path="/" element={<PublicRoute><Step1WhatsApp /></PublicRoute>} />

        {/* ─── PROTECTED: onboarding ─── */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* ─── PROTECTED: post-onboarding ─── */}
        <Route path="/subscription"          element={<ProtectedRoute><SubscriptionPlan /></ProtectedRoute>} />
        <Route path="/subscription/checkout" element={<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>} />
        <Route path="/oulet"                 element={<ProtectedRoute><TrydoodOutlet /></ProtectedRoute>} />
        <Route path="/brand-outlet"          element={<ProtectedRoute><CreateBrandOutlet /></ProtectedRoute>} />
        <Route path="/under-review"          element={<ProtectedRoute><YourOutlet /></ProtectedRoute>} />

        {/* ─── DASHBOARD ─── */}
        <Route path="/dashboard"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analysis-report"       element={<ProtectedRoute><AnalysisReport /></ProtectedRoute>} />

        {/* ─── Fallback ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;