import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Card, InputField, PageContainer, PrimaryButton } from "../components/ui";
import { Banknote, Info } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleWithdraw = async () => {
    if (!user) return navigate("/login");
    if (!amount || Number(amount) < 500) return alert(t("min_500"));
    setLoading(true);
    try {
      const res = await api.post(`/wallet/${user.id}/withdraw`, { amount: Number(amount) });
      alert("Withdrawal requested! ID: " + res.data.id);
      navigate("/profile/wallet");
    } catch (e) { alert(e.response?.data || "Withdrawal failed"); }
    finally { setLoading(false); }
  };

  const AMOUNTS = [500, 1000, 2000, 5000];

  return (
    <PageContainer title={t("withdraw_cashback")} subtitle={t("transfer_earnings")}>
      <Card>
        <div className="flex items-center gap-2.5 rounded-xl bg-blue-50 border border-blue-100 p-3 mb-4">
          <Info size={14} className="text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700 font-medium">{t("min_note")}</p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`rounded-xl border py-2 text-sm font-bold transition-all ${amount === String(a) ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-200"}`}>
                ₹{a}
              </button>
            ))}
          </div>
        </div>

        <InputField
          type="number"
          label={t("custom_amount")}
          placeholder={t("amount_placeholder")}
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <PrimaryButton
          onClick={handleWithdraw}
          disabled={loading || !amount || Number(amount) < 500}
          className="mt-5 w-full py-3"
        >
          <Banknote size={15} />
          {loading ? t("processing") : `${t("withdraw_label")} ₹${amount || 0}`}
        </PrimaryButton>
      </Card>
    </PageContainer>
  );
}
