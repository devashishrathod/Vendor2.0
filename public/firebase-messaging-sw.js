// public/firebase-messaging-sw.js

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

// messaging.onBackgroundMessage((payload) => {
//   console.log("[FCM SW] Background message:", payload);

//   const notification = payload.notification || {};
//   const data = payload.data || {};

//   self.registration.showNotification(
//     notification.title || data.title || "TryDood Vendor",
//     {
//       body: notification.body || data.body || "",
//       icon: "/vite.svg",
//       data,
//     }
//   );
// });

messaging.onBackgroundMessage(async (payload) => {
  console.log("[FCM SW] Background message:", payload);

  const notification = payload.notification || {};
  const data = payload.data || {};

  const message = {
    type: "FCM_PUSH",
    title: notification.title || data.title || "TryDood Vendor",
    body: notification.body || data.body || "",
    deepLink: data.deepLink || data.deeplink || null,
    data,
  };

  // 🔥 Send message to the open Vendor React app
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  clients.forEach((client) => {
    client.postMessage(message);
  });

  // Browser notification
  await self.registration.showNotification(message.title, {
    body: message.body,
    icon: "/vite.svg",
    data,
  });
});