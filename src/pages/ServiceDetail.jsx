import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { uploadFile, normalizeImageUrl } from "../api/api";
import { Card, PageContainer, PrimaryButton, TextAreaField } from "../components/ui";
import { Clock, CheckCircle, Paperclip } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

/* Unsplash fallback images by service keyword */
const FALLBACK_IMAGES = {
  plumber:     "https://images.unsplash.com/photo-1542632867-261e4be41c7c?w=600&h=300&fit=crop&q=80",
  electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=300&fit=crop&q=80",
  carpenter:   "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=300&fit=crop&q=80",
  mason:       "https://images.unsplash.com/photo-1574359411659-15573a27fd0c?w=600&h=300&fit=crop&q=80",
  painter:     "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&h=300&fit=crop&q=80",
  ac:          "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=300&fit=crop&q=80",
  default:     "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop&q=80",
};

function getFallback(name = "") {
  const n = name.toLowerCase();
  for (const [k, url] of Object.entries(FALLBACK_IMAGES)) {
    if (k !== "default" && n.includes(k)) return url;
  }
  return FALLBACK_IMAGES.default;
}

function SafeImage({ src, name, gradient }) {
  const [err, setErr] = useState(false);
  const fallback = getFallback(name);
  const imgSrc = (!src || err) ? fallback : src;

  return (
    <div className={`w-full aspect-[16/7] bg-gradient-to-br ${gradient || "from-indigo-500 to-blue-600"}`}>
      <img
        src={imgSrc}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setErr(true)}
      />
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [service, setService]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [description, setDescription]     = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachName, setAttachName]       = useState("");
  const [booked, setBooked]               = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [bookingError, setBookingError]   = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get("/config/our-services"),
      api.get("/config/quick-services"),
    ]).then(([ourRes, quickRes]) => {
      const ourList   = ourRes.status   === "fulfilled" ? (ourRes.value.data   || []) : [];
      const quickList = quickRes.status === "fulfilled" ? (quickRes.value.data || []) : [];

      const found =
        ourList.find(s => !isNaN(Number(s.id)) && String(s.id) === String(id)) ||
        quickList.find(s => !isNaN(Number(s.id)) && String(s.id) === String(id));

      setService(found || null);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return alert(t("file_too_large"));

    setUploadingFile(true);
    try {
      const url = await uploadFile(file);
      setAttachmentUrl(url);
      setAttachName(file.name);
    } catch {
      alert(t("upload_failed"));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleBook = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return navigate("/login");

    if (!user.mobile) {
      setBookingError(t("mobile_required"));
      return;
    }

    setSubmitting(true);
    setBookingError("");

    const numericId = service && !isNaN(Number(service.id)) ? Number(service.id) : null;
    const desc = description.trim() || service?.name || `${t("service")} #${id}`;

    const corePayload = {
      serviceId:        numericId,
      description:      desc,
      customerPhone:    user.mobile,
      assistedByUserId: user.id,
      attachmentUrl:    attachmentUrl || null,
    };

    const fullPayload = {
      ...corePayload,
      serviceName:     service?.name || desc,
      serviceImageUrl: service?.imageUrl || null,
    };

    const tryPost = async (payload) => {
      const res = await api.post("/cases", payload);
      return res.data?.data || res.data;
    };

    try {
      try {
        await tryPost(fullPayload);
      } catch (firstErr) {
        const s = firstErr.response?.status;
        if (s === 400 || s === 500) {
          await tryPost(corePayload);
        } else {
          throw firstErr;
        }
      }
      setBooked(true);
      setTimeout(() => navigate("/profile/orders"), 1500);
    } catch (err) {
      const serverMsg = err.response?.data?.message
        || (typeof err.response?.data === "string" ? err.response.data : null);

      const status = err.response?.status;

      let friendly = t("booking_failed");
      if (status === 400) friendly = t("booking_rejected");
      if (status === 500) friendly = t("server_error");
      if (serverMsg) friendly = serverMsg;

      setBookingError(friendly);
    } finally {
      setSubmitting(false);
    }
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

  if (loading) return (
    <PageContainer>
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
        <div className="w-full aspect-[16/7] bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    </PageContainer>
  );

  if (!service) return (
    <PageContainer>
      <Card className="text-center py-12">
        <p className="text-3xl mb-3">🔍</p>
        <h2 className="text-base font-bold text-gray-900">{t("service_not_found")}</h2>
        <p className="text-sm text-gray-400 mt-1 mb-4">{t("service_not_found_desc")}</p>
        <PrimaryButton onClick={() => navigate("/")}>{t("back_to_home")}</PrimaryButton>
      </Card>
    </PageContainer>
  );

  return (
    <PageContainer>
      <div className="relative rounded-2xl overflow-hidden">
        <SafeImage src={service.imageUrl} name={service.name} gradient={service.gradient} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{service.name}</h1>
              {service.description && <p className="text-sm text-white/70 mt-0.5">{service.description}</p>}
            </div>
            <p className="text-lg font-bold text-white flex-shrink-0 ml-2">{service.price || "₹400+"}</p>
          </div>
        </div>
      </div>

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

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-xs font-bold text-indigo-800 mb-2">{t("booking_summary")}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600">{t("service")}</span>
            <span className="text-xs font-bold text-indigo-900">{service.name}</span>
          </div>
          {service.price && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-600">{t("starting_price")}</span>
              <span className="text-xs font-bold text-indigo-900">{service.price}</span>
            </div>
          )}
          {service.description && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-indigo-600 flex-shrink-0">{t("description")}</span>
              <span className="text-xs text-indigo-900 text-right line-clamp-2">{service.description}</span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <h2 className="text-sm font-bold text-gray-900 mb-4">{t("book_service")} — {service.name}</h2>

        <div className="space-y-4">
          <TextAreaField
            label={t("describe_issue")}
            rows={4}
            placeholder={t("describe_placeholder")}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t("attachment_optional")}
            </span>

            <div className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors
              ${attachmentUrl ? "border-emerald-200 bg-emerald-50" : "border-gray-200 hover:border-indigo-200"}`}>

              {attachmentUrl ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold truncate max-w-[180px]">
                    {attachName || t("attachment_selected")}
                  </span>
                  <button
                    onClick={() => { setAttachmentUrl(""); setAttachName(""); }}
                    className="text-xs text-gray-400 hover:text-red-500 underline flex-shrink-0"
                  >
                    {t("remove")}
                  </button>
                </div>
              ) : uploadingFile ? (
                <div className="text-sm text-indigo-500 font-semibold animate-pulse">
                  {t("uploading")}
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Paperclip size={20} className="mx-auto text-gray-300 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-500">{t("attachment_tap")}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t("attachment_max")}</p>
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={e => handleFileUpload(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {bookingError && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
            <p className="text-xs font-semibold text-red-600">⚠️ {bookingError}</p>
          </div>
        )}

        <PrimaryButton
          onClick={handleBook}
          disabled={submitting || uploadingFile}
          className="mt-5 w-full py-3 text-base"
        >
          {submitting
            ? t("confirming")
            : `${t("confirm_booking")} · ${service.price || "₹400+"}`}
        </PrimaryButton>

        <p className="text-center text-[11px] text-gray-400 mt-2">
          {t("booking_confirmation_note")}
        </p>
      </Card>
    </PageContainer>
  );
}