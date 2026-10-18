/* Material yang dibutuhkan per tahapan WBS (catatan klien 17 Okt, K17-PM-03).
   Sumber tunggal tetap BOM proyek (ADR-0020): satu baris per (proyek, material),
   dan tiap baris membawa `alokasi` [{wbsTask, qty}]. Menambah material ke
   tahapan membuat baris BOM bila belum ada, atau menaikkan kebutuhan BOM bila
   total alokasi melampauinya. Server memvalidasi alokasi (domainGuards). */
import { useState } from "react";
import { Modal, Field, FormGrid, NumInput, toast } from "../../components/ui";
import { SearchSelect } from "../../components/SearchSelect";
import { useStore, type StoreItem } from "../../data/store";
import { useAuth, hasPermission } from "../../auth/auth";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import { fmtJumlah } from "../../utils/format";

export interface BomAllocation { wbsTask: string; qty: number }

export function allocationsOf(row: StoreItem): BomAllocation[] {
  const raw = Array.isArray(row.alokasi) ? row.alokasi : [];
  return raw
    .map((a) => (typeof a === "object" && a !== null ? a as Record<string, unknown> : {}))
    .map((a) => ({ wbsTask: String(a.wbsTask ?? "").trim(), qty: Number(a.qty) || 0 }))
    .filter((a) => a.wbsTask !== "" && a.qty > 0);
}

/** Jumlah material yang dialokasikan ke satu tahapan proyek. */
export function stageMaterialCount(bomItems: readonly StoreItem[], projectId: string, task: string): number {
  return bomItems.filter((b) => String(b.projectId) === projectId && allocationsOf(b).some((a) => a.wbsTask === task)).length;
}

export default function WbsMaterialModal({ projectId, task, onClose }: { projectId: string; task: string | null; onClose: () => void }) {
  const { data, add, update, log } = useStore();
  const { user } = useAuth();
  const { locale } = useT();
  const S = n_prj[locale];
  const canWrite = hasPermission(user?.permissions, "bomItems", "w");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);

  const projectBom = (data.bomItems ?? []).filter((b) => String(b.projectId) === projectId);
  const rows = task
    ? projectBom.flatMap((b) => allocationsOf(b).filter((a) => a.wbsTask === task).map((a) => ({ bom: b, qty: a.qty })))
    : [];
  const inventory = data.inventory ?? [];

  const save = async (): Promise<void> => {
    if (!task) return;
    const n = Number(qty);
    if (!itemId) { toast(S.wbsMatPick, "info"); return; }
    if (!(n > 0)) { toast(S.wbsMatQty, "info"); return; }
    const inv = inventory.find((i) => String(i.id) === itemId);
    const existing = projectBom.find((b) => String(b.itemId) === itemId);
    setBusy(true);
    try {
      if (existing) {
        const alokasi = [...allocationsOf(existing).filter((a) => a.wbsTask !== task), { wbsTask: task, qty: n }];
        const total = alokasi.reduce((s, a) => s + a.qty, 0);
        const need = Math.max(Number(existing.need) || 0, total);
        await update("bomItems", String(existing.id), { alokasi, need });
      } else {
        await add("bomItems", {
          projectId, itemId, item: String(inv?.name ?? itemId), unit: String(inv?.unit ?? ""),
          need: n, note: "", alokasi: [{ wbsTask: task, qty: n }],
        }, { action: "menambah BOM proyek", target: `${projectId} · ${String(inv?.name ?? itemId)}`, module: "Proyek" });
      }
      log("mengalokasikan material ke tahap WBS", `${projectId} · ${task} · ${String(inv?.name ?? itemId)} × ${fmtJumlah(n)}`, "Proyek");
      toast(S.wbsMatSaved);
      setItemId("");
      setQty("");
    } catch (e) {
      toast(e instanceof Error ? e.message : S.wbsMatFail, "info");
    } finally {
      setBusy(false);
    }
  };

  const removeRow = async (bom: StoreItem): Promise<void> => {
    if (!task) return;
    try {
      await update("bomItems", String(bom.id), { alokasi: allocationsOf(bom).filter((a) => a.wbsTask !== task) });
      log("melepas material dari tahap WBS", `${projectId} · ${task} · ${String(bom.item ?? bom.itemId)}`, "Proyek");
    } catch (e) {
      toast(e instanceof Error ? e.message : S.wbsMatFail, "info");
    }
  };

  return (
    <Modal open={task !== null} onClose={onClose} title={S.wbsMatTitle.replace("{a}", task ?? "")} subtitle={S.wbsMatSub} wide
      footer={<button className="btn-secondary" onClick={onClose}>{S.cancelBtn}</button>}>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-lg bg-surface px-3 py-4 text-center text-sm text-steel-400">{S.wbsMatEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr><th className="th">{S.wbsMatColItem}</th><th className="th text-right">{S.wbsMatColQty}</th><th className="th text-right">{S.wbsMatColBom}</th>{canWrite && <th className="th" />}</tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {rows.map(({ bom, qty: q }) => (
                  <tr key={String(bom.id)}>
                    <td className="td text-sm font-medium text-navy-900">{String(bom.item ?? bom.itemId)}</td>
                    <td className="td text-right text-sm">{fmtJumlah(q)} {String(bom.unit ?? "")}</td>
                    <td className="td text-right text-xs text-steel-500">{fmtJumlah(Number(bom.need) || 0)} {String(bom.unit ?? "")}</td>
                    {canWrite && (
                      <td className="td text-right">
                        <button className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => void removeRow(bom)}>{S.wbsMatRemove}</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canWrite && (
          <div className="rounded-xl border border-steel-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-500">{S.wbsMatAdd}</p>
            <FormGrid>
              <Field label={S.wbsMatColItem}>
                <SearchSelect value={itemId} onChange={setItemId} ariaLabel={S.wbsMatColItem} placeholder={S.wbsMatPick} emptyText={S.wbsMatNoItem}
                  options={inventory.map((i) => ({ value: String(i.id), label: String(i.name ?? i.id), subLabel: `${String(i.sku ?? i.id)} · ${String(i.unit ?? "")}` }))} />
              </Field>
              <Field label={S.wbsMatColQty} hint={S.wbsMatQtyHint}>
                <NumInput min={0} className="input" value={qty} onChange={(e) => setQty(e.target.value)} />
              </Field>
            </FormGrid>
            <div className="mt-3 flex justify-end">
              <button className="btn-primary text-xs" disabled={busy} onClick={() => void save()}>{S.wbsMatSave}</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
