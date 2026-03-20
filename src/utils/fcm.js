/**
 * FCM Push Notification Utilities (FINAL FIXED VERSION)
 */

import api from '../api/api';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD76jLLAC7ev-HwfCjN3ti_UvBNk2tmKxE",
  authDomain: "vmdfix.firebaseapp.com",
  projectId: "vmdfix",
  storageBucket: "vmdfix.firebasestorage.app",
  messagingSenderId: "129434529590",
  appId: "1:129434529590:web:5b1aa325685556f89e8d97",
};

// VAPID key
const VAPID_KEY = "BHj2bBrQbSVWSoDy7-wiTKGgHL4zqQVZaCuLBQOMh4Pu10uB6p4FP0Dcxhta8IZtd7_BGPAN29jQ71u4xNN95_w";

let _messaging = null;

/**
 * Get Firebase messaging instance (singleton)
 */
async function getMessagingInstance() {
  if (_messaging) return _messaging;

  const { initializeApp, getApps } = await import('firebase/app');
  const { getMessaging } = await import('firebase/messaging');

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _messaging = getMessaging(app);

  return _messaging;
}

/**
 * Request permission + get token + register with backend
 */
export async function requestAndRegisterToken(userId) {
  try {
    if (!('Notification' in window)) {
      console.warn("❌ Notifications not supported");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("❌ Notification permission denied");
      return null;
    }

    // ✅ Use EXISTING service worker (DO NOT register new one)
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      console.error("❌ No active service worker found");
      return null;
    }

    const { getToken } = await import('firebase/messaging');
    const messaging = await getMessagingInstance();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("🔥 FCM TOKEN:", token);

    if (token) {
      try {
        await api.post('/notifications/token', {
          userId: userId ? String(userId) : "guest",
          fcmToken: token,
          platform: 'WEB',
        });
        console.log("✅ Token sent to backend");
      } catch (err) {
        console.warn("⚠️ Failed to send token to backend:", err.message);
      }

      localStorage.setItem('fcm_token', token);
    }

    return token;

  } catch (err) {
    console.error("❌ FCM registration error:", err);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export async function onForegroundMessage(callback) {
  try {
    const { onMessage } = await import('firebase/messaging');
    const messaging = await getMessagingInstance();

    return onMessage(messaging, callback);
  } catch (err) {
    console.warn("⚠️ Foreground listener error:", err.message);
    return () => {};
  }
}