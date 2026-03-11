import { Home, MessageCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const items = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/ask-ai", label: t("ask_ai"), icon: MessageCircle },
    { path: "/profile", label: t("profile"), icon: User },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 glass border-t border-gray-100">
      <div className="mx-auto flex w-full max-w-screen-sm items-center justify-around px-2 py-1.5">
        {items.map(({ path, label, icon: Icon }) => {
          const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all ${
                active ? "" : "text-gray-400 hover:text-gray-600"
              }`}
              style={active ? { color: "#1a7a4a" } : {}}
            >
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-xl transition-all`}
                   style={active ? { background: "#e8f5ee" } : {}}>
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: "#1a7a4a" }} />
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none`}
                    style={active ? { color: "#1a7a4a" } : {}}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
