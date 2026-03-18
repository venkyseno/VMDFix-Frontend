import { useEffect, useState } from 'react';

/** In-app toast shown when a push arrives while app is open */
function PushToast({ title, body, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-xs w-full rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#16213e,#1a7a4a)', animation: 'slideIn 0.3s ease' }}
    >
      <div className="flex items-start gap-3 p-4 pr-10 relative">
        <img src="/icon.jpeg" alt="VMDFix" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-extrabold text-sm leading-tight">{title}</p>
          {body && <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{body}</p>}
        </div>
        <button onClick={onClose}
          className="absolute top-2 right-2 text-white/50 hover:text-white text-lg leading-none p-1">
          ×
        </button>
      </div>
    </div>
  );
}

/** Lazy-loads FCM only after user logs in AND firebase package is available */
async function tryRegisterFCM(userId) {
  try {
    const { requestAndRegisterToken } = await import('../utils/fcm.js');
    await requestAndRegisterToken(userId);
  } catch (e) {
    // Firebase SDK not installed or not configured — silently skip
    if (!e.message?.includes('firebase')) {
      console.warn('FCM setup skipped:', e.message);
    }
  }
}

async function tryListenForeground(callback) {
  try {
    const { onForegroundMessage } = await import('../utils/fcm.js');
    return onForegroundMessage(callback);
  } catch {
    return () => {};
  }
}

export default function PushNotificationProvider({ children }) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.id) return;

    // Lazy-load FCM — won't crash if firebase package is missing
    tryRegisterFCM(user.id);

    let unsub = () => {};
    tryListenForeground((payload) => {
      const { title, body } = payload.notification || {};
      if (title) setToast({ title, body });
    }).then(fn => { unsub = fn; });

    return () => unsub();
  }, []);

  return (
    <>
      {children}
      {toast && (
        <PushToast
          title={toast.title}
          body={toast.body}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
