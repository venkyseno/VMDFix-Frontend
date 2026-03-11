import { useEffect, useState } from "react";
import api from "../../api/api";
import { Badge, Card, EmptyState, PageContainer, PrimaryButton, SectionHeader } from "../../components/ui";
import { CheckCircle, XCircle, Wallet } from "lucide-react";

const TONE = { PENDING:"yellow", APPROVED:"green", REJECTED:"red" };

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = useState("PENDING");
  const [withdrawals, setWithdrawals] = useState([]);
  const admin = JSON.parse(localStorage.getItem("user")||"null");

  const load = async (s = status) => { const r = await api.get(`/admin/withdrawals?status=${s}`); setWithdrawals(r.data||[]); };
  useEffect(() => { load(); }, [status]);

  return (
    <PageContainer title="Withdrawals" subtitle="Review and process cashout requests">
      <div className="flex rounded-xl bg-gray-100 p-1">
        {["PENDING","APPROVED","REJECTED"].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${status===s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            {s}
          </button>
        ))}
      </div>

      <Card>
        <SectionHeader title={`${status} Requests`} subtitle={`${withdrawals.length} total`} />
        {withdrawals.length === 0 ? (
          <EmptyState icon="💳" title={`No ${status.toLowerCase()} withdrawals`} />
        ) : (
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div key={w.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Wallet size={15} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">User #{w.userId}</p>
                      <p className="text-xs text-indigo-600 font-bold">₹{w.amount}</p>
                    </div>
                  </div>
                  <Badge tone={TONE[w.status]||"gray"}>{w.status}</Badge>
                </div>
                {status === "PENDING" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={async () => { await api.post(`/admin/withdrawals/${w.id}/approve?adminId=${admin?.id}`); load(); }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                      <CheckCircle size={12} />Approve
                    </button>
                    <button onClick={async () => { const reason = prompt("Rejection reason"); if(!reason) return; await api.post(`/admin/withdrawals/${w.id}/reject?adminId=${admin?.id}`, { reason }); load(); }}
                      className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">
                      <XCircle size={12} />Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
