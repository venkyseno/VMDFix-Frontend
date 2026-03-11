import { useEffect, useState } from "react";
import api from "../../api/api";
import { Badge, Card, DangerButton, EmptyState, PageContainer, PrimaryButton, SectionHeader, SecondaryButton } from "../../components/ui";
import { CheckCircle, XCircle, User, Briefcase } from "lucide-react";

export default function AdminWorkersPage() {
  const [applications, setApplications] = useState([]);
  const [workers, setWorkers] = useState([]);

  const load = async () => {
    const [a, w] = await Promise.all([api.get("/admin/worker-applications"), api.get("/admin/users/workers")]);
    setApplications(a.data || []);
    setWorkers(w.data || []);
  };

  useEffect(() => { load(); }, []);
  const pending = applications.filter(x => x.status === "PENDING");

  return (
    <PageContainer title="Workers" subtitle="Approve applications and manage worker accounts">
      {/* Pending Applications */}
      <Card>
        <SectionHeader title="Pending Applications" subtitle={`${pending.length} awaiting review`} />
        {pending.length === 0 ? (
          <EmptyState icon="✅" title="All clear!" description="No pending worker applications." />
        ) : (
          <div className="space-y-2">
            {pending.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={15} className="text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{a.workerType}</p>
                  <p className="text-xs text-gray-500">{a.experienceLevel} · {a.mobile}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={async () => { await api.post(`/admin/worker-applications/${a.id}/approve`); load(); }}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle size={12} />Approve
                  </button>
                  <button onClick={async () => { await api.post(`/admin/worker-applications/${a.id}/reject`); load(); }}
                    className="flex items-center gap-1 rounded-xl bg-red-50 border border-red-100 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">
                    <XCircle size={12} />Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Existing Workers */}
      <Card>
        <SectionHeader title="All Workers" subtitle={`${workers.length} registered`} />
        {workers.length === 0 ? (
          <EmptyState icon="👷" title="No workers registered" />
        ) : (
          <div className="space-y-2">
            {workers.map(w => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0 text-sm">
                  {(w.name||"W").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{w.name}</p>
                  <p className="text-xs text-gray-400">{w.mobile}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={async () => { const name = prompt("Name", w.name); if(!name) return; await api.put(`/admin/users/workers/${w.id}`, { ...w, name }); load(); }}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:text-indigo-600 text-xs transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={async () => { if(!confirm("Delete worker?")) return; await api.delete(`/admin/users/workers/${w.id}`); load(); }}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-red-100 bg-white hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
