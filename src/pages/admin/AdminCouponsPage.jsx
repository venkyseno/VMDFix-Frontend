import { useEffect, useState } from "react";
import api from "../../api/api";
import { Card, EmptyState, InputField, PageContainer, PrimaryButton, SectionHeader, SecondaryButton, TextAreaField } from "../../components/ui";
import { Plus, Tag } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code:"", message:"", active:true });
  const [showForm, setShowForm] = useState(false);
  const load = async () => { const r = await api.get("/admin/coupons"); setCoupons(r.data||[]); };
  useEffect(() => { load(); }, []);
  return (
    <PageContainer title="Coupons" subtitle="Create and manage discount campaigns">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">{coupons.length} active coupons</p>
        <PrimaryButton onClick={() => setShowForm(v => !v)}><Plus size={14} />{showForm ? "Cancel" : "Add Coupon"}</PrimaryButton>
      </div>
      {showForm && (
        <Card className="border-indigo-100 animate-scale-in">
          <SectionHeader title="New Coupon" />
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Coupon Code" placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm({ ...form, code:e.target.value })} />
            <TextAreaField label="Message / Terms" rows={2} value={form.message} onChange={e => setForm({ ...form, message:e.target.value })} />
          </div>
          <PrimaryButton className="mt-3" onClick={async () => { if (!form.code.trim()) return alert("Code required"); await api.post("/admin/coupons", form); setForm({ code:"", message:"", active:true }); setShowForm(false); load(); }}>Save Coupon</PrimaryButton>
        </Card>
      )}
      <Card>
        <SectionHeader title="All Coupons" />
        {coupons.length === 0 ? <EmptyState icon="🎟️" title="No coupons yet" description="Create your first coupon above." /> : (
          <div className="space-y-2">
            {coupons.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Tag size={15} className="text-amber-700" /></div>
                <div className="flex-1 min-w-0"><p className="font-bold text-gray-900 text-sm font-mono">{c.code}</p><p className="text-xs text-gray-400 truncate">{c.message}</p></div>
                <div className="flex gap-1.5">
                  <button onClick={async () => { const code=prompt("Code",c.code); const message=prompt("Message",c.message); if(!code||!message) return; await api.put(`/admin/coupons/${c.id}`,{ ...c,code,message }); load(); }} className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all text-xs">✏️</button>
                  <button onClick={async () => { if(!confirm("Delete?")) return; await api.delete(`/admin/coupons/${c.id}`); load(); }} className="h-8 w-8 flex items-center justify-center rounded-xl border border-red-100 bg-white hover:bg-red-50 hover:text-red-600 transition-all text-xs">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
