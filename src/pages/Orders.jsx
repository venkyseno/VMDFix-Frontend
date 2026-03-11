import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Badge, EmptyState, PageContainer, PrimaryButton } from "../components/ui";
import { Package, Clock, CheckCircle, Loader } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

const STATUS = {
  CREATED:     { tone: "gray",   icon: <Clock size={12} />,       label: "Pending" },
  ASSIGNED:    { tone: "blue",   icon: <Loader size={12} />,      label: "Assigned" },
  IN_PROGRESS: { tone: "yellow", icon: <Loader size={12} />,      label: "In Progress" },
  WORK_DONE:   { tone: "purple", icon: <CheckCircle size={12} />, label: "Done" },
  CLOSED:      { tone: "green",  icon: <CheckCircle size={12} />, label: "Closed" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) return navigate("/login");
    api.get(`/cases/user/${user.id}`)
      .then(r => setOrders(r.data?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer title={t("my_orders_title")} subtitle={t("track_service_bookings")}>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse h-24" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8">
          <EmptyState icon="📦" title={t("no_orders")} action={<PrimaryButton onClick={() => navigate("/")}>{t("browse_services")}</PrimaryButton>} />
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {orders.map((order) => {
            const s = STATUS[order.status] || STATUS.CREATED;
            return (
              <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t("order_hash")}{order.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{order.description}</p>
                    </div>
                  </div>
                  <Badge tone={s.tone}>
                    <span className="flex items-center gap-1">{s.icon}{s.label}</span>
                  </Badge>
                </div>
                {order.serviceAmount && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">{t("amount")}</span>
                    <span className="text-sm font-bold text-gray-900">₹{order.serviceAmount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
