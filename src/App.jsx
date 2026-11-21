import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onForegroundMessage } from './config/firebaseMessaging';
import PushNotificationToast from './components/common/PushNotificationToast';
import NotificationClickListener from './components/common/NotificationClickListener';
import { announceNotification, refreshProfileAfterNotice } from './utils/notificationEvents';
import { NOTIFICATION_OPEN_PATH, notificationTarget, refreshesProfile } from './utils/notificationLinks';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import DashboardLayout from './features/dashboard/layouts/DashboardLayout';

import Step1WhatsApp from './features/onboarding/steps/Step1WhatsApp';
import { ONBOARDING_ROUTES, OnboardingPage, ReviewStatusPage, StatusGate } from './features/onboarding-v2';

import AnalysisReport from './features/dashboard/pages/AnalysisReport';
import Transactions from './features/transaction/pages/Transactions';
import OrderDetail from './features/transaction/pages/OrderDetail';
import Refunds from './features/refund/pages/Refunds';
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
import PlaylistPage from './features/music/pages/PlaylistPage';
import { SubscriptionPage } from './features/subscription';
import SettingsPage from './features/settings/pages/SettingsPage';
import BrandPage from './features/brand';
import PostAuthRouteGuard from './routes/PostAuthRouteGuard';
import NotificationOpenRoute from './routes/NotificationOpenRoute';
import OnboardingOnlyRoute from './routes/OnboardingOnlyRoute';
import AnalyticsRouteTracker from './routes/AnalyticsRouteTracker';


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

      // Top-level deepLink (push payload) or meta's, as a token or a server
      // path → a panel route; unknown links fall back to the type.
      const type = payload?.data?.type || payload?.type || null;
      const target = notificationTarget({
        type,
        deepLink: payload?.data?.deepLink || payload?.data?.deeplink || payload?.deepLink || null,
        meta: payload?.data?.meta ?? payload?.meta,
      });

      setPushToast({ title, body, deepLink: target?.to ?? null });
      // The bell reloads; a review / legal / outlet notice refreshes status + profile.
      announceNotification();
      if (refreshesProfile(type)) refreshProfileAfterNotice();
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
    <AnalyticsRouteTracker />
    <PushNotificationToast toast={pushToast} onDismiss={() => setPushToast(null)} />
    {/* OS notification clicked while this tab is open → its page, in-app. */}
    <NotificationClickListener />
     {/* Logged in → wait for GET /brands/onboarding/status, the only routing source. */}
     <StatusGate>
     <PostAuthRouteGuard>   {/* ✅ yahan wrap karo — Routes ke bahar, Router ke andar */}
      <Routes>

        {/* ─── PUBLIC ─── */}
        <Route path={ONBOARDING_ROUTES.LOGIN} element={<PublicRoute><Step1WhatsApp /></PublicRoute>} />

        {/* ─── ONBOARDING (v3, login → partnership deed) / OUTLET-SETUP FLOW: header/footer NAHI ─── */}
        <Route path={ONBOARDING_ROUTES.WIZARD} element={<ProtectedRoute><OnboardingOnlyRoute><OnboardingPage /></OnboardingOnlyRoute></ProtectedRoute>} />
        <Route path={ONBOARDING_ROUTES.PLAN} element={<ProtectedRoute><SubscriptionPlan /></ProtectedRoute>} />
        <Route path={ONBOARDING_ROUTES.CHECKOUT} element={<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>} />
        <Route path={ONBOARDING_ROUTES.STATUS} element={<ProtectedRoute><ReviewStatusPage /></ProtectedRoute>} />

        {/* ─── DASHBOARD GROUP: header/footer YAHAN chahiye ─── */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

          <Route path="/analysis-report" element={<AnalysisReport />} />

          {/* Transactions */}
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/order/:orderId" element={<OrderDetail />} />

          {/* Refunds */}
          <Route path="/refunds" element={<Refunds />} />

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
            <Route path="playlist/:playlistId" element={<PlaylistPage />} />
          </Route>

          {/* Subscription Page */}
          <Route path="/subscription-plan" element={<SubscriptionPage />} />

          <Route path="/settings" element={<SettingsPage />} />

        </Route>

        {/* OS notification click (service worker) → the notification's page, or the vendor's screen. */}
        <Route path={NOTIFICATION_OPEN_PATH} element={<ProtectedRoute><NotificationOpenRoute /></ProtectedRoute>} />

        {/* ─── Fallback ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
         </PostAuthRouteGuard>  
     </StatusGate>
    </BrowserRouter>
  );
}

export default App;