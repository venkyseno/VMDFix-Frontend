import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import {
  Avatar, Card, EmptyState, InputField, PageContainer,
  PrimaryButton, SecondaryButton, SelectField, DangerButton, Badge
} from "../components/ui";
import {
  ChevronRight, MapPin, Package, Tag, Wallet, Briefcase,
  ShieldCheck, LogOut, LogIn, Plus, X, Pencil, Trash2, Star
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

const workerTypes = ["Plumber","Electrician","Carpenter","Painter","Other"];
const INIT_ADDR = { addressLine:"", city:"", landmark:"", primaryAddress:false };
const INIT_WORKER = { workerType:"Plumber", experienceLevel:"BEGINNER", chargePerDay:"", mobile:"" };

const parseUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw || raw === "undefined" || raw === "null") return null;
  try { return JSON.parse(raw); } catch { localStorage.removeItem("user"); return null; }
};

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(() => parseUser());
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(INIT_ADDR);
  const [workerForm, setWorkerForm] = useState(INIT_WORKER);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const [savingWorker, setSavingWorker] = useState(false);
  const [view, setView] = useState("profile");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sync = () => setUser(parseUser());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const isLoggedIn = !!user?.id;
  const displayName = useMemo(() => (!user ? "Guest" : user.name || "User"), [user]);
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const requireLogin = cb => { if (!isLoggedIn) return navigate("/login"); cb(); };

  const loadAddresses = async () => {
    if (!user?.id) return;
    setAddrLoading(true);
    try { const { data } = await api.get(`/user-flow/addresses/${user.id}`); setAddresses(data || []); }
    catch { setAddresses([]); } finally { setAddrLoading(false); }
  };

  const handleOpenAddresses = () => {
    requireLogin(async () => { setView("addresses"); await loadAddresses(); });
  };

  const handleAddAddress = async () => {
    if (!addressForm.addressLine.trim()) return showToast("Address line is required");
    if (!addressForm.city.trim()) return showToast("City is required");
    try {
      await api.post("/user-flow/addresses", { ...addressForm, userId: user.id });
      setAddressForm(INIT_ADDR); setShowAddAddress(false); showToast("Address saved!"); loadAddresses();
    } catch (e) { showToast(e?.response?.data || "Failed to add address"); }
  };

  const handleDeleteAddress = async id => {
    if (!confirm("Delete this address?")) return;
    try { await api.delete(`/user-flow/addresses/${id}`); showToast("Address deleted"); loadAddresses(); }
    catch (e) { showToast(e?.response?.data || "Failed to delete"); }
  };

  const handleSetPrimary = async id => {
    try { await api.put(`/user-flow/addresses/${id}/primary`, { userId: user.id }); showToast("Primary address updated!"); loadAddresses(); }
    catch (e) { showToast(e?.response?.data?.message || e?.response?.data || "Failed to set primary"); }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress?.addressLine?.trim()) return showToast("Address line required");
    if (!editingAddress?.city?.trim()) return showToast("City required");
    try { await api.put(`/user-flow/addresses/${editingAddress.id}`, { ...editingAddress, userId: user.id }); setEditingAddress(null); showToast("Address updated!"); loadAddresses(); }
    catch (e) { showToast(e?.response?.data || "Failed to update"); }
  };

  const handleWorkerSubmit = async () => {
    if (!workerForm.mobile.trim()) return showToast("Mobile is required");
    setSavingWorker(true);
    try { await api.post("/user-flow/worker-apply", { ...workerForm, userId: user.id }); showToast("Application submitted!"); setWorkerForm(INIT_WORKER); setShowWorkerForm(false); }
    catch (e) { showToast(e?.response?.data || "Submission failed"); } finally { setSavingWorker(false); }
  };

  const handleLogout = () => { localStorage.removeItem("user"); setUser(null); setView("profile"); navigate("/"); };

  if (view === "addresses") {
    return (
      <PageContainer title={t("manage_addresses")} subtitle={t("manage_delivery")}>
        {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-semibold shadow-xl animate-slide-up whitespace-nowrap">{toast}</div>}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-medium">{addresses.length} {addresses.length !== 1 ? t("saved_addresses_plural") : t("saved_addresses")}</span>
          <PrimaryButton onClick={() => setShowAddAddress(v => !v)} className="text-xs px-3 py-2"><Plus size={13} />{showAddAddress ? t("cancel") : t("add_new")}</PrimaryButton>
        </div>
        {showAddAddress && (
          <Card className="border-indigo-100 animate-scale-in">
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t("new_address")}</h3>
            <div className="space-y-3">
              <InputField label={t("address_line")} placeholder={t("address_placeholder")} value={addressForm.addressLine} onChange={e => setAddressForm({ ...addressForm, addressLine: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label={t("city")} placeholder={t("city")} value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                <InputField label={t("landmark")} placeholder={t("landmark_placeholder")} value={addressForm.landmark} onChange={e => setAddressForm({ ...addressForm, landmark: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addressForm.primaryAddress} onChange={e => setAddressForm({ ...addressForm, primaryAddress: e.target.checked })} className="rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-700 font-medium">{t("set_primary")}</span>
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <PrimaryButton onClick={handleAddAddress}>{t("save_address")}</PrimaryButton>
              <SecondaryButton onClick={() => setShowAddAddress(false)}>{t("cancel")}</SecondaryButton>
            </div>
          </Card>
        )}
        {addrLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse h-24" />)}</div>
        ) : addresses.length === 0 ? (
          <Card><EmptyState icon="📍" title={t("no_addresses")} description={t("no_addresses_desc")} /></Card>
        ) : (
          <div className="space-y-3 stagger-children">
            {addresses.map((addr, idx) => (
              <div key={addr.id} className={`rounded-2xl border p-4 transition-all ${addr.primaryAddress ? "primary-address-card" : "bg-white border-gray-100"}`}>
                {editingAddress?.id === addr.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-600">{t("edit_address")} #{idx+1}</span>
                      <button onClick={() => setEditingAddress(null)}><X size={14} className="text-gray-400" /></button>
                    </div>
                    <InputField label={t("address_line")} value={editingAddress.addressLine||""} onChange={e => setEditingAddress({ ...editingAddress, addressLine: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label={t("city")} value={editingAddress.city||""} onChange={e => setEditingAddress({ ...editingAddress, city: e.target.value })} />
                      <InputField label={t("landmark")} value={editingAddress.landmark||""} onChange={e => setEditingAddress({ ...editingAddress, landmark: e.target.value })} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <PrimaryButton onClick={handleUpdateAddress} className="text-xs px-3 py-2">{t("save")}</PrimaryButton>
                      <SecondaryButton onClick={() => setEditingAddress(null)} className="text-xs px-3 py-2">{t("cancel")}</SecondaryButton>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${addr.primaryAddress ? "bg-indigo-100" : "bg-gray-100"}`}>
                          <MapPin size={14} className={addr.primaryAddress ? "text-indigo-600" : "text-gray-500"} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-500">{t("address_label")} {idx+1}</span>
                            {addr.primaryAddress && <Badge tone="indigo"><Star size={9} className="mr-1 fill-indigo-600" />{t("primary")}</Badge>}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{addr.addressLine}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{addr.city}{addr.landmark ? ` · Near ${addr.landmark}` : ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-100/80">
                      {!addr.primaryAddress && (
                        <button onClick={() => handleSetPrimary(addr.id)} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                          <Star size={10} /> {t("set_as_primary")}
                        </button>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <button onClick={() => setEditingAddress(addr)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <SecondaryButton onClick={() => { setView("profile"); navigate("/profile"); }} className="mt-2">{t("back_to_profile")}</SecondaryButton>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-semibold shadow-xl animate-slide-up whitespace-nowrap">{toast}</div>}
      <div className="rounded-2xl gradient-primary p-5 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</div>
          <div className="flex-1">
            <h2 className="text-base font-bold">{displayName}</h2>
            <p className="text-xs text-white/70 font-medium">{user?.mobile || t("not_logged_in")}</p>
            <span className="mt-1.5 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">{user?.role || "GUEST"}</span>
          </div>
          {isLoggedIn && (
            <button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title={t("logout")}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 stagger-children">
        <ProfileMenuItem icon={<Package size={16} />} label={t("my_orders")} desc={t("track_bookings")} onClick={() => requireLogin(() => navigate("/profile/orders"))} color="bg-blue-50 text-blue-600" />
        <ProfileMenuItem icon={<MapPin size={16} />} label={t("addresses")} desc={t("manage_locations")} onClick={handleOpenAddresses} color="bg-emerald-50 text-emerald-600" />
        <ProfileMenuItem icon={<Tag size={16} />} label={t("coupons")} desc={t("discounts_offers")} onClick={() => requireLogin(() => navigate("/profile/coupons"))} color="bg-amber-50 text-amber-600" />
        <ProfileMenuItem icon={<Wallet size={16} />} label={t("wallet")} desc={t("balance_history")} onClick={() => requireLogin(() => navigate("/profile/wallet"))} color="bg-purple-50 text-purple-600" />
        {user?.role === "WORKER" && <ProfileMenuItem icon={<Briefcase size={16} />} label={t("worker_dashboard")} desc={t("your_jobs")} onClick={() => navigate("/worker/dashboard")} color="bg-indigo-50 text-indigo-600" />}
        {user?.role === "ADMIN" && <ProfileMenuItem icon={<ShieldCheck size={16} />} label={t("admin_panel")} desc={t("manage_platform")} onClick={() => navigate("/admin/dashboard")} color="bg-rose-50 text-rose-600" />}
      </div>
      {user?.role === "USER" && (
        <div>
          <button onClick={() => setShowWorkerForm(v => !v)} className="w-full rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center hover:bg-indigo-50 transition-colors">
            <p className="text-sm font-bold text-indigo-700">{showWorkerForm ? t("close_application") : t("work_with_us")}</p>
            <p className="text-xs text-indigo-500 mt-0.5">{t("apply_professional")}</p>
          </button>
          {showWorkerForm && (
            <Card className="border-indigo-100 animate-scale-in mt-3">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t("worker_application")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label={t("type")} value={workerForm.workerType} onChange={e => setWorkerForm({ ...workerForm, workerType: e.target.value })}>
                  {workerTypes.map(wt => <option key={wt}>{wt}</option>)}
                </SelectField>
                <SelectField label={t("experience")} value={workerForm.experienceLevel} onChange={e => setWorkerForm({ ...workerForm, experienceLevel: e.target.value })}>
                  <option>BEGINNER</option><option>INTERMEDIATE</option><option>PROFESSIONAL</option>
                </SelectField>
                <InputField label={t("charge_per_day")} placeholder={t("charge_placeholder")} value={workerForm.chargePerDay} onChange={e => setWorkerForm({ ...workerForm, chargePerDay: e.target.value })} />
                <InputField label={t("mobile")} placeholder={t("mobile_number")} value={workerForm.mobile} onChange={e => setWorkerForm({ ...workerForm, mobile: e.target.value })} />
              </div>
              <PrimaryButton className="mt-4 w-full" onClick={handleWorkerSubmit} disabled={savingWorker}>
                {savingWorker ? t("submitting") : t("submit_application")}
              </PrimaryButton>
            </Card>
          )}
        </div>
      )}
      {!isLoggedIn && (
        <button onClick={() => navigate("/login")} className="w-full rounded-2xl gradient-primary p-4 text-center text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity">
          <LogIn size={14} className="inline mr-1.5" />{t("login_signup")}
        </button>
      )}
    </PageContainer>
  );
}

function ProfileMenuItem({ icon, label, desc, onClick, color }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 text-left shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900">{label}</p>
        <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
      </div>
      <ChevronRight size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
    </button>
  );
}
