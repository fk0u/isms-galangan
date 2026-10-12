import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus, Minus, Search } from "lucide-react";
import type { StoreItem } from "../../../data/store";
import { SearchBox, RowAction, CardHeader, EmptyState } from "../../../components/ui";
import { n_fin } from "../../../i18n/n_fin";
import { useT } from "../../../i18n/LanguageContext";
import { Pencil, Trash2 } from "lucide-react";

export interface CoaTreeNode {
  id: string;
  kode: string;
  nama: string;
  dk: string;
  nrlr: string;
  tipe: string;
  isHeader: boolean;
  level: number;
  parentKode: string | null;
  raw: StoreItem;
  children: CoaTreeNode[];
}

interface CoaTabProps {
  coaRows: StoreItem[];
  onAdd: () => void;
  onEdit: (item: StoreItem) => void;
  onDelete: (item: StoreItem) => void;
}

/** Tentukan klasifikasi tipe akun (Aset, Liabilitas, Ekuitas, Pendapatan, Beban). */
export function determineCoaType(kode: string, dk: string, nrlr: string): string {
  if (dk === "-") return "Header";
  const clean = kode.trim();
  if (clean.startsWith("1")) return "Aset";
  if (clean.startsWith("2")) return "Liabilitas";
  if (clean.startsWith("3")) return "Ekuitas";
  if (clean.startsWith("4")) return "Pendapatan";
  if (clean.startsWith("5") || clean.startsWith("6")) return "Beban";
  if (clean.startsWith("7")) {
    if (clean.startsWith("7-1") || clean.startsWith("7-2")) return "Pendapatan";
    return "Beban";
  }
  return nrlr === "LR" ? "Beban" : "Aset";
}

/** Cari kode induk (parent) dari sebuah kode akun sesuai konvensi CoA galangan. */
export function resolveParentKode(kode: string, allKodes: Set<string>): string | null {
  const clean = kode.trim();

  // Sufiks huruf (misal: "6-021 A" -> "6-021")
  const suffixMatch = clean.match(/^([0-9]-[0-9]{3})\s+[A-Z]$/);
  if (suffixMatch && allKodes.has(suffixMatch[1])) {
    return suffixMatch[1];
  }

  const parts = clean.split("-");
  if (parts.length < 2) return null;
  const major = parts[0];
  const numPart = parts[1].slice(0, 3);
  const num = parseInt(numPart, 10);
  if (isNaN(num) || num === 0) return null; // Root 1-000, 2-000, dst.

  // Sub-header tingkat 1 ratusan (1-100, 1-200, 2-100, 2-200) -> Parent: X-000
  if (num % 100 === 0) {
    const root = `${major}-000`;
    return allKodes.has(root) ? root : null;
  }

  // Sub-kelompok khusus di katalog akun standar
  const specificSubParents = [
    "1-110", // Kas
    "1-120", // Bank
    "1-230", // Kendaraan
    "1-280", // Akum. Penyusutan Kendaraan
    "2-230", // Hutang Pajak
    "4-100", // Pendapatan
    "5-100", // Beban Pokok
    "6-021", // Penyusutan Kendaraan
  ];
  for (const sp of specificSubParents) {
    if (clean !== sp && clean.startsWith(sp.slice(0, 4)) && allKodes.has(sp)) {
      return sp;
    }
  }

  // Fallback ke sub-header ratusan terdekat (misal 1-100, 1-200, 2-100, 2-200)
  const hundreds = `${major}-${String(Math.floor(num / 100) * 100).padStart(3, "0")}`;
  if (allKodes.has(hundreds)) return hundreds;

  // Fallback ke root golongan (misal 3-000, 4-000, 5-000, 6-000, 7-000)
  const root = `${major}-000`;
  if (allKodes.has(root)) return root;

  return null;
}

