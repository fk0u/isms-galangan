/* RAB belanja rutin (#285): anggaran per akun beban per bulan (koleksi
 * `rabItems`), dibandingkan realisasi = jurnal debit akun itu di bulan yang
 * sama. Tidak menyimpan realisasi agar selalu cocok dengan buku besar. */
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AsyncButton, ConfirmModal, EmptyState, Field, FormGrid, KpiCard, Modal, MoneyInput, RowAction, toast } from "../../../components/ui";
import type { StoreItem } from "../../../data/store";
import { useStore } from "../../../data/store";
import { exportExcel } from "../../../utils/export";
import { fmtBulan, fmtRupiah, parseRupiah, todayISO } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

const empty = (periode: string) => ({ akun: "", periode, anggaran: "", catatan: "" });

export default function RabTab() {
  const { data, add, update, remove, inBranch } = useStore();
  const { locale } = useT();
  const S = n_fin[locale];
  const [periode, setPeriode] = useState(todayISO().slice(0, 7));
  const [form, setForm] = useState(empty(periode));
  const [edit, setEdit] = useState<StoreItem | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<StoreItem | null>(null);

  // Akun beban (kode 5/6) yang bisa dianggarkan, tanpa baris judul.
  const akunBeban = useMemo(() => (data.coa ?? []).filter((c) => /^[56]-/.test(String(c.kode)) && String(c.dk) !== "-"), [data.coa]);
  const namaAkun = (k: string): string => String(akunBeban.find((c) => String(c.kode) === k)?.nama ?? k);
  const rows = useMemo(() => {
    const realisasi = new Map<string, number>();
    for (const j of data.journals ?? []) {
      if (j.status === "Void" || !String(j.date ?? "").startsWith(periode)) continue;
      const k = String(j.db ?? "");
      realisasi.set(k, (realisasi.get(k) ?? 0) + (Number(j.amount) || 0));
    }
    return inBranch(data.rabItems ?? []).filter((r) => r.periode === periode)
      .map((r) => ({ r, real: realisasi.get(String(r.akun)) ?? 0 }))
      .sort((a, b) => String(a.r.akun).localeCompare(String(b.r.akun)));
  }, [data.rabItems, data.journals, periode, inBranch]);
  const totA = rows.reduce((s, x) => s + (Number(x.r.anggaran) || 0), 0);
  const totR = rows.reduce((s, x) => s + x.real, 0);

  const openNew = () => { setEdit(null); setForm(empty(periode)); setOpen(true); };
  const openEdit = (r: StoreItem) => { setEdit(r); setForm({ akun: String(r.akun), periode: String(r.periode), anggaran: String(r.anggaran ?? ""), catatan: String(r.catatan ?? "") }); setOpen(true); };
  const save = async () => {
    const anggaran = parseRupiah(form.anggaran);
    if (!form.akun || !form.periode || !(anggaran > 0)) { toast(S.rabInvalid, "info"); return; }
    const dup = (data.rabItems ?? []).some((r) => r.akun === form.akun && r.periode === form.periode && r.id !== edit?.id);
    if (dup) { toast(S.rabDup.replace("{a}", form.akun).replace("{b}", form.periode), "info"); return; }
    const row = { akun: form.akun, periode: form.periode, anggaran, catatan: form.catatan.trim() };
    try {
      if (edit) await update("rabItems", edit.id, row);
      else await add("rabItems", row, { action: "menambah RAB", module: "Keuangan" });
      setOpen(false);
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const exportXls = () => exportExcel([
    ["Kode akun", "Akun", "Anggaran", "Realisasi", "Selisih", "Serapan %", "Catatan"],
    ...rows.map(({ r, real }) => [String(r.akun), namaAkun(String(r.akun)), Number(r.anggaran) || 0, real, (Number(r.anggaran) || 0) - real, Number(r.anggaran) ? Math.round((real / Number(r.anggaran)) * 100) : 0, String(r.catatan ?? "")]),
    ["", "Total", totA, totR, totA - totR, totA ? Math.round((totR / totA) * 100) : 0, ""],
  ], `RAB-${periode}`, "RAB");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-steel-600">
          {S.payrollPeriod}
          <input type="month" className="input w-auto" value={periode} onChange={(e) => setPeriode(e.target.value)} />
        </label>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary text-xs" onClick={() => void exportXls()}>{S.histExport}</button>
          <button className="btn-primary text-xs" onClick={openNew}>{S.rabAdd}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label={S.rabBudget} value={fmtRupiah(totA)} hint={fmtBulan(periode)} chip="navy" />
        <KpiCard label={S.rabReal} value={fmtRupiah(totR)} hint={S.rabRealHint} chip="teal" />
        <KpiCard label={S.rabRemain} value={fmtRupiah(totA - totR)} hint={totA ? `${Math.round((totR / totA) * 100)}%` : "-"} chip={totR > totA ? "rose" : "amber"} />
      </div>
      {rows.length === 0 ? <EmptyState title={S.rabEmpty.replace("{a}", fmtBulan(periode))} /> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface"><tr>
              <th className="th">{S.colKode}</th><th className="th">{S.colNamaAkun}</th>
              <th className="th text-right">{S.rabBudget}</th><th className="th text-right">{S.rabReal}</th>
              <th className="th text-right">{S.rabRemain}</th><th className="th">{S.actionTh}</th>
            </tr></thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map(({ r, real }) => {
                const a = Number(r.anggaran) || 0;
                return (
                  <tr key={r.id} className="hover:bg-surface">
                    <td className="td font-mono text-xs">{String(r.akun)}</td>
                    <td className="td text-xs text-steel-700">{namaAkun(String(r.akun))}{r.catatan ? <span className="block text-[11px] text-steel-400">{String(r.catatan)}</span> : null}</td>
                    <td className="td text-right text-xs">{fmtRupiah(a)}</td>
                    <td className="td text-right text-xs">{fmtRupiah(real)}</td>
                    <td className={`td text-right text-xs font-semibold ${real > a ? "text-rose-600" : "text-emerald-700"}`}>{fmtRupiah(a - real)}</td>
                    <td className="td"><div className="flex gap-1">
                      <RowAction icon={Pencil} tone="neutral" label={S.editBtn} onClick={() => openEdit(r)} />
                      <RowAction icon={Trash2} tone="danger" label={S.deleteBtn} onClick={() => setDel(r)} />
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? S.rabEdit : S.rabAdd}
        footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={save}>{S.saveBtn}</AsyncButton></>}>
        <FormGrid>
          <Field label={S.colNamaAkun} required>
            <select className="input" value={form.akun} onChange={(e) => setForm({ ...form, akun: e.target.value })}>
              <option value="">-</option>
              {akunBeban.map((c) => <option key={String(c.kode)} value={String(c.kode)}>{String(c.kode)} · {String(c.nama)}</option>)}
            </select>
          </Field>
          <Field label={S.payrollPeriod} required><input type="month" className="input" value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} /></Field>
          <Field label={S.rabBudget} required><MoneyInput className="input" value={form.anggaran} onChange={(v) => setForm({ ...form, anggaran: v })} /></Field>
          <Field label={S.rabNote}><input className="input" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} /></Field>
        </FormGrid>
      </Modal>
      <ConfirmModal open={del !== null} danger title={S.rabDelTitle} desc={del ? `${String(del.akun)} · ${String(del.periode)}` : ""} confirmLabel={S.deleteBtn}
        onCancel={() => setDel(null)} onConfirm={() => { if (del) void remove("rabItems", del.id).then(() => setDel(null)).catch((e: unknown) => toast(e instanceof Error ? e.message : String(e), "info")); }} />
    </div>
  );
}
