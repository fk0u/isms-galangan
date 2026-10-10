/* Delegasi equipment (F3-H-03, EQP-05): peminjaman (→ bookings, kind
 * "Peminjaman") atau maintenance/kalibrasi (→ maintenances). Status equipment
 * dihitung dari delegasi aktif; server menolak peminjaman yang bertumpang (409). */
import { useState } from "react";
import { AsyncButton, Badge, Field, FormGrid, Modal, MoneyInput, toast } from "../../components/ui";
import { SearchSelect } from "../../components/SearchSelect";
import { useStore, type StoreItem } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_dlg } from "../../i18n/n_dlg";
import { fmtRupiah, fmtTanggal, parseRupiah, todayISO } from "../../utils/format";

const CLOSED = new Set(["Selesai", "Dibatalkan", "Dikembalikan"]);

/** Peminjaman aktif untuk equipment ini (hari ini di dalam rentang). */
export function activeLoanOf(eq: StoreItem, bookings: StoreItem[], today: string): StoreItem | undefined {
  return bookings.find((b) => String(b.kind ?? "") === "Peminjaman" && String(b.equipId ?? "") === String(eq.id)
    && !CLOSED.has(String(b.status ?? "")) && String(b.startDate ?? "") <= today && today <= String(b.endDate ?? ""));
}
/** Maintenance/kalibrasi yang masih berjalan untuk equipment ini. */
export function activeMaintOf(eq: StoreItem, maintenances: StoreItem[]): StoreItem | undefined {
  return maintenances.find((m) => String(m.equipmentId ?? "") === String(eq.id) && !CLOSED.has(String(m.status ?? "")) && String(m.status ?? "") !== "Batal");
}
/** Status turunan: Maintenance > Dipinjam > Tersedia. */
export function delegationStatus(eq: StoreItem, bookings: StoreItem[], maintenances: StoreItem[], today: string): "Maintenance" | "Dipinjam" | "Tersedia" {
  if (activeMaintOf(eq, maintenances)) return "Maintenance";
  return activeLoanOf(eq, bookings, today) ? "Dipinjam" : "Tersedia";
}

