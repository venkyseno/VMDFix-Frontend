import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Wallet from "./pages/Wallet";
import Withdraw from "./pages/Withdraw";
import AskAI from "./pages/AskAI";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import AdminRoute from "./components/AdminRoute";
import WorkerRoute from "./components/WorkerRoute";
import Coupons from "./pages/Coupons";
import AdminBannersPage from "./pages/admin/AdminBannersPage";
import AdminWorkersPage from "./pages/admin/AdminWorkersPage";
import AdminWorksPage from "./pages/admin/AdminWorksPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminQuickServicesPage from "./pages/admin/AdminQuickServicesPage";
import OtherServiceDetail from "./pages/OtherServiceDetail";
import AdminOurServicesPage from "./pages/admin/AdminOurServicesPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";

import { useEffect } from "react";

// ✅ NEW IMPORT (correct one)
import { onForegroundMessage } from "./utils/fcm";

function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#16213e", margin: 0 }}>Page Not Found</h1>
      <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ marginTop: 8, background: "linear-gradient(135deg,#1a7a4a,#16213e)", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
        Go to Home
      </a>
    </div>
  );
}

function App() {

  // ✅ NEW LISTENER (replaces old one)
  useEffect(() => {
  let unsubscribeFn = null;

  onForegroundMessage((payload) => {
    console.log("📩 Foreground message:", payload);

    const title = payload.data?.title || payload.notification?.title;
    const body = payload.data?.body || payload.notification?.body;

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }).then((unsubscribe) => {
    unsubscribeFn = unsubscribe;
  });

  return () => {
    if (typeof unsubscribeFn === "function") {
      unsubscribeFn();
    }
  };
}, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/orders" element={<Orders />} />
          <Route path="/profile/wallet" element={<Wallet />} />
          <Route path="/profile/withdraw" element={<Withdraw />} />
          <Route path="/profile/coupons" element={<Coupons />} />
          <Route path="/other-services/:id" element={<OtherServiceDetail />} />
          <Route path="/ask-ai" element={<AskAI />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/banners" element={<AdminRoute><AdminBannersPage /></AdminRoute>} />
          <Route path="/admin/workers" element={<AdminRoute><AdminWorkersPage /></AdminRoute>} />
          <Route path="/admin/works" element={<AdminRoute><AdminWorksPage /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
          <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawalsPage /></AdminRoute>} />
          <Route path="/admin/quick-services" element={<AdminRoute><AdminQuickServicesPage /></AdminRoute>} />
          <Route path="/admin/our-services" element={<AdminRoute><AdminOurServicesPage /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />
          <Route path="/worker/dashboard" element={<WorkerRoute><WorkerDashboard /></WorkerRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;