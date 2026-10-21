/* Tab Inventori "Terima & Keluar" (F3-G-04 BOM terima/keluar, F3-G-03 eceran/potongan).
 * - Terima: checklist PO yang sedang dikirim -> receive transaksional (F3-J-02),
 *   termasuk pemenuhan otomatis permintaan proyek; Additional wajib alasan;
 *   lokasi simpan (gudang/rak/bin).
 * - Keluar: checklist permintaan proyek (F3-J-01), procurement alokasi PO proyek,
 *   dan Additional dengan satuan dasar (eceran) atau ukuran potongan (plat). */
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, PackageCheck } from "lucide-react";
import { AsyncButton, Card, EmptyState, Field, FormGrid, NumInput, toast } from "../../../components/ui";
import { useStore, type StoreItem } from "../../../data/store";
import { useAuth } from "../../../auth/auth";
import { poIsMultiItem, poOpenQty, usePoActions } from "../../../data/usePoActions";
import { useFulfillMaterialRequest, useApproveMaterialRequest } from "../../../data/useMaterialRequest";
import { useStockIssue } from "../../../data/useStockIssue";
import { unitConversionOf } from "../../../utils/unitConversion";
import { formatStockWithBase } from "../../../utils/stockIssue";
import { fmtJumlah, todayISO } from "../../../utils/format";
import { allWarehouseNames } from "../../../utils/warehouse";
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
  const approveMr = useApproveMaterialRequest();
  const issue = useStockIssue();
  const inventory = useMemo(() => data.inventory ?? [], [data.inventory]);

  // Filter segmented: Masuk & Keluar
  const [filterIn, setFilterIn] = useState<"all" | "procurement" | "additional">("all");
  const [filterOut, setFilterOut] = useState<"all" | "checklist" | "procurement" | "additional">("all");

  // Daftar nama gudang terdaftar
  const warehouses = useMemo(
    () => allWarehouseNames(data.warehouses, inventory),
    [data.warehouses, inventory],
  );

  // ---------- Terima dari PO ----------
  const receivable = useMemo(
    () => (data.purchaseOrders ?? []).filter((p) => RECEIVABLE.has(String(p.status)) && poOpenQty(p) > 0 && !poIsMultiItem(p)),
    [data.purchaseOrders],
  );
  const [inPick, setInPick] = useState<Record<string, {
    on: boolean;
    qty: string;
    itemId: string;
    warehouse?: string;
    rack?: string;
    bin?: string;
  }>>({});

  const pickOf = (p: StoreItem) => {
    const existing = inPick[String(p.id)];
    const defItemId = String(p.itemId ?? "");
    const curItemId = existing?.itemId ?? defItemId;
    const it = inventory.find((i) => String(i.id) === curItemId);
    return {
      on: existing?.on ?? false,
      qty: existing?.qty ?? (Number(p.qty || 0) > 0 ? String(poOpenQty(p)) : ""),
      itemId: curItemId,
      warehouse: existing?.warehouse ?? (it?.warehouse ? String(it.warehouse) : (warehouses[0] ?? "")),
      rack: existing?.rack ?? (it?.rack ? String(it.rack) : (it?.location ? String(it.location) : "")),
      bin: existing?.bin ?? (it?.bin ? String(it.bin) : ""),
    };
  };

  const setPick = (p: StoreItem, patch: Partial<{
    on: boolean;
    qty: string;
    itemId: string;
    warehouse: string;
    rack: string;
    bin: string;
  }>) =>
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
        const out = await poActions.receive(p, {
          qty,
          itemId: pk.itemId,
          actor,
          warehouse: pk.warehouse || undefined,
          rack: pk.rack || undefined,
          bin: pk.bin || undefined,
        });
        done += 1;
        auto.push(...out.fulfilled.map((f) => f.id));
      } catch (e) { toast(`${String(p.id)}: ${e instanceof Error ? e.message : String(e)}`, "info"); }
    }
    setInPick({});
    if (done > 0) toast(T.inDone.replace("{n}", String(done)));
    if (auto.length > 0) toast(T.inAuto.replace("{n}", auto.join(", ")));
  };

  // ---------- Additional masuk ----------
  const [addIn, setAddIn] = useState({
    itemId: "",
    qty: "",
    reason: "",
    warehouse: "",
    rack: "",
    bin: "",
  });

  const onSelectAddInItem = (itemId: string) => {
    const it = inventory.find((i) => String(i.id) === itemId);
    setAddIn((prev) => ({
      ...prev,
      itemId,
      warehouse: it?.warehouse ? String(it.warehouse) : (warehouses[0] ?? ""),
      rack: it?.rack ? String(it.rack) : (it?.location ? String(it.location) : ""),
      bin: it?.bin ? String(it.bin) : "",
    }));
  };

  const saveAddIn = async () => {
    const item = inventory.find((i) => String(i.id) === addIn.itemId);
    const qty = Number(addIn.qty);
    if (!item || !(qty > 0)) { toast(T.qtyInvalid, "info"); return; }
    if (!addIn.reason.trim()) { toast(T.reasonReq, "info"); return; }
    const invPatch: Record<string, unknown> = { stock: Number(item.stock || 0) + qty };
    if (addIn.warehouse) invPatch.warehouse = addIn.warehouse;
    if (addIn.rack) {
      invPatch.rack = addIn.rack;
      invPatch.location = addIn.rack;
    }
    if (addIn.bin) invPatch.bin = addIn.bin;
    await update("inventory", String(item.id), invPatch);
    await add("movements", {
      item: String(item.name),
      itemId: String(item.id),
      type: "Penerimaan",
      qty,
      unit: String(item.unit ?? "pcs"),
      by: `Additional - ${addIn.reason.trim()}`,
      date: todayISO(),
      tone: "in",
      note: addIn.reason.trim(),
      additional: true,
      warehouse: addIn.warehouse || undefined,
      rack: addIn.rack || undefined,
      bin: addIn.bin || undefined,
    }, { action: "barang masuk additional", target: `${String(item.name)} × ${qty}`, module: "Inventori" });
    toast(T.addInDone.replace("{n}", `${String(item.name)} × ${fmtJumlah(qty)}`));
    setAddIn({ itemId: "", qty: "", reason: "", warehouse: "", rack: "", bin: "" });
  };

  // ---------- Keluar untuk permintaan (Checklist MR) ----------
  const waiting = useMemo(
    () => (data.materialRequests ?? []).filter((m) =>
      (m.status === "Menunggu Approval Gudang" || Number(m.shortage ?? 0) > 0) &&
      m.status !== "Ditolak Gudang" && m.status !== "Selesai" && m.status !== "Dipenuhi dari stok"
    ).sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? ""))),
    [data.materialRequests],
  );
  const [outPick, setOutPick] = useState<Set<string>>(new Set());
  const stockOf = (itemId: unknown) => inventory.find((i) => String(i.id) === String(itemId));
  const issueTicked = async () => {
    let done = 0;
    for (const id of outPick) {
      const mr = (data.materialRequests ?? []).find((m) => String(m.id) === id);
      try {
        if (mr?.status === "Menunggu Approval Gudang") {
          await approveMr(id, actor);
        } else {
          await fulfill(id, actor);
        }
        done += 1;
      } catch (e) { toast(`${id}: ${e instanceof Error ? e.message : String(e)}`, "info"); }
    }
    setOutPick(new Set());
    if (done > 0) toast(T.outDone.replace("{n}", String(done)));
  };

  // ---------- Procurement: pengeluaran alokasi PO proyek ----------
  const [procOut, setProcOut] = useState({
    projectId: "",
    poId: "",
    itemId: "",
    qty: "",
    note: "",
  });

  const activeProjects = useMemo(
    () => (data.projects ?? []).filter((p) => p.status !== "Selesai"),
    [data.projects],
  );

  const projectPos = useMemo(() => {
    if (!procOut.projectId) return [];
    return (data.purchaseOrders ?? []).filter(
      (p) => String(p.projectId ?? "") === procOut.projectId || String(p.project ?? "") === procOut.projectId,
    );
  }, [data.purchaseOrders, procOut.projectId]);

  const onSelectProcProject = (projectId: string) => {
    setProcOut({ projectId, poId: "", itemId: "", qty: "", note: "" });
  };

  const onSelectProcPo = (poId: string) => {
    const po = (data.purchaseOrders ?? []).find((p) => String(p.id) === poId);
    setProcOut((prev) => ({
      ...prev,
      poId,
      itemId: po?.itemId ? String(po.itemId) : prev.itemId,
    }));
  };

  const saveProcOut = async () => {
    if (!procOut.projectId) { toast(T.tProjectReq, "info"); return; }
    const it = inventory.find((i) => String(i.id) === procOut.itemId);
    const qty = Number(procOut.qty);
    if (!it || !(qty > 0)) { toast(T.qtyInvalid, "info"); return; }
    if (qty > Number(it.stock || 0)) { toast(T.stockShort, "info"); return; }
    await update("inventory", String(it.id), { stock: Number(it.stock || 0) - qty });
    await add("movements", {
      item: String(it.name),
      itemId: String(it.id),
      type: "Pengeluaran",
      qty,
      unit: String(it.unit ?? "pcs"),
      by: actor,
      date: todayISO(),
      tone: "out",
      ref: { projectId: procOut.projectId, poId: procOut.poId || undefined },
      note: procOut.note.trim() || `Pengeluaran Procurement Proyek ${procOut.projectId}`,
      procurement: true,
    }, { action: "pengeluaran procurement proyek", target: `${String(it.name)} × ${qty}`, module: "Inventori" });
    toast(T.outProcDone.replace("{n}", `${String(it.name)} × ${fmtJumlah(qty)}`));
    setProcOut({ projectId: "", poId: "", itemId: "", qty: "", note: "" });
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
        {/* Segmented Filter Masuk */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-steel-200 bg-steel-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterIn("all")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              filterIn === "all" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            {T.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setFilterIn("procurement")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              filterIn === "procurement" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {T.filterProcurement}
          </button>
          <button
            type="button"
            onClick={() => setFilterIn("additional")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              filterIn === "additional" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {T.filterAdditional}
          </button>
        </div>

        {/* Card Terima dari PO (Procurement) */}
        {(filterIn === "all" || filterIn === "procurement") && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <ArrowDownToLine className="h-4 w-4" /> {T.inTitle}
              </h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {T.badgeProcurement}
              </span>
            </div>
            <p className="mb-3 mt-0.5 text-xs text-steel-500">{T.inSub}</p>
            {receivable.length === 0 ? <EmptyState title={T.inEmpty} /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["", T.colPo, T.colItem, T.colLocation, T.colOpen, T.colQty].map((h, i) => (
                        <th key={i} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100">
                    {receivable.map((p) => {
                      const pk = pickOf(p);
                      return (
                        <tr key={String(p.id)}>
                          <td className="td w-8">
                            <input
                              type="checkbox"
                              aria-label={String(p.id)}
                              checked={pk.on}
                              onChange={(e) => setPick(p, { on: e.target.checked })}
                            />
                          </td>
                          <td className="td">
                            <p className="font-mono text-xs font-semibold text-navy-900">{String(p.id)}</p>
                            <p className="text-[11px] text-steel-500">{String(p.vendor ?? "")}</p>
                          </td>
                          <td className="td text-sm">
                            {p.itemId ? String(p.item ?? p.itemId) : (
                              <select
                                className="input h-8 py-0 text-xs"
                                value={pk.itemId}
                                onChange={(e) => setPick(p, { itemId: e.target.value })}
                              >
                                <option value="">{T.pickItem}</option>
                                {inventory.map((i) => (
                                  <option key={String(i.id)} value={String(i.id)}>{String(i.name)}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="td w-44">
                            <div className="flex flex-col gap-1">
                              <select
                                className="input h-7 py-0 text-xs"
                                value={pk.warehouse}
                                onChange={(e) => setPick(p, { warehouse: e.target.value })}
                                title={T.colWarehouse}
                              >
                                <option value="">{T.colWarehouse}...</option>
                                {warehouses.map((w) => (
                                  <option key={w} value={w}>{w}</option>
                                ))}
                              </select>
                              <div className="flex gap-1">
                                <input
                                  className="input h-7 py-0 text-xs w-1/2"
                                  placeholder={T.colRack}
                                  value={pk.rack}
                                  onChange={(e) => setPick(p, { rack: e.target.value })}
                                  title={T.colRack}
                                />
                                <input
                                  className="input h-7 py-0 text-xs w-1/2"
                                  placeholder={T.colBin}
                                  value={pk.bin}
                                  onChange={(e) => setPick(p, { bin: e.target.value })}
                                  title={T.colBin}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="td text-xs tabular-nums">
                            {Number(p.qty || 0) > 0 ? fmtJumlah(poOpenQty(p)) : "-"}
                          </td>
                          <td className="td w-28">
                            <NumInput
                              min={0}
                              className="input h-8 py-0 text-xs"
                              value={pk.qty}
                              onChange={(e) => setPick(p, { qty: e.target.value, on: true })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {receivable.length > 0 && (
              <AsyncButton
                className="btn-primary mt-3 text-xs"
                disabled={ticked.length === 0}
                onAction={receiveTicked}
              >
                {T.inBtn.replace("{n}", String(ticked.length))}
              </AsyncButton>
            )}
          </Card>
        )}

        {/* Card Additional Masuk */}
        {(filterIn === "all" || filterIn === "additional") && (
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-navy-900">{T.addInTitle}</h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                {T.badgeAdditional}
              </span>
            </div>
            <FormGrid>
              <Field label={T.item}>
                <select
                  className="input"
                  value={addIn.itemId}
                  onChange={(e) => onSelectAddInItem(e.target.value)}
                >
                  <option value="">{T.pickItem}</option>
                  {inventory.map((i) => (
                    <option key={String(i.id)} value={String(i.id)}>
                      {String(i.name)} · {stockLabel(i)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={T.qty}>
                <NumInput
                  min={0}
                  className="input"
                  value={addIn.qty}
                  onChange={(e) => setAddIn({ ...addIn, qty: e.target.value })}
                />
              </Field>
            </FormGrid>
            <FormGrid>
              <Field label={T.colWarehouse}>
                <select
                  className="input"
                  value={addIn.warehouse}
                  onChange={(e) => setAddIn({ ...addIn, warehouse: e.target.value })}
                >
                  <option value="">{T.colWarehouse}...</option>
                  {warehouses.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={T.colRack}>
                  <input
                    className="input"
                    placeholder={T.colRack}
                    value={addIn.rack}
                    onChange={(e) => setAddIn({ ...addIn, rack: e.target.value })}
                  />
                </Field>
                <Field label={T.colBin}>
                  <input
                    className="input"
                    placeholder={T.colBin}
                    value={addIn.bin}
                    onChange={(e) => setAddIn({ ...addIn, bin: e.target.value })}
                  />
                </Field>
              </div>
            </FormGrid>
            <Field label={T.reason} required>
              <input
                className="input"
                maxLength={300}
                value={addIn.reason}
                onChange={(e) => setAddIn({ ...addIn, reason: e.target.value })}
                placeholder={T.reasonPh}
              />
            </Field>
            <AsyncButton className="btn-secondary mt-3 text-xs" onAction={saveAddIn}>
              {T.save}
            </AsyncButton>
          </Card>
        )}
      </div>

      {/* ===== KELUAR ===== */}
      <div className="space-y-4">
        {/* Segmented Filter Keluar */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-steel-200 bg-steel-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterOut("all")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              filterOut === "all" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            {T.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setFilterOut("checklist")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              filterOut === "checklist" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {T.filterChecklist}
          </button>
          <button
            type="button"
            onClick={() => setFilterOut("procurement")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              filterOut === "procurement" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {T.filterProcurement}
          </button>
          <button
            type="button"
            onClick={() => setFilterOut("additional")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              filterOut === "additional" ? "bg-white text-navy-900 shadow-sm" : "text-steel-600 hover:text-navy-900"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {T.filterAdditional}
          </button>
        </div>

        {/* Card Checklist Permintaan Proyek (MR) */}
        {(filterOut === "all" || filterOut === "checklist") && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <ArrowUpFromLine className="h-4 w-4" /> {T.outTitle}
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                {T.badgeChecklist}
              </span>
            </div>
            <p className="mb-3 mt-0.5 text-xs text-steel-500">{T.outSub}</p>
            {waiting.length === 0 ? <EmptyState title={T.outEmpty} /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["", T.colMr, T.colItem, T.colShort, T.colStock].map((h, i) => (
                        <th key={i} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100">
                    {waiting.map((m) => {
                      const it = stockOf(m.itemId);
                      // Pemenuhan permintaan memakai kemasan utuh (stock); sisa kemasan terbuka lewat Additional.
                      const hasStock = Number(it?.stock ?? 0) > 0;
                      return (
                        <tr key={String(m.id)}>
                          <td className="td w-8">
                            <input
                              type="checkbox"
                              aria-label={String(m.id)}
                              disabled={!hasStock}
                              checked={outPick.has(String(m.id))}
                              onChange={(e) => setOutPick((s) => {
                                const n = new Set(s);
                                if (e.target.checked) n.add(String(m.id));
                                else n.delete(String(m.id));
                                return n;
                              })}
                            />
                          </td>
                          <td className="td">
                            <p className="font-mono text-xs font-semibold text-navy-900">{String(m.id)}</p>
                            <p className="text-[11px] text-steel-500">{String(m.projectId ?? "")}</p>
                          </td>
                          <td className="td text-sm">{String(m.item ?? m.itemId)}</td>
                          <td className="td text-xs font-semibold tabular-nums text-ocean-700">
                            {fmtJumlah(Number(m.shortage ?? 0))} {String(m.unit ?? "")}
                          </td>
                          <td className="td text-xs text-steel-600">{it ? stockLabel(it) : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {waiting.length > 0 && (
              <AsyncButton
                className="btn-primary mt-3 text-xs"
                disabled={outPick.size === 0}
                onAction={issueTicked}
              >
                {T.outBtn.replace("{n}", String(outPick.size))}
              </AsyncButton>
            )}
          </Card>
        )}

        {/* Card Procurement: Pengeluaran Alokasi PO Proyek */}
        {(filterOut === "all" || filterOut === "procurement") && (
          <Card className="p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <PackageCheck className="h-4 w-4" /> {T.outProcTitle}
              </h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {T.badgeProcurement}
              </span>
            </div>
            <p className="mb-3 text-xs text-steel-500">{T.outProcSub}</p>
            <FormGrid>
              <Field label={T.colProject} required>
                <select
                  className="input"
                  value={procOut.projectId}
                  onChange={(e) => onSelectProcProject(e.target.value)}
                >
                  <option value="">{T.optPickProject}</option>
                  {activeProjects.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {String(p.id)} · {String(p.vessel ?? p.name ?? "")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={T.colPo}>
                <select
                  className="input"
                  value={procOut.poId}
                  onChange={(e) => onSelectProcPo(e.target.value)}
                  disabled={!procOut.projectId}
                >
                  <option value="">
                    {projectPos.length === 0 ? T.optPickPoEmpty : T.optPickPo}
                  </option>
                  {projectPos.map((po) => (
                    <option key={String(po.id)} value={String(po.id)}>
                      {String(po.id)} · {String(po.item ?? po.itemId ?? "")}
                    </option>
                  ))}
                </select>
              </Field>
            </FormGrid>
            <FormGrid>
              <Field label={T.item}>
                <select
                  className="input"
                  value={procOut.itemId}
                  onChange={(e) => setProcOut({ ...procOut, itemId: e.target.value })}
                >
                  <option value="">{T.pickItem}</option>
                  {inventory.map((i) => (
                    <option key={String(i.id)} value={String(i.id)}>
                      {String(i.name)} · {stockLabel(i)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={T.qty}>
                <NumInput
                  min={0}
                  className="input"
                  value={procOut.qty}
                  onChange={(e) => setProcOut({ ...procOut, qty: e.target.value })}
                />
              </Field>
            </FormGrid>
            <Field label={T.note}>
              <input
                className="input"
                maxLength={300}
                value={procOut.note}
                onChange={(e) => setProcOut({ ...procOut, note: e.target.value })}
                placeholder={T.notePh}
              />
            </Field>
            <AsyncButton className="btn-primary mt-3 text-xs" onAction={saveProcOut}>
              {T.save}
            </AsyncButton>
          </Card>
        )}

        {/* Card Additional Keluar */}
        {(filterOut === "all" || filterOut === "additional") && (
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-navy-900">{T.addOutTitle}</h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                {T.badgeAdditional}
              </span>
            </div>
            <Field label={T.item}>
              <select
                className="input"
                value={addOut.itemId}
                onChange={(e) => setAddOut({ ...addOut, itemId: e.target.value })}
              >
                <option value="">{T.pickItem}</option>
                {inventory.map((i) => (
                  <option key={String(i.id)} value={String(i.id)}>
                    {String(i.name)} · {stockLabel(i)}
                  </option>
                ))}
              </select>
            </Field>
            {outItem && outConv && isPlate ? (
              <>
                <FormGrid>
                  <Field label={T.cutL}>
                    <NumInput
                      min={0}
                      className="input"
                      value={addOut.cutL}
                      onChange={(e) => setAddOut({ ...addOut, cutL: e.target.value })}
                    />
                  </Field>
                  <Field label={T.cutW}>
                    <NumInput
                      min={0}
                      className="input"
                      value={addOut.cutW}
                      onChange={(e) => setAddOut({ ...addOut, cutW: e.target.value })}
                    />
                  </Field>
                </FormGrid>
                <p className="mt-1 text-[11px] text-steel-500">
                  {T.cutHint
                    .replace("{L}", fmtJumlah(Number(outConv.dims?.lengthMm)))
                    .replace("{W}", fmtJumlah(Number(outConv.dims?.widthMm)))
                    .replace("{kg}", fmtJumlah(Number(outConv.dims?.weightKg ?? outConv.perUnit)))}
                </p>
              </>
            ) : (
              <Field
                label={outConv ? T.unitBase.replace("{u}", outConv.baseUnit) : T.qty}
                hint={outItem && outConv ? T.eceranHint.replace("{u}", outConv.baseUnit).replace("{s}", stockLabel(outItem)) : undefined}
              >
                <NumInput
                  min={0}
                  step={0.01}
                  className="input"
                  value={addOut.qty}
                  onChange={(e) => setAddOut({ ...addOut, qty: e.target.value })}
                />
              </Field>
            )}
            <Field label={T.reason} required>
              <input
                className="input"
                maxLength={300}
                value={addOut.reason}
                onChange={(e) => setAddOut({ ...addOut, reason: e.target.value })}
                placeholder={T.reasonPh}
              />
            </Field>
            <AsyncButton className="btn-secondary mt-3 text-xs" onAction={saveAddOut}>
              {T.save}
            </AsyncButton>
          </Card>
        )}
      </div>
    </div>
  );
}