export default function DelegationPanel({ equipment, onClose }: { equipment: StoreItem | null; onClose: () => void }) {
  const { locale } = useT();
  const T = n_dlg[locale];
  const { data, add, update } = useStore();
  const [type, setType] = useState<"loan" | "maint">("loan");
  const [loan, setLoan] = useState({ project: "", borrower: "", start: todayISO(), end: todayISO(), condOut: "" });
  const [maint, setMaint] = useState({ kind: "Service", tech: "", date: todayISO(), cost: "", note: "", project: "" });
  const [condIn, setCondIn] = useState<Record<string, string>>({});
  if (!equipment) return null;
  const eqId = String(equipment.id);
  const eqName = String(equipment.name ?? eqId);

  const loans = (data.bookings ?? []).filter((b) => String(b.kind ?? "") === "Peminjaman" && String(b.equipId ?? "") === eqId);
  const maints = (data.maintenances ?? []).filter((m) => String(m.equipmentId ?? "") === eqId);
  const history = [
    ...loans.map((b) => ({ id: String(b.id), date: String(b.startDate ?? b.date ?? ""), kind: "loan" as const, row: b })),
    ...maints.map((m) => ({ id: String(m.id), date: String(m.mulai ?? m.tanggal ?? ""), kind: "maint" as const, row: m })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const employees = (data.employees ?? []).map((e) => ({ value: String(e.name ?? e.id), label: String(e.name ?? e.id), subLabel: String(e.role ?? "") }));

  const saveLoan = async () => {
    if (!loan.borrower.trim() || !loan.start || !loan.end) { toast(T.required, "info"); return; }
    try {
      const created = await add("bookings", {
        kind: "Peminjaman", equipId: eqId, equip: eqName, proyek: loan.project || "-", borrower: loan.borrower.trim(),
        startDate: loan.start, endDate: loan.end, date: loan.start, conditionOut: loan.condOut.trim(), status: "Dipinjam",
        jam: "-", hours: 0, downtime: 0, fuelLiters: 0, cost: 0,
      }, { action: "delegasi peminjaman equipment", target: eqName, module: "Equipment" });
      toast(T.saved.replace("{n}", String(created.id)));
      setLoan({ project: "", borrower: "", start: todayISO(), end: todayISO(), condOut: "" });
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const saveMaint = async () => {
    if (!maint.tech.trim() || !maint.date) { toast(T.techRequired, "info"); return; }
    const cost = parseRupiah(maint.cost);
    try {
      const created = await add("maintenances", {
        equipmentId: eqId, equipmentName: eqName, tanggal: maint.date, mulai: maint.date, selesai: "",
        jenis: maint.kind, status: "Sedang Proses", teknisi: maint.tech.trim(), catatan: maint.note.trim(),
        ...(maint.project ? { projectId: maint.project, projectName: maint.project } : {}),
        materials: [], materialCost: cost, laborCost: 0, costTotal: cost, delegasi: true,
      }, { action: "delegasi maintenance equipment", target: eqName, module: "Equipment" });
      toast(T.saved.replace("{n}", String(created.id)));
      setMaint({ kind: "Service", tech: "", date: todayISO(), cost: "", note: "", project: "" });
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const returnLoan = async (b: StoreItem) => {
    try {
      await update("bookings", String(b.id), { status: "Selesai", returnedAt: todayISO(), conditionIn: (condIn[String(b.id)] ?? "").trim() });
      toast(T.returned);
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const finishMaint = async (m: StoreItem) => {
    try {
      await update("maintenances", String(m.id), { status: "Selesai", selesai: todayISO() });
      toast(T.finished);
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };

  return (
    <Modal open onClose={onClose} wide title={T.title.replace("{n}", eqName)} subtitle={String(equipment.code ?? eqId)}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="inline-flex rounded-lg border border-steel-200 p-0.5">
            {(["loan", "maint"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${type === t ? "bg-navy-900 text-white" : "text-steel-600 hover:text-navy-900"}`}>
                {t === "loan" ? T.typeLoan : T.typeMaint}
              </button>
            ))}
          </div>
          {type === "loan" ? (
            <>
              <Field label={T.borrower}>
                {employees.length > 0
                  ? <SearchSelect value={loan.borrower} onChange={(v) => setLoan({ ...loan, borrower: v })} options={employees} placeholder={T.borrowerPh} ariaLabel={T.borrower} />
                  : <input className="input" value={loan.borrower} onChange={(e) => setLoan({ ...loan, borrower: e.target.value })} placeholder={T.borrowerPh} />}
              </Field>
              <Field label={T.project}>
                <select className="input" value={loan.project} onChange={(e) => setLoan({ ...loan, project: e.target.value })}>
                  <option value="">{T.none}</option>
                  {(data.projects ?? []).map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.id)} · {String(p.vessel ?? "")}</option>)}
                </select>
              </Field>
              <FormGrid>
                <Field label={T.start}><input type="date" className="input" value={loan.start} onChange={(e) => setLoan({ ...loan, start: e.target.value })} /></Field>
                <Field label={T.end}><input type="date" className="input" value={loan.end} min={loan.start} onChange={(e) => setLoan({ ...loan, end: e.target.value })} /></Field>
              </FormGrid>
              <Field label={T.condOut}><input className="input" value={loan.condOut} onChange={(e) => setLoan({ ...loan, condOut: e.target.value })} placeholder={T.condPh} /></Field>
              <AsyncButton className="btn-primary text-xs" onAction={saveLoan}>{T.save}</AsyncButton>
            </>
          ) : (
            <>
              <FormGrid>
                <Field label={T.kind}>
                  <select className="input" value={maint.kind} onChange={(e) => setMaint({ ...maint, kind: e.target.value })}>
                    <option value="Service">{T.kindService}</option>
                    <option value="Kalibrasi">{T.kindCal}</option>
                  </select>
                </Field>
                <Field label={T.date}><input type="date" className="input" value={maint.date} onChange={(e) => setMaint({ ...maint, date: e.target.value })} /></Field>
              </FormGrid>
              <Field label={T.tech}><input className="input" value={maint.tech} onChange={(e) => setMaint({ ...maint, tech: e.target.value })} /></Field>
              <FormGrid>
                <Field label={T.cost}><MoneyInput className="input" value={maint.cost} onChange={(v) => setMaint({ ...maint, cost: v })} /></Field>
                <Field label={T.project}>
                  <select className="input" value={maint.project} onChange={(e) => setMaint({ ...maint, project: e.target.value })}>
                    <option value="">{T.none}</option>
                    {(data.projects ?? []).map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.id)} · {String(p.vessel ?? "")}</option>)}
                  </select>
                </Field>
              </FormGrid>
              <Field label={T.note}><input className="input" value={maint.note} onChange={(e) => setMaint({ ...maint, note: e.target.value })} /></Field>
              <AsyncButton className="btn-primary text-xs" onAction={saveMaint}>{T.save}</AsyncButton>
            </>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-navy-900">{T.history}</p>
          {history.length === 0 ? <p className="text-sm text-steel-400">{T.empty}</p> : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {history.map((h) => {
                const closed = CLOSED.has(String(h.row.status ?? ""));
                return (
                  <li key={`${h.kind}-${h.id}`} className="rounded-xl border border-steel-100 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={h.kind === "loan" ? "navy" : "amber"}>{h.kind === "loan" ? T.typeLoan : T.typeMaint}</Badge>
                      <Badge tone={closed ? "green" : "red"}>{closed ? T.done : T.active}</Badge>
                      <span className="font-mono text-[11px] text-steel-400">{h.id}</span>
                    </div>
                    {h.kind === "loan" ? (
                      <>
                        <p className="mt-1 text-navy-900">{T.loanLine.replace("{who}", String(h.row.borrower ?? "-")).replace("{a}", fmtTanggal(String(h.row.startDate ?? ""))).replace("{b}", fmtTanggal(String(h.row.endDate ?? "")))}</p>
                        <p className="text-xs text-steel-500">
                          {String(h.row.proyek ?? "-") !== "-" ? `${String(h.row.proyek)} · ` : ""}
                          {h.row.conditionOut ? `${T.condOut}: ${String(h.row.conditionOut)}` : ""}
                          {h.row.conditionIn ? ` · ${T.condIn}: ${String(h.row.conditionIn)}` : ""}
                        </p>
                        {!closed && (
                          <div className="mt-2 flex gap-2">
                            <input className="input h-8 flex-1 py-0 text-xs" placeholder={T.condIn} value={condIn[h.id] ?? ""} onChange={(e) => setCondIn({ ...condIn, [h.id]: e.target.value })} />
                            <AsyncButton className="btn-secondary h-8 text-xs" onAction={() => returnLoan(h.row)}>{T.returnBtn}</AsyncButton>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-navy-900">{T.maintLine.replace("{kind}", String(h.row.jenis ?? "")).replace("{who}", String(h.row.teknisi ?? "-")).replace("{a}", fmtTanggal(String(h.row.mulai ?? h.row.tanggal ?? "")))}</p>
                        <p className="text-xs text-steel-500">{fmtRupiah(Number(h.row.costTotal ?? 0))}{h.row.projectId ? ` · ${String(h.row.projectId)}` : ""}{h.row.catatan ? ` · ${String(h.row.catatan)}` : ""}</p>
                        {!closed && <AsyncButton className="btn-secondary mt-2 h-8 text-xs" onAction={() => finishMaint(h.row)}>{T.finishBtn}</AsyncButton>}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
