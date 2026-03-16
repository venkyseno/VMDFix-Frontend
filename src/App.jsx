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

function App() {
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
          <Route path="/worker/dashboard" element={<WorkerRoute><WorkerDashboard /></WorkerRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
