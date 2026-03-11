import { useParams, useNavigate } from "react-router-dom";
import { services } from "../data/Services";
import { useState } from "react";
import api, { uploadFile } from "../api/api";
import { Card, InputField, PageContainer, PrimaryButton, TextAreaField, Badge } from "../components/ui";
import { Clock, CheckCircle, Paperclip, Star } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachName, setAttachName] = useState("");
  const [booked, setBooked] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const service = services.find((s) => s.id === Number(id));
  if (!service) return (
    <PageContainer>
      <Card className="text-center py-12">
        <p className="text-2xl mb-2">🔍</p>
        <h2 className="text-base font-bold text-gray-900">{t("service_not_found")}</h2>
      </Card>
    </PageContainer>
  );

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return alert("File too large (max 20MB)");
    setUploadingFile(true);
    try {
      // Use the same upload endpoint used for banners
      const url = await uploadFile(file);
      setAttachmentUrl(url);
      setAttachName(file.name);
    } catch (e) {
      console.error("File upload error:", e);
      // Fallback: use data URL for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => { setAttachmentUrl(ev.target.result); setAttachName(file.name); };
        reader.readAsDataURL(file);
      } else {
        alert("File upload failed. Please try again.");
      }
    } finally { setUploadingFile(false); }
  };

  const handleBook = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return navigate("/login");
    setLoading(true);
    try {
      const res = await api.post("/cases", {
        serviceId: service.id,
        description: description || service.name,
        customerPhone: user.mobile,
        assistedByUserId: user.id,
        attachmentUrl: attachmentUrl || null,
      });
      if (res.data?.data?.id) {
        setBooked(true);
        setTimeout(() => navigate("/profile/orders"), 1500);
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("Booking failed: " + (err.response?.data?.message || err.response?.data || err.message));
    } finally { setLoading(false); }
  };

  if (booked) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">{t("booking_confirmed")}</h2>
        <p className="text-sm text-gray-400 mt-1">{t("redirecting")}</p>
      </div>
    </div>
  );

  return (
    <PageContainer>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-200">
        <img src={service.image} alt={service.name} className="w-full aspect-[16/7] object-cover"
          onError={e => { e.target.style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl mb-1">{service.icon}</div>
              <h1 className="text-xl font-bold text-white">{service.name}</h1>
              <p className="text-sm text-white/70">{service.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{service.price}</p>
              <div className="flex items-center gap-1 justify-end mt-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-white/80 font-medium">4.8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-1.5 shadow-sm">
          <Clock size={12} className="text-indigo-500" />
          <span className="text-xs font-semibold text-gray-700">{t("same_day_service")}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-1.5 shadow-sm">
          <CheckCircle size={12} className="text-emerald-500" />
          <span className="text-xs font-semibold text-gray-700">{t("verified_professionals")}</span>
        </div>
      </div>

      {/* Booking form */}
      <Card>
        <h2 className="text-sm font-bold text-gray-900 mb-4">{t("book_service")}</h2>
        <div className="space-y-4">
          <TextAreaField
            label={t("describe_issue")}
            rows={4}
            placeholder={t("describe_placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t("attachment_optional")}
            </span>
            <div className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${attachmentUrl ? "border-emerald-200 bg-emerald-50" : "border-gray-200 hover:border-indigo-200"}`}>
              {attachmentUrl ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">{attachName || "Attachment selected"}</span>
                </div>
              ) : uploadingFile ? (
                <div className="text-sm text-indigo-500 font-semibold animate-pulse">Uploading...</div>
              ) : (
                <label className="cursor-pointer">
                  <Paperclip size={20} className="mx-auto text-gray-300 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-500">{t("attachment_tap")}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t("attachment_max")}</p>
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
        <PrimaryButton onClick={handleBook} disabled={loading || uploadingFile} className="mt-5 w-full py-3 text-base">
          {loading ? t("confirming") : `${t("confirm_booking")} · ${service.price}`}
        </PrimaryButton>
        <p className="text-center text-[11px] text-gray-400 mt-2">{t("booking_confirmation_note")}</p>
      </Card>
    </PageContainer>
  );
}
