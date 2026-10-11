// Daftar berjenjang bergaya flowchart: tiap anak tersambung ke induknya
// dengan garis siku + kepala panah, bisa dibuka-tutup per simpul.
// Dipakai halaman Dokumen dan tab Dokumen proyek; isi simpul ditentukan
// pemanggil, komponen ini hanya mengurus struktur, garis, dan buka-tutup.
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export interface FlowNode {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** Lencana/aksi di sisi kanan simpul. */
  trailing?: ReactNode;
  /** Klik pada badan simpul (mis. buka detail). Tanpa ini, klik = buka-tutup. */
  onOpen?: () => void;
  children?: FlowNode[];
  /** group = simpul kelompok (tebal), item = dokumen, leaf = rincian kecil. */
  kind?: "group" | "item" | "leaf";
}

const ELBOW_Y = 22; // px dari atas simpul ke garis siku

function Branch({ nodes, depth, open, toggle, labels }: {
  nodes: FlowNode[]; depth: number; open: Set<string>; toggle: (id: string) => void;
  labels: { expand: string; collapse: string };
}) {
  const reduced = useReducedMotion();
  return (
    <ul role={depth === 0 ? "tree" : "group"} className={depth === 0 ? "space-y-3" : "ml-5 space-y-2 pt-2"}>
      {nodes.map((n, i) => {
        const kids = n.children ?? [];
        const isOpen = open.has(n.id);
        const last = i === nodes.length - 1;
        const kind = n.kind ?? "item";
        const body = (
          <>
            {n.icon && <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${kind === "group" ? "bg-white/15 text-white" : "bg-steel-100 text-navy-800"}`}>{n.icon}</span>}
            <span className="min-w-0 flex-1 text-left">
              <span className={`block truncate ${kind === "group" ? "text-sm font-semibold text-white" : kind === "leaf" ? "text-xs text-navy-900" : "text-sm font-medium text-navy-900"}`}>{n.title}</span>
              {n.subtitle && <span className={`block truncate text-xs ${kind === "group" ? "text-white/75" : "text-steel-500"}`}>{n.subtitle}</span>}
            </span>
          </>
        );
        return (
          <li key={n.id} role="treeitem" aria-expanded={kids.length > 0 ? isOpen : undefined} className={depth === 0 ? "relative" : "relative pl-7"}>
            {depth > 0 && (
              <>
                {/* Garis tegak: anak terakhir berhenti di siku supaya tidak menjuntai. */}
                <span aria-hidden className="absolute left-0 top-0 w-px bg-steel-300" style={{ height: last ? ELBOW_Y : "100%" }} />
                <span aria-hidden className="absolute left-0 h-px w-5 bg-steel-300" style={{ top: ELBOW_Y }} />
                <span aria-hidden className="absolute border-y-4 border-l-[6px] border-y-transparent border-l-steel-400" style={{ left: 18, top: ELBOW_Y - 4 }} />
              </>
            )}
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-shadow duration-150 ${
              kind === "group" ? "border-navy-800 bg-navy-800" : kind === "leaf" ? "border-steel-100 bg-surface" : "border-steel-200 bg-white hover:shadow-sm"
            }`}>
              {kids.length > 0 ? (
                <button type="button" onClick={() => toggle(n.id)} aria-label={isOpen ? labels.collapse : labels.expand}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-transform duration-150 ease-out active:scale-95 ${kind === "group" ? "text-white hover:bg-white/15" : "text-steel-500 hover:bg-steel-100"}`}>
                  <ChevronRight className={`h-4 w-4 transition-transform duration-150 ease-out ${isOpen ? "rotate-90" : ""}`} />
                </button>
              ) : <span className="w-6 shrink-0" aria-hidden />}
              {n.onOpen || kids.length > 0 ? (
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ocean-500"
                  onClick={n.onOpen ?? (() => toggle(n.id))}>{body}</button>
              ) : <span className="flex min-w-0 flex-1 items-center gap-2">{body}</span>}
              {n.trailing && <span className="flex shrink-0 items-center gap-1.5">{n.trailing}</span>}
            </div>
            <AnimatePresence initial={false}>
              {kids.length > 0 && isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden"
                >
                  <Branch nodes={kids} depth={depth + 1} open={open} toggle={toggle} labels={labels} />
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

/** `defaultOpen` = id simpul yang terbuka saat pertama tampil. */
export function FlowTree({ nodes, defaultOpen, labels }: {
  nodes: FlowNode[]; defaultOpen?: string[]; labels: { expand: string; collapse: string; expandAll: string; collapseAll: string };
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ?? nodes.map((n) => n.id)));
  const toggle = (id: string): void => setOpen((cur) => { const next = new Set(cur); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const allIds = (list: FlowNode[]): string[] => list.flatMap((n) => ((n.children ?? []).length > 0 ? [n.id, ...allIds(n.children ?? [])] : []));
  return (
    <div>
      <div className="mb-2 flex justify-end gap-3 text-xs">
        <button type="button" className="font-medium text-ocean-600 hover:underline" onClick={() => setOpen(new Set(allIds(nodes)))}>{labels.expandAll}</button>
        <button type="button" className="font-medium text-ocean-600 hover:underline" onClick={() => setOpen(new Set())}>{labels.collapseAll}</button>
      </div>
      <Branch nodes={nodes} depth={0} open={open} toggle={toggle} labels={labels} />
    </div>
  );
}
