// Detail satu mesin di tab "Mesin": grafik scan, kualitas koneksi, isi vs
// kapasitas, pengaturan mesin (baca saja - firmware menolak perubahan), dan
// ambil log dari memori mesin (scan yang terlewat dimasukkan ke absensi).
// Semua data dari GET /api/attendance/devices/:id/stats, diperbarui tiap 5 detik.
import { useCallback, useEffect, useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Settings2, Wifi } from "lucide-react";
import { AsyncButton, Badge, ChartTooltip, toast } from "../../components/ui";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch } from "../../services/http";
import { fmtTanggalJam } from "../../utils/format";

interface Stats {
  perHour: number[];
  perDay: { date: string; count: number }[];
  capacity: Record<string, number | string> | null;
  connection: { samples: number; avgGapSec: number; maxGapSec: number; drops: number; uptimePct: number; perMinute: number[]; lastSeen: string | null };
  settings: { at: string | null; values: Record<string, number | string> | null } | null;
}

const todayWita = (): string => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
const shiftDay = (d: string, n: number): string => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
type CapKey = "users" | "fp" | "face" | "palm" | "card" | "logs";
const CAP: [string, string, CapKey][] = [
  ["user_count", "user_max", "users"], ["fp_count", "fp_max", "fp"], ["face_count", "face_max", "face"],
  ["pv_count", "pv_max", "palm"], ["idcard_count", "idcard_max", "card"], ["all_log_count", "total_log_max", "logs"],
];

