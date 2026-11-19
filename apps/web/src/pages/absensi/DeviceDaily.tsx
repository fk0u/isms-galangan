// Tab "Log Mesin" → tampilan utama "Ringkasan harian": per karyawan per hari -
// masuk, pulang, lama di kantor, keluar di tengah hari, jumlah scan, dan garis
// waktu. Angka dihitung server (attendanceAnalysis.ts). Tampilan kedua
// "Semua scan" = DeviceLogs (log mentah).
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, RefreshCw } from "lucide-react";
import { AsyncButton, Badge, EmptyState, Field, Modal, SearchBox, toast } from "../../components/ui";
import { TimeInput24 } from "../../components/TimeInput24";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch } from "../../services/http";
import DeviceLogs from "./DeviceLogs";

type Flag = "late" | "early_leave" | "overtime" | "no_checkout" | "in_office" | "odd_scans" | "outside_hours" | "overnight";
interface Span { from: string; to: string }
interface DayRow {
  id: string; date: string; employee: { id: string; name: string; devicePin: string }; status: string;
  taps: string[]; rawCount: number; checkIn: string; checkOut: string; spanMin: number; breakMin: number; netMin: number;
  sessions: Span[]; breaks: Span[]; lateMin: number; earlyMin: number; overtimeMin: number; flags: Flag[];
}
interface Daily {
  from: string; to: string; rows: DayRow[];
  summary: { present: number; late: number; inOffice: number; noCheckout: number; earlyLeave: number; overtime: number; review: number; avgNetMin: number };
  workHours: { start: string; end: string };
}

const toMin = (t: string): number => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const witaNow = (): Date => new Date(Date.now() + 8 * 3600_000);
const todayWita = (): string => witaNow().toISOString().slice(0, 10);
const nowMinWita = (): number => witaNow().getUTCHours() * 60 + witaNow().getUTCMinutes();
const shiftDay = (d: string, n: number): string => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const FLAG_TONE: Record<Flag, "red" | "amber" | "blue" | "green" | "gray" | "violet"> = { late: "red", early_leave: "amber", overtime: "blue", no_checkout: "amber", in_office: "green", odd_scans: "gray", outside_hours: "violet", overnight: "violet" };
/** "24:05" (dini hari esoknya, shift lintas tengah malam) → "00:05". */
const wall = (t: string): string => (t && Number(t.slice(0, 2)) >= 24 ? `${String(Number(t.slice(0, 2)) - 24).padStart(2, "0")}${t.slice(2)}` : t);

