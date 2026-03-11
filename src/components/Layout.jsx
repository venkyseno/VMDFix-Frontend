import { ChevronLeft, Menu, ShieldCheck, Sparkles, User, X } from "lucide-react";
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
      <span className="app-logo-icon">
                {isAdmin
                  ? <ShieldCheck size={16} color="white" />
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                }
              </span>
              <span className="font-extrabold text-sm" style={{ color: "#16213e", letterSpacing: "-0.03em" }}>
                {isAdmin ? (
                  <span>VMD<span style={{ color: "#1a7a4a" }}>Fix</span> Admin</span>
                ) : (
                  <span>VMD<span style={{ color: "#1a7a4a" }}>Fix</span></span>
                )}
              </span>
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
            /* Mobile: slide-in drawer */
            drawerOpen ? "fixed inset-y-0 left-0 z-40 pt-16 w-64 block" : "hidden",
            /* Desktop: always visible */
            "lg:relative lg:block lg:pt-0 lg:w-56"
          ].join(" ")}>
            <div className="h-full lg:sticky lg:top-20 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

              {/* Drawer close (mobile) */}
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
                        {/* Icon — never hidden */}
                        <span style={{ fontSize:"16px", lineHeight:1, flexShrink:0 }}>{item.icon}</span>
                        {/* Label — ALWAYS visible, explicit style, never truncated */}
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
    </div>
  );
}
