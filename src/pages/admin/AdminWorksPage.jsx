import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { Badge, Card, EmptyState, PageContainer, SectionHeader, SelectField } from "../../components/ui";

const TONE = { CREATED:"gray", ASSIGNED:"blue", IN_PROGRESS:"yellow", CLOSED:"green", WORK_DONE:"purple" };

export default function AdminWorksPage() {
  const [cases, setCases] = useState([]);
  const [workers, setWorkers] = useState([]);
  const load = async () => {
    const [c, w] = await Promise.all([api.get("/admin/cases"), api.get("/admin/users/workers")]);
    setCases(c.data||[]); setWorkers(w.data||[]);
  };
  useEffect(() => { load(); }, []);
  const unassigned = useMemo(() => cases.filter(c => !c.workerId), [cases]);
  const assigned = useMemo(() => cases.filter(c => c.workerId), [cases]);

  const CaseCard = ({ c }) => (
    <div className={`rounded-xl border p-3.5 ${!c.workerId ? "border-amber-100 bg-amber-50/30" : "border-gray-100 bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-bold text-gray-900 text-sm">Case #{c.id}{c.serviceName ? ` — ${c.serviceName}` : ""}</p>
        </div>
        <Badge tone={TONE[c.status]||"gray"}>{c.status}</Badge>
      </div>
      <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">{c.description}</p>
      <p className="text-[10px] text-gray-400">📞 {c.customerPhone} {c.workerId ? `· Worker #${c.workerId}` : "· Unassigned"}</p>
      {!c.workerId && (
        <SelectField className="mt-2.5" onChange={async e => { if (!e.target.value) return; await api.post(`/cases/${c.id}/assign-worker?workerId=${e.target.value}`); load(); }}>
          <option value="">Assign to worker...</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </SelectField>
      )}
    </div>
  );

  return (
    <PageContainer title="Works" subtitle="Track orders and assign workers">
      <div className="grid gap-2 sm:grid-cols-2 text-center mb-2">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3"><p className="text-xl font-bold text-amber-700">{unassigned.length}</p><p className="text-xs text-amber-600 font-semibold">Unassigned</p></div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3"><p className="text-xl font-bold text-indigo-700">{assigned.length}</p><p className="text-xs text-indigo-600 font-semibold">Assigned</p></div>
      </div>
      <Card>
        <SectionHeader title="Unassigned Cases" />
        {unassigned.length === 0 ? <EmptyState icon="✅" title="All cases assigned!" /> : <div className="space-y-2">{unassigned.map(c => <CaseCard key={c.id} c={c} />)}</div>}
      </Card>
      <Card>
        <SectionHeader title="Assigned Cases" />
        {assigned.length === 0 ? <EmptyState icon="📋" title="No assigned cases" /> : <div className="space-y-2">{assigned.map(c => <CaseCard key={c.id} c={c} />)}</div>}
      </Card>
    </PageContainer>
  );
}
