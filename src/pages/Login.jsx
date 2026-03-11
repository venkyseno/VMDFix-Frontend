import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { InputField, PrimaryButton, SecondaryButton } from "../components/ui";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [authType, setAuthType] = useState("login");
  const [method, setMethod] = useState("email");
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", otp: "123456" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const postAuth = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    if (user.role === "ADMIN") navigate("/admin/dashboard");
    else if (user.role === "WORKER") navigate("/worker/dashboard");
    else navigate("/profile");
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (authType === "login") {
        const { data } = await api.post("/users/login", { mobile: form.mobile, password: form.password });
        return postAuth(data);
      }
      if (method === "email") {
        const { data } = await api.post("/users/signup", { name: form.name, email: form.email, mobile: form.mobile, password: form.password, signupProvider: "EMAIL" });
        return postAuth(data);
      }
      if (method === "google") {
        const { data } = await api.post("/users/google-signup", { name: form.name, email: form.email, mobile: form.mobile });
        return postAuth(data);
      }
      const { data } = await api.post("/users/mobile-otp-signup", { name: form.name, mobile: form.mobile, otp: form.otp });
      postAuth(data);
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data || t("auth_failed"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-indigo-200 mb-3">
              <Sparkles size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("app_name")}</h1>
            <p className="text-sm text-gray-400 mt-1">{t("book_trusted")}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {/* Tab */}
            <div className="mb-5 flex rounded-xl bg-gray-100 p-1">
              {[{ k: "login", l: t("login") }, { k: "signup", l: t("signup") }].map(tb => (
                <button key={tb.k} onClick={() => { setAuthType(tb.k); setError(""); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${authType === tb.k ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}>
                  {tb.l}
                </button>
              ))}
            </div>

            {authType === "signup" && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {[["email", "📧 Email"], ["google", "🔵 Google"], ["mobile", "📱 OTP"]].map(([k, l]) => (
                  <button key={k} onClick={() => setMethod(k)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${method === k ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {authType === "signup" && <InputField label={t("full_name")} placeholder={t("your_name")} value={form.name} onChange={set("name")} />}
              <InputField label={t("mobile")} placeholder={t("mobile_placeholder")} value={form.mobile} onChange={set("mobile")} type="tel" />
              {(authType === "login" || method === "email") && <InputField label={t("password")} placeholder={t("password_placeholder")} type="password" value={form.password} onChange={set("password")} />}
              {authType === "signup" && (method === "email" || method === "google") && <InputField label={t("email")} placeholder={t("email_placeholder")} type="email" value={form.email} onChange={set("email")} />}
              {authType === "signup" && method === "mobile" && <InputField label={t("otp")} placeholder={t("otp_placeholder")} value={form.otp} onChange={set("otp")} />}
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            <PrimaryButton onClick={submit} disabled={loading} className="mt-5 w-full py-3">
              {loading ? "..." : authType === "login" ? t("login") : t("continue_btn")}
            </PrimaryButton>
          </div>

          <button onClick={() => navigate("/")} className="mt-4 flex items-center justify-center gap-1.5 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={14} />
            {t("back_to_home")}
          </button>
        </div>
      </div>
    </div>
  );
}
