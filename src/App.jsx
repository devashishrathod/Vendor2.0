import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import DashboardLayout from './features/dashboard/layouts/DashboardLayout';

import Step1WhatsApp from './features/onboarding/steps/Step1WhatsApp';
import OnboardingPage from './features/onboarding/pages/VendorOnboarding';

import Dashboard from './features/dashboard/pages/Dashboard';
import AnalysisReport from './features/dashboard/pages/AnalysisReport';
import Transactions from './features/dashboard/pages/Transactions';
import OrderDetail from './features/dashboard/pages/OrderDetail';
import { Voucher, VoucherDetails } from './features/voucher/pages/voucher';
import { Settlement, SettlementDetails } from './features/Settlement/pages/settlement';
import VoucherFormPage from './features/voucher/pages/voucher/VoucherFormPage';
import More from './features/more/More';
import SubscriptionPlan from './features/subscriptions/pages/SubscriptionPlan';
import SubscriptionCheckout from './features/subscriptions/pages/SubscriptionCheckout';

import { OutletDetailsPage, OutletsPage } from './features/outlets';
import { MusicPage } from './features/music';
import { SubscriptionPage } from './features/subscription';
import BrandPage from './features/brand';
import CreateBrandOutlet from './features/oulet/New folder/pages/CreateBrandOutlet';
import UnderReview from './features/oulet/New folder/pages/Youroutlet';
import PostAuthRouteGuard from './routes/PostAuthRouteGuard';


function App() {
  return (
    <BrowserRouter>
     <PostAuthRouteGuard>   {/* ✅ yahan wrap karo — Routes ke bahar, Router ke andar */}
      <Routes>

        {/* ─── PUBLIC ─── */}
        <Route path="/" element={<PublicRoute><Step1WhatsApp /></PublicRoute>} />

        {/* ─── ONBOARDING / OUTLET-SETUP FLOW: header/footer NAHI ─── */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlan /></ProtectedRoute>} />
        <Route path="/subscription/checkout" element={<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>} />
        {/* <Route path="/oulet" element={<ProtectedRoute><TrydoodOutlet /></ProtectedRoute>} /> */}
        <Route path="/brand-outlet" element={<ProtectedRoute><CreateBrandOutlet /></ProtectedRoute>} />
        <Route path="/under-review" element={<ProtectedRoute><UnderReview /></ProtectedRoute>} />

        {/* ─── DASHBOARD GROUP: header/footer YAHAN chahiye ─── */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis-report" element={<AnalysisReport />} />

          {/* Transactions */}
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/order/:orderId" element={<OrderDetail />} />

          {/* Vouchers */}
          <Route path="/vouchers" element={<Voucher />} />
          <Route path="/vouchers/new" element={<VoucherFormPage />} />
          <Route path="/vouchers/:voucherId/edit" element={<VoucherFormPage />} />
          <Route path="/vouchers/:voucherId" element={<VoucherDetails />} />

          {/* Settlements */}
          <Route path="/settlements" element={<Settlement />} />
          <Route path="/settlement/:settlementId" element={<SettlementDetails />} />

          {/* More */}
          <Route path="/more" element={<More />} />

          <Route path="/account-information" element={<BrandPage />} />
          <Route path="/outlets" element={<OutletsPage />} />
          <Route path="/outlets/:id" element={<OutletDetailsPage />} />

          {/* Music */}
          <Route path="/music" element={<MusicPage />} />

          {/* Subscription Page */}
          <Route path="/subscription-plan" element={<SubscriptionPage />} />

        </Route>

        {/* ─── Fallback ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
         </PostAuthRouteGuard>  
    </BrowserRouter>
  );
}

export default App;