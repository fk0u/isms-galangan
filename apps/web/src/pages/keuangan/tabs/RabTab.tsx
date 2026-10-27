/* RAB belanja rutin (#285, #302): anggaran per akun beban per bulan (koleksi
 * `rabItems`), dibandingkan realisasi = jurnal debit akun itu di bulan yang
 * sama. Tidak menyimpan realisasi agar selalu cocok dengan buku besar.
 * Didukung modal full-screen dengan Nama RAB dan skema rincian baris anggaran (#302). */
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AsyncButton, ConfirmModal, EmptyState, Field, FormGrid, KpiCard, Modal, MoneyInput, RowAction, toast } from "../../../components/ui";
import type { StoreItem } from "../../../data/store";
import { useStore } from "../../../data/store";
import { useAuth, hasPermission } from "../../../auth/auth";
import { exportExcel } from "../../../utils/export";
import { fmtBulan, fmtRupiah, parseRupiah, todayISO } from "../../../utils/format";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";

interface RabLine {
  id?: string;
  akun: string;
  uraian: string;
  anggaran: string;
}

const emptyLine = (): RabLine => ({ akun: "", uraian: "", anggaran: "" });

const emptyForm = (periode: string) => ({
  nama: "",
  periode,
  catatan: "",
});

export default function RabTab() {
  const { data, add, update, remove, inBranch } = useStore();
  const { user } = useAuth();
  const { locale } = useT();
  const S = n_fin[locale];

  const canWriteRab = hasPermission(user?.permissions, "rabItems", "w");
  const canDeleteRab = hasPermission(user?.permissions, "rabItems", "d");

  const [periode, setPeriode] = useState(todayISO().slice(0, 7));
  const [form, setForm] = useState(emptyForm(periode));
  const [lines, setLines] = useState<RabLine[]>([emptyLine()]);
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

  const totalModalBudget = useMemo(() => {
    return lines.reduce((sum, l) => sum + (parseRupiah(l.anggaran) || 0), 0);
  }, [lines]);

  const openNew = () => {
    setEdit(null);
    setForm(emptyForm(periode));
    setLines([emptyLine(), emptyLine()]);
    setOpen(true);
  };

  const openEdit = (r: StoreItem) => {
    setEdit(r);
    setForm({
      nama: String(r.nama ?? ""),
      periode: String(r.periode ?? periode),
      catatan: String(r.catatan ?? ""),
    });
    setLines([{
      id: r.id,
      akun: String(r.akun ?? ""),
      uraian: String(r.catatan ?? ""),
      anggaran: String(r.anggaran ?? ""),
    }]);
    setOpen(true);
  };

  const save = async () => {
    const validLines = lines.filter((l) => l.akun && parseRupiah(l.anggaran) > 0);
    if (!form.nama.trim() || !form.periode || validLines.length === 0) {
      toast(S.rabInvalid, "info");
      return;
    }

    // Cek duplikasi akun di dalam rincian form
    const seenFormAccounts = new Set<string>();
    for (const l of validLines) {
      if (seenFormAccounts.has(l.akun)) {
        toast(S.rabDup.replace("{a}", l.akun).replace("{b}", form.periode), "info");
        return;
      }
      seenFormAccounts.add(l.akun);
    }

    // Cek duplikasi dengan data lain di periode yang sama
    const existingInPeriod = inBranch(data.rabItems ?? []).filter((r) => r.periode === form.periode);
    for (const l of validLines) {
      const dup = existingInPeriod.find((r) => r.akun === l.akun && r.id !== l.id && r.id !== edit?.id);
      if (dup) {
        toast(S.rabDup.replace("{a}", l.akun).replace("{b}", form.periode), "info");
        return;
      }
    }

    try {
      if (edit) {
        const [first, ...rest] = validLines;
        await update("rabItems", edit.id, {
          nama: form.nama.trim(),
          periode: form.periode,
          akun: first.akun,
          anggaran: parseRupiah(first.anggaran),
          catatan: first.uraian.trim() || form.catatan.trim(),
        });
        for (const line of rest) {
          await add("rabItems", {
            nama: form.nama.trim(),
            periode: form.periode,
            akun: line.akun,
            anggaran: parseRupiah(line.anggaran),
            catatan: line.uraian.trim() || form.catatan.trim(),
          }, { action: "menambah rincian RAB", module: "Keuangan" });
        }
      } else {
        for (const line of validLines) {
          await add("rabItems", {
            nama: form.nama.trim(),
            periode: form.periode,
            akun: line.akun,
            anggaran: parseRupiah(line.anggaran),
            catatan: line.uraian.trim() || form.catatan.trim(),
          }, { action: "menambah RAB", module: "Keuangan" });
        }
      }
      setOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "info");
    }
  };

  const exportXls = () => exportExcel([
    ["Kode akun", "Akun", "Nama RAB", "Catatan", "Anggaran", "Realisasi", "Selisih", "Serapan %"],
    ...rows.map(({ r, real }) => [
      String(r.akun),
      namaAkun(String(r.akun)),
      String(r.nama ?? "-"),
      String(r.catatan ?? ""),
      Number(r.anggaran) || 0,
      real,
      (Number(r.anggaran) || 0) - real,
      Number(r.anggaran) ? Math.round((real / Number(r.anggaran)) * 100) : 0,
    ]),
    ["", "Total", "", "", totA, totR, totA - totR, totA ? Math.round((totR / totA) * 100) : 0],
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
          {canWriteRab && <button className="btn-primary text-xs" onClick={openNew}>{S.rabAdd}</button>}
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
              <th className="th">{S.colKode}</th>
              <th className="th">{S.colNamaAkun}</th>
              <th className="th">{S.rabName}</th>
              <th className="th text-right">{S.rabBudget}</th>
              <th className="th text-right">{S.rabReal}</th>
              <th className="th text-right">{S.rabRemain}</th>
              {(canWriteRab || canDeleteRab) && <th className="th">{S.actionTh}</th>}
            </tr></thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map(({ r, real }) => {
                const a = Number(r.anggaran) || 0;
                return (
                  <tr key={r.id} className="hover:bg-surface">
                    <td className="td font-mono text-xs">{String(r.akun)}</td>
                    <td className="td text-xs text-steel-700">
                      <span className="font-medium text-navy-900">{namaAkun(String(r.akun))}</span>
                      {r.catatan ? <span className="block text-[11px] text-steel-400">{String(r.catatan)}</span> : null}
                    </td>
                    <td className="td text-xs text-steel-600 font-medium">
                      {String(r.nama || "-")}
                    </td>
                    <td className="td text-right text-xs font-mono">{fmtRupiah(a)}</td>
                    <td className="td text-right text-xs font-mono">{fmtRupiah(real)}</td>
                    <td className={`td text-right text-xs font-semibold font-mono ${real > a ? "text-rose-600" : "text-emerald-700"}`}>
                      {fmtRupiah(a - real)}
                    </td>
                    {(canWriteRab || canDeleteRab) && (
                      <td className="td"><div className="flex gap-1">
                        {canWriteRab && <RowAction icon={Pencil} tone="neutral" label={S.editBtn} onClick={() => openEdit(r)} />}
                        {canDeleteRab && <RowAction icon={Trash2} tone="danger" label={S.deleteBtn} onClick={() => setDel(r)} />}
                      </div></td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal RAB: proporsional extraWide, Nama RAB, Periode, dan skema rincian anggaran tanpa input realisasi */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? S.rabEdit : S.rabAdd}
        extraWide={true}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>{S.cancelBtn}</button>
            <AsyncButton className="btn-primary" onAction={save}>{S.saveBtn}</AsyncButton>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-steel-200 bg-surface/40 p-4">
            <FormGrid>
              <Field label={S.rabName} required>
                <input
                  className="input"
                  placeholder={S.rabNamePh}
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </Field>
              <Field label={S.payrollPeriod} required>
                <input
                  type="month"
                  className="input"
                  value={form.periode}
                  onChange={(e) => setForm({ ...form, periode: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={S.rabNote}>
                  <input
                    className="input"
                    placeholder={S.rabNote}
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  />
                </Field>
              </div>
            </FormGrid>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-navy-900">{S.rabLinesTitle}</h4>
                <p className="text-xs text-steel-500">
                  {S.rabLineCount.replace("{n}", String(lines.length))}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary flex items-center gap-1.5 text-xs"
                onClick={() => setLines([...lines, emptyLine()])}
              >
                <Plus className="h-3.5 w-3.5" />
                {S.rabAddLine}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-xl border border-steel-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-steel-200 bg-surface text-steel-600">
                  <tr>
                    <th className="py-2.5 px-3 font-medium w-10 text-center">#</th>
                    <th className="py-2.5 px-3 font-medium min-w-[260px]">{S.colNamaAkun} <span className="text-rose-500">*</span></th>
                    <th className="py-2.5 px-3 font-medium min-w-[200px]">{S.rabLineDesc}</th>
                    <th className="py-2.5 px-3 font-medium min-w-[180px] text-right">{S.rabBudget} (Rp) <span className="text-rose-500">*</span></th>
                    <th className="py-2.5 px-3 font-medium w-12 text-center">{S.actionTh}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100 bg-white">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-surface/30">
                      <td className="py-2 px-3 text-center font-mono text-steel-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <select
                          className="input py-1.5 text-xs"
                          value={line.akun}
                          onChange={(e) => {
                            const next = [...lines];
                            next[idx] = { ...line, akun: e.target.value };
                            setLines(next);
                          }}
                        >
                          <option value="">-- {S.colNamaAkun} --</option>
                          {akunBeban.map((c) => (
                            <option key={String(c.kode)} value={String(c.kode)}>
                              {String(c.kode)} · {String(c.nama)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="input py-1.5 text-xs"
                          placeholder={S.rabLineDesc}
                          value={line.uraian}
                          onChange={(e) => {
                            const next = [...lines];
                            next[idx] = { ...line, uraian: e.target.value };
                            setLines(next);
                          }}
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <MoneyInput
                          className="input py-1.5 text-right text-xs font-mono"
                          value={line.anggaran}
                          onChange={(v) => {
                            const next = [...lines];
                            next[idx] = { ...line, anggaran: v };
                            setLines(next);
                          }}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          title={S.deleteBtn}
                          disabled={lines.length <= 1}
                          className="rounded p-1 text-steel-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-steel-400"
                          onClick={() => {
                            if (lines.length > 1) {
                              setLines(lines.filter((_, i) => i !== idx));
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-steel-200 bg-surface/70 font-semibold text-navy-900">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-steel-600">
                      {S.rabTotalBudget}:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-navy-900">
                      {fmtRupiah(totalModalBudget)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={del !== null}
        danger
        title={S.rabDelTitle}
        desc={del ? `${String(del.nama ? del.nama + " · " : "")}${String(del.akun)} · ${String(del.periode)}` : ""}
        confirmLabel={S.deleteBtn}
        onCancel={() => setDel(null)}
        onConfirm={() => {
          if (del) {
            void remove("rabItems", del.id)
              .then(() => setDel(null))
              .catch((e: unknown) => toast(e instanceof Error ? e.message : String(e), "info"));
          }
        }}
      />
    </div>
  );
}
