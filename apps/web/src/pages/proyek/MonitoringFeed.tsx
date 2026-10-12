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
import { ROLE_LABELS } from "../pengaturan/Peran";

interface FeedEntry {
  key: string;
  kind: "wbs" | "wo";
  pid: string;
  vessel: string;
  title: string;
  from: number | null;
  to: number | null;
  actor: string;
  /** Peran akun yang dicap server saat update disimpan; kosong untuk update lama. */
  role: string;
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
        ((w as { history?: Record<string, unknown>[] }).history ?? []).forEach((h, i) => {
          out.push({
            key: `wbs-${projectId}-${String(w.task)}-${String(h.id ?? h.date)}-${i}`, kind: "wbs", pid: projectId, vessel: allowed.get(projectId) ?? projectId,
            title: String(w.task), from: num(h.from), to: num(h.to), actor: String(h.actor ?? "-"), role: String(h.actorRole ?? ""),
            date: String(h.date ?? ""), note: String(h.note ?? ""), photos: Array.isArray(h.photos) ? (h.photos as unknown[]).map(String) : [],
          });
        });
      }
    }
    for (const wo of data.workOrders ?? []) {
      const projectId = String(wo.project ?? "");
      if (!allowed.has(projectId)) continue;
      (Array.isArray(wo.progressLog) ? (wo.progressLog as Record<string, unknown>[]) : []).forEach((h, i) => {
        out.push({
          key: `wo-${String(wo.id)}-${String(h.id ?? h.date)}-${i}`, kind: "wo", pid: projectId, vessel: allowed.get(projectId) ?? projectId,
          title: `${String(wo.id)} · ${String(wo.scope ?? wo.title ?? wo.sub ?? "")}`, from: num(h.from), to: num(h.to),
          actor: String(h.by ?? h.actor ?? "-"), role: String(h.actorRole ?? ""), date: String(h.date ?? ""), note: String(h.note ?? ""),
          photos: Array.isArray(h.photos) ? (h.photos as unknown[]).map(String) : [],
        });
      });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [data.wbsByProject, data.workOrders, projects]);

  const shown = entries.filter((e) => (pid === "Semua" || e.pid === pid)
    && (!from || e.date.slice(0, 10) >= from) && (!to || e.date.slice(0, 10) <= to));

  return (
    <Card className="mt-4 p-5">
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
        /* #90: tabel yang mudah dipindai; di layar sempit tabel digulir mendatar
           sehingga foto dan progres tetap terlihat. */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-steel-200 text-xs text-steel-500">
                <th className="py-2 pr-3 font-medium">{S.monFeedColPhoto}</th>
                <th className="py-2 pr-3 font-medium">{S.monFeedColWork}</th>
                <th className="py-2 pr-3 font-medium">{S.monFeedColProgress}</th>
                <th className="py-2 pr-3 font-medium">{S.monFeedColBy}</th>
                <th className="py-2 pr-3 font-medium">{S.monFeedColDate}</th>
                <th className="py-2 font-medium"><span className="sr-only">{S.monFeedDetail}</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, limit).map((e) => (
                <tr key={e.key} className="border-b border-steel-100 align-top last:border-0">
                  <td className="py-2 pr-3">
                    {e.photos[0] ? (
                      <SecureImg src={e.photos[0]} alt={e.title} name={e.title} className="h-14 w-20 rounded-lg border border-steel-200 object-cover" />
                    ) : (
                      <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-steel-50 text-steel-300"><Camera className="h-4 w-4" /></div>
                    )}
                    {e.photos.length > 1 && <p className="mt-0.5 text-[11px] text-steel-400">{S.monFeedPhotos.replace("{n}", String(e.photos.length))}</p>}
                  </td>
                  <td className="max-w-[260px] py-2 pr-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={e.kind === "wbs" ? "navy" : "amber"}>{e.kind === "wbs" ? "WBS" : "WO Subkon"}</Badge>
                      <span className="text-xs text-steel-500">{e.pid} · {e.vessel}</span>
                    </div>
                    <p className="mt-0.5 break-words font-semibold text-navy-900">{e.title}</p>
                    {e.note && <p className="mt-0.5 line-clamp-2 text-xs text-steel-500">{e.note}</p>}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-3 text-xs text-steel-600">
                    {e.from !== null && e.to !== null ? S.monFeedProgress.replace("{a}", String(e.from)).replace("{b}", String(e.to)) : "-"}
                  </td>
                  <td className="py-2 pr-3">
                    <p className="text-sm text-navy-900">{e.actor}</p>
                    {e.role && <Badge tone="blue">{ROLE_LABELS[e.role] ?? e.role}</Badge>}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-3 text-xs text-steel-600">{fmtTanggal(e.date.slice(0, 10))}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        to={`/proyek/${e.pid}?tab=${encodeURIComponent(e.kind === "wbs" ? "WBS & Anggaran" : "Subkon")}`}
                        state={{ from: "/proyek/monitoring" }}
                        className="btn-secondary h-8 whitespace-nowrap px-3 text-xs"
                      >
                        {canUpdate && e.kind === "wbs" ? S.monFeedUpdate : S.monFeedDetail}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {shown.length > limit && (
        <button type="button" className="btn-secondary mt-3 w-full justify-center text-xs" onClick={() => setLimit((n) => n + 12)}>
          {S.monFeedMore.replace("{n}", String(shown.length - limit))}
        </button>
      )}
    </Card>
  );
}
