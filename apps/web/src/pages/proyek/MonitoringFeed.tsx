/* Feed update pekerjaan (F3-E-01, MON-01): update progres WBS (histori
 * F3-B-09) dan progres WO subkon (progressLog, F3-I-03) terbaru, dengan foto.
 * Sumber dari store, jadi update dari detail proyek langsung muncul. */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, ClipboardList } from "lucide-react";
import { Badge, Card, EmptyState, SecureImg } from "../../components/ui";
import type { StoreItem } from "../../data/store";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import { fmtTanggal } from "../../utils/format";

interface FeedEntry {
  key: string;
  kind: "wbs" | "wo";
  pid: string;
  vessel: string;
  title: string;
  from: number | null;
  to: number | null;
  actor: string;
  date: string;
  note: string;
  photos: string[];
}

interface Props {
  /** Proyek yang boleh dilihat peran ini (F3-E-02). */
  projects: StoreItem[];
  /** Peran boleh memperbarui pekerjaan (tombol Update). */
  canUpdate: boolean;
}

const num = (v: unknown): number | null => (v === undefined || v === null || v === "" ? null : Number(v));

export default function MonitoringFeed({ projects, canUpdate }: Props) {
  const { locale } = useT();
  const S = n_prj[locale];
  const { data } = useStore();
  const [pid, setPid] = useState("Semua");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(12);

  const entries = useMemo(() => {
    const allowed = new Map(projects.map((p) => [String(p.id), String(p.vessel ?? p.id)]));
    const out: FeedEntry[] = [];
    for (const [projectId, rows] of Object.entries(data.wbsByProject ?? {})) {
      if (!allowed.has(projectId)) continue;
      for (const w of rows ?? []) {
        for (const h of (w as { history?: Record<string, unknown>[] }).history ?? []) {
          out.push({
            key: `wbs-${projectId}-${String(h.id ?? h.date)}`, kind: "wbs", pid: projectId, vessel: allowed.get(projectId) ?? projectId,
            title: String(w.task), from: num(h.from), to: num(h.to), actor: String(h.actor ?? "-"),
            date: String(h.date ?? ""), note: String(h.note ?? ""), photos: Array.isArray(h.photos) ? (h.photos as unknown[]).map(String) : [],
          });
        }
      }
    }
    for (const wo of data.workOrders ?? []) {
      const projectId = String(wo.project ?? "");
      if (!allowed.has(projectId)) continue;
      for (const h of (Array.isArray(wo.progressLog) ? (wo.progressLog as Record<string, unknown>[]) : [])) {
        out.push({
          key: `wo-${String(wo.id)}-${String(h.id ?? h.date)}`, kind: "wo", pid: projectId, vessel: allowed.get(projectId) ?? projectId,
          title: `${String(wo.id)} · ${String(wo.scope ?? wo.title ?? wo.sub ?? "")}`, from: num(h.from), to: num(h.to),
          actor: String(h.by ?? h.actor ?? "-"), date: String(h.date ?? ""), note: String(h.note ?? ""),
          photos: Array.isArray(h.photos) ? (h.photos as unknown[]).map(String) : [],
        });
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [data.wbsByProject, data.workOrders, projects]);

  const shown = entries.filter((e) => (pid === "Semua" || e.pid === pid)
    && (!from || e.date.slice(0, 10) >= from) && (!to || e.date.slice(0, 10) <= to));

  return (
    <Card className="mb-4 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto flex items-center gap-2 text-sm font-semibold text-navy-900">
          <Camera className="h-4 w-4 text-steel-500" /> {S.monFeedTitle}
        </h3>
        <select className="input h-8 w-auto py-0 text-xs" aria-label={S.monFeedProject} value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="Semua">{S.monFeedAllProj}</option>
          {projects.map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.id)} · {String(p.vessel ?? "")}</option>)}
        </select>
        <input type="date" className="input h-8 w-auto py-0 text-xs" aria-label={S.monFeedFrom} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-xs text-steel-400">–</span>
        <input type="date" className="input h-8 w-auto py-0 text-xs" aria-label={S.monFeedTo} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title={S.monFeedEmpty} subtitle={S.monFeedEmptySub} />
      ) : (
        <ol className="space-y-3">
          {shown.slice(0, limit).map((e) => (
            <li key={e.key} className="flex gap-3 rounded-xl border border-steel-100 p-3">
              {e.photos[0] ? (
                <SecureImg src={e.photos[0]} alt={e.title} name={e.title} className="h-20 w-28 shrink-0 rounded-lg border border-steel-200 object-cover" />
              ) : (
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-steel-50 text-steel-300"><Camera className="h-5 w-5" /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={e.kind === "wbs" ? "navy" : "amber"}>{e.kind === "wbs" ? "WBS" : "WO Subkon"}</Badge>
                  <Link to={`/proyek/${e.pid}`} state={{ from: "/proyek/monitoring" }} className="truncate text-xs font-medium text-steel-600 hover:underline">{e.pid} · {e.vessel}</Link>
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-navy-900">{e.title}</p>
                {e.from !== null && e.to !== null && (
                  <p className="text-xs text-steel-600">{S.monFeedProgress.replace("{a}", String(e.from)).replace("{b}", String(e.to))}</p>
                )}
                {e.note && <p className="mt-0.5 line-clamp-2 text-xs text-steel-500">{e.note}</p>}
                <p className="mt-1 text-[11px] text-steel-400">{S.monFeedBy.replace("{by}", e.actor).replace("{date}", fmtTanggal(e.date.slice(0, 10)))}{e.photos.length > 1 ? ` · ${S.monFeedPhotos.replace("{n}", String(e.photos.length))}` : ""}</p>
              </div>
              {canUpdate && e.kind === "wbs" && (
                <Link
                  to={`/proyek/${e.pid}?tab=${encodeURIComponent("WBS & Anggaran")}`}
                  state={{ from: "/proyek/monitoring" }}
                  className="btn-secondary h-8 self-center whitespace-nowrap px-3 text-xs"
                >
                  {S.monFeedUpdate}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
      {shown.length > limit && (
        <button type="button" className="btn-secondary mt-3 w-full justify-center text-xs" onClick={() => setLimit((n) => n + 12)}>
          {S.monFeedMore.replace("{n}", String(shown.length - limit))}
        </button>
      )}
    </Card>
  );
}
