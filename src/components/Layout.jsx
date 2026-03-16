import { ChevronLeft, Menu, Sparkles, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useTranslation } from "../i18n/LanguageContext";

const NAV = [
  { to:"/admin/dashboard",      label:"Overview",           icon:"📊" },
  { to:"/admin/banners",        label:"Banners & Services", icon:"🖼️" },
  { to:"/admin/quick-services", label:"Quick Services",     icon:"⚡" },
  { to:"/admin/our-services",   label:"Our Services",       icon:"🛠️" },
  { to:"/admin/works",          label:"Works / Orders",     icon:"📋" },
  { to:"/admin/workers",        label:"Workers",            icon:"👷" },
  { to:"/admin/coupons",        label:"Coupons",            icon:"🎟️" },
  { to:"/admin/withdrawals",    label:"Withdrawals",        icon:"💳" },
];

/* WhatsApp SVG icon */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* WhatsApp floating button */
function WhatsAppFAB() {
  const { pathname } = useLocation();
  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href="https://wa.me/917013693574?text=Hello%2C%20I%20need%20help%20with%20VMDfix%20services."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
      style={{
        bottom: "90px",
        right: "16px",
        width: "52px",
        height: "52px",
        background: "#25D366",
        color: "white",
        boxShadow: "0 4px 20px rgba(37,211,102,0.5)",
      }}
      title="Chat on WhatsApp"
      aria-label="WhatsApp Support"
    >
      <WhatsAppIcon />
    </a>
  );
}

function LangBtn() {
  const { lang, switchLang } = useTranslation();
  return (
    <button
      onClick={() => switchLang(lang === "en" ? "te" : "en")}
      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold shadow-sm hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all select-none whitespace-nowrap"
      style={{ minWidth: "fit-content" }}
    >
      <span style={{ fontSize: "14px" }}>{lang === "en" ? "🇮🇳" : "🇬🇧"}</span>
      <span style={{ display: "inline", whiteSpace: "nowrap" }}>{lang === "en" ? "తెలుగు" : "English"}</span>
    </button>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();

  const isAdmin   = pathname.startsWith("/admin");
  const canGoBack = pathname !== "/" && !pathname.startsWith("/admin/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#f4f7f6" }}>
      {/* ── Top header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 glass">
        <div className="mx-auto flex h-14 w-full max-w-screen-lg items-center justify-between px-3 sm:px-5">
          {/* Left */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <button className="rounded-xl border border-gray-200 bg-white p-2 lg:hidden shadow-sm" onClick={() => setDrawerOpen(v => !v)}>
                <Menu size={17} />
              </button>
            ) : canGoBack ? (
              <button onClick={() => navigate(-1)} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm hover:bg-gray-50">
                <ChevronLeft size={17} />
              </button>
            ) : null}

            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
              <img src="/icon.png" alt="VMDFix" className="rounded-xl object-cover flex-shrink-0 shadow-sm" style={{ width: 24, height: 24 }} />
              {isAdmin ? (
                <span className="font-extrabold text-sm" style={{ color: "#16213e", letterSpacing: "-0.03em" }}>
                  VMD<span style={{ color: "#1a7a4a" }}>Fix</span> <span style={{ color:"#e53e3e" }}>Admin</span>
                </span>
              ) : (
                <img src="/appname.png" alt="VMDFix" className="rounded-xl object-cover flex-shrink-0 shadow-sm" style={{ height: 25, maxWidth: 110 }} />
              )}
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <LangBtn />
            {!isAdmin && (
              <Link to="/profile" className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50">
                <User size={15} className="text-gray-600" />
              </Link>
            )}
            {isAdmin && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 border border-red-100">Admin</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Drawer backdrop ──────────────────────────────────────── */}
      {isAdmin && drawerOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      <div className={`mx-auto flex w-full max-w-screen-lg gap-5 ${isAdmin ? "px-3 sm:px-5 pb-24 pt-4" : "pb-24 pt-0"}`}>

        {/* ── Admin sidebar ─────────────────────────────────────── */}
        {isAdmin && (
          <aside className={[
            "flex-shrink-0",
            drawerOpen ? "fixed inset-y-0 left-0 z-40 pt-16 w-64 block" : "hidden",
            "lg:relative lg:block lg:pt-0 lg:w-56"
          ].join(" ")}>
            <div className="h-full lg:sticky lg:top-20 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {drawerOpen && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700">Navigation</span>
                  <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1 hover:bg-gray-100">
                    <X size={15} />
                  </button>
                </div>
              )}
              <div className="p-2">
                <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Menu</p>
                <nav className="space-y-0.5">
                  {NAV.map(item => {
                    const active = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px",
                                 borderRadius:"10px", textDecoration:"none", whiteSpace:"nowrap",
                                 fontWeight: active ? 700 : 600, fontSize:"14px",
                                 color: active ? "#1a7a4a" : "#4b5563",
                                 background: active ? "#e8f5ee" : "transparent" }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize:"16px", lineHeight:1, flexShrink:0 }}>{item.icon}</span>
                        <span style={{ display:"inline", opacity:1, visibility:"visible",
                                       overflow:"visible", whiteSpace:"nowrap", maxWidth:"none" }}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link to="/" onClick={() => setDrawerOpen(false)}
                    style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 12px",
                             borderRadius:"10px", textDecoration:"none", fontSize:"12px",
                             fontWeight:600, color:"#6b7280" }}
                    onMouseEnter={e => { e.currentTarget.style.background="#eef2ff"; e.currentTarget.style.color="#4338ca"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#6b7280"; }}
                  >
                    <Sparkles size={13} />
                    <span style={{ display:"inline", whiteSpace:"nowrap" }}>User App</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── Page content ──────────────────────────────────────── */}
        <main className="flex-1 min-w-0 animate-fade-in">{children}</main>
      </div>

      <BottomNav />

      {/* WhatsApp Floating Support Button */}
      <WhatsAppFAB />
    </div>
  );
}
