// Tab "Log Mesin" di Absensi: setiap scan yang dikirim mesin ke server, dengan
// statusnya saat ini (diterima / diproses ulang / menunggu ID dihubungkan /
// tidak valid). Sumber: GET /api/attendance/device-logs (audit_log ingest).
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ScrollText } from "lucide-react";
import { AsyncButton, Badge, EmptyState, toast } from "../../components/ui";
import { SearchBox } from "../../components/ui";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch } from "../../services/http";
import { fmtTanggalJam } from "../../utils/format";

type LogStatus = "accepted" | "reprocessed" | "pending" | "invalid";
interface LogRow {
  at: string; deviceId: string; protocol: string; userId: string; scanAt: string | null;
  employee: { id: string; name: string } | null; status: LogStatus; lines: number; unknown: string[];
  kind: "in" | "out" | "extra" | null; dayScans: number;
}
interface LogPage { from: string; to: string; total: number; summary: Record<LogStatus, number>; rows: LogRow[]; devices: string[] }

const PAGE = 100;
const TONE: Record<LogStatus, "green" | "blue" | "amber" | "red"> = { accepted: "green", reprocessed: "blue", pending: "amber", invalid: "red" };
const todayWita = (): string => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
const shift = (d: string, n: number): string => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** "2026-11-16T07:58:00+08:00" → "16 Nov 2026 07.58.00" (jam dinding WITA dari mesin). */
const fmtScan = (iso: string, locale: string): string => {
  const [d, t] = iso.slice(0, 19).split("T");
  const dt = new Date(`${d}T00:00:00Z`);
  return `${dt.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })} ${(t ?? "").replace(/:/g, ".")}`;
};

export default function DeviceLogs() {
  const { locale } = useT();
  const E = n_emp[locale];
  const [to, setTo] = useState(todayWita());
  const [from, setFrom] = useState(shift(todayWita(), -6));
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState<LogStatus | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState<LogPage | null>(null);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const query = useCallback((offset: number): string => {
    const p = new URLSearchParams({ from, to, limit: String(PAGE), offset: String(offset) });
    if (deviceId) p.set("deviceId", deviceId);
    if (status) p.set("status", status);
    if (q.trim()) p.set("q", q.trim());
    return `/api/attendance/device-logs?${p.toString()}`;
  }, [from, to, deviceId, status, q]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await apiFetch<LogPage>(query(0));
      setPage(res);
      setRows(res.rows);
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); } finally { setLoading(false); }
  }, [query, E.ingFail]);
  const more = async (): Promise<void> => {
    try {
      const res = await apiFetch<LogPage>(query(rows.length));
      setRows((r) => [...r, ...res.rows]);
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  useEffect(() => {
    const t0 = window.setTimeout(() => void load(), 250); // tunda sedikit saat mengetik pencarian
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 5_000);
    return () => { window.clearTimeout(t0); window.clearInterval(t); };
  }, [load]);

  const label: Record<LogStatus, string> = { accepted: E.logAccepted, reprocessed: E.logReprocessed, pending: E.logPending, invalid: E.logInvalid };
  const hint: Record<LogStatus, string> = { accepted: E.logAcceptedHint, reprocessed: E.logReprocessedHint, pending: E.logPendingHint, invalid: E.logInvalidHint };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold text-navy-900">{E.logTitle}</h3>
        <p className="text-xs text-steel-500">{E.logSub}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-xs text-steel-500">{E.logFrom}
          <input type="date" className="input mt-1 w-auto" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col text-xs text-steel-500">{E.logTo}
          <input type="date" className="input mt-1 w-auto" value={to} min={from} max={todayWita()} onChange={(e) => setTo(e.target.value)} />
        </label>
        {(page?.devices.length ?? 0) > 1 && (
          <label className="flex flex-col text-xs text-steel-500">{E.logDevice}
            <select className="input mt-1 w-auto" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              <option value="">{E.logAll}</option>
              {page?.devices.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col text-xs text-steel-500">{E.logStatusLabel}
          <select className="input mt-1 w-auto" value={status} onChange={(e) => setStatus(e.target.value as LogStatus | "")}>
            <option value="">{E.logAll}</option>
            {(Object.keys(label) as LogStatus[]).map((k) => <option key={k} value={k}>{label[k]}</option>)}
          </select>
        </label>
        <div className="min-w-[200px] flex-1"><SearchBox value={q} onChange={setQ} placeholder={E.logSearch} ariaLabel={E.logSearch} /></div>
        <AsyncButton className="btn-secondary text-xs" onAction={load}><RefreshCw className="h-3.5 w-3.5" /> {E.devRefresh}</AsyncButton>
      </div>

      {page && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={E.logStatusLabel}>
          {(Object.keys(label) as LogStatus[]).map((k) => (
            <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(status === k ? "" : k)} title={hint[k]}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${status === k ? "border-navy-900 bg-surface" : "border-steel-200 bg-white hover:bg-surface"}`}>
              <p className="text-lg font-semibold tabular-nums text-navy-900">{page.summary[k] ?? 0}</p>
              <p className="text-xs text-steel-500">{label[k]}</p>
            </button>
          ))}
        </div>
      )}

      {loading && !page ? (
        <p className="py-10 text-center text-sm text-steel-400" role="status">{E.devLoading}</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-6 w-6" />} title={E.logEmpty} subtitle={E.logEmptyHint} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-steel-200">
          <table className="w-full min-w-[600px] text-sm">
            <caption className="sr-only">{E.logCaption}</caption>
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th scope="col" className="px-3 py-2">{E.logColScan}</th>
                <th scope="col" className="px-3 py-2">{E.logColKind}</th>
                <th scope="col" className="px-3 py-2">{E.devColId}</th>
                <th scope="col" className="px-3 py-2">{E.devColEmp}</th>
                <th scope="col" className="px-3 py-2">{E.logStatusLabel}</th>
                <th scope="col" className="px-3 py-2">{E.logColReceived}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {rows.map((r, i) => (
                <tr key={`${r.at}-${r.userId}-${i}`}>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-navy-900">{r.scanAt ? fmtScan(r.scanAt, locale) : <span className="text-steel-400">{E.logBatch.replace("{n}", String(r.lines))}</span>}</td>
                  <td className="px-3 py-2">
                    {r.kind ? (
                      <>
                        <Badge tone={r.kind === "in" ? "green" : r.kind === "out" ? "blue" : "gray"}>{r.kind === "in" ? E.logKindIn : r.kind === "out" ? E.logKindOut : E.logKindExtra}</Badge>
                        {r.dayScans > 0 && <span className="mt-0.5 block text-[11px] text-steel-400">{E.logDayScans.replace("{n}", String(r.dayScans))}</span>}
                      </>
                    ) : <span className="text-steel-400">-</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-navy-900">{r.userId || (r.unknown.length ? r.unknown.join(", ") : "-")}</td>
                  <td className="px-3 py-2">{r.employee ? r.employee.name : <span className="text-steel-400">{E.logNoEmp}</span>}</td>
                  <td className="px-3 py-2"><span title={hint[r.status]}><Badge tone={TONE[r.status]}>{label[r.status]}</Badge></span></td>
                  <td className="px-3 py-2 text-xs text-steel-500">{fmtTanggalJam(r.at)}{(page?.devices.length ?? 0) > 1 && <span className="block font-mono">{r.deviceId}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {page && rows.length < page.total && (
        <div className="flex justify-center">
          <AsyncButton className="btn-secondary text-xs" onAction={more}>{E.logMore.replace("{a}", String(rows.length)).replace("{b}", String(page.total))}</AsyncButton>
        </div>
      )}
    </div>
  );
}
