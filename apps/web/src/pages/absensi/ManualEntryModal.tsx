// Catat absensi manual satu karyawan untuk satu hari (menggantikan tab "Catat"
// yang berisi tabel seluruh karyawan - permintaan 19 Nov: "jadikan satu dengan
// Rekap, tombol + modal, per karyawan"). Baris yang sudah ada di tanggal itu
// diperbarui, bukan digandakan.
import { useMemo, useState } from "react";
import { AsyncButton, Field, Modal, toast } from "../../components/ui";
import { Select } from "../../components/inputs/Select";
import { SearchSelect } from "../../components/SearchSelect";
import { TimeInput24 } from "../../components/TimeInput24";
import { useStore } from "../../data/store";
import type { StoreItem } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { todayISO } from "../../utils/format";

const STATUS = ["Hadir", "Izin", "Sakit", "Cuti", "Alpa"] as const;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function ManualEntryModal({ open, onClose, employees }: { open: boolean; onClose: () => void; employees: StoreItem[] }) {
  const { locale } = useT();
  const E = n_emp[locale];
  const { data, add, update, log } = useStore();
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<string>("Hadir");
  const [checkIn, setCheckIn] = useState("08:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [overtime, setOvertime] = useState("0");
  const [err, setErr] = useState<string | null>(null);

  const options = useMemo(() => employees.map((e) => ({ value: String(e.id), label: String(e.name ?? e.id), subLabel: [String(e.role ?? ""), String(e.username ?? "")].filter(Boolean).join(" · ") })), [employees]);
  const existing = useMemo(() => data.attendance.find((a) => String(a.employeeId) === empId && String(a.date) === date), [data.attendance, empId, date]);

  const reset = (): void => { setEmpId(""); setStatus("Hadir"); setCheckIn("08:00"); setCheckOut("17:00"); setOvertime("0"); setErr(null); };
  const close = (): void => { reset(); onClose(); };

  const save = async (): Promise<void> => {
    if (!empId) { setErr(E.manNeedEmp); return; }
    if (!date || date > todayISO()) { setErr(E.manBadDate); return; }
    const hadir = status === "Hadir";
    if (hadir && (!HM.test(checkIn) || (checkOut !== "" && !HM.test(checkOut)))) { setErr(E.manBadTime); return; }
    const ot = hadir ? Math.max(0, Number(overtime) || 0) : 0;
    const emp = employees.find((e) => String(e.id) === empId);
    const payload = {
      employeeId: empId, date, shift: String(existing?.shift ?? "Pagi"), status,
      checkIn: hadir ? checkIn : "", checkOut: hadir ? checkOut : "", overtime: ot,
      branch: String(emp?.branch ?? ""), source: String(existing?.source ?? "manual"),
      otStatus: ot > 0 ? String(existing?.otStatus ?? "") || "Diajukan" : "",
    };
    try {
      if (existing) await update("attendance", String(existing.id), payload);
      else await add("attendance", payload, undefined);
      log("mencatat absensi", `${String(emp?.name ?? empId)} · ${date} · ${status}`, "Absensi");
      toast((existing ? E.manUpdated : E.manSaved).replace("{n}", String(emp?.name ?? "")), "success");
      close();
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  return (
    <Modal open={open} onClose={close} title={E.manTitle} subtitle={E.manSub}
      footer={<><button type="button" className="btn-secondary" onClick={close}>{E.ingCancel}</button><AsyncButton className="btn-primary" onAction={save}>{existing ? E.manBtnUpdate : E.manBtnSave}</AsyncButton></>}>
      <div className="space-y-3">
        <Field label={E.manEmp} required error={err && !empId ? err : null}>
          <SearchSelect value={empId} onChange={(v) => { setEmpId(v); setErr(null); }} options={options} placeholder={E.devPickEmp} ariaLabel={E.manEmp} emptyText={E.devNoEmp} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={E.manDate} required>
            <input type="date" className="input" value={date} max={todayISO()} onChange={(e) => { setDate(e.target.value); setErr(null); }} />
          </Field>
          <Field label={E.manStatus}>
            <Select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={E.manStatus}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        {status === "Hadir" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={E.workStartLbl}><TimeInput24 value={checkIn} onChange={setCheckIn} ariaLabel={E.workStartLbl} /></Field>
            <Field label={E.workEndLbl} hint={E.manOutHint}><TimeInput24 value={checkOut} onChange={setCheckOut} ariaLabel={E.workEndLbl} /></Field>
            <Field label={E.manOt}><input type="number" min={0} max={12} step={0.5} className="input" value={overtime} onChange={(e) => setOvertime(e.target.value)} /></Field>
          </div>
        )}
        {existing && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{E.manExisting.replace("{a}", String(existing.status ?? "")).replace("{b}", [existing.checkIn, existing.checkOut].filter(Boolean).join(" - ") || "-")}</p>}
        {err && empId && <p role="alert" className="text-xs font-medium text-rose-600">{err}</p>}
      </div>
    </Modal>
  );
}
