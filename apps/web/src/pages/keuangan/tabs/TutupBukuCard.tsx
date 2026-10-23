/* Tutup buku bulanan & tahunan (#283). Aturan & penguncian jurnal ada di
 * server (closing.ts); kartu ini hanya memanggil /api/closing. */
import { useEffect, useState } from "react";
import { AsyncButton, Badge, Card, CardHeader, toast } from "../../../components/ui";
import { apiFetch } from "../../../services/http";
import { useAuth } from "../../../auth/auth";
import { fmtRupiah, todayISO } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

interface Closed { months: string[]; years: string[]; stockValue: number }

export default function TutupBukuCard() {
  const { locale } = useT();
  const S = n_fin[locale];
  const { user } = useAuth();
  const canReopen = ["direktur", "developer"].includes(String(user?.role ?? ""));
  const [st, setSt] = useState<Closed | null>(null);
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const load = () => apiFetch<Closed>("/api/closing").then(setSt).catch(() => setSt(null));
  useEffect(() => { void load(); }, []);

  const close = async (period: string) => {
    try {
      const r = await apiFetch<{ journal: { amount?: number } | null }>("/api/closing", { method: "POST", body: JSON.stringify({ period }) });
      toast(r.journal ? S.tbYearDone.replace("{a}", period).replace("{b}", fmtRupiah(Number(r.journal.amount ?? 0))) : S.tbDone.replace("{a}", period));
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const reopen = async (period: string) => {
    try { await apiFetch(`/api/closing/${period}`, { method: "DELETE" }); toast(S.tbReopened.replace("{a}", period)); await load(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };

  if (!st) return null;
  const year = month.slice(0, 4);
  return (
    <Card className="p-4">
      <CardHeader title={S.tbTitle} subtitle={S.tbSub.replace("{a}", fmtRupiah(st.stockValue))} />
      <div className="flex flex-wrap items-center gap-2">
        <input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} aria-label={S.tbTitle} />
        <AsyncButton className="btn-secondary text-xs" onAction={() => close(month)}>{S.tbCloseMonth.replace("{a}", month)}</AsyncButton>
        <AsyncButton className="btn-primary text-xs" onAction={() => close(year)}>{S.tbCloseYear.replace("{a}", year)}</AsyncButton>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...st.years, ...st.months].length === 0 && <span className="text-xs text-steel-400">{S.tbNone}</span>}
        {[...st.years, ...st.months].map((p) => (
          <span key={p} className="flex items-center gap-1">
            <Badge tone="navy">{S.tbClosedTag.replace("{a}", p)}</Badge>
            {canReopen && <button className="text-[11px] font-semibold text-amber-600 hover:underline" onClick={() => void reopen(p)}>{S.tbReopen}</button>}
          </span>
        ))}
      </div>
    </Card>
  );
}
