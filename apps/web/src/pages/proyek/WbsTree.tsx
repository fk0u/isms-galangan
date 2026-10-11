// Alur WBS bercabang: fase → pekerjaan → foto & riwayat update.
// Foto yang diunggah saat update progres (POST /api/files + PUT WBS) dibaca
// kembali dari WBS proyek dan ditampilkan sebagai thumbnail; klik = perbesar.
import { useMemo, useState } from "react";
import { Camera, GitBranch, History, ListChecks, Layers } from "lucide-react";
import { FlowTree, type FlowNode } from "../../components/FlowTree";
import { Badge, Modal, SecureImg } from "../../components/ui";
import type { WbsItem } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_tree } from "../../i18n/n_tree";
import { fmtBulan, fmtTanggal } from "../../utils/format";

interface Photo { url: string; note: string; date: string }

/** Galeri pekerjaan: field `photos` (objek atau URL polos) + `photoUrl` lama, tanpa duplikat. */
function taskPhotos(w: WbsItem): Photo[] {
  const out: Photo[] = [];
  const seen = new Set<string>();
  const push = (p: Photo): void => { if (p.url !== "" && !seen.has(p.url)) { seen.add(p.url); out.push(p); } };
  for (const p of (w.photos ?? []) as unknown[]) {
    if (typeof p === "string") push({ url: p, note: "", date: "" });
    else if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      push({ url: String(o.url ?? ""), note: String(o.note ?? ""), date: String(o.date ?? "") });
    }
  }
  const legacy = (w as unknown as { photoUrl?: unknown; photoNote?: unknown });
  if (typeof legacy.photoUrl === "string") push({ url: legacy.photoUrl, note: String(legacy.photoNote ?? ""), date: "" });
  return out;
}

/** Fase = bagian nama sebelum " — " / " - "; pekerjaan tanpa pemisah jadi fasenya sendiri. */
function phaseOf(task: string): string {
  const m = /^(.+?)\s+[—–-]\s+/.exec(task);
  return m ? m[1] : task;
}

export default function WbsTree({ wbs }: { wbs: WbsItem[] }) {
  const { locale } = useT();
  const T = n_tree[locale];
  const [zoom, setZoom] = useState<Photo | null>(null);

  const thumbs = (photos: Photo[], label: string) => (
    <div className="flex flex-wrap gap-2">
      {photos.map((p) => (
        <button key={p.url} type="button" onClick={() => setZoom(p)} aria-label={`${T.zoomPhoto}: ${p.note || label}`}
          className="overflow-hidden rounded-lg border border-steel-200 transition-transform duration-150 ease-out hover:shadow-sm active:scale-[0.97]">
          <SecureImg src={p.url} alt={p.note || label} name={label} className="h-16 w-24 object-cover" />
        </button>
      ))}
    </div>
  );

  const { nodes, photoCount } = useMemo(() => {
    const phases = new Map<string, WbsItem[]>();
    for (const w of wbs) {
      const key = phaseOf(String(w.task ?? ""));
      phases.set(key, [...(phases.get(key) ?? []), w]);
    }
    let count = 0;
    const taskNode = (w: WbsItem): FlowNode => {
          const task = String(w.task ?? "");
          const photos = taskPhotos(w);
          const hist = [...(w.history ?? [])].reverse();
          count += photos.length;
          const kids: FlowNode[] = [];
          if (photos.length > 0) {
            kids.push({ id: `${task}:foto`, kind: "leaf", icon: <Camera className="h-3.5 w-3.5" />, title: T.wbsPhotos.replace("{n}", String(photos.length)), content: thumbs(photos, task) });
          }
          if (hist.length > 0) {
            kids.push({
              id: `${task}:hist`, kind: "leaf", icon: <History className="h-3.5 w-3.5" />, title: T.wbsHistory.replace("{n}", String(hist.length)),
              children: hist.map((h, i) => {
                const hp = (h.photos ?? []).map((u) => ({ url: String(u), note: String(h.note ?? ""), date: String(h.date ?? "") }));
                count += hp.filter((p) => !photos.some((x) => x.url === p.url)).length;
                return {
                  id: `${task}:hist:${i}`, kind: "leaf" as const, icon: <GitBranch className="h-3.5 w-3.5" />,
                  title: `${Number(h.from) || 0}% → ${Number(h.to) || 0}%${h.note ? ` - ${String(h.note)}` : ""}`,
                  subtitle: T.revBy.replace("{date}", h.date ? fmtTanggal(String(h.date).slice(0, 10)) : "-").replace("{by}", String(h.actor ?? "-")),
                  content: hp.length > 0 ? thumbs(hp, task) : undefined,
                };
              }),
            });
          }
          const progress = Number(w.progress) || 0;
          return {
            id: task, kind: "item" as const, icon: <ListChecks className="h-4 w-4" />,
            title: task,
            subtitle: `${fmtBulan(String(w.start ?? ""))} – ${fmtBulan(String(w.end ?? ""))}${w.assignee?.name ? ` · ${w.assignee.name}` : ""}`,
            trailing: <>
              {photos.length > 0 && <Badge tone="blue">{T.photosN.replace("{n}", String(photos.length))}</Badge>}
              <Badge tone={progress >= 100 ? "green" : progress > 0 ? "amber" : "gray"}>{progress}%</Badge>
            </>,
            children: kids,
          };
    };
    const built: FlowNode[] = [...phases.entries()].map(([phase, tasks]) => {
      // Pekerjaan tunggal tanpa fase tidak dibungkus kelompok berisi dirinya sendiri.
      if (tasks.length === 1 && String(tasks[0].task ?? "") === phase) return taskNode(tasks[0]);
      const avg = Math.round(tasks.reduce((s, w) => s + (Number(w.progress) || 0), 0) / Math.max(1, tasks.length));
      return {
        id: `p:${phase}`, kind: "group" as const, icon: <Layers className="h-4 w-4" />,
        title: phase, subtitle: T.phaseSub.replace("{n}", String(tasks.length)).replace("{p}", String(avg)),
        children: tasks.map(taskNode),
      };
    });
    return { nodes: built, photoCount: count };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wbs, locale]);

  if (wbs.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs text-steel-500">{T.wbsIntro.replace("{n}", String(photoCount))}</p>
      <FlowTree nodes={nodes} defaultOpen={nodes.map((n) => n.id)} labels={{ expand: T.expand, collapse: T.collapse, expandAll: T.expandAll, collapseAll: T.collapseAll }} />
      <Modal open={zoom !== null} onClose={() => setZoom(null)} wide title={zoom?.note || T.zoomPhoto} subtitle={zoom?.date ? fmtTanggal(zoom.date.slice(0, 10)) : undefined}>
        {zoom && <SecureImg src={zoom.url} alt={zoom.note || T.zoomPhoto} className="max-h-[70vh] w-full rounded-xl object-contain" />}
      </Modal>
    </div>
  );
}
