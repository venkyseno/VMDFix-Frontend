import { useEffect, useRef, useState } from "react";
import api, { uploadFile } from "../../api/api";
import {
  Badge, Card, EmptyState, InputField, PageContainer,
  PrimaryButton, SectionHeader, SecondaryButton, TextAreaField
} from "../../components/ui";
import { Plus, Pencil, Trash2, Star, X, Check } from "lucide-react";

const GRADIENTS = [
  { label: "Blue→Cyan",     value: "from-blue-500 to-cyan-600" },
  { label: "Amber→Orange",  value: "from-amber-500 to-orange-600" },
  { label: "Yellow→Amber",  value: "from-yellow-600 to-amber-700" },
  { label: "Red→Rose",      value: "from-red-500 to-rose-600" },
  { label: "Pink→Rose",     value: "from-pink-500 to-rose-600" },
  { label: "Cyan→Blue",     value: "from-cyan-500 to-blue-600" },
  { label: "Emerald→Green", value: "from-emerald-500 to-green-600" },
  { label: "Purple→Indigo", value: "from-purple-500 to-indigo-600" },
];

const DEFAULT_QUICK = [
  { id:"dq1", name:"Plumber",     description:"Pipe repair & leakage fix",      price:"₹400",  rating:4.8, bookings:"2.5k+", gradient:"from-blue-500 to-cyan-600",    tag:"TRENDING", imageUrl:"https://images.unsplash.com/photo-1542632867-261e4be41c7c?w=400&h=400&fit=crop" },
  { id:"dq2", name:"Electrician", description:"Wiring, switches & fan repair",   price:"₹350",  rating:4.7, bookings:"3.2k+", gradient:"from-amber-500 to-orange-600",  imageUrl:"https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop" },
  { id:"dq3", name:"Carpenter",   description:"Furniture & door fixing",          price:"₹500",  rating:4.9, bookings:"1.8k+", gradient:"from-yellow-500 to-amber-600",  imageUrl:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop" },
  { id:"dq4", name:"Mason",       description:"Brickwork, plastering & tiling",   price:"₹600",  rating:4.6, bookings:"1.2k+", gradient:"from-red-500 to-rose-600",      tag:"PRO",      imageUrl:"https://images.unsplash.com/photo-1574359411659-15573a27fd0c?w=400&h=400&fit=crop" },
  { id:"dq5", name:"Painter",     description:"Interior & exterior painting",     price:"₹700",  rating:4.8, bookings:"2.1k+", gradient:"from-pink-500 to-rose-600",     imageUrl:"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop" },
  { id:"dq6", name:"AC Repair",   description:"AC service & installation",        price:"₹450",  rating:4.7, bookings:"2.8k+", gradient:"from-cyan-500 to-blue-600",    tag:"HOT",      imageUrl:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop" },
];

const EMPTY = { name:"", description:"", price:"", gradient:"from-blue-500 to-cyan-600", imageUrl:"", tag:"", bookings:"", rating:4.8, active:true, sortOrder:99 };

export default function AdminQuickServicesPage() {
  const [services, setServices]   = useState([]);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(true);
  const formRef = useRef(null);

  const err = (e) => alert(e?.response?.data?.message || e?.response?.data || e?.message || "Request failed");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/quick-services");
      setServices(r.data || []);
    } catch { setServices([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return alert("Service name required");
    try {
      await api.post("/admin/quick-services", form);
      setForm(EMPTY); setShowForm(false); load();
    } catch (e) { err(e); }
  };

  const update = async () => {
    if (!editData) return;
    if (!editData.name?.trim()) return alert("Name required");
    try {
      // Default cards have string IDs like "dq1" — save as new instead of PUT
      const isDefault = typeof editId === "string" && isNaN(Number(editId));
      if (isDefault) {
        const { id, ...payload } = editData;
        await api.post("/admin/quick-services", payload);
      } else {
        await api.put(`/admin/quick-services/${editId}`, editData);
      }
      setEditId(null); setEditData(null); load();
    } catch (e) { err(e); }
  };

  const del = async (id) => {
    if (!confirm("Delete this service?")) return;
    try { await api.delete(`/admin/quick-services/${id}`); load(); } catch (e) { err(e); }
  };

  const uploadImg = async (file, setter) => {
    if (file.size > 20 * 1024 * 1024) return alert("Max 20MB");
    setUploading(true);
    try { const url = await uploadFile(file); setter(url); }
    catch (e) { err(e); } finally { setUploading(false); }
  };

  const startEdit = (s) => { setEditId(s.id); setEditData({ ...s }); setShowForm(false); };
  const cancelEdit = () => { setEditId(null); setEditData(null); };

  const GradientPicker = ({ value, onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Gradient</label>
      <div className="flex flex-wrap gap-2">
        {GRADIENTS.map(g => (
          <button key={g.value} type="button" onClick={() => onChange(g.value)}
            className={`h-8 w-14 rounded-lg bg-gradient-to-br ${g.value} shadow-sm transition-all
              ${value === g.value ? "ring-2 ring-green-500 ring-offset-1 scale-110" : "hover:scale-105"}`}
            title={g.label} />
        ))}
      </div>
    </div>
  );

  const ServiceForm = ({ data, onChange, onSave, onCancel, isEdit, title }) => (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Service Name *</label>
            <input type="text" placeholder="e.g. Plumber" value={data.name || ""} onChange={e => onChange({ ...data, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price</label>
            <input type="text" placeholder="e.g. ₹400" value={data.price || ""} onChange={e => onChange({ ...data, price: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tag (optional)</label>
            <input type="text" placeholder="e.g. TRENDING, HOT, PRO" value={data.tag || ""} onChange={e => onChange({ ...data, tag: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bookings</label>
            <input type="text" placeholder="e.g. 2.5k+" value={data.bookings || ""} onChange={e => onChange({ ...data, bookings: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
            <input type="number" step="0.1" min="1" max="5" value={data.rating || 4.8} onChange={e => onChange({ ...data, rating: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
            <input type="number" value={data.sortOrder || 99} onChange={e => onChange({ ...data, sortOrder: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
          <textarea rows={2} placeholder="Short description..." value={data.description || ""} onChange={e => onChange({ ...data, description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none resize-none" />
        </div>
        <GradientPicker value={data.gradient || GRADIENTS[0].value} onChange={v => onChange({ ...data, gradient: v })} />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Service Image</label>
          <input type="file" accept="image/*"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImg(f, url => onChange({ ...data, imageUrl: url })); }}
            className="w-full text-sm text-gray-500 mb-2" />
          {uploading && <p className="text-xs text-green-600 animate-pulse">Uploading...</p>}
          {data.imageUrl
            ? <img src={data.imageUrl} alt="preview" className="h-20 w-20 rounded-xl object-cover border" />
            : <div className={`h-16 w-full rounded-xl bg-gradient-to-br ${data.gradient} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{data.name || "Preview"}</span>
              </div>
          }
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.active !== false} onChange={e => onChange({ ...data, active: e.target.checked })} />
          <span className="text-sm font-medium text-gray-700">Active (visible on home)</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-xl"
            style={{ background: "linear-gradient(135deg,#16213e,#1a7a4a)" }}>
            <Check size={14} /> {isEdit ? "Save Changes" : "Add Service"}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl bg-white hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const displayServices = services.length > 0 ? services : DEFAULT_QUICK;
  const isDefault = services.length === 0;

  return (
    <PageContainer title="Quick Services" subtitle="Manage quick service cards shown on the home page">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-400">
          {isDefault ? "📌 Showing defaults — add services above to override" : `${services.length} services saved`}
        </p>
        <button type="button" onClick={() => { setShowForm(v => !v); cancelEdit(); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-xl"
          style={{ background: "linear-gradient(135deg,#16213e,#1a7a4a)" }}>
          <Plus size={14} /> {showForm ? "Cancel" : "Add Service"}
        </button>
      </div>

      {isDefault && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          ⚡ <strong>Default services</strong> are shown on home. Add your own to override them.
        </div>
      )}

      {showForm && (
        <ServiceForm
          data={form} onChange={setForm}
          onSave={save} onCancel={() => setShowForm(false)}
          isEdit={false} title="New Quick Service"
        />
      )}

      <Card>
        <SectionHeader
          title={isDefault ? "Default Service Cards" : "Your Service Cards"}
          subtitle={isDefault ? "Click ✏️ on any default to save it as your own" : "Click ✏️ to edit any card"}
        />
        {loading ? (
          <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : displayServices.length === 0 ? (
          <EmptyState icon="⚡" title="No services yet" description="Add your first quick service." />
        ) : (
          <div className="space-y-2">
            {displayServices.map(s => (
              <div key={s.id}>
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className={`relative h-14 w-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${s.gradient || "from-blue-500 to-cyan-600"}`}>
                    {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 flex items-end p-1">
                      <span className="text-white text-[9px] font-bold drop-shadow">{s.name}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                      {!isDefault && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s.active ? "Active" : "Hidden"}</span>}
                      {isDefault && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Default</span>}
                      {s.tag && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">{s.tag}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-bold text-green-700">{s.price}</span>
                      <span className="flex items-center gap-0.5 text-xs text-amber-600">
                        <Star size={10} className="fill-amber-400 text-amber-400" /> {s.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button type="button" onClick={() => startEdit(s)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-green-300 hover:text-green-700 transition-all"
                      title="Edit">
                      <Pencil size={13} />
                    </button>
                    {!isDefault && (
                      <button type="button" onClick={() => del(s.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-red-100 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {editId === s.id && editData && (
                  <div className="mt-2">
                    <ServiceForm
                      data={editData} onChange={setEditData}
                      onSave={update} onCancel={cancelEdit}
                      isEdit={true} title={`Editing: ${editData.name}`}
                    />
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
