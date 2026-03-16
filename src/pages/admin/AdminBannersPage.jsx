import { useEffect, useMemo, useState } from "react";
import api, { uploadFile } from "../../api/api";
import {
  Badge, Card, EmptyState, InputField, PageContainer,
  PrimaryButton, SectionHeader, SelectField, SecondaryButton, TextAreaField
} from "../../components/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";

const EMPTY_BANNER = { title:"", imageUrl:"", redirectType:"SERVICE", targetId:"", redirectPath:"/", sortOrder:1, displaySeconds:5, placement:"HOME", active:true };
const EMPTY_SERVICE = { name:"", menuDetails:"", imageUrl:"", startPrice:"", active:true };

const buildPath = (type, id) => {
  if (type === "ALL_SERVICES") return "/#all-services";
  if (type === "OTHER_SERVICES") return "/#other-services";
  if (type === "SERVICE") return `/service/${id || 1}`;
  if (type === "OTHER_SERVICE") return `/other-services/${id || 1}`;
  return "/";
};

const parsePath = (path = "") => {
  if (path === "/#all-services") return { redirectType:"ALL_SERVICES", targetId:"" };
  if (path === "/#other-services") return { redirectType:"OTHER_SERVICES", targetId:"" };
  if (path.startsWith("/service/")) return { redirectType:"SERVICE", targetId: path.split("/service/")[1] || "" };
  if (path.startsWith("/other-services/")) return { redirectType:"OTHER_SERVICE", targetId: path.split("/other-services/")[1] || "" };
  return { redirectType:"SERVICE", targetId:"" };
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [otherServices, setOtherServices] = useState([]);
  const [ourServices, setOurServices] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [itemForm, setItemForm] = useState({ name:"", price:"", availableQuantity:"" });
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER);
  const [editingBanner, setEditingBanner] = useState(null);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [editingService, setEditingService] = useState(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingService, setUploadingService] = useState(false);
  const [activeTab, setActiveTab] = useState("banners");

  const err = (e) => alert(e?.response?.data || e?.message || "Request failed");

  const load = async () => {
    const [b, s, os] = await Promise.allSettled([
      api.get("/admin/banners"),
      api.get("/admin/other-services"),
      api.get("/admin/our-services"),
    ]);
    if (b.status === "fulfilled") setBanners(b.value.data || []);
    if (s.status === "fulfilled") setOtherServices(s.value.data || []);
    if (os.status === "fulfilled") setOurServices(os.value.data || []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedServiceId) return setItems([]);
    api.get(`/admin/other-services/${selectedServiceId}/items`).then(r => setItems(r.data||[])).catch(() => setItems([]));
  }, [selectedServiceId]);

  const redirectPreview = useMemo(() => buildPath(bannerForm.redirectType, bannerForm.targetId), [bannerForm.redirectType, bannerForm.targetId]);
  const ourSvcOpts = useMemo(() => ourServices.map(s => ({ id: String(s.id), label: `${s.id} · ${s.name}` })), [ourServices]);
  const otherSvcOpts = useMemo(() => otherServices.map(s => ({ id: String(s.id), label: `${s.id} · ${s.name}` })), [otherServices]);

  const saveBanner = async () => {
    if (!bannerForm.title.trim()) return alert("Banner title is required");
    if (!bannerForm.imageUrl?.trim()) return alert("Banner image is required");
    try {
      await api.post("/admin/banners", { title:bannerForm.title, imageUrl:bannerForm.imageUrl, redirectPath:redirectPreview, sortOrder:Number(bannerForm.sortOrder||1), displaySeconds:Number(bannerForm.displaySeconds||5), placement:bannerForm.placement||"HOME", active:true });
      setBannerForm({ ...EMPTY_BANNER, sortOrder: banners.length+1 });
      setShowBannerForm(false); load();
    } catch(e) { err(e); }
  };

  const updateBanner = async () => {
    if (!editingBanner) return;
    const payload = { title:editingBanner.title, imageUrl:editingBanner.imageUrl, redirectPath:buildPath(editingBanner.redirectType, editingBanner.targetId), sortOrder:Number(editingBanner.sortOrder||1), displaySeconds:Number(editingBanner.displaySeconds||5), placement:editingBanner.placement||"HOME", active:editingBanner.active !== false };
    try { await api.put(`/admin/banners/${editingBanner.id}`, payload); setEditingBanner(null); load(); } catch(e) { err(e); }
  };

  const saveService = async () => {
    if (!serviceForm.name.trim()) return alert("Service name required");
    if (!serviceForm.imageUrl?.trim()) return alert("Service image required");
    try { await api.post("/admin/other-services", serviceForm); setServiceForm(EMPTY_SERVICE); setShowServiceForm(false); load(); } catch(e) { err(e); }
  };

  const updateService = async () => {
    if (!editingService) return;
    try { await api.put(`/admin/other-services/${editingService.id}`, editingService); setEditingService(null); load(); } catch(e) { err(e); }
  };

  const addItem = async () => {
    if (!selectedServiceId) return alert("Select a service first");
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.availableQuantity) return alert("Fill all item fields");
    try {
      await api.post(`/admin/other-services/${selectedServiceId}/items`, { name:itemForm.name, price:Number(itemForm.price), availableQuantity:Number(itemForm.availableQuantity) });
      setItemForm({ name:"", price:"", availableQuantity:"" });
      const res = await api.get(`/admin/other-services/${selectedServiceId}/items`);
      setItems(res.data||[]);
    } catch(e) { err(e); }
  };

  return (
    <PageContainer title="Content Management" subtitle="Manage banners and marketplace services">
      <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
        {[{ key:"banners", label:"🖼️ Banners", count:banners.length }, { key:"services", label:"🛒 Other Services", count:otherServices.length }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${activeTab===tab.key ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab===tab.key ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-bold text-gray-900">Banner Management</h2><p className="text-xs text-gray-400">Promotional banners on the home screen</p></div>
            <PrimaryButton onClick={() => setShowBannerForm(v => !v)}><Plus size={14} />{showBannerForm ? "Cancel" : "Create Banner"}</PrimaryButton>
          </div>
          {showBannerForm && (
            <Card className="border-indigo-100 animate-scale-in">
              <SectionHeader title="New Banner" />
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Banner Title" placeholder="e.g. Summer Sale" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title:e.target.value })} />
                  <InputField label="Sort Order" type="number" value={bannerForm.sortOrder} onChange={e => setBannerForm({ ...bannerForm, sortOrder:e.target.value })} />
                  <InputField label="Display Duration (s)" type="number" value={bannerForm.displaySeconds} onChange={e => setBannerForm({ ...bannerForm, displaySeconds:e.target.value })} />
                  <SelectField label="Placement" value={bannerForm.placement} onChange={e => setBannerForm({ ...bannerForm, placement:e.target.value })}>
                    <option value="HOME">Home</option><option value="TOP">Top</option>
                  </SelectField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label="Redirect To" value={bannerForm.redirectType} onChange={e => setBannerForm({ ...bannerForm, redirectType:e.target.value, targetId:"" })}>
                    <option value="SERVICE">Our Service Page</option>
                    <option value="OTHER_SERVICE">Marketplace Service</option>
                    <option value="ALL_SERVICES">All Services</option>
                    <option value="OTHER_SERVICES">Marketplace Section</option>
                  </SelectField>
                  {bannerForm.redirectType === "SERVICE" && (
                    <SelectField label="Target Service" value={bannerForm.targetId} onChange={e => setBannerForm({ ...bannerForm, targetId:e.target.value })}>
                      <option value="">Select service</option>
                      {ourSvcOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </SelectField>
                  )}
                  {bannerForm.redirectType === "OTHER_SERVICE" && (
                    <SelectField label="Target Service" value={bannerForm.targetId} onChange={e => setBannerForm({ ...bannerForm, targetId:e.target.value })}>
                      <option value="">Select service</option>
                      {otherSvcOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </SelectField>
                  )}
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
                  <p className="text-xs font-bold text-indigo-800 mb-1">Redirect Preview</p>
                  <code className="text-xs text-indigo-600 font-mono">{redirectPreview}</code>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">Banner Image</span>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setUploadingBanner(true);
                    try { const url = await uploadFile(file); setBannerForm(p => ({ ...p, imageUrl:url })); } catch(e) { err(e); } finally { setUploadingBanner(false); }
                  }} />
                  {uploadingBanner && <span className="text-xs text-gray-400 animate-pulse ml-2">Uploading...</span>}
                  {bannerForm.imageUrl && <img src={bannerForm.imageUrl} alt="preview" className="mt-2 h-24 w-full rounded-xl object-cover border border-gray-100" />}
                </div>
                <div className="flex gap-2 pt-1">
                  <PrimaryButton onClick={saveBanner}>Publish Banner</PrimaryButton>
                  <SecondaryButton onClick={() => setShowBannerForm(false)}>Cancel</SecondaryButton>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <SectionHeader title="Published Banners" />
            {banners.length === 0 ? <EmptyState icon="🖼️" title="No banners published" description="Create your first banner above." /> : (
              <div className="space-y-2">
                {banners.map(banner => (
                  <div key={banner.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      {banner.imageUrl && <img src={banner.imageUrl} alt="" className="h-14 w-20 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{banner.title}</p>
                          <Badge tone="indigo">#{banner.id}</Badge>
                          <Badge tone="gray">{banner.placement||"HOME"}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{banner.redirectPath||"/"}</p>
                        <p className="text-xs text-gray-400">{banner.displaySeconds||5}s display</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => { const p=parsePath(banner.redirectPath); setEditingBanner({ ...banner, ...p, displaySeconds:banner.displaySeconds||5, placement:banner.placement||"HOME" }); }} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 transition-all"><Pencil size={13} /></button>
                        <button onClick={async () => { if(!confirm("Delete banner?")) return; await api.delete(`/admin/banners/${banner.id}`); if(editingBanner?.id===banner.id) setEditingBanner(null); load(); }} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-red-100 hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {editingBanner?.id === banner.id && (
                      <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 animate-scale-in">
                        <p className="text-xs font-bold text-indigo-800 mb-3">Editing Banner #{editingBanner.id}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Title" value={editingBanner.title||""} onChange={e => setEditingBanner({ ...editingBanner, title:e.target.value })} />
                          <InputField label="Sort Order" type="number" value={editingBanner.sortOrder||1} onChange={e => setEditingBanner({ ...editingBanner, sortOrder:e.target.value })} />
                          <InputField label="Display Seconds" type="number" value={editingBanner.displaySeconds||5} onChange={e => setEditingBanner({ ...editingBanner, displaySeconds:e.target.value })} />
                          <SelectField label="Placement" value={editingBanner.placement||"HOME"} onChange={e => setEditingBanner({ ...editingBanner, placement:e.target.value })}><option value="HOME">Home</option><option value="TOP">Top</option></SelectField>
                          <SelectField label="Redirect To" value={editingBanner.redirectType||"SERVICE"} onChange={e => setEditingBanner({ ...editingBanner, redirectType:e.target.value, targetId:"" })}>
                            <option value="SERVICE">Our Service Page</option><option value="OTHER_SERVICE">Marketplace Service</option><option value="ALL_SERVICES">All Services</option><option value="OTHER_SERVICES">Marketplace Section</option>
                          </SelectField>
                          {editingBanner.redirectType==="SERVICE" && <SelectField label="Target" value={editingBanner.targetId||""} onChange={e => setEditingBanner({ ...editingBanner, targetId:e.target.value })}><option value="">Select</option>{ourSvcOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</SelectField>}
                          {editingBanner.redirectType==="OTHER_SERVICE" && <SelectField label="Target" value={editingBanner.targetId||""} onChange={e => setEditingBanner({ ...editingBanner, targetId:e.target.value })}><option value="">Select</option>{otherSvcOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</SelectField>}
                        </div>
                        <div className="mt-3">
                          <input type="file" accept="image/*" onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; try { const url=await uploadFile(file); setEditingBanner(p => ({ ...p, imageUrl:url })); } catch(e) { err(e); } }} />
                          {editingBanner.imageUrl && <img src={editingBanner.imageUrl} alt="" className="mt-2 h-20 w-full rounded-xl object-cover" />}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <PrimaryButton onClick={updateBanner}>Save Changes</PrimaryButton>
                          <SecondaryButton onClick={() => setEditingBanner(null)}>Cancel</SecondaryButton>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-bold text-gray-900">Marketplace Services</h2><p className="text-xs text-gray-400">Menu-based services with item pricing</p></div>
            <PrimaryButton onClick={() => setShowServiceForm(v => !v)}><Plus size={14} />{showServiceForm ? "Cancel" : "Add Service"}</PrimaryButton>
          </div>
          {showServiceForm && (
            <Card className="border-indigo-100 animate-scale-in">
              <SectionHeader title="New Marketplace Service" />
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Service Name" placeholder="e.g. Home Cleaning" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name:e.target.value })} />
                  <InputField label="Starting Price" placeholder="e.g. ₹499" value={serviceForm.startPrice} onChange={e => setServiceForm({ ...serviceForm, startPrice:e.target.value })} />
                </div>
                <TextAreaField label="Description" rows={3} value={serviceForm.menuDetails} onChange={e => setServiceForm({ ...serviceForm, menuDetails:e.target.value })} />
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">Service Image</span>
                  <input type="file" accept="image/*" onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; setUploadingService(true); try { const url=await uploadFile(file); setServiceForm(p => ({ ...p, imageUrl:url })); } catch(e) { err(e); } finally { setUploadingService(false); } }} />
                  {uploadingService && <p className="text-xs text-gray-400 mt-1 animate-pulse">Uploading...</p>}
                  {serviceForm.imageUrl && <img src={serviceForm.imageUrl} alt="" className="mt-2 h-24 w-full rounded-xl object-cover" />}
                </div>
                <div className="flex gap-2"><PrimaryButton onClick={saveService}>Publish Service</PrimaryButton><SecondaryButton onClick={() => setShowServiceForm(false)}>Cancel</SecondaryButton></div>
              </div>
            </Card>
          )}
          <Card>
            <SectionHeader title="Published Services" />
            {otherServices.length === 0 ? <EmptyState icon="🛒" title="No services yet" description="Add your first marketplace service above." /> : (
              <div className="space-y-2">
                {otherServices.map(s => (
                  <div key={s.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      {s.imageUrl && <img src={s.imageUrl} alt="" className="h-14 w-20 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-gray-900 text-sm">{s.name}</p><Badge tone="gray">#{s.id}</Badge></div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.menuDetails}</p>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">From {s.startPrice||"₹0"}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelectedServiceId(String(s.id)); setEditingService(s); }} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 transition-all"><Pencil size={13} /></button>
                        <button onClick={async () => { if(!confirm("Delete?")) return; await api.delete(`/admin/other-services/${s.id}`); load(); }} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-red-100 hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {editingService?.id === s.id && (
                      <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-4 animate-scale-in">
                        <p className="text-xs font-bold text-indigo-800">Editing: {editingService.name}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Name" value={editingService.name||""} onChange={e => setEditingService({ ...editingService, name:e.target.value })} />
                          <InputField label="Starting Price" value={editingService.startPrice||""} onChange={e => setEditingService({ ...editingService, startPrice:e.target.value })} />
                        </div>
                        <TextAreaField label="Description" rows={2} value={editingService.menuDetails||""} onChange={e => setEditingService({ ...editingService, menuDetails:e.target.value })} />
                        <div>
                          <input type="file" accept="image/*" onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; try { const url=await uploadFile(file); setEditingService(p => ({ ...p, imageUrl:url })); } catch(e) { err(e); } }} />
                          {editingService.imageUrl && <img src={editingService.imageUrl} alt="" className="mt-2 h-20 w-full rounded-xl object-cover" />}
                        </div>
                        <div className="flex gap-2"><PrimaryButton onClick={updateService}>Save Service</PrimaryButton><SecondaryButton onClick={() => setEditingService(null)}>Cancel</SecondaryButton></div>
                        <div className="border-t border-indigo-100 pt-4">
                          <p className="text-xs font-bold text-gray-800 mb-3">Menu Items</p>
                          <div className="grid gap-3 sm:grid-cols-3 mb-3">
                            <InputField label="Item Name" placeholder="e.g. Basic Package" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name:e.target.value })} />
                            <InputField label="Price (₹)" type="number" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price:e.target.value })} />
                            <InputField label="Quantity" type="number" value={itemForm.availableQuantity} onChange={e => setItemForm({ ...itemForm, availableQuantity:e.target.value })} />
                          </div>
                          <PrimaryButton onClick={addItem} className="text-xs px-3 py-2"><Plus size={13} />Add Item</PrimaryButton>
                          <div className="mt-3 space-y-1.5">
                            {items.map(item => (
                              <div key={item.id} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-3 py-2">
                                <div><span className="text-sm font-semibold text-gray-900">{item.name}</span><span className="text-xs text-gray-400 ml-2">₹{item.price} · Qty {item.availableQuantity}</span></div>
                                <button onClick={async () => { await api.delete(`/admin/other-services/items/${item.id}`); const res=await api.get(`/admin/other-services/${selectedServiceId}/items`); setItems(res.data||[]); }} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
