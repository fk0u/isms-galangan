/* Tutup buku bulanan & tahunan (#283). Aturan & penguncian jurnal ada di
 * server (closing.ts); kartu ini hanya memanggil /api/closing. */
import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Card, CardHeader, ConfirmModal, toast } from "../../../components/ui";
import { apiFetch } from "../../../services/http";
import { useAuth } from "../../../auth/auth";
import { fmtRupiah, todayISO } from "../../../utils/format";
import ClosingArchives from "./ClosingArchives";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

interface Closed { months: string[]; years: string[]; stockValue: number; can?: { close: boolean; reopen: boolean } }

export default function TutupBukuCard() {
  const { locale } = useT();
  const S = n_fin[locale];
  const { user } = useAuth();
  const roleRaw = String(user?.role ?? "").toLowerCase();
  const [st, setSt] = useState<Closed | null>(null);
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [confirmClose, setConfirmClose] = useState<{ period: string; isYear: boolean } | null>(null);
  const [confirmReopen, setConfirmReopen] = useState<string | null>(null);
  const [arcKey, setArcKey] = useState(0);


  const load = () => apiFetch<Closed>("/api/closing").then(setSt).catch(() => setSt(null));
  useEffect(() => { void load(); }, []);

  const close = async (period: string) => {
    try {
      const r = await apiFetch<{ journal: { amount?: number } | null }>("/api/closing", { method: "POST", body: JSON.stringify({ period }) });
      toast(r.journal ? S.tbYearDone.replace("{a}", period).replace("{b}", fmtRupiah(Number(r.journal.amount ?? 0))) : S.tbDone.replace("{a}", period));
      await load();
      setArcKey((k) => k + 1);
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const reopen = async (period: string) => {
    try { await apiFetch(`/api/closing/${period}`, { method: "DELETE" }); toast(S.tbReopened.replace("{a}", period)); await load(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };

  if (!st) return null;
  /* Izin dari server (normalizeRole); string peran hanya cadangan untuk server lama. */
  const canClose = st.can?.close ?? ["finance", "pajak", "direktur", "developer"].includes(roleRaw);
  const canReopen = st.can?.reopen ?? ["direktur", "developer"].includes(roleRaw);
  const year = month.slice(0, 4);
  const allClosed = [...st.years, ...st.months];

  return (
    <>
    <Card className="p-4">
      <CardHeader title={S.tbTitle} subtitle={S.tbSub.replace("{a}", fmtRupiah(st.stockValue))} />
      <div className="flex flex-wrap items-center gap-2">
        <input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} aria-label={S.tbTitle} />
        <button
          type="button"
          className="btn-secondary text-xs inline-flex items-center gap-1.5"
          onClick={() => setConfirmClose({ period: month, isYear: false })}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>{S.tbCloseMonth.replace("{a}", month)}</span>
        </button>
        <button
          type="button"
          className="btn-primary text-xs inline-flex items-center gap-1.5"
          onClick={() => setConfirmClose({ period: year, isYear: true })}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>{S.tbCloseYear.replace("{a}", year)}</span>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-steel-500">{S.tbLockStatus}:</span>
        {allClosed.length === 0 && <span className="text-xs text-steel-400">{S.tbNone}</span>}
        {allClosed.map((p) => (
          <div
            key={p}
            className="inline-flex items-center gap-2 rounded-lg border border-steel-200 bg-surface px-2.5 py-1 text-xs shadow-xs"
          >
            <span className="inline-flex items-center gap-1.5 font-medium text-navy-900">
              <Lock className="h-3.5 w-3.5 text-navy-600 shrink-0" />
              <span>{S.tbLockedBadge.replace("{a}", p)}</span>
            </span>
            {canReopen && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                onClick={() => setConfirmReopen(p)}
                title={S.tbConfirmReopenTitle.replace("{a}", p)}
              >
                <Unlock className="h-3 w-3" />
                <span>{S.tbUnlockBtn}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmClose}
        title={S.tbConfirmCloseTitle.replace("{a}", confirmClose?.period ?? "")}
        desc={confirmClose?.isYear
          ? S.tbConfirmCloseYearDesc.replace("{a}", confirmClose.period).replace("{s}", fmtRupiah(st.stockValue))
          : S.tbConfirmCloseDesc.replace("{a}", confirmClose?.period ?? "")
        }
        confirmLabel={confirmClose?.isYear ? S.tbCloseYear.replace("{a}", confirmClose.period) : S.tbCloseMonth.replace("{a}", confirmClose?.period ?? "")}
        onCancel={() => setConfirmClose(null)}
        onConfirm={async () => {
          if (confirmClose) {
            const p = confirmClose.period;
            setConfirmClose(null);
            await close(p);
          }
        }}
      />

      <ConfirmModal
        open={!!confirmReopen}
        title={S.tbConfirmReopenTitle.replace("{a}", confirmReopen ?? "")}
        desc={S.tbConfirmReopenDesc.replace("{a}", confirmReopen ?? "")}
        confirmLabel={S.tbUnlockBtn}
        danger
        onCancel={() => setConfirmReopen(null)}
        onConfirm={async () => {
          if (confirmReopen) {
            const p = confirmReopen;
            setConfirmReopen(null);
            await reopen(p);
          }
        }}
      />
    </Card>
    <ClosingArchives canClose={canClose} locked={allClosed} refreshKey={arcKey} />
    </>
  );
}
