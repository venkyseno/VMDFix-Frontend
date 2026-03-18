import { useEffect, useState } from "react";
import api from "../../api/api";
import { Card, PageContainer, PrimaryButton } from "../../components/ui";
import { Bell, Send, Plus, ToggleLeft, ToggleRight, Loader, Users, Zap, CheckCircle } from "lucide-react";

const EVENT_TYPES = [
  { value: "ORDER_CREATED",  label: "Order Created",    icon: "📦" },
  { value: "WORK_ASSIGNED",  label: "Worker Assigned",  icon: "👷" },
  { value: "WORK_STARTED",   label: "Work Started",     icon: "🔧" },
  { value: "WORK_COMPLETED", label: "Work Completed",   icon: "✅" },
  { value: "PAYMENT_SUCCESS",label: "Payment Done",     icon: "💳" },
];
const TARGET_TYPES = ["ALL_USERS", "CUSTOMERS", "WORKERS"];
const EMPTY_CONFIG = { eventType: "ORDER_CREATED", targetRole: "CUSTOMER", titleTemplate: "Your {{serviceName}} booking is confirmed!", bodyTemplate: "Booking #{{orderId}} has been created.", channel: "PUSH", isEnabled: true };
const EMPTY_CAMPAIGN = { title: "", body: "", targetType: "ALL_USERS" };