export default function DevicePanel({ deviceId, onAction }: { deviceId: string; onAction: (body: Record<string, unknown>, msg: string) => Promise<boolean> }) {
  const { locale } = useT();
  const E = n_emp[locale];
  const [s, setS] = useState<Stats | null>(null);
  const [from, setFrom] = useState(shiftDay(todayWita(), -6));
  const [to, setTo] = useState(todayWita());
  const fromId = useId();
  const toId = useId();

  const load = useCallback(async (): Promise<void> => {
    try { setS(await apiFetch<Stats>(`/api/attendance/devices/${encodeURIComponent(deviceId)}/stats`)); } catch { /* dicoba lagi berkala */ }
  }, [deviceId]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 5_000);
    return () => window.clearInterval(t);
  }, [load]);

  if (!s) return <p className="py-6 text-center text-sm text-steel-400" role="status">{E.devLoading}</p>;
  const c = s.connection;
  const quality = c.samples < 3 ? "unknown" : c.drops === 0 && c.uptimePct >= 95 ? "good" : c.drops <= 2 && c.uptimePct >= 80 ? "fair" : "poor";
  const qTone = { good: "green", fair: "amber", poor: "red", unknown: "gray" } as const;
  const qText = { good: E.pnlConnGood, fair: E.pnlConnFair, poor: E.pnlConnPoor, unknown: E.pnlConnUnknown };
  const capLabel: Record<CapKey, string> = { users: E.devStatUsers, fp: E.devStatFp, face: E.devStatFace, palm: E.devStatPalm, card: E.devStatCard, logs: E.devStatLogs };
  const hours = s.perHour.map((v, h) => ({ name: String(h).padStart(2, "0"), v }));
  const days = s.perDay.map((d) => ({ name: d.date.slice(8, 10) + "/" + d.date.slice(5, 7), v: d.count }));
  const settingRows = s.settings?.values ? Object.entries(s.settings.values) : [];
  const settingLabel = (k: string): [string, string] => {
    const v = (E.pnlSetting as Record<string, string[]>)[k];
    return v ? [v[0] ?? k, v[1] ?? ""] : [k.replace(/_/g, " "), ""];
  };

  const pullLogs = async (): Promise<void> => {
    if (from > to) { toast(E.pnlRangeInvalid, "info"); return; }
    await onAction({ action: "pull_logs", from, to }, E.pnlPullQueued);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section aria-labelledby={`${deviceId}-h`} className="rounded-xl border border-steel-200 bg-white p-4">
          <h4 id={`${deviceId}-h`} className="text-sm font-semibold text-navy-900">{E.pnlPerHour}</h4>
          <p className="text-xs text-steel-500">{E.pnlPerHourSub.replace("{n}", String(s.perHour.reduce((a, b) => a + b, 0)))}</p>
          <div className="mt-2 h-40" role="img" aria-label={`${E.pnlPerHour}: ${hours.filter((x) => x.v > 0).map((x) => `${x.name}.00 ${x.v}`).join(", ") || E.pnlNoScan}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${String(v)} scan`} />} />
                <Bar dataKey="v" fill="#262626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section aria-labelledby={`${deviceId}-d`} className="rounded-xl border border-steel-200 bg-white p-4">
          <h4 id={`${deviceId}-d`} className="text-sm font-semibold text-navy-900">{E.pnlPerDay}</h4>
          <p className="text-xs text-steel-500">{E.pnlPerDaySub}</p>
          <div className="mt-2 h-40" role="img" aria-label={`${E.pnlPerDay}: ${days.map((x) => `${x.name} ${x.v}`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${String(v)} scan`} />} />
                <Bar dataKey="v" fill="#E61919" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section aria-labelledby={`${deviceId}-c`} className="rounded-xl border border-steel-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 id={`${deviceId}-c`} className="flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Wifi className="h-4 w-4" aria-hidden /> {E.pnlConn}</h4>
              <p className="text-xs text-steel-500">{E.pnlConnSub}</p>
            </div>
            <Badge tone={qTone[quality]}>{qText[quality]}</Badge>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              [E.pnlConnLast, c.lastSeen ? fmtTanggalJam(c.lastSeen) : "-"],
              [E.pnlConnGap, c.samples > 1 ? E.pnlSec.replace("{n}", String(c.avgGapSec)) : "-"],
              [E.pnlConnDrops, String(c.drops)],
              [E.pnlConnUptime, c.samples > 1 ? `${c.uptimePct}%` : "-"],
            ] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface px-2 py-1.5"><dd className="text-sm font-semibold tabular-nums text-navy-900">{v}</dd><dt className="text-[11px] text-steel-500">{k}</dt></div>
            ))}
          </dl>
          <div className="mt-3 flex h-10 items-end gap-px" role="img" aria-label={E.pnlConnBarsLabel.replace("{a}", String(c.perMinute.filter((n) => n > 0).length))}>
            {c.perMinute.map((n, i) => (
              <span key={i} aria-hidden className={`flex-1 rounded-sm ${n === 0 ? "bg-red-200" : "bg-emerald-500"}`} style={{ height: `${n === 0 ? 20 : Math.min(100, 30 + n * 6)}%` }} />
            ))}
          </div>
          <p className="mt-1 flex justify-between text-[10px] text-steel-400" aria-hidden><span>{E.pnl60Ago}</span><span>{E.pnlNow}</span></p>
          <p className="mt-2 text-[11px] text-steel-400">{E.pnlConnNote}</p>
        </section>

        <section aria-labelledby={`${deviceId}-k`} className="rounded-xl border border-steel-200 bg-white p-4">
          <h4 id={`${deviceId}-k`} className="text-sm font-semibold text-navy-900">{E.pnlCap}</h4>
          <p className="text-xs text-steel-500">{s.capacity?.at ? E.pnlCapAt.replace("{t}", fmtTanggalJam(String(s.capacity.at))) : E.pnlCapNone}</p>
          {s.capacity ? (
            <ul className="mt-3 space-y-2.5">
              {CAP.map(([k, max, label]) => {
                const v = Number(s.capacity?.[k] ?? 0);
                const m = Number(s.capacity?.[max] ?? 0);
                const p = m > 0 ? Math.min(100, (v / m) * 100) : 0;
                return (
                  <li key={k}>
                    <div className="flex justify-between text-xs"><span className="text-steel-600">{capLabel[label]}</span><span className="tabular-nums text-navy-900">{v} / {m || "-"}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-surface" role="progressbar" aria-label={capLabel[label]} aria-valuenow={v} aria-valuemin={0} aria-valuemax={m || undefined}>
                      <div className={`h-2 rounded-full ${p >= 90 ? "bg-red-500" : p >= 70 ? "bg-amber-500" : "bg-navy-900"}`} style={{ width: `${Math.max(p, v > 0 ? 1.5 : 0)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-3 text-sm text-steel-400">{E.pnlCapHint}</p>}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section aria-labelledby={`${deviceId}-l`} className="rounded-xl border border-steel-200 bg-white p-4">
          <h4 id={`${deviceId}-l`} className="flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Download className="h-4 w-4" aria-hidden /> {E.pnlPull}</h4>
          <p className="text-xs text-steel-500">{E.pnlPullSub}</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex flex-col text-xs text-steel-500"><label htmlFor={fromId}>{E.logFrom}</label><input id={fromId} type="date" className="input mt-1 w-auto" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="flex flex-col text-xs text-steel-500"><label htmlFor={toId}>{E.logTo}</label><input id={toId} type="date" className="input mt-1 w-auto" value={to} min={from} max={todayWita()} onChange={(e) => setTo(e.target.value)} /></div>
            <AsyncButton className="btn-primary text-xs" onAction={pullLogs}><Download className="h-3.5 w-3.5" aria-hidden /> {E.pnlPullBtn}</AsyncButton>
          </div>
          <p className="mt-2 text-[11px] text-steel-400">{E.pnlPullNote}</p>
        </section>

        <section aria-labelledby={`${deviceId}-s`} className="rounded-xl border border-steel-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 id={`${deviceId}-s`} className="flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Settings2 className="h-4 w-4" aria-hidden /> {E.pnlSet}</h4>
              <p className="text-xs text-steel-500">{s.settings?.at ? E.pnlSetAt.replace("{t}", fmtTanggalJam(s.settings.at)) : E.pnlSetNone}</p>
            </div>
            <AsyncButton className="btn-secondary text-xs" onAction={() => onAction({ action: "settings" }, E.devActQueued)}>{E.pnlSetBtn}</AsyncButton>
          </div>
          {settingRows.length > 0 && (
            <dl className="mt-3 divide-y divide-steel-100">
              {settingRows.map(([k, v]) => {
                const [label, help] = settingLabel(k);
                return (
                  <div key={k} className="flex items-start justify-between gap-3 py-1.5">
                    <dt className="min-w-0 text-xs text-steel-600">{label}{help && <span className="block text-[11px] text-steel-400">{help}</span>}</dt>
                    <dd className="shrink-0 text-sm font-medium tabular-nums text-navy-900">{String(v)}</dd>
                  </div>
                );
              })}
            </dl>
          )}
          <p className="mt-2 text-[11px] text-steel-400">{E.pnlSetNote}</p>
        </section>
      </div>
    </div>
  );
}
