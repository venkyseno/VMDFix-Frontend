import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Badge, EmptyState, PageContainer, StatCard } from "../components/ui";
import { Play, CheckCheck, Briefcase, Phone } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

const TONE = { CREATED:"gray", ASSIGNED:"blue", IN_PROGRESS:"yellow", CLOSED:"green", WORK_DONE:"purple" };

export default function WorkerDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earned, setEarned] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  useEffect(() => { if (!user) return navigate("/login"); fetchCases(); }, []);
  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/worker/cases/${user.id}`);
      const d = data.data ?? [];
      setCases(d);
      setEarned(d.filter(c => c.status === "CLOSED").reduce((s, c) => s + Number(c.serviceAmount || 0), 0));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const startWork = async id => { try { await api.post(`/cases/${id}/start-work?workerId=${user.id}`); fetchCases(); } catch (e) { alert(e.response?.data || "Failed"); } };
  const completeWork = async id => { try { await api.post(`/cases/${id}/complete-work?workerId=${user.id}`); fetchCases(); } catch (e) { alert(e.response?.data || "Failed"); } };
  return (
    <PageContainer title={`${t("worker_hello")}, ${user?.name || "Worker"} 👋`} subtitle={t("worker_assigned_jobs")}>
      <div className="grid grid-cols-2 gap-3">
        <StatCard title={t("jobs_done")} value={cases.filter(c => c.status === "CLOSED").length} icon={<CheckCheck size={16} />} tone="emerald" />
        <StatCard title={t("earned")} value={`₹${earned}`} icon={<Briefcase size={16} />} tone="indigo" />
      </div>
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}</div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8">
          <EmptyState icon="🔧" title={t("no_jobs")} description={t("no_jobs_desc")} />
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {cases.map(c => (
            <div key={c.id} className={`rounded-2xl border p-4 bg-white shadow-sm ${c.status === "IN_PROGRESS" ? "border-amber-200" : "border-gray-100"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-gray-900 text-sm">{t("case_hash")}{c.id} {c.serviceName ? `— ${c.serviceName}` : ""}</p>
                <Badge tone={TONE[c.status] || "gray"}>{c.status}</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-1 line-clamp-2">{c.description}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-3"><Phone size={11} /><span>{c.customerPhone}</span></div>
              <div className="flex gap-2">
                {c.status === "ASSIGNED" && (
                  <button onClick={() => startWork(c.id)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors active:scale-95">
                    <Play size={11} />{t("start_work")}
                  </button>
                )}
                {c.status === "IN_PROGRESS" && (
                  <button onClick={() => completeWork(c.id)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors active:scale-95">
                    <CheckCheck size={11} />{t("mark_complete")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
