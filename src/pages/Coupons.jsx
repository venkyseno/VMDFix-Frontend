import { useEffect, useState } from "react";
import api from "../api/api";
import { EmptyState, PageContainer } from "../components/ui";
import { Copy, Tag } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState(null);
  const { t } = useTranslation();
  useEffect(() => { api.get("/config/coupons").then(r => setCoupons(r.data || [])).catch(() => setCoupons([])); }, []);
  const handleCopy = code => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <PageContainer title={t("coupons_title")} subtitle={t("available_offers")}>
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8">
          <EmptyState icon="🎟️" title={t("no_coupons")} description={t("no_coupons_desc")} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 stagger-children">
          {coupons.map(c => (
            <div key={c.id} className="relative rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-16 opacity-10"><Tag size={80} className="text-amber-700 rotate-12 -translate-y-2 translate-x-4" /></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800 font-mono tracking-wider">{c.code}</span>
                  <button onClick={() => handleCopy(c.code)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${copied === c.code ? "bg-emerald-100 text-emerald-700" : "bg-white text-gray-500 hover:bg-amber-100 hover:text-amber-700"}`}>
                    <Copy size={10} />{copied === c.code ? t("copied") : t("copy")}
                  </button>
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">{c.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
