/**
 * FCM Push Notification Utilities
 *
 * SETUP INSTRUCTIONS:
 * 1. Run: npm install firebase
 * 2. Go to Firebase Console → Project Settings → General → Add Web App
 * 3. Replace the firebaseConfig values below
 * 4. Go to Cloud Messaging → Web Push certificates → copy VAPID key below
 * 5. In public/firebase-messaging-sw.js, also fill in the same config
 * 6. Set FIREBASE_SERVICE_ACCOUNT_JSON env var in Render (backend)
 */

import api from '../api/api';

// ⚠️  Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyD76jLLAC7ev-HwfCjN3ti_UvBNk2tmKxE",
  authDomain: "vmdfix.firebaseapp.com",
  projectId: "vmdfix",
  storageBucket: "vmdfix.firebasestorage.app",
  messagingSenderId: "129434529590",
  appId: "1:129434529590:web:5b1aa325685556f89e8d97",
};


const VAPID_KEY = "BHj2bBrQbSVWSoDy7-wiTKGgHL4zqQVZaCuLBQOMh4Pu10uB6p4FP0Dcxhta8IZtd7_BGPAN29jQ71u4xNN95_w";

let _messaging = null;

async function getMessagingInstance() {
  if (_messaging) return _messaging;
  const { initializeApp, getApps } = await import('firebase/app');
  const { getMessaging } = await import('firebase/messaging');
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _messaging = getMessaging(app);
  return _messaging;
}

export async function requestAndRegisterToken(userId) {
  try {
    if (!('Notification' in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const { getToken } = await import('firebase/messaging');
    const messaging = await getMessagingInstance();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token && userId) {
      await api.post('/notifications/token', {
        userId: String(userId),
        fcmToken: token,
        platform: 'WEB',
      });
      localStorage.setItem('fcm_token', token);
    }
    return token;
  } catch (err) {
    console.warn('FCM registration:', err.message);
    return null;
  }
}

export async function onForegroundMessage(callback) {
  try {
    const { onMessage } = await import('firebase/messaging');
    const messaging = await getMessagingInstance();
    return onMessage(messaging, callback);
  } catch {
    return () => {};
  }
}
