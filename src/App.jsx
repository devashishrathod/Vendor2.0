import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute      from './routes/ProtectedRoute';
import PublicRoute         from './routes/PublicRoute';

import Step1WhatsApp       from './features/onboarding/steps/Step1WhatsApp';
import OnboardingPage      from './features/onboarding/pages/VendorOnboarding';
import SubscriptionPlan    from './features/subscription/SubscriptionPlan';
import SubscriptionCheckout from './features/checkout/Subscriptioncheckout';
import CreateBrandOutlet   from './features/oulet/pages/Createbrandoutlet';
import YourOutlet          from './features/oulet/pages/Youroutlet';
import TrydoodOutlet       from './features/oulet/pages/Outlet';

// Individual step routes — sirf dev/testing ke liye useful hain
// Production mein inhe hata sakte ho, sab kuch OnboardingPage handle karta hai
import Step3BusinessName   from './features/onboarding/steps/Step3BusinessName';
import Step4IsRegistered   from './features/onboarding/steps/Step4IsRegistered';
import Step5BusinessType   from './features/onboarding/steps/Step5BusinessType';
import Step6PANEnter       from './features/onboarding/steps/Step6PANEnter';
import Step8GSTEnter       from './features/onboarding/steps/Step8GSTEnter';
import Step10SystemVerify  from './features/onboarding/steps/Step10SystemVerify';
import Step11BankEnter     from './features/onboarding/steps/Step11BankEnter';
import Step14PartnerContract from './features/onboarding/steps/Step14PartnerContract';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ─── PUBLIC: sirf login page ─── */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Step1WhatsApp />
            </PublicRoute>
          }
        />

        {/* ─── PROTECTED: onboarding (main flow) ─── */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* ─── PROTECTED: individual step routes (dev/testing) ─── */}
        <Route path="/onboarding/step3"  element={<ProtectedRoute><Step3BusinessName /></ProtectedRoute>} />
        <Route path="/onboarding/step4"  element={<ProtectedRoute><Step4IsRegistered /></ProtectedRoute>} />
        <Route path="/onboarding/step5"  element={<ProtectedRoute><Step5BusinessType /></ProtectedRoute>} />
        <Route path="/onboarding/step6"  element={<ProtectedRoute><Step6PANEnter /></ProtectedRoute>} />
        <Route path="/onboarding/step8"  element={<ProtectedRoute><Step8GSTEnter /></ProtectedRoute>} />
        <Route path="/onboarding/step10" element={<ProtectedRoute><Step10SystemVerify /></ProtectedRoute>} />
        <Route path="/onboarding/step11" element={<ProtectedRoute><Step11BankEnter /></ProtectedRoute>} />
        <Route path="/onboarding/step14" element={<ProtectedRoute><Step14PartnerContract /></ProtectedRoute>} />

        {/* ─── PROTECTED: post-onboarding routes ─── */}
        <Route path="/subscription"          element={<ProtectedRoute><SubscriptionPlan /></ProtectedRoute>} />
        <Route path="/subscription/checkout" element={<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>} />
        <Route path="/oulet"                 element={<ProtectedRoute><TrydoodOutlet /></ProtectedRoute>} />
        <Route path="/brand-outlet"          element={<ProtectedRoute><CreateBrandOutlet /></ProtectedRoute>} />
        <Route path="/under-review"          element={<ProtectedRoute><YourOutlet /></ProtectedRoute>} />

        {/* ─── Fallback: unknown route → login ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;