/** Bangun pohon hierarki lengkap dari daftar baris CoA. */
export function buildCoaTree(rows: StoreItem[]): CoaTreeNode[] {
  const allKodes = new Set(rows.map((r) => String(r.kode ?? "").trim()));
  const nodesMap = new Map<string, CoaTreeNode>();

  for (const r of rows) {
    const kode = String(r.kode ?? "").trim();
    const nama = String(r.nama ?? "").trim();
    const dk = String(r.dk ?? "-");
    const nrlr = String(r.nrlr ?? "-");
    const tipe = determineCoaType(kode, dk, nrlr);
    const isHeader = dk === "-" || kode.endsWith("-000");

    nodesMap.set(kode, {
      id: String(r.id ?? kode),
      kode,
      nama,
      dk,
      nrlr,
      tipe,
      isHeader,
      level: 0,
      parentKode: resolveParentKode(kode, allKodes),
      raw: r,
      children: [],
    });
  }

  const roots: CoaTreeNode[] = [];
  for (const node of nodesMap.values()) {
    if (node.parentKode && nodesMap.has(node.parentKode)) {
      nodesMap.get(node.parentKode)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function setLevels(node: CoaTreeNode, lvl: number) {
    node.level = lvl;
    for (const child of node.children) {
      setLevels(child, lvl + 1);
    }
  }

  for (const r of roots) setLevels(r, 0);

  return roots;
}

export function CoaTab({ coaRows, onAdd, onEdit, onDelete }: CoaTabProps) {
  const { locale } = useT();
  const S = n_fin[locale];
  const [q, setQ] = useState("");
  const [tipeFilter, setTipeFilter] = useState("Semua");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(["1-000", "2-000", "3-000", "4-000", "5-000", "6-000", "7-000", "1-100", "1-200", "2-100", "2-200"]));

  // Bangun struktur pohon akun
  const rootNodes = useMemo(() => buildCoaTree(coaRows), [coaRows]);

  const coaTipeOptions = ["Semua", "Aset", "Liabilitas", "Ekuitas", "Pendapatan", "Beban", "Header"];

  // Evaluasi filter & pencarian sambil mempertahankan konteks hierarki parent-child
  const { filteredRoots, autoExpandKeys, matchCount } = useMemo(() => {
    const searchLow = q.trim().toLowerCase();
    const autoKeys = new Set<string>();
    let count = 0;

    function filterNode(node: CoaTreeNode): { keep: boolean; clone: CoaTreeNode | null } {
      const isDirectMatch =
        (!searchLow || node.kode.toLowerCase().includes(searchLow) || node.nama.toLowerCase().includes(searchLow)) &&
        (tipeFilter === "Semua" || node.tipe === tipeFilter || (tipeFilter === "Header" && node.isHeader));

      if (isDirectMatch) count++;

      const keptChildren: CoaTreeNode[] = [];
      for (const child of node.children) {
        const { keep, clone } = filterNode(child);
        if (keep && clone) {
          keptChildren.push(clone);
        }
      }

      if (isDirectMatch || keptChildren.length > 0) {
        if (keptChildren.length > 0 && (searchLow || tipeFilter !== "Semua")) {
          autoKeys.add(node.kode);
        }
        return {
          keep: true,
          clone: {
            ...node,
            children: keptChildren,
          },
        };
      }

      return { keep: false, clone: null };
    }

    const filtered: CoaTreeNode[] = [];
    for (const r of rootNodes) {
      const { keep, clone } = filterNode(r);
      if (keep && clone) filtered.push(clone);
    }

    return { filteredRoots: filtered, autoExpandKeys: autoKeys, matchCount: count };
  }, [rootNodes, q, tipeFilter]);

  // Gabungkan expandedKeys pengguna dengan auto-expanded jika sedang mencari
  const activeExpanded = useMemo(() => {
    if (q.trim() || tipeFilter !== "Semua") {
      const merged = new Set(expandedKeys);
      for (const k of autoExpandKeys) merged.add(k);
      return merged;
    }
    return expandedKeys;
  }, [expandedKeys, autoExpandKeys, q, tipeFilter]);

  const toggleExpand = (kode: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) {
        next.delete(kode);
      } else {
        next.add(kode);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    function visit(nodes: CoaTreeNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) all.add(n.kode);
        visit(n.children);
      }
    }
    visit(rootNodes);
    setExpandedKeys(all);
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  return (
    <div className="space-y-4">
      <CardHeader
        title={S.akunTitle}
        subtitle={S.akunSub}
        action={
          <button className="btn-primary text-xs" onClick={onAdd}>
            {S.addAkun}
          </button>
        }
      />

      {/* Toolbar Pencarian, Filter Tipe, dan Aksi Buka/Tutup */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-steel-200 bg-surface/50 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder={S.searchAkunPh}
            ariaLabel={S.searchAkunAria}
            className="w-64"
          />
          <select
            className="input w-auto py-1.5 text-sm"
            value={tipeFilter}
            onChange={(e) => setTipeFilter(e.target.value)}
            aria-label={S.filterTipeAria}
          >
            {coaTipeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "Semua" ? S.allTypes : t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-steel-200 bg-white px-2.5 py-1.5 text-xs font-medium text-steel-700 shadow-sm hover:bg-surface active:bg-steel-100"
            onClick={expandAll}
          >
            <Plus className="h-3.5 w-3.5" />
            {S.expandAll}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-steel-200 bg-white px-2.5 py-1.5 text-xs font-medium text-steel-700 shadow-sm hover:bg-surface active:bg-steel-100"
            onClick={collapseAll}
          >
            <Minus className="h-3.5 w-3.5" />
            {S.collapseAll}
          </button>
          <span className="ml-2 text-xs text-steel-500">
            {S.countAkun.replace("{n}", String(matchCount))}
          </span>
        </div>
      </div>

      {/* Tampilan Hierarki Tabel Akun */}
      <div className="overflow-x-auto rounded-xl border border-steel-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface border-b border-steel-200 text-xs font-semibold text-steel-600">
            <tr>
              <th className="py-3 px-4 w-72">{S.colNoAkun}</th>
              <th className="py-3 px-4">{S.colNamaAkun}</th>
              <th className="py-3 px-4 w-28">Tipe</th>
              <th className="py-3 px-4 w-20 text-center">D/K</th>
              <th className="py-3 px-4 w-20 text-center">NR/LR</th>
              <th className="py-3 px-4 w-24 text-right">{S.actionTh}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-100 text-xs">
            {filteredRoots.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10">
                  <EmptyState
                    title={S.noAkunMatch}
                    subtitle={S.noMatchingAccounts}
                    icon={<Search className="h-8 w-8 text-steel-300" />}
                  />
                </td>
              </tr>
            ) : (
              filteredRoots.map((rootNode) => (
                <TreeNodeRow
                  key={rootNode.kode}
                  node={rootNode}
                  expandedKeys={activeExpanded}
                  onToggleExpand={toggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  searchQuery={q}
                  S={S}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TreeNodeRowProps {
  node: CoaTreeNode;
  expandedKeys: Set<string>;
  onToggleExpand: (kode: string) => void;
  onEdit: (item: StoreItem) => void;
  onDelete: (item: StoreItem) => void;
  searchQuery: string;
  S: Record<string, string>;
}

function TreeNodeRow({
  node,
  expandedKeys,
  onToggleExpand,
  onEdit,
  onDelete,
  searchQuery,
  S,
}: TreeNodeRowProps): React.JSX.Element {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedKeys.has(node.kode);
  const isRoot = node.level === 0;
  const isSubHeader = node.level === 1 && node.isHeader;

  // Indentasi berjenjang (tablet dan desktop nyaman)
  const indentPadding = Math.min(node.level * 24, 96);

  // Penentuan styling baris
  let rowBg = "hover:bg-surface/80";
  if (isRoot) {
    rowBg = "bg-navy-50/70 font-semibold border-t-2 border-navy-100 hover:bg-navy-50";
  } else if (isSubHeader) {
    rowBg = "bg-steel-50/60 font-medium hover:bg-steel-50";
  }

  const isMatchedDirectly =
    Boolean(searchQuery.trim()) &&
    (node.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <tr className={`transition-colors ${rowBg} ${isMatchedDirectly ? "bg-amber-50/60" : ""}`}>
        {/* Kolom No. Akun dengan Pohon Garis & Tombol Expand */}
        <td className="py-2.5 px-4 font-mono font-medium text-navy-900 whitespace-nowrap">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${indentPadding}px` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(node.kode)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-steel-200/60 text-steel-500 focus:outline-none"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="inline-block w-5 shrink-0 text-center text-steel-300">
                {node.level > 0 && "•"}
              </span>
            )}

            {isRoot ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-navy-700" />
            ) : isSubHeader || hasChildren ? (
              <Folder className="h-3.5 w-3.5 shrink-0 text-ocean-600" />
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0 text-steel-400" />
            )}

            <span className={isRoot ? "font-bold text-navy-950" : isSubHeader ? "font-semibold text-navy-900" : "text-steel-800"}>
              {node.kode}
            </span>
          </div>
        </td>

        {/* Kolom Nama Akun */}
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`${
                isRoot
                  ? "text-xs font-bold text-navy-950 uppercase tracking-wide"
                  : isSubHeader
                  ? "text-xs font-semibold text-navy-900"
                  : "text-xs text-steel-700"
              }`}
            >
              {node.nama}
            </span>

            {/* Badge penanda level/header */}
            {isRoot ? (
              <span className="rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                {S.coaLevelRoot}
              </span>
            ) : isSubHeader ? (
              <span className="rounded-full bg-ocean-100 text-ocean-800 px-2 py-0.5 text-[10px] font-semibold border border-ocean-200">
                {S.coaLevelSub}
              </span>
            ) : node.isHeader ? (
              <span className="rounded-full bg-steel-100 text-steel-700 px-1.5 py-0.5 text-[10px] font-semibold">
                {S.coaHeaderBadge}
              </span>
            ) : null}
          </div>
        </td>

        {/* Kolom Tipe */}
        <td className="py-2.5 px-4">
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
              node.tipe === "Aset"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : node.tipe === "Liabilitas"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : node.tipe === "Ekuitas"
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : node.tipe === "Pendapatan"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : node.tipe === "Beban"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-steel-100 text-steel-600"
            }`}
          >
            {node.tipe}
          </span>
        </td>

        {/* Kolom D/K */}
        <td className="py-2.5 px-4 text-center">
          <span
            className={`font-semibold ${
              node.dk === "D"
                ? "text-emerald-600"
                : node.dk === "K"
                ? "text-blue-600"
                : "text-steel-400"
            }`}
          >
            {node.dk}
          </span>
        </td>

        {/* Kolom NR/LR */}
        <td className="py-2.5 px-4 text-center">
          <span className="text-steel-600">{node.nrlr}</span>
        </td>

        {/* Kolom Aksi */}
        <td className="py-2.5 px-4 text-right">
          <div className="flex justify-end gap-1.5">
            <RowAction
              icon={Pencil}
              tone="neutral"
              label={S.editBtn}
              ariaLabel={`${S.editBtn} ${node.kode}`}
              onClick={() => onEdit(node.raw)}
            />
            {!node.isHeader && (
              <RowAction
                icon={Trash2}
                tone="danger"
                label={S.deleteBtn}
                ariaLabel={`${S.deleteBtn} ${node.kode}`}
                onClick={() => onDelete(node.raw)}
              />
            )}
          </div>
        </td>
      </tr>

      {/* Render children bila node sedang terbuka (expanded) */}
      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <TreeNodeRow
            key={child.kode}
            node={child}
            expandedKeys={expandedKeys}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            searchQuery={searchQuery}
            S={S}
          />
        ))}
    </>
  );
}
