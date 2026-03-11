import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { EmptyState } from "../components/ui";
import { Search, Star, TrendingUp, Shield, Award, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

/* ── Default fallback data ─────────────────────────────────────────────────── */
const DEFAULT_QUICK = [
  { id:"q1", name:"Plumber",      description:"Pipe repair & leakage fix",      price:"₹400",  rating:4.8, bookings:"2.5k+", gradient:"from-blue-500 to-cyan-600",    tag:"TRENDING", imageUrl:"https://images.unsplash.com/photo-1542632867-261e4be41c7c?w=400&h=400&fit=crop&q=80" },
  { id:"q2", name:"Electrician",  description:"Wiring, switches & fan repair",   price:"₹350",  rating:4.7, bookings:"3.2k+", gradient:"from-amber-500 to-orange-600",  imageUrl:"https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop&q=80" },
  { id:"q3", name:"Carpenter",    description:"Furniture & door fixing",          price:"₹500",  rating:4.9, bookings:"1.8k+", gradient:"from-yellow-500 to-amber-600",  imageUrl:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop&q=80" },
  { id:"q4", name:"Mason",        description:"Brickwork, plastering & tiling",   price:"₹600",  rating:4.6, bookings:"1.2k+", gradient:"from-red-500 to-rose-600",      tag:"PRO",      imageUrl:"https://images.unsplash.com/photo-1574359411659-15573a27fd0c?w=400&h=400&fit=crop&q=80" },
  { id:"q5", name:"Painter",      description:"Interior & exterior painting",     price:"₹700",  rating:4.8, bookings:"2.1k+", gradient:"from-pink-500 to-rose-600",     imageUrl:"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop&q=80" },
  { id:"q6", name:"AC Repair",    description:"AC service & installation",        price:"₹450",  rating:4.7, bookings:"2.8k+", gradient:"from-cyan-500 to-blue-600",    tag:"HOT",      imageUrl:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&q=80" },
];
const DEFAULT_OUR = [
  { id:1, name:"Plumber",     description:"Pipe repair, leakage fix, installation",  price:"₹400+", gradient:"from-blue-500 to-cyan-500",    imageUrl:"https://images.unsplash.com/photo-1542632867-261e4be41c7c?w=400&h=400&fit=crop&q=80" },
  { id:2, name:"Electrician", description:"Wiring, switch repair, fan install",       price:"₹350+", gradient:"from-amber-500 to-orange-500",  imageUrl:"https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop&q=80" },
  { id:3, name:"Carpenter",   description:"Furniture repair, door fixing",            price:"₹500+", gradient:"from-yellow-500 to-amber-600",  imageUrl:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop&q=80" },
  { id:4, name:"Mason",       description:"Brickwork, plastering, tiling",            price:"₹600+", gradient:"from-red-500 to-rose-500",      imageUrl:"https://images.unsplash.com/photo-1574359411659-15573a27fd0c?w=400&h=400&fit=crop&q=80" },
  { id:5, name:"Painter",     description:"Interior & exterior painting",             price:"₹700+", gradient:"from-pink-500 to-rose-500",     imageUrl:"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=400&fit=crop&q=80" },
  { id:6, name:"General",     description:"Custom & general service requests",        price:"₹300+", gradient:"from-indigo-500 to-violet-500", imageUrl:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80" },
];

/* ── Service Card ──────────────────────────────────────────────────────────── */
function ServiceCard({ service, onClick, showBookings, t }) {
  return (
    <div className="service-card" onClick={onClick}>
      <div className="service-card-img-wrap">
        {service.imageUrl
          ? <img src={service.imageUrl} alt={service.name} className="service-card-img" loading="lazy" />
          : <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient || "from-indigo-500 to-blue-600"}`} />
        }
        <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient || "from-indigo-500 to-blue-600"} opacity-40 mix-blend-multiply pointer-events-none`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

        {/* Rating */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          <span className="text-[9px] font-bold text-white leading-none">{service.rating ?? "4.8"}</span>
        </div>

        {/* Tag */}
        {service.tag && (
          <div className="absolute top-1.5 right-1.5 bg-white/90 px-1.5 py-0.5 rounded-full">
            <span className="text-[8px] font-extrabold text-green-700 leading-none tracking-wide">{service.tag}</span>
          </div>
        )}

        {/* Price overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-3 pointer-events-none">
          <p className="font-bold text-white text-[11px] leading-tight truncate drop-shadow">{service.name}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-white font-extrabold text-[11px] drop-shadow">{service.price || "₹400"}</span>
            {showBookings && service.bookings && (
              <span className="text-white/65 text-[8px]">{service.bookings}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "6px 7px 7px", background: "#fff" }}>
        <p className="text-[9px] text-gray-400 line-clamp-1 leading-snug mb-1">{service.description}</p>
        <button className="service-card-book-btn">{t ? t("book") : "Book"}</button>
      </div>
    </div>
  );
}

/* ── Grid Skeleton ─────────────────────────────────────────────────────────── */
function GridSkeleton({ n = 6 }) {
  return (
    <div className="service-grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: "1/1.35", borderRadius: "12px" }} />
      ))}
    </div>
  );
}

/* ── Section Header ────────────────────────────────────────────────────────── */
function SectionHead({ title, subtitle, count, stripeColor = "#1a7a4a", countBg = "#e8f5ee", countColor = "#1a7a4a" }) {
  return (
    <div className="sec-head">
      <div className="sec-head-left">
        <div className="sec-head-stripe" style={{ background: stripeColor }} />
        <div>
          <h2 className="sec-head-title">{title}</h2>
          {subtitle && <span className="sec-head-sub">{subtitle}</span>}
        </div>
      </div>
      {count != null && (
        <span className="sec-count" style={{ background: countBg, color: countColor }}>
          {count} services
        </span>
      )}
    </div>
  );
}

/* ── Banner Carousel ───────────────────────────────────────────────────────── */
function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const navigate = useNavigate();

  const go = useCallback((next) => {
    setFading(true);
    setTimeout(() => { setIdx(next); setFading(false); }, 180);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const secs = Math.max(2, Number(banners[idx]?.displaySeconds || 5));
    const t = setTimeout(() => go((idx + 1) % banners.length), secs * 1000);
    return () => clearTimeout(t);
  }, [banners, idx, go]);

  if (!banners.length) return null;
  const b = banners[idx];

  return (
    <div className="relative overflow-hidden group" style={{ margin: "0 10px 8px", borderRadius: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <div
        className={`relative h-44 lg:h-64 cursor-pointer transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
        onClick={() => navigate(b.redirectPath || "/")}
      >
        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-1 rounded-full shadow-lg tracking-wide">
            {b.tag || "OFFER"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-14">
          <p className="text-white font-extrabold text-sm lg:text-2xl drop-shadow leading-snug">{b.title}</p>
          {b.subtitle && <p className="text-white/80 text-[10px] lg:text-sm drop-shadow mt-0.5 line-clamp-1">{b.subtitle}</p>}
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); go(i); }}
                className={`rounded-full transition-all ${i === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>
      {banners.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); go((idx - 1 + banners.length) % banners.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>
          <button onClick={e => { e.stopPropagation(); go((idx + 1) % banners.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
        </>
      )}
    </div>
  );
}

/* ── Marketplace Card ──────────────────────────────────────────────────────── */
function MarketplaceCard({ service }) {
  return (
    <Link to={`/other-services/${service.id}`} style={{ display: "block", margin: "0 10px 8px" }}>
      <div className="mkt-card">
        <div className="flex p-3 gap-3">
          <div className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-md" style={{ width: 88, height: 88 }}>
            {service.imageUrl
              ? <img src={service.imageUrl} alt={service.name} className="mkt-img w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl">🛒</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 bg-white/95 px-1.5 py-0.5 rounded-md shadow">
              <p className="text-[10px] font-extrabold text-gray-900">{service.startPrice || "₹0"}</p>
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-1 mb-1">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{service.name}</h3>
                <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                  <TrendingUp className="w-2.5 h-2.5 text-green-600" />
                  <span className="text-[9px] font-bold text-green-700">Popular</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-1">{service.menuDetails}</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-gray-800">4.8</span>
                <span className="text-[10px] text-gray-400">· Menu Pricing</span>
              </div>
            </div>
            <button className="mt-2 w-full text-white font-bold text-[10px] py-1.5 rounded-xl shadow-sm btn-book-now">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Trust Badge (desktop) ─────────────────────────────────────────────────── */
function TrustBadge({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 text-white shadow-sm"
           style={{ background: "linear-gradient(135deg, #16213e, #1a7a4a)" }}>
        {icon}
      </div>
      <p className="font-bold text-gray-900 text-xs">{title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function Home() {
  const [quickServices, setQuickServices] = useState([]);
  const [ourServices, setOurServices]     = useState([]);
  const [otherServices, setOtherServices] = useState([]);
  const [banners, setBanners]             = useState([]);
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    Promise.allSettled([
      api.get("/config/banners"),
      api.get("/config/quick-services"),
      api.get("/config/our-services"),
      api.get("/config/other-services"),
    ]).then(([b, q, os, o]) => {
      setBanners(b.status === "fulfilled" ? (b.value.data || []) : []);
      setQuickServices(q.status === "fulfilled" ? (q.value.data || []) : []);
      setOurServices(os.status === "fulfilled" ? (os.value.data || []) : []);
      setOtherServices(o.status === "fulfilled" ? (o.value.data || []) : []);
    }).finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const quick = (quickServices.length > 0 ? quickServices : DEFAULT_QUICK).filter(s => !q || s.name.toLowerCase().includes(q));
  const our   = (ourServices.length > 0 ? ourServices : DEFAULT_OUR).filter(s => !q || s.name.toLowerCase().includes(q));

  const SERVICE_ID_MAP = { Plumber:1, Electrician:2, Carpenter:3, Mason:4, Painter:5, General:6 };
  const goService = (s) => navigate(`/service/${s.serviceId || SERVICE_ID_MAP[s.name] || 1}`);

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", padding: "10px 12px 12px", marginBottom: "8px" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search_placeholder") || "Search plumber, electrician, cleaning..."}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ "--tw-ring-color": "#1a7a4a" }}
          />
        </div>
      </div>

      {/* ── Banner ───────────────────────────────────────────────────────── */}
      {!loading && banners.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* ── Trust badges (desktop only) ──────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-4 gap-3" style={{ padding: "0 12px 8px", background: "#fff", marginBottom: "8px" }}>
        <TrustBadge icon={<Shield className="w-4 h-4" />}     title="Verified Pros"   subtitle="Background checked" />
        <TrustBadge icon={<Award className="w-4 h-4" />}      title="Best Rated"      subtitle="4.7+ ratings" />
        <TrustBadge icon={<TrendingUp className="w-4 h-4" />} title="50k+ Bookings"   subtitle="Happy customers" />
        <TrustBadge icon={<Star className="w-4 h-4" />}       title="100% Guarantee"  subtitle="Service warranty" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          QUICK SERVICES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="home-section">
        <SectionHead
          title={t("quick_services") || "Quick Services"}
          subtitle={`⚡ ${t("instant_booking") || "Most popular · Instant booking"}`}
          count={quick.length}
          stripeColor="#1a7a4a"
          countBg="#e8f5ee"
          countColor="#1a7a4a"
        />
        {loading
          ? <GridSkeleton n={6} />
          : quick.length === 0
            ? <p className="text-center py-8 text-sm text-gray-400">No services match "{search}"</p>
            : (
              <div className="service-grid stagger-children">
                {quick.map(s => (
                  <ServiceCard key={s.id} service={s} showBookings t={t} onClick={() => goService(s)} />
                ))}
              </div>
            )
        }
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          OUR SERVICES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="home-section">
        <SectionHead
          title={t("our_services") || "Our Services"}
          subtitle={`🛡️ ${t("book_trusted") || "Book trusted professionals in minutes"}`}
          count={our.length}
          stripeColor="#2563eb"
          countBg="#dbeafe"
          countColor="#1d4ed8"
        />
        {loading
          ? <GridSkeleton n={6} />
          : our.length === 0
            ? <p className="text-center py-8 text-sm text-gray-400">No services match "{search}"</p>
            : (
              <div className="service-grid stagger-children">
                {our.map(s => (
                  <ServiceCard key={s.id} service={s} t={t} onClick={() => navigate(`/service/${s.id}`)} />
                ))}
              </div>
            )
        }
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MARKETPLACE SERVICES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ paddingBottom: "8px" }}>
        <SectionHead
          title={t("marketplace_services") || "Marketplace Services"}
          subtitle={`📋 ${t("menu_based_pricing") || "Menu-based pricing"}`}
          stripeColor="#d97706"
          countBg="#fef3c7"
          countColor="#92400e"
        />
        {loading
          ? <div style={{ padding: "0 10px 10px" }}>{[0,1].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 8, borderRadius: 12 }} />)}</div>
          : otherServices.length === 0
            ? (
              <div style={{ margin: "0 10px 10px", border: "2px dashed #fbbf24", borderRadius: 12, background: "#fffbeb", padding: "32px 16px" }}>
                <EmptyState icon="🛒" title={t("no_marketplace_yet")} description={t("admin_publish_soon")} />
              </div>
            )
            : <div className="stagger-children">{otherServices.map(s => <MarketplaceCard key={s.id} service={s} />)}</div>
        }
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          REWARDS BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ margin: "0 10px 16px" }}>
        <div className="relative overflow-hidden p-5 lg:p-8 text-white"
             style={{ borderRadius: 16, background: "linear-gradient(135deg,#16213e 0%,#1a7a4a 100%)", boxShadow: "0 4px 20px rgba(22,33,62,0.3)" }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold leading-tight">{t("join_rewards") || "Join VMDFix Rewards!"}</h2>
              <p className="text-white/70 text-[10px] mt-0.5">{t("earn_points") || "Earn points on every booking"}</p>
            </div>
          </div>
          <p className="relative z-10 text-white/85 text-xs sm:text-sm leading-relaxed mb-4 max-w-sm">
            {t("rewards_desc") || "Get exclusive discounts, priority booking, and early-access offers."}
          </p>
          <Link to="/profile/coupons" className="relative z-10 inline-block">
            <button className="bg-white font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all" style={{ color: "#1a7a4a" }}>
              {t("view_offers") || "View Offers →"}
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
}
