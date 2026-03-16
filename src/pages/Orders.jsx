import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Badge, EmptyState, PageContainer, PrimaryButton } from "../components/ui";
import { Package, Clock, CheckCircle, Loader, Phone, MapPin, User, Star, Calendar } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

const STATUS_MAP = {
  CREATED:     { tone: "gray",   icon: <Clock size={12} />,       label: "Pending",     desc: "Booking Created" },
  ASSIGNED:    { tone: "blue",   icon: <Loader size={12} />,      label: "Assigned",    desc: "Worker Assigned" },
  IN_PROGRESS: { tone: "yellow", icon: <Loader size={12} />,      label: "In Progress", desc: "Work Started" },
  WORK_DONE:   { tone: "purple", icon: <CheckCircle size={12} />, label: "Done",        desc: "Work Completed" },
  CLOSED:      { tone: "green",  icon: <CheckCircle size={12} />, label: "Closed",      desc: "Payment Completed" },
};

const STATUS_STEPS = ["CREATED", "ASSIGNED", "IN_PROGRESS", "WORK_DONE", "CLOSED"];
const STEP_LABELS  = ["Booking Created", "Worker Assigned", "Work Started", "Work Completed", "Payment Done"];

function StatusTimeline({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Order Timeline</p>
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= idx;
          const active = i === idx;
          return (
            <div key={step} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all
                  ${active ? "border-indigo-600 bg-indigo-600" : done ? "border-emerald-500 bg-emerald-500" : "border-gray-200 bg-white"}`}>
                  {done && !active && <CheckCircle size={10} className="text-white" />}
                  {active && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <p className={`text-[8px] font-semibold mt-1 text-center leading-tight max-w-[50px] truncate
                  ${active ? "text-indigo-600" : done ? "text-emerald-600" : "text-gray-300"}`}>
                  {STEP_LABELS[i]}
                </p>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 mb-4 ${i < idx ? "bg-emerald-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function tSvcName(name = "", t) {
  const key = (name || "").toLowerCase();
  if (key.includes("plumber"))        return t("svc_plumber", name);
  if (key.includes("electric"))       return t("svc_electrician", name);
  if (key.includes("carpenter"))      return t("svc_carpenter", name);
  if (key.includes("mason"))          return t("svc_mason", name);
  if (key.includes("paint"))          return t("svc_painter", name);
  if (key.includes("ac") || key.includes("air condition")) return t("svc_ac_repair", name);
  if (key.includes("clean"))          return t("svc_cleaner", name);
  if (key.includes("pest"))           return t("svc_pest_control", name);
  if (key.includes("general"))        return t("svc_general", name);
  return name || "";
}

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

  const handleCall = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  return (
    <PageContainer title={t("my_orders_title")} subtitle={t("track_service_bookings")}>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse h-40" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8">
          <EmptyState icon="📦" title={t("no_orders")} action={<PrimaryButton onClick={() => navigate("/")}>{t("browse_services")}</PrimaryButton>} />
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {orders.map((order) => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.CREATED;
            return (
              <div key={order.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-start gap-3 p-4 pb-3">
                  {order.serviceImageUrl ? (
                    <img src={order.serviceImageUrl} alt={order.serviceName || "Service"}
                      className="h-12 w-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-indigo-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {tSvcName(order.serviceName || ("Service #" + order.id), t)}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{t("order_hash")}{order.id}</p>
                      </div>
                      <Badge tone={s.tone}>
                        <span className="flex items-center gap-1">{s.icon}{s.label}</span>
                      </Badge>
                    </div>
                    {order.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{order.description}</p>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="px-4 pb-3 space-y-2">
                  {/* Booking Address */}
                  {order.bookingAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500 line-clamp-1">{order.bookingAddress}</p>
                    </div>
                  )}

                  {/* Booked On */}
                  {order.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                      </p>
                    </div>
                  )}

                  {/* Worker Details */}
                  {order.workerId && (
                    <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(order.workerName || "W").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-900">{order.workerName || "Worker Assigned"}</p>
                          {order.workerPhone && (
                            <p className="text-[10px] text-indigo-600 font-medium">{order.workerPhone}</p>
                          )}
                        </div>
                      </div>
                      {order.workerPhone && (
                        <button
                          onClick={() => handleCall(order.workerPhone)}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                          title={`Call ${order.workerName}`}
                        >
                          <Phone size={11} />
                          Call
                        </button>
                      )}
                    </div>
                  )}

                  {/* Amount */}
                  {order.serviceAmount && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-400 font-medium">{t("amount")}</span>
                      <span className="text-sm font-bold text-gray-900">₹{order.serviceAmount}</span>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="px-4 pb-4">
                  <StatusTimeline status={order.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