export default function AdminNotificationsPage() {
  const [tab, setTab]               = useState("campaigns"); // campaigns | configs | stats
  const [configs, setConfigs]       = useState([]);
  const [campaigns, setCampaigns]   = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(null);

  // Campaign form
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_CAMPAIGN);
  const [saving, setSaving]         = useState(false);

  // Config edit
  const [editCfg, setEditCfg]       = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.allSettled([
      api.get("/notifications/campaigns"),
      api.get("/notifications/configs"),
      api.get("/notifications/stats"),
    ]).then(([c, cf, s]) => {
      if (c.status  === "fulfilled") setCampaigns(c.value.data  || []);
      if (cf.status === "fulfilled") setConfigs(cf.value.data   || []);
      if (s.status  === "fulfilled") setStats(s.value.data      || {});
    }).finally(() => setLoading(false));
  };

  const sendCampaign = async (id) => {
    setSending(id);
    try {
      await api.post(`/notifications/campaigns/${id}/send`);
      loadAll();
    } catch(e) { alert("Send failed: " + (e.response?.data?.message || e.message)); }
    finally { setSending(null); }
  };

  const createCampaign = async () => {
    if (!form.title.trim() || !form.body.trim()) return alert("Title and body required");
    setSaving(true);
    try {
      await api.post("/notifications/campaigns", form);
      setForm(EMPTY_CAMPAIGN); setShowForm(false); loadAll();
    } catch(e) { alert("Failed: " + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const saveConfig = async (cfg) => {
    try {
      await api.post("/notifications/configs", cfg);
      setEditCfg(null); loadAll();
    } catch(e) { alert("Failed: " + (e.response?.data?.message || e.message)); }
  };

  const toggleConfig = (cfg) => saveConfig({ ...cfg, isEnabled: !cfg.isEnabled });

  return (
    <PageContainer title="🔔 Push Notifications" subtitle="Manage push notification campaigns and events">

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Devices", value: stats.deviceCount ?? "–", icon: <Users size={14} /> },
          { label: "Firebase", value: stats.firebaseReady ? "Ready" : "Not configured", icon: <Zap size={14} />, ok: stats.firebaseReady },
          { label: "Campaigns", value: campaigns.length, icon: <Send size={14} /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 flex items-center gap-2 shadow-sm">
            <div className={`rounded-lg p-1.5 ${s.ok === false ? "bg-red-50 text-red-500" : "bg-indigo-50 text-indigo-600"}`}>{s.icon}</div>
            <div>
              <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
              <p className={`text-xs font-extrabold ${s.ok === false ? "text-red-600" : "text-gray-900"}`}>{String(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Firebase not configured warning */}
      {stats.firebaseReady === false && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-800">⚠️ Firebase not configured</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Set <code className="bg-amber-100 px-1 rounded">FIREBASE_SERVICE_ACCOUNT_JSON</code> env var in Render to enable real push delivery.
            Campaigns will still be saved and sent in simulation mode.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-xl bg-gray-100 p-1">
        {[["campaigns","📢 Campaigns"],["configs","⚙️ Event Rules"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 rounded-lg text-xs font-bold py-1.5 transition-all ${tab===id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-indigo-500" size={24} />
        </div>
      ) : tab === "campaigns" ? (
        <>
          {/* Create campaign button */}
          <button onClick={() => setShowForm(v => !v)}
            className="mb-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-md active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#1a7a4a,#16213e)" }}>
            <Plus size={15} /> New Campaign
          </button>

          {/* Create form */}
          {showForm && (
            <Card className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">📢 Create Notification Campaign</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                    placeholder="e.g. 50% OFF today only!"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Message</label>
                  <textarea value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))}
                    rows={3} placeholder="e.g. Book any service today and get 50% off. Limited time offer!"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Target Audience</label>
                  <select value={form.targetType} onChange={e => setForm(f => ({...f, targetType: e.target.value}))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none">
                    {TARGET_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <PrimaryButton onClick={createCampaign} disabled={saving} className="flex-1">
                    {saving ? "Saving…" : "Save as Draft"}
                  </PrimaryButton>
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 py-2 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Campaign list */}
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No campaigns yet. Create one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-sm leading-tight">{c.title}</p>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "SENT" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{c.body}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>👥 {c.targetType?.replace("_"," ")}</span>
                      {c.recipientCount != null && <span>📤 {c.recipientCount} sent</span>}
                      {c.sentAt && <span>🕐 {new Date(c.sentAt).toLocaleDateString("en-IN")}</span>}
                    </div>
                  </div>
                  {c.status === "DRAFT" && (
                    <div className="border-t border-gray-50 px-4 py-2.5">
                      <button
                        onClick={() => sendCampaign(c.id)}
                        disabled={sending === c.id}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold text-white active:scale-95 transition-all"
                        style={{ background: "linear-gradient(135deg,#1a7a4a,#16213e)" }}>
                        {sending === c.id
                          ? <><Loader size={12} className="animate-spin" /> Sending…</>
                          : <><Send size={12} /> Send to All Devices</>}
                      </button>
                    </div>
                  )}
                  {c.status === "SENT" && (
                    <div className="border-t border-gray-50 px-4 py-2 flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle size={12} />
                      <span className="text-xs font-semibold">Delivered to {c.recipientCount ?? 0} devices</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Event configs tab */
        <>
          <p className="text-xs text-gray-500 mb-3">Configure automatic notifications triggered by order events. Use <code className="bg-gray-100 px-1 rounded">{"{{variableName}}"}</code> in templates.</p>

          {/* Add default configs button */}
          <button onClick={() => {
            EVENT_TYPES.forEach(ev => {
              api.post("/notifications/configs", {
                eventType: ev.value, targetRole: "CUSTOMER",
                titleTemplate: `Your ${ev.label.toLowerCase()} 🔔`,
                bodyTemplate: "Order #{{orderId}} — {{serviceName}}",
                channel: "PUSH", isEnabled: true
              }).catch(() => {});
            });
            setTimeout(loadAll, 500);
          }} className="mb-3 text-xs font-bold text-indigo-600 underline">
            + Add default event templates
          </button>

          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No event configs yet. Click "Add default event templates" above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {configs.map(cfg => (
                <div key={cfg.id} className="rounded-xl border border-gray-100 bg-white shadow-sm p-3">
                  {editCfg?.id === cfg.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{EVENT_TYPES.find(e=>e.value===cfg.eventType)?.icon||"📣"}</span>
                        <p className="font-bold text-gray-900 text-xs">{cfg.eventType}</p>
                      </div>
                      <input value={editCfg.titleTemplate} onChange={e=>setEditCfg(c=>({...c,titleTemplate:e.target.value}))}
                        placeholder="Title template" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" />
                      <textarea value={editCfg.bodyTemplate} onChange={e=>setEditCfg(c=>({...c,bodyTemplate:e.target.value}))}
                        rows={2} placeholder="Body template" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => saveConfig(editCfg)} className="flex-1 bg-indigo-600 text-white text-xs font-bold rounded-lg py-1.5">Save</button>
                        <button onClick={() => setEditCfg(null)} className="flex-1 border border-gray-200 text-xs font-semibold rounded-lg py-1.5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5">{EVENT_TYPES.find(e=>e.value===cfg.eventType)?.icon||"📣"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-gray-900">{cfg.eventType}</p>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{cfg.targetRole}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 font-semibold">{cfg.titleTemplate}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{cfg.bodyTemplate}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => toggleConfig(cfg)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                          {cfg.isEnabled ? <ToggleRight size={18} className="text-indigo-600" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => setEditCfg({...cfg})} className="text-xs text-gray-400 hover:text-indigo-600 font-semibold">Edit</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
