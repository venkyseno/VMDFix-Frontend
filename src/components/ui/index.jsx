import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function PageContainer({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`w-full max-w-screen-lg mx-auto px-3 sm:px-5 py-4 space-y-5 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

function buttonBase(cls) {
  return `inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${cls}`;
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button className={buttonBase(`bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 px-4 py-2.5 text-sm ${className}`)} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button className={buttonBase(`border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2.5 text-sm ${className}`)} {...props}>
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", ...props }) {
  return (
    <button className={buttonBase(`bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-4 py-2.5 text-sm ${className}`)} {...props}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button className={buttonBase(`text-indigo-600 hover:bg-indigo-50 px-3 py-2 text-sm ${className}`)} {...props}>
      {children}
    </button>
  );
}

export function InputField({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>}
      <input
        className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all ${className}`}
        {...props}
      />
    </label>
  );
}

export function SelectField({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>}
      <select
        className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>}
      <textarea
        className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all resize-none ${className}`}
        {...props}
      />
    </label>
  );
}

export function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DataTable({ columns, data }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50/80">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-gray-50/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Avatar({ name, size = "md" }) {
  const initial = (name || "U").charAt(0).toUpperCase();
  const sizes = { sm: "h-8 w-8 text-sm", md: "h-11 w-11 text-base", lg: "h-14 w-14 text-xl" };
  return (
    <div className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white ${sizes[size] || sizes.md}`}>
      {initial}
    </div>
  );
}

export function StatCard({ title, value, icon, tone = "indigo" }) {
  const tones = {
    indigo: { bg: "from-indigo-500 to-indigo-600", light: "bg-indigo-50", text: "text-indigo-600" },
    purple: { bg: "from-purple-500 to-violet-600", light: "bg-purple-50", text: "text-purple-600" },
    emerald: { bg: "from-emerald-500 to-teal-500", light: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "from-amber-500 to-orange-400", light: "bg-amber-50", text: "text-amber-600" },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${t.bg} text-white flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function NavCardLink({ to, title, subtitle, icon }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        {icon && <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">{icon}</div>}
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
    </Link>
  );
}

export function Divider({ className = "" }) {
  return <div className={`border-t border-gray-100 ${className}`} />;
}
