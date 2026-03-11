import { useEffect, useState } from "react";
import { getWallet, getLedger } from "../api/api";
import { useNavigate } from "react-router-dom";
import { EmptyState, PageContainer, PrimaryButton } from "../components/ui";
import { ArrowDownCircle, ArrowUpCircle, Wallet as WalletIcon } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return navigate("/login");
    getWallet(user.id).then(r => setWallet(r.data)).catch(() => {});
    getLedger(user.id).then(r => setLedger(r.data || [])).catch(() => {});
  }, []);

  return (
    <PageContainer title={t("wallet")} subtitle={t("cashback_balance")}>
      {/* Balance card */}
      <div className="rounded-2xl gradient-primary p-5 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center gap-2 mb-2">
          <WalletIcon size={16} className="text-white/70" />
          <p className="text-xs font-semibold text-white/70">{t("cashback_balance")}</p>
        </div>
        <p className="text-4xl font-bold">₹{wallet?.balance ?? "—"}</p>
        {/* FIX: Withdraw button with explicit visible styling */}
        <button
          onClick={() => navigate("/profile/withdraw")}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm px-5 py-2.5 transition-colors shadow-sm"
        >
          {t("withdraw")}
        </button>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">{t("transaction_history")}</h2>
        {ledger.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8">
            <EmptyState icon="💳" title={t("no_transactions")} description={t("no_transactions_desc")} />
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {ledger.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${entry.type === "CREDIT" ? "bg-emerald-100" : "bg-red-100"}`}>
                  {entry.type === "CREDIT"
                    ? <ArrowDownCircle size={16} className="text-emerald-600" />
                    : <ArrowUpCircle size={16} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{entry.type}</p>
                  <p className="text-xs text-gray-400">{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}</p>
                </div>
                <p className={`font-bold text-sm ${entry.type === "CREDIT" ? "text-emerald-600" : "text-red-500"}`}>
                  {entry.type === "CREDIT" ? "+" : "-"}₹{entry.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
