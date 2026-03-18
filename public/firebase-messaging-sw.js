// Firebase Cloud Messaging Service Worker
// This file must be at the root (/firebase-messaging-sw.js) for FCM to work

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ⚠️  Replace with your Firebase project config
firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message:', payload);
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || "",
      icon: '/icon.jpeg',
      badge: '/icon.jpeg',
      data: payload.data || {},
      actions: [{ action: 'open', title: 'Open App' }],
    });
  }
});

// Notification click → open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