export default function DeviceInsights() {
  const { locale } = useT();
  const E = n_emp[locale];
  const [view, setView] = useState<"daily" | "raw">("daily");
  return (
    <div className="space-y-4">
      <div role="group" aria-label={E.dayViewLabel} className="inline-flex rounded-lg border border-steel-200 bg-white p-0.5">
        {(["daily", "raw"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 ${view === v ? "bg-navy-900 text-white" : "text-steel-600 hover:bg-surface"}`}>
            {v === "daily" ? E.dayViewDaily : E.dayViewRaw}
          </button>
        ))}
      </div>
      {view === "daily" ? <DailySummary /> : <DeviceLogs />}
    </div>
  );
}

export function DailySummary() {
  const { locale } = useT();
  const E = n_emp[locale];
  const [day, setDay] = useState(todayWita());
  const [q, setQ] = useState("");
  const [data, setData] = useState<Daily | null>(null);
  const [loading, setLoading] = useState(true);
  const dateId = useId();
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hStart, setHStart] = useState("08:00");
  const [hEnd, setHEnd] = useState("17:00");
  const saveHours = async (): Promise<void> => {
    if (!/^\d{2}:\d{2}$/.test(hStart) || !/^\d{2}:\d{2}$/.test(hEnd) || hStart >= hEnd) { toast(E.workHoursInvalid, "info"); return; }
    try {
      await apiFetch("/api/attendance/work-hours", { method: "PUT", body: JSON.stringify({ start: hStart, end: hEnd }) });
      toast(E.workHoursSaved, "success");
      setHoursOpen(false);
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };
  const isToday = day === todayWita();

  const dur = useCallback((min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return E.dayDur.replace("{h}", String(h)).replace("{m}", String(m));
  }, [E.dayDur]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const p = new URLSearchParams({ from: day, to: day });
      if (q.trim()) p.set("q", q.trim());
      setData(await apiFetch<Daily>(`/api/attendance/device-daily?${p.toString()}`));
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); } finally { setLoading(false); }
  }, [day, q, E.ingFail]);
  useEffect(() => {
    const t0 = window.setTimeout(() => void load(), 250);
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 5_000);
    return () => { window.clearTimeout(t0); window.clearInterval(t); };
  }, [load]);

  const flagText = (r: DayRow, f: Flag): string => ({
    late: E.dayLate.replace("{t}", dur(r.lateMin)),
    early_leave: E.dayEarly.replace("{t}", dur(r.earlyMin)),
    overtime: E.dayOver.replace("{t}", dur(r.overtimeMin)),
    no_checkout: E.dayNoOut,
    in_office: E.dayInOffice,
    odd_scans: E.dayOdd,
    outside_hours: E.dayOutside2,
    overnight: E.dayOvernight,
  })[f];
  const clock = (t: string): string => (t && Number(t.slice(0, 2)) >= 24 ? E.dayNextDay.replace("{t}", wall(t)) : t);

  const s = data?.summary;
  const tiles: [string, string][] = s ? [
    [E.dayPresent, String(s.present)], [E.dayLateN, String(s.late)],
    [isToday ? E.dayInOfficeN : E.dayNoOutN, String(isToday ? s.inOffice : s.noCheckout)], [E.dayAvg, s.avgNetMin > 0 ? dur(s.avgNetMin) : "-"],
  ] : [];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-navy-900">{E.dayTitle}</h3>
          <button type="button" className="btn-secondary text-xs" onClick={() => { setHStart(data?.workHours.start ?? "08:00"); setHEnd(data?.workHours.end ?? "17:00"); setHoursOpen(true); }}>
            {E.workHoursBtn.replace("{a}", data?.workHours.start ?? "08:00").replace("{b}", data?.workHours.end ?? "17:00")}
          </button>
        </div>
        <p className="text-xs text-steel-500">{E.daySub.replace("{a}", data?.workHours.start ?? "08:00").replace("{b}", data?.workHours.end ?? "17:00")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col text-xs text-steel-500">
          <label htmlFor={dateId}>{E.dayDate}</label>
          <div className="mt-1 flex items-center gap-1">
            <button type="button" className="btn-secondary h-[38px] px-2" aria-label={E.dayPrev} onClick={() => setDay(shiftDay(day, -1))}><ChevronLeft className="h-4 w-4" aria-hidden /></button>
            <input id={dateId} type="date" className="input w-auto" value={day} max={todayWita()} onChange={(e) => { if (e.target.value) setDay(e.target.value); }} />
            <button type="button" className="btn-secondary h-[38px] px-2" aria-label={E.dayNext} disabled={isToday} onClick={() => setDay(shiftDay(day, 1))}><ChevronRight className="h-4 w-4" aria-hidden /></button>
            {!isToday && <button type="button" className="btn-secondary h-[38px] text-xs" onClick={() => setDay(todayWita())}>{E.dayToday}</button>}
          </div>
        </div>
        <div className="min-w-[200px] flex-1"><SearchBox value={q} onChange={setQ} placeholder={E.daySearch} ariaLabel={E.daySearch} /></div>
        <AsyncButton className="btn-secondary text-xs" onAction={load}><RefreshCw className="h-3.5 w-3.5" aria-hidden /> {E.devRefresh}</AsyncButton>
      </div>

      {s && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
          {tiles.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-steel-200 bg-white px-3 py-2">
              <dd className="text-lg font-semibold tabular-nums text-navy-900">{v}</dd>
              <dt className="text-xs text-steel-500">{k}</dt>
            </div>
          ))}
        </dl>
      )}

      <Modal open={hoursOpen} onClose={() => setHoursOpen(false)} title={E.workHoursTitle} subtitle={E.workHoursSub}
        footer={<><button type="button" className="btn-secondary" onClick={() => setHoursOpen(false)}>{E.ingCancel}</button><AsyncButton className="btn-primary" onAction={saveHours}>{E.workHoursSave}</AsyncButton></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={E.workStartLbl}><TimeInput24 value={hStart} onChange={setHStart} ariaLabel={E.workStartLbl} /></Field>
          <Field label={E.workEndLbl}><TimeInput24 value={hEnd} onChange={setHEnd} ariaLabel={E.workEndLbl} /></Field>
        </div>
      </Modal>

      {loading && !data ? (
        <p className="py-10 text-center text-sm text-steel-400" role="status">{E.devLoading}</p>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={<Clock3 className="h-6 w-6" />} title={E.dayEmpty} subtitle={E.dayEmptyHint} />
      ) : (
        <ul className="space-y-3">
          {data.rows.map((r) => {
            const open = r.flags.includes("in_office");
            const running = open ? Math.max(0, nowMinWita() - toMin(r.checkIn)) : 0;
            return (
              <li key={r.id} className="rounded-xl border border-steel-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">{r.employee.name}</p>
                    {r.employee.devicePin && <p className="text-xs text-steel-500">{E.dayPin.replace("{n}", r.employee.devicePin)}</p>}
                  </div>
                  <ul className="flex flex-wrap justify-end gap-1.5" aria-label={E.dayFlags}>
                    {r.status && r.status !== "Hadir" && <li><Badge tone="violet">{r.status}</Badge></li>}
                    {r.flags.length === 0 && <li><Badge tone="green">{E.dayOnTime}</Badge></li>}
                    {r.flags.map((f) => <li key={f}><Badge tone={FLAG_TONE[f]}>{flagText(r, f)}</Badge></li>)}
                  </ul>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
                  {([
                    [E.dayIn, clock(r.checkIn) || "-"],
                    [E.dayOut, clock(r.checkOut) || (open ? E.dayNotYet : "-")],
                    [E.dayNet, r.netMin > 0 ? dur(r.netMin) : open ? E.dayRunning.replace("{t}", dur(running)) : "-"],
                    [E.dayBreak, r.breakMin > 0 ? dur(r.breakMin) : "-"],
                    [E.dayScans, r.rawCount > r.taps.length ? E.dayScansDup.replace("{a}", String(r.taps.length)).replace("{b}", String(r.rawCount - r.taps.length)) : String(r.taps.length)],
                  ] as const).map(([k, v]) => (
                    <div key={k}><dt className="text-[11px] uppercase tracking-wide text-steel-500">{k}</dt><dd className="text-sm font-medium tabular-nums text-navy-900">{v}</dd></div>
                  ))}
                </dl>

                <Timeline row={r} start={data.workHours.start} end={data.workHours.end} runningTo={open ? nowMinWita() : null}
                  label={E.dayTimeline} insideText={E.dayInside} outsideText={E.dayOutside} />
                <p className="mt-2 text-xs text-steel-500"><span className="font-medium text-steel-600">{E.dayTaps}</span> {r.taps.map(clock).join(" · ")}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Garis waktu satu hari. Informasinya juga tersedia sebagai teks (aria-label +
 *  angka di atasnya), jadi tidak bergantung pada warna atau penglihatan. */
function Timeline({ row, start, end, runningTo, label, insideText, outsideText }: {
  row: DayRow; start: string; end: string; runningTo: number | null; label: string; insideText: string; outsideText: string;
}) {
  const sessions: { from: number; to: number; open?: boolean }[] = row.sessions.map((x) => ({ from: toMin(x.from), to: toMin(x.to) }));
  if (runningTo !== null && row.checkIn) sessions.push({ from: toMin(row.checkIn), to: Math.max(runningTo, toMin(row.checkIn) + 1), open: true });
  const all = [toMin(start), toMin(end), ...row.taps.map(toMin), ...(runningTo !== null ? [runningTo] : [])];
  const lo = Math.max(0, Math.floor((Math.min(...all) - 30) / 60) * 60);
  const hi = Math.min(30 * 60, Math.ceil((Math.max(...all) + 30) / 60) * 60);
  const pct = (m: number): number => ((m - lo) / (hi - lo)) * 100;
  const text = [
    ...row.sessions.map((x) => `${insideText} ${wall(x.from)}-${wall(x.to)}`),
    ...row.breaks.map((x) => `${outsideText} ${wall(x.from)}-${wall(x.to)}`),
  ].join(", ") || row.taps.map(wall).join(", ");
  const hours: number[] = [];
  for (let h = lo; h <= hi; h += 120) hours.push(h);
  return (
    <div className="mt-3">
      <div role="img" aria-label={`${label}: ${text}`} className="relative h-5 rounded-md bg-surface">
        {/* jam kerja standar */}
        <span aria-hidden className="absolute inset-y-0 border-x border-dashed border-steel-300" style={{ left: `${pct(toMin(start))}%`, width: `${pct(toMin(end)) - pct(toMin(start))}%` }} />
        {row.breaks.map((b) => (
          <span key={`b${b.from}`} aria-hidden className="absolute inset-y-1 rounded-sm bg-amber-300/70" style={{ left: `${pct(toMin(b.from))}%`, width: `${pct(toMin(b.to)) - pct(toMin(b.from))}%` }} />
        ))}
        {sessions.map((x) => (
          <span key={`s${x.from}${x.open ? "o" : ""}`} aria-hidden className={`absolute inset-y-1 rounded-sm ${x.open ? "bg-emerald-500/60" : "bg-navy-900"}`} style={{ left: `${pct(x.from)}%`, width: `${Math.max(0.6, pct(x.to) - pct(x.from))}%` }} />
        ))}
        {row.taps.map((t) => (
          <span key={`t${t}`} aria-hidden className="absolute -top-0.5 h-6 w-0.5 rounded bg-red-500" style={{ left: `${pct(toMin(t))}%` }} />
        ))}
      </div>
      <div aria-hidden className="relative mt-1 h-3 text-[10px] tabular-nums text-steel-400">
        {hours.map((h) => <span key={h} className="absolute -translate-x-1/2" style={{ left: `${pct(h)}%` }}>{String((h / 60) % 24).padStart(2, "0")}</span>)}
      </div>
    </div>
  );
}
