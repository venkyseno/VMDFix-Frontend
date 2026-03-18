import { useEffect, useState } from "react";
import api from "../api/api";
import { NavCardLink, StatCard } from "../components/ui";
import { LayoutGrid, Image, Wrench, Users, Tag, CreditCard, Bell } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, services: 0, users: 0, revenue: 0 });
  const { t } = useTranslation();
  useEffect(() => {
    api.get("/admin/cases").then(r => {
      const cases = r.data || [];
      setStats(s => ({ ...s, orders: cases.length, revenue: cases.filter(c => c.status === "CLOSED").reduce((acc, c) => acc + Number(c.serviceAmount || 0), 0) }));
    }).catch(() => {});
    api.get("/admin/other-services").then(r => setStats(s => ({ ...s, services: (r.data || []).length }))).catch(() => {});
    api.get("/admin/users/workers").then(r => setStats(s => ({ ...s, users: (r.data || []).length }))).catch(() => {});
  }, []);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{t("admin_dashboard")}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{t("manage_platform_desc")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-children">
        <StatCard title={t("orders")} value={stats.orders} icon={<LayoutGrid size={16} />} tone="indigo" />
        <StatCard title={t("services")} value={stats.services} icon={<Wrench size={16} />} tone="blue" />
        <StatCard title={t("workers")} value={stats.users} icon={<Users size={16} />} tone="emerald" />
        <StatCard title={t("revenue")} value={`₹${stats.revenue}`} icon={<CreditCard size={16} />} tone="amber" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 stagger-children">
        <NavCardLink to="/admin/banners" icon={<Image size={16} />} label={t("banners_services")} desc={t("publish_banners")} />
        <NavCardLink to="/admin/works" icon={<LayoutGrid size={16} />} label={t("works_orders")} desc={t("assign_monitor")} />
        <NavCardLink to="/admin/workers" icon={<Users size={16} />} label={t("workers")} desc={t("approve_manage")} />
        <NavCardLink to="/admin/coupons" icon={<Tag size={16} />} label={t("coupons")} desc={t("create_discounts")} />
        <NavCardLink to="/admin/withdrawals" icon={<CreditCard size={16} />} label="Withdrawals" desc={t("process_payouts")} />
        <NavCardLink to="/admin/notifications" icon={<Bell size={16} />} label="Push Notifications" desc="Send campaigns to all users" />
      </div>
    </div>
  );
}
