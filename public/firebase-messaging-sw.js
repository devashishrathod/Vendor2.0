// public/firebase-messaging-sw.js

// OS notification click → the panel opens at that notification's page.
// Registered before Firebase so it runs first and stops the SDK's own click
// handler (that one only focuses a tab or opens fcmOptions.link). The worker
// can't import the app's link map, so it passes type + link to this path and
// the app resolves them with notificationTarget() — NOTIFICATION_OPEN_PATH in
// src/utils/notificationLinks.js.
const NOTIFICATION_OPEN_PATH = "/notifications/open";

self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  // Shown by the Firebase SDK → the push payload sits under FCM_MSG; shown by
  // onBackgroundMessage below → `data` is the payload's data.
  const shown = event.notification.data || {};
  const data = (shown.FCM_MSG && shown.FCM_MSG.data) || shown;
  const params = new URLSearchParams();
  if (data.type) params.set("type", data.type);
  const link = data.deepLink || data.deeplink;
  if (link) params.set("link", link);
  event.waitUntil(openPanel(`${NOTIFICATION_OPEN_PATH}?${params.toString()}`));
});

async function openPanel(url) {
  const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const tab = tabs.find((client) => client.focused) || tabs[0];
  if (!tab) return self.clients.openWindow(url);
  // The open panel routes in-app, without a reload (NotificationClickListener).
  tab.postMessage({ type: "NOTIFICATION_CLICK", url });
  return tab.focus();
}

// A new version takes over at once: this worker only handles pushes (no cache
// to keep consistent), and open tabs would otherwise keep the old click handler.
self.addEventListener("install", () => self.skipWaiting());

importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBrxjSu40AuXadpX7je2cBTXMyQOqLGuz4",
  authDomain: "trydood-5b2ec.firebaseapp.com",
  projectId: "trydood-5b2ec",
  storageBucket: "trydood-5b2ec.firebasestorage.app",
  messagingSenderId: "411862718937",
  appId: "1:411862718937:web:6fa2eae3e94b41cddf61c8",
});

const messaging = firebase.messaging();

// Background push. Our pushes carry a `notification` block (title, body) and
// `data` (type, notificationId, deepLink, brandId); the browser (Firebase SDK)
// shows those itself, so showing one here too made two OS notifications per
// push. Only a data-only push needs one from us.
messaging.onBackgroundMessage(async (payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const message = {
    type: "FCM_PUSH",
    title: notification.title || data.title || "TryDood Vendor",
    body: notification.body || data.body || "",
    deepLink: data.deepLink || data.deeplink || null,
    data,
  };

  // Open panel tabs (in the background) reload the bell and the onboarding status.
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));

  if (payload.notification) return;
  await self.registration.showNotification(message.title, {
    body: message.body,
    icon: "/favicon.svg",
    data,
  });
});