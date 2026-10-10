/* Tab Inventori "Terima & Keluar" (F3-G-04 BOM terima/keluar, F3-G-03 eceran/potongan).
 * - Terima: checklist PO yang sedang dikirim → receive transaksional (F3-J-02),
 *   termasuk pemenuhan otomatis permintaan proyek; Additional wajib alasan.
 * - Keluar: checklist permintaan proyek (F3-J-01) → penuhi dari stok;
 *   Additional dengan satuan dasar (eceran) atau ukuran potongan (plat). */
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { AsyncButton, Card, EmptyState, Field, FormGrid, NumInput, toast } from "../../../components/ui";
import { useStore, type StoreItem } from "../../../data/store";
import { useAuth } from "../../../auth/auth";
import { poIsMultiItem, poOpenQty, usePoActions } from "../../../data/usePoActions";
import { useFulfillMaterialRequest } from "../../../data/useMaterialRequest";
import { useStockIssue } from "../../../data/useStockIssue";
import { unitConversionOf } from "../../../utils/unitConversion";
import { formatStockWithBase } from "../../../utils/stockIssue";
import { fmtJumlah, todayISO } from "../../../utils/format";
import { useT } from "../../../i18n/LanguageContext";
import { n_recv } from "../../../i18n/n_recv";

const RECEIVABLE = new Set(["Dikirim", "Dalam Pengiriman", "Diterima Sebagian"]);

export default function ReceiveIssueTab() {
  const { locale } = useT();
  const T = n_recv[locale];
  const { data, add, update } = useStore();
  const { user } = useAuth();
  const actor = user?.name ?? "Gudang";
  const poActions = usePoActions();
  const fulfill = useFulfillMaterialRequest();
  const issue = useStockIssue();
  const inventory = data.inventory ?? [];

  // ---------- Terima dari PO ----------
  const receivable = useMemo(
    () => (data.purchaseOrders ?? []).filter((p) => RECEIVABLE.has(String(p.status)) && poOpenQty(p) > 0 && !poIsMultiItem(p)),
    [data.purchaseOrders],
  );
  const [inPick, setInPick] = useState<Record<string, { on: boolean; qty: string; itemId: string }>>({});
  const pickOf = (p: StoreItem) => inPick[String(p.id)] ?? {
    on: false, qty: Number(p.qty || 0) > 0 ? String(poOpenQty(p)) : "", itemId: String(p.itemId ?? ""),
  };
  const setPick = (p: StoreItem, patch: Partial<{ on: boolean; qty: string; itemId: string }>) =>
    setInPick((m) => ({ ...m, [String(p.id)]: { ...pickOf(p), ...patch } }));
  const ticked = receivable.filter((p) => pickOf(p).on);

  const receiveTicked = async () => {
    let done = 0;
    const auto: string[] = [];
    for (const p of ticked) {
      const pk = pickOf(p);
      const qty = Number(pk.qty);
      if (!(qty > 0) || !pk.itemId) { toast(`${String(p.id)}: ${T.qtyInvalid}`, "info"); continue; }
      try {
        const out = await poActions.receive(p, { qty, itemId: pk.itemId, actor });
        done += 1;
        auto.push(...out.fulfilled.map((f) => f.id));
      } catch (e) { toast(`${String(p.id)}: ${e instanceof Error ? e.message : String(e)}`, "info"); }
    }
    setInPick({});
    if (done > 0) toast(T.inDone.replace("{n}", String(done)));
    if (auto.length > 0) toast(T.inAuto.replace("{n}", auto.join(", ")));
  };

  // ---------- Additional masuk ----------
  const [addIn, setAddIn] = useState({ itemId: "", qty: "", reason: "" });
  const saveAddIn = async () => {
    const item = inventory.find((i) => String(i.id) === addIn.itemId);
    const qty = Number(addIn.qty);
    if (!item || !(qty > 0)) { toast(T.qtyInvalid, "info"); return; }
    if (!addIn.reason.trim()) { toast(T.reasonReq, "info"); return; }
    await update("inventory", String(item.id), { stock: Number(item.stock || 0) + qty });
    await add("movements", {
      item: String(item.name), itemId: String(item.id), type: "Penerimaan", qty, unit: String(item.unit ?? "pcs"),
      by: `Additional - ${addIn.reason.trim()}`, date: todayISO(), tone: "in", note: addIn.reason.trim(), additional: true,
    }, { action: "barang masuk additional", target: `${String(item.name)} × ${qty}`, module: "Inventori" });
    toast(T.addInDone.replace("{n}", `${String(item.name)} × ${fmtJumlah(qty)}`));
    setAddIn({ itemId: "", qty: "", reason: "" });
  };

  // ---------- Keluar untuk permintaan ----------
  const waiting = useMemo(
    () => (data.materialRequests ?? []).filter((m) => Number(m.shortage ?? 0) > 0)
      .sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? ""))),
    [data.materialRequests],
  );
  const [outPick, setOutPick] = useState<Set<string>>(new Set());
  const stockOf = (itemId: unknown) => inventory.find((i) => String(i.id) === String(itemId));
  const issueTicked = async () => {
    let done = 0;
    for (const id of outPick) {
      try { await fulfill(id, actor); done += 1; } catch (e) { toast(`${id}: ${e instanceof Error ? e.message : String(e)}`, "info"); }
    }
    setOutPick(new Set());
    if (done > 0) toast(T.outDone.replace("{n}", String(done)));
  };

  // ---------- Additional keluar (eceran / potongan / biasa) ----------
  const [addOut, setAddOut] = useState({ itemId: "", qty: "", cutL: "", cutW: "", reason: "" });
  const outItem = inventory.find((i) => String(i.id) === addOut.itemId);
  const outConv = outItem ? unitConversionOf(outItem) : null;
  const isPlate = !!outConv?.dims?.lengthMm && !!outConv?.dims?.widthMm;
  const saveAddOut = async () => {
    if (!outItem) { toast(T.qtyInvalid, "info"); return; }
    if (!addOut.reason.trim()) { toast(T.reasonReq, "info"); return; }
    try {
      if (outConv) {
        const res = await issue({
          itemId: String(outItem.id), note: addOut.reason.trim(), actor,
          ...(isPlate ? { cut: { lengthMm: Number(addOut.cutL), widthMm: Number(addOut.cutW) } } : { qty: Number(addOut.qty) }),
        });
        toast(T.outAddDone.replace("{n}", `${String(outItem.name)} ${fmtJumlah(res.baseQty)} ${res.baseUnit}`));
      } else {
        const qty = Number(addOut.qty);
        if (!(qty > 0)) { toast(T.qtyInvalid, "info"); return; }
        if (qty > Number(outItem.stock || 0)) { toast(T.stockShort, "info"); return; }
        await update("inventory", String(outItem.id), { stock: Number(outItem.stock || 0) - qty });
        await add("movements", {
          item: String(outItem.name), itemId: String(outItem.id), type: "Pengeluaran", qty, unit: String(outItem.unit ?? "pcs"),
          by: `Additional - ${addOut.reason.trim()}`, date: todayISO(), tone: "out", note: addOut.reason.trim(), additional: true,
        }, { action: "barang keluar additional", target: `${String(outItem.name)} × ${qty}`, module: "Inventori" });
        toast(T.outAddDone.replace("{n}", `${String(outItem.name)} × ${fmtJumlah(qty)}`));
      }
      setAddOut({ itemId: "", qty: "", cutL: "", cutW: "", reason: "" });
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };

  const stockLabel = (it: StoreItem) =>
    formatStockWithBase({ stock: Number(it.stock || 0), openBase: Number(it.openBase || 0) }, String(it.unit ?? ""), unitConversionOf(it));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* ===== MASUK ===== */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-900"><ArrowDownToLine className="h-4 w-4" /> {T.inTitle}</h3>
          <p className="mb-3 mt-0.5 text-xs text-steel-500">{T.inSub}</p>
          {receivable.length === 0 ? <EmptyState title={T.inEmpty} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>{["", T.colPo, T.colItem, T.colOpen, T.colQty].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-steel-100">
                  {receivable.map((p) => {
                    const pk = pickOf(p);
                    return (
                      <tr key={String(p.id)}>
                        <td className="td w-8"><input type="checkbox" aria-label={String(p.id)} checked={pk.on} onChange={(e) => setPick(p, { on: e.target.checked })} /></td>
                        <td className="td"><p className="font-mono text-xs font-semibold text-navy-900">{String(p.id)}</p><p className="text-[11px] text-steel-500">{String(p.vendor ?? "")}</p></td>
                        <td className="td text-sm">
                          {p.itemId ? String(p.item ?? p.itemId) : (
                            <select className="input h-8 py-0 text-xs" value={pk.itemId} onChange={(e) => setPick(p, { itemId: e.target.value })}>
                              <option value="">{T.pickItem}</option>
                              {inventory.map((i) => <option key={String(i.id)} value={String(i.id)}>{String(i.name)}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="td text-xs tabular-nums">{Number(p.qty || 0) > 0 ? fmtJumlah(poOpenQty(p)) : "-"}</td>
                        <td className="td w-28"><NumInput min={0} className="input h-8 py-0 text-xs" value={pk.qty} onChange={(e) => setPick(p, { qty: e.target.value, on: true })} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {receivable.length > 0 && (
            <AsyncButton className="btn-primary mt-3 text-xs" disabled={ticked.length === 0} onAction={receiveTicked}>{T.inBtn.replace("{n}", String(ticked.length))}</AsyncButton>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-navy-900">{T.addInTitle}</h3>
          <FormGrid>
            <Field label={T.item}>
              <select className="input" value={addIn.itemId} onChange={(e) => setAddIn({ ...addIn, itemId: e.target.value })}>
                <option value="">{T.pickItem}</option>
                {inventory.map((i) => <option key={String(i.id)} value={String(i.id)}>{String(i.name)} · {stockLabel(i)}</option>)}
              </select>
            </Field>
            <Field label={T.qty}><NumInput min={0} className="input" value={addIn.qty} onChange={(e) => setAddIn({ ...addIn, qty: e.target.value })} /></Field>
          </FormGrid>
          <Field label={T.reason}><input className="input" maxLength={300} value={addIn.reason} onChange={(e) => setAddIn({ ...addIn, reason: e.target.value })} placeholder={T.reasonPh} /></Field>
          <AsyncButton className="btn-secondary mt-3 text-xs" onAction={saveAddIn}>{T.save}</AsyncButton>
        </Card>
      </div>

      {/* ===== KELUAR ===== */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-900"><ArrowUpFromLine className="h-4 w-4" /> {T.outTitle}</h3>
          <p className="mb-3 mt-0.5 text-xs text-steel-500">{T.outSub}</p>
          {waiting.length === 0 ? <EmptyState title={T.outEmpty} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>{["", T.colMr, T.colItem, T.colShort, T.colStock].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-steel-100">
                  {waiting.map((m) => {
                    const it = stockOf(m.itemId);
                    // Pemenuhan permintaan memakai kemasan utuh (stock); sisa kemasan terbuka lewat Additional.
                    const hasStock = Number(it?.stock ?? 0) > 0;
                    return (
                      <tr key={String(m.id)}>
                        <td className="td w-8">
                          <input type="checkbox" aria-label={String(m.id)} disabled={!hasStock} checked={outPick.has(String(m.id))}
                            onChange={(e) => setOutPick((s) => { const n = new Set(s); if (e.target.checked) n.add(String(m.id)); else n.delete(String(m.id)); return n; })} />
                        </td>
                        <td className="td"><p className="font-mono text-xs font-semibold text-navy-900">{String(m.id)}</p><p className="text-[11px] text-steel-500">{String(m.projectId ?? "")}</p></td>
                        <td className="td text-sm">{String(m.item ?? m.itemId)}</td>
                        <td className="td text-xs font-semibold tabular-nums text-ocean-700">{fmtJumlah(Number(m.shortage ?? 0))} {String(m.unit ?? "")}</td>
                        <td className="td text-xs text-steel-600">{it ? stockLabel(it) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {waiting.length > 0 && (
            <AsyncButton className="btn-primary mt-3 text-xs" disabled={outPick.size === 0} onAction={issueTicked}>{T.outBtn.replace("{n}", String(outPick.size))}</AsyncButton>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-navy-900">{T.addOutTitle}</h3>
          <Field label={T.item}>
            <select className="input" value={addOut.itemId} onChange={(e) => setAddOut({ ...addOut, itemId: e.target.value })}>
              <option value="">{T.pickItem}</option>
              {inventory.map((i) => <option key={String(i.id)} value={String(i.id)}>{String(i.name)} · {stockLabel(i)}</option>)}
            </select>
          </Field>
          {outItem && outConv && isPlate ? (
            <>
              <FormGrid>
                <Field label={T.cutL}><NumInput min={0} className="input" value={addOut.cutL} onChange={(e) => setAddOut({ ...addOut, cutL: e.target.value })} /></Field>
                <Field label={T.cutW}><NumInput min={0} className="input" value={addOut.cutW} onChange={(e) => setAddOut({ ...addOut, cutW: e.target.value })} /></Field>
              </FormGrid>
              <p className="mt-1 text-[11px] text-steel-500">{T.cutHint.replace("{L}", fmtJumlah(Number(outConv.dims?.lengthMm))).replace("{W}", fmtJumlah(Number(outConv.dims?.widthMm))).replace("{kg}", fmtJumlah(Number(outConv.dims?.weightKg ?? outConv.perUnit)))}</p>
            </>
          ) : (
            <Field label={outConv ? T.unitBase.replace("{u}", outConv.baseUnit) : T.qty} hint={outItem && outConv ? T.eceranHint.replace("{u}", outConv.baseUnit).replace("{s}", stockLabel(outItem)) : undefined}>
              <NumInput min={0} step={0.01} className="input" value={addOut.qty} onChange={(e) => setAddOut({ ...addOut, qty: e.target.value })} />
            </Field>
          )}
          <Field label={T.reason}><input className="input" maxLength={300} value={addOut.reason} onChange={(e) => setAddOut({ ...addOut, reason: e.target.value })} placeholder={T.reasonPh} /></Field>
          <AsyncButton className="btn-secondary mt-3 text-xs" onAction={saveAddOut}>{T.save}</AsyncButton>
        </Card>
      </div>
    </div>
  );
}
