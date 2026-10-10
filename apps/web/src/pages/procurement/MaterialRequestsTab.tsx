/* Tab "Permintaan Barang" (F3-J-01): penghubung proyek → gudang → procurement.
 * Baris dibuat server saat proyek mengambil material (WBS / sparepart). Sisa
 * yang kurang dipenuhi dari stok setelah barang PO masuk gudang. */
import { useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";
import { Badge, EmptyState, SearchBox, rowMatches, toast, AsyncButton } from "../../components/ui";
import { useStore, type StoreItem } from "../../data/store";
import { useFulfillMaterialRequest } from "../../data/useMaterialRequest";
import { useAuth, hasPermission } from "../../auth/auth";
import { useT } from "../../i18n/LanguageContext";
import { n_mr } from "../../i18n/n_mr";
import { fmtJumlah, fmtTanggal } from "../../utils/format";

type Filter = "Semua" | "Terbuka";

/* "Menunggu stok" = kekurangan sudah dipesan (PR jadi PO), tinggal barang masuk. */
export function mrDisplayStatus(mr: StoreItem, requisitions: StoreItem[]): string {
  const st = String(mr.status ?? "");
  if (Number(mr.shortage ?? 0) > 0) {
    const pr = requisitions.find((r) => String(r.id) === String(mr.requisitionId ?? ""));
    if (pr && String(pr.status) === "Sudah PO") return "Menunggu stok";
  }
  return st;
}

export default function MaterialRequestsTab() {
  const { locale } = useT();
  const T = n_mr[locale];
  const { data } = useStore();
  const { user } = useAuth();
  const fulfill = useFulfillMaterialRequest();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("Terbuka");
  const canIssue = hasPermission(user?.permissions, "movements", "w");

  const all = useMemo(
    () => [...(data.materialRequests ?? [])].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")) || String(b.id).localeCompare(String(a.id))),
    [data.materialRequests],
  );
  // Status tampilan (termasuk "Menunggu stok" turunan) ikut bisa dicari.
  const shown = all.filter((m) => (filter === "Semua" || Number(m.shortage ?? 0) > 0)
    && rowMatches({ ...m, shownStatus: mrDisplayStatus(m, data.requisitions ?? []) } as StoreItem, q,
      ["id", "projectId", "item", "requestedBy", "shownStatus", "requisitionId", "wbsTask"]));
  const openCount = all.filter((m) => Number(m.shortage ?? 0) > 0).length;
  const prCount = all.filter((m) => String(m.requisitionId ?? "") !== "").length;

  const stLabel: Record<string, string> = {
    "Menunggu stok": T.stWaitStock, "Dipenuhi dari stok": T.stFromStock, "Menunggu PO": T.stWaitPo,
    "Sebagian diterima": T.stPartial, Selesai: T.stDone,
  };
  const stTone = (st: string) => (st === "Selesai" || st === "Dipenuhi dari stok" ? "green" : st === "Menunggu PO" ? "red" : "amber");
  const stockOf = (itemId: unknown) => {
    const it = (data.inventory ?? []).find((i) => String(i.id) === String(itemId));
    return Math.max(0, Number(it?.stock ?? 0) || 0);
  };

  const doFulfill = async (m: StoreItem) => {
    try {
      const res = await fulfill(String(m.id), user?.name);
      toast(res.shortage === 0
        ? T.fulfilledAll.replace("{id}", String(m.id))
        : T.fulfilled.replace("{n}", fmtJumlah(res.given)).replace("{unit}", String(m.unit ?? "")).replace("{id}", String(m.id)));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "info");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-steel-600">{T.mrIntro}</p>
      <div className="grid grid-cols-3 gap-3">
        {[[T.kpiTotal, all.length], [T.kpiOpen, openCount], [T.kpiPr, prCount]].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-steel-200 bg-white px-3 py-2.5">
            <p className="text-[11px] text-steel-500">{l}</p>
            <p className="text-lg font-semibold tabular-nums text-navy-900">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder={T.mrSearch} ariaLabel={T.mrSearch} className="min-w-52 flex-1 sm:max-w-xs" />
        <div className="inline-flex rounded-lg border border-steel-200 p-0.5">
          {(["Terbuka", "Semua"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${filter === f ? "bg-navy-900 text-white" : "text-steel-600 hover:text-navy-900"}`}
            >
              {f === "Terbuka" ? `${T.mrOpen} (${openCount})` : `${T.mrAll} (${all.length})`}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={<PackageCheck className="h-6 w-6" />} title={T.mrEmptyT} subtitle={T.mrEmptyS} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                {[T.colNo, T.colId, T.colProject, T.colItem, T.colRequested, T.colIssued, T.colShortage, T.colPr, T.colStatus, T.colAction].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {shown.map((m, i) => {
                const st = mrDisplayStatus(m, data.requisitions ?? []);
                const short = Number(m.shortage ?? 0);
                const stock = stockOf(m.itemId);
                const unit = String(m.unit ?? "");
                return (
                  <tr key={String(m.id)}>
                    <td className="td tabular-nums text-steel-500">{i + 1}</td>
                    <td className="td">
                      <p className="font-mono text-xs font-semibold text-navy-900">{String(m.id)}</p>
                      <p className="text-[11px] text-steel-500">{fmtTanggal(String(m.date ?? ""))} · {String(m.requestedBy ?? "-")}</p>
                    </td>
                    <td className="td">
                      <p className="text-sm text-navy-900">{String(m.projectId ?? "-")}</p>
                      <p className="text-[11px] text-steel-500">{m.purpose === "sparepart" ? T.purposeSp : T.purposeWbs}{m.wbsTask ? ` · ${String(m.wbsTask)}` : ""}</p>
                    </td>
                    <td className="td text-sm">{String(m.item ?? m.itemId)}</td>
                    <td className="td tabular-nums">{fmtJumlah(Number(m.requested ?? 0))} {unit}</td>
                    <td className="td tabular-nums">{fmtJumlah(Number(m.issued ?? 0))}</td>
                    <td className={`td tabular-nums ${short > 0 ? "font-semibold text-ocean-700" : "text-steel-500"}`}>{fmtJumlah(short)}</td>
                    <td className="td font-mono text-xs">{String(m.requisitionId ?? "") || "-"}</td>
                    <td className="td"><Badge tone={stTone(st)}>{stLabel[st] ?? st}</Badge></td>
                    <td className="td">
                      {short > 0 && canIssue ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <AsyncButton className="btn-secondary text-xs" disabled={stock === 0} onAction={() => doFulfill(m)}>{T.fulfill}</AsyncButton>
                          <span className="text-[11px] text-steel-500">{stock === 0 ? T.noStock : T.fulfillHint.replace("{n}", fmtJumlah(stock)).replace("{unit}", unit)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-steel-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
