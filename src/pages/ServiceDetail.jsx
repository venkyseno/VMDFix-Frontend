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
      <img src={imgSrc} alt={name} className="w-full h-full object-cover" onError={() => setErr(true)} />
    </div>
  );
}

/**
 * Parse the route :id param.
 * Supports both legacy numeric IDs ("5") and compound source-prefixed IDs ("our-5", "quick-5").
 * Returns { source: "our"|"quick"|null, numericId: number|null }
 */
function parseServiceId(rawId) {
  if (!rawId) return { source: null, numericId: null };
  if (rawId.startsWith("our-")) {
    return { source: "our", numericId: Number(rawId.slice(4)) };
  }
  if (rawId.startsWith("quick-")) {
    return { source: "quick", numericId: Number(rawId.slice(6)) };
  }
  // Legacy plain numeric ID — search both lists (old bookmarks / deep links)
  return { source: null, numericId: Number(rawId) };
}

export default function ServiceDetail() {
  const { id: rawId } = useParams();
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

  const { source, numericId } = parseServiceId(rawId);

  useEffect(() => {
    setLoading(true);
    setService(null);

    Promise.allSettled([
      api.get("/config/our-services"),
      api.get("/config/quick-services"),
    ]).then(([ourRes, quickRes]) => {
      const ourList   = (ourRes.status   === "fulfilled" ? ourRes.value.data   : null) || [];
      const quickList = (quickRes.status === "fulfilled" ? quickRes.value.data : null) || [];

      let found = null;

      if (source === "our") {
        // Explicit source — look only in our-services
        found = ourList.find(s => String(s.id) === String(numericId)) || null;
      } else if (source === "quick") {
        // Explicit source — look only in quick-services
        found = quickList.find(s => String(s.id) === String(numericId)) || null;
      } else {
        // Legacy: no source prefix — search both but prefer our-services
        // (this path only hit by old links; new links always have the source prefix)
        const idStr = String(numericId || rawId);
        found =
          ourList.find(s => String(s.id) === idStr) ||
          quickList.find(s => String(s.id) === idStr) ||
          null;
      }

      if (found) {
        // Attach the source so we can pass it to the booking payload
        found = { ...found, _source: source || (ourList.find(s => String(s.id) === String(found.id)) ? "our" : "quick") };
      }

      setService(found);
    }).finally(() => setLoading(false));
  }, [rawId]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return alert("File is too large (max 20MB)");
    setUploadingFile(true);
    try {
      const url = await uploadFile(file);
      setAttachmentUrl(url);
      setAttachName(file.name);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleBook = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return navigate("/login");
    if (!user.mobile) {
      setBookingError("Mobile number is required for booking. Please update your profile.");
      return;
    }

    setSubmitting(true);
    setBookingError("");

    // Always send the exact name/image the user saw — never let backend guess
    const payload = {
      serviceId:        numericId,
      serviceName:      service.name,        // ← authoritative: what user saw
      serviceImageUrl:  service.imageUrl || null,
      serviceType:      service._source || source || "our",  // ← tells backend which table
      description:      description.trim() || service.name,
      customerPhone:    user.mobile,
      assistedByUserId: user.id,
      attachmentUrl:    attachmentUrl || null,
    };

    try {
      await api.post("/cases", payload);
      setBooked(true);
      setTimeout(() => navigate("/profile/orders"), 1500);
    } catch (err) {
      const serverMsg = err.response?.data?.message
        || (typeof err.response?.data === "string" ? err.response.data : null);
      const status = err.response?.status;
      let friendly = "Booking failed. Please try again.";
      if (status === 400) friendly = "Invalid booking details. Please check and retry.";
      if (status === 500) friendly = "Server error. Please try again in a moment.";
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
        <p className="text-sm text-gray-400 mt-1 mb-4">The service could not be found. It may have been removed.</p>
        <PrimaryButton onClick={() => navigate("/")}>{t("back_to_home")}</PrimaryButton>
      </Card>
    </PageContainer>
  );

  return (
    <PageContainer>
      {/* Hero image */}
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

      {/* Trust badges */}
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

      {/* Booking summary */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-xs font-bold text-indigo-800 mb-2">Booking Summary</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600">Service</span>
            <span className="text-xs font-bold text-indigo-900">{service.name}</span>
          </div>
          {service.price && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-600">Starting Price</span>
              <span className="text-xs font-bold text-indigo-900">{service.price}</span>
            </div>
          )}
          {service.description && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-indigo-600 flex-shrink-0">Description</span>
              <span className="text-xs text-indigo-900 text-right line-clamp-2">{service.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking form */}
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
                  <span className="text-sm font-semibold truncate max-w-[180px]">{attachName || "Attached"}</span>
                  <button
                    onClick={() => { setAttachmentUrl(""); setAttachName(""); }}
                    className="text-xs text-gray-400 hover:text-red-500 underline flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : uploadingFile ? (
                <div className="text-sm text-indigo-500 font-semibold animate-pulse">Uploading...</div>
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
