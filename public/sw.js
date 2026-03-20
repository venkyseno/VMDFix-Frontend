// 🔥 Firebase SDKs
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 🔥 Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyD76jLLAC7ev-HwfCjN3ti_UvBNk2tmKxE",
  authDomain: "vmdfix.firebaseapp.com",
  projectId: "vmdfix",
  messagingSenderId: "129434529590",
  appId: "1:129434529590:web:5b1aa325685556f89e8d97",
});

// 🔥 Messaging instance
const messaging = firebase.messaging();

// ✅ HANDLE BACKGROUND NOTIFICATIONS (CRITICAL)
messaging.onBackgroundMessage((payload) => {
  console.log("🔥 FCM Background message:", payload);

  const title = payload.data?.title || "Notification";
  const body = payload.data?.body || "";

  self.registration.showNotification(title, {
    body: body,
    icon: "/icon.jpeg",
    badge: "/icon.jpeg",
    data: payload.data || {},
  });
});

// ✅ HANDLE CLICK (SAFE VERSION)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.click_action || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});