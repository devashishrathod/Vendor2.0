import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onForegroundMessage } from './config/firebaseMessaging';
import PushNotificationToast from './components/common/PushNotificationToast';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import DashboardLayout from './features/dashboard/layouts/DashboardLayout';

import Step1WhatsApp from './features/onboarding/steps/Step1WhatsApp';
import OnboardingPage from './features/onboarding/pages/VendorOnboarding';

import AnalysisReport from './features/dashboard/pages/AnalysisReport';
import Transactions from './features/transaction/pages/Transactions';
import OrderDetail from './features/transaction/pages/OrderDetail';
import { Voucher, VoucherDetails } from './features/voucher/pages/voucher';
import { Settlement, SettlementDetails } from './features/Settlement/pages/settlement';
import VoucherFormPage from './features/voucher/pages/voucher/VoucherFormPage';
import More from './features/more/More';
import SubscriptionPlan from './features/subscriptions/pages/SubscriptionPlan';
import SubscriptionCheckout from './features/subscriptions/pages/SubscriptionCheckout';

import { OutletDetailsPage, OutletsPage } from './features/outlets';
import MusicLayout from './features/music/pages/MusicLayout';
import MusicPage from './features/music/pages/MusicPage';
import CollectionPage from './features/music/pages/CollectionPage';
import { SubscriptionPage } from './features/subscription';
import BrandPage from './features/brand';
import CreateBrandOutlet from './features/oulet/New folder/pages/CreateBrandOutlet';
import UnderReview from './features/oulet/New folder/pages/Youroutlet';
import PostAuthRouteGuard from './routes/PostAuthRouteGuard';


function App() {

    const [pushToast, setPushToast] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const handleMessage = (payload) => {
      const title =
        payload?.notification?.title ||
        payload?.title ||
        payload?.data?.title ||
        "New Notification";

      const body =
        payload?.notification?.body ||
        payload?.body ||
        payload?.data?.body ||
        "";

      const deepLink =
        payload?.data?.deepLink ||
        payload?.data?.deeplink ||
        payload?.deepLink ||
        null;

      setPushToast({ title, body, deepLink });
    };

    onForegroundMessage(handleMessage).then((unsub) => {
      unsubscribe = unsub;
    });

    // Background pushes are shown by firebase-messaging-sw.js itself; this
    // only covers a worker that also forwards the payload to open tabs via
    // postMessage (type: "FCM_PUSH") so the same toast can render for it.
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "FCM_PUSH") {
        handleMessage(event.data);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      unsubscribe?.();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, []);

  return (
    <BrowserRouter>
    <PushNotificationToast toast={pushToast} onDismiss={() => setPushToast(null)} />
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

          {/* Music — nested under MusicLayout so the bottom player (and its
              playback state) survives navigating into a collection's own
              page and back, Spotify-style. */}
          <Route path="/music" element={<MusicLayout />}>
            <Route index element={<MusicPage />} />
            <Route path="collection/:collectionId" element={<CollectionPage />} />
          </Route>

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