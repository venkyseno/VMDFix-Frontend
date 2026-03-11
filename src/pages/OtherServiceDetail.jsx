import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/api";
import { PageContainer, PrimaryButton, EmptyState, Card } from "../components/ui";
import { Minus, Plus, ShoppingCart, CheckCircle } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function OtherServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [service, setService] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [svc, itms] = await Promise.allSettled([
          api.get(`/config/other-services/${id}`),
          api.get(`/config/other-services/${id}/items`),
        ]);
        if (svc.status === "fulfilled") setService(svc.value.data);
        if (itms.status === "fulfilled") setItems(itms.value.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const adj = (itemId, delta) => {
    setCart(prev => {
      const newQty = Math.max(0, (prev[itemId] || 0) + delta);
      if (newQty === 0) { const next = { ...prev }; delete next[itemId]; return next; }
      return { ...prev, [itemId]: newQty };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = items.find(i => i.id === Number(itemId));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);

  const handleConfirm = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return navigate("/login");
    if (!cartCount) return;
    setOrdering(true);
    try {
      const orderItems = Object.entries(cart).map(([itemId, qty]) => ({
        itemId: Number(itemId),
        quantity: qty,
      }));
      await api.post("/other-service-orders", {
        userId: user.id,
        otherServiceId: Number(id),
        items: orderItems,
      });
      setOrdered(true);
      setTimeout(() => navigate("/profile/orders"), 1500);
    } catch (e) {
      console.error("Order failed:", e);
      alert("Order failed: " + (e.response?.data?.message || e.response?.data || e.message));
    } finally { setOrdering(false); }
  };

  if (ordered) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">{t("order_confirmed")}</h2>
        <p className="text-sm text-gray-400 mt-1">{t("redirecting")}</p>
      </div>
    </div>
  );

  if (loading) return (
    <PageContainer><div className="h-64 bg-white rounded-2xl animate-pulse" /></PageContainer>
  );

  if (!service) return (
    <PageContainer>
      <Card className="text-center py-12">
        <p className="text-2xl mb-2">🔍</p>
        <h2 className="text-base font-bold text-gray-900">{t("service_not_found")}</h2>
      </Card>
    </PageContainer>
  );

  return (
    <PageContainer>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} className="w-full aspect-[16/7] object-cover" />
        ) : (
          <div className="w-full aspect-[16/7] gradient-primary flex items-center justify-center text-5xl">🛒</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-bold text-white">{service.name}</h1>
          {service.menuDetails && <p className="text-sm text-white/70 mt-0.5 line-clamp-2">{service.menuDetails}</p>}
          <p className="text-sm font-bold text-white/90 mt-1">{t("starting_from")} {service.startPrice || "₹0"}</p>
        </div>
      </div>

      {/* Items */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">{t("select_services")}</h2>
        {items.length === 0 ? (
          <Card>
            <EmptyState icon="📋" title={t("no_items")} />
          </Card>
        ) : (
          <div className="space-y-2.5 stagger-children">
            {items.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id} className={`rounded-2xl border p-3.5 bg-white flex items-center justify-between shadow-sm transition-all ${qty > 0 ? "border-indigo-200 shadow-indigo-50" : "border-gray-100"}`}>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">₹{item.price}</p>
                    {item.availableQuantity > 0 && (
                      <p className="text-[10px] text-gray-400">Available: {item.availableQuantity}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {qty > 0 ? (
                      <>
                        <button onClick={() => adj(item.id, -1)} className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-indigo-600">{qty}</span>
                        <button onClick={() => adj(item.id, 1)} className="h-8 w-8 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                          <Plus size={13} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => adj(item.id, 1)} className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all">
                        <Plus size={12} /> {t("add")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart summary */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-20">
          <div className="mx-auto max-w-screen-sm">
            <button
              onClick={handleConfirm}
              disabled={ordering}
              className="w-full flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 shadow-lg hover:bg-gray-800 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 flex items-center justify-center rounded-xl bg-white/10">
                  <ShoppingCart size={14} className="text-white" />
                </div>
                <span className="text-white font-bold text-sm">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
              </div>
              <span className="text-white font-bold text-sm">
                {ordering ? "Placing..." : `${t("confirm_order")} · ₹${cartTotal}`}
              </span>
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
