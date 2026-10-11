import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Anchor, Wallet, TrendingUp, Clock, Trash2, Eye, Filter } from "lucide-react";
import {
  Card,
  PageHeader,
  StatusBadge,
  ProgressBar,
  Badge,
  KpiCard,
  SortTh,
  toggleSort,
  sortRows,
  usePager,
  ConfirmModal,
  toast,
  SearchBox,
  rowMatches,
  RowAction,
} from "../../components/ui";
import type { SortState } from "../../components/ui";
import { useStore } from "../../data/store";
import { useModuleSync } from "../../data/useModuleSync";
import { findUsages } from "../../utils/usages";
import type { StoreItem, CollectionKey } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import { fmtMiliar } from "../../data";
import { todayISO, fmtTanggal } from "../../utils/format";
import { getSetting } from "../../utils/settings";
import { shouldAutoSetLate, shouldClearOverride } from "../../utils/projectDelay";
import { generateRisksFromWbs, generateRisksFromWo, claimAutoRisk, releaseAutoRisk } from "../../utils/riskAuto";
import { createdAtOf, lastTouchedAt } from "../../utils/timestamps";
import { canonPrioritas } from "../../utils/scope";
import ProjectAddModal from "../../components/ProjectAddModal";
import { AnimatePresence, motion } from "framer-motion";
import { AlertBannerView, flashPick, notifRowId, useModuleAlert, useNotifFlash } from "../../components/AlertBanner";
import { useDeepLinkParams, useDeepLinkTarget } from "../../components/useDeepLink";
import { rowHighlightClass } from "../../components/rowHighlight";
import { StatusChips } from "../../components/StatusChips";
import { projectProgressOf } from "../../utils/projectProgress";

export const TAHAP = ["Inquiry", "Quotation", "Kontrak", "Desain", "Produksi", "Trial", "Handover"];
export const PRIORITAS = ["Rendah", "Sedang", "Tinggi"];

export function tahapOf(p: StoreItem): string {
  return TAHAP.includes(p.tahap) ? p.tahap : "Produksi";
}

// Kontrak wajib terisi sebelum proyek hasil konversi bisa jalan: tahap awal
// (Inquiry/Quotation/Kontrak) dikunci bila belum ada kontrak untuk quotationId itu.
export function hasContract(p: StoreItem, contracts: StoreItem[]): boolean {
  if (!p.quotationId) return true;
  return contracts.some(
    (c) => String(c.quotationId ?? "") === String(p.quotationId) || String(c.projectId ?? "") === String(p.id)
  );
}

export function isOverdue(p: StoreItem, today: string): boolean {
  if (!p.end || p.end === "-") return false;
  if (String(p.status) === "Selesai") return false;
  if (Number(p.progress || 0) >= 100) return false;
  return String(p.end) < today;
}

const filters = ["Semua", "New Build", "Repair", "Retrofit"];
/* Label tampilan tipe proyek (ID); value backend tetap EN. */
const TYPE_ID: Record<string, string> = { "New Build": "Bangun Baru", Repair: "Reparasi", Retrofit: "Retrofit / Modifikasi" };
/* "Dalam Proses" WAJIB ada: itu status default proyek baru
   (ProjectAddModal), jadi tanpa baris ini filter dari Dashboard menerima
   ?status=Dalam Proses lalu ditolak `known` di bawah dan reset diam-diam ke
   "Semua" - pill-nya terlihat berfungsi tapi tidak memfilter apa pun. */
const statusOptions = ["Semua", "Sedang Berjalan", "Dalam Proses", "Tertunda", "Batal", "Terlambat", "Selesai"];
const prioritasTone: Record<string, "gray" | "blue" | "amber" | "red"> = {
  Rendah: "gray",
  Sedang: "blue",
  Tinggi: "amber",
};

/* Batch koleksi modul Proyek untuk useModuleSync (pengganti resync penuh). */
const PRJ_COLS: CollectionKey[] = ["activities", "clients", "drydocks", "employees", "projects", "vessels"];

export default function Projects() {
  const { locale } = useT();
  const S = n_prj[locale];
  const { data, add, update, remove, inBranch, log } = useStore();
  const modAlert = useModuleAlert("proyek");
  const flash = useNotifFlash();
  const deepParams = useDeepLinkParams();
  const notified = useMemo(() => new Set(modAlert.items.map((a) => a.rowId)), [modAlert.items]);
  const navigate = useNavigate();
  const projects = data.projects;
  const [filter, setFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [tahapFilter, setTahapFilter] = useState("Semua");
  const [branchFilter, setBranchFilter] = useState("Semua");
  const [prioritasFilter, setPrioritasFilter] = useState("Semua");
  const [pmFilter, setPmFilter] = useState("Semua");
  const [q, setQ] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  /* Default: proyek terbaru paling atas (P9). Versi lama `key: null` dengan
     `dir: "asc"` membuat daftar urut tak tertentu, dan kolom `createdAt`
     yang diklik pertama kali menghasilkan ASC = terlama dulu, berlawanan
     dengan yang diharapkan. Sekarang default-nya DESC di `createdAt`, jadi
     baris pertama benar-benar proyek terbaru. */
  const [sort, setSort] = useState<SortState>({ key: "createdAt", dir: "desc" });
  const [showAdd, setShowAdd] = useState(false);
  // Hapus proyek via ConfirmModal + daftar pemakai (blokir bila dirujuk PO/invoice/WBS).
  const [delProject, setDelProject] = useState<StoreItem | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  /* Fetch per-batch modul (pengganti resync penuh). */
  useModuleSync(PRJ_COLS);

  // Alur dari Dashboard: /proyek?create=1 langsung buka form tambah proyek.
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowAdd(true);
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Jalur sama untuk /proyek?status=<Status> yang dipakai kartu sebaran
     status di Dashboard. Sebelumnya hanya `create` yang dibaca, jadi
     clicking pil statusDiam-diam tidak melakukan apa-apa. */
  useEffect(() => {
    const want = searchParams.get("status");
    if (!want) return;
    const known = statusOptions.some((s) => s === want);
    setStatusFilter(known ? want : "Semua");
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Edit tahap HANYA via detail (stepper + modal alasan di ProjectDetail).

  // Terlambat otomatis dari due (P8: bisa di-override manual).
  useEffect(() => {
    const today = todayISO();
    for (const p of projects) {
      // Override sudah tidak relevan → clear.
      if (shouldClearOverride(p as Record<string, unknown>, today, isOverdue as (r: Record<string, unknown>, t: string) => boolean)) {
        void update("projects", p.id, { statusOverride: null }).catch(() => {});
      }
      // Auto-logic hanya menulis "Terlambat" kalau tidak ada override aktif.
      if (shouldAutoSetLate(p as Record<string, unknown>, today, isOverdue as (r: Record<string, unknown>, t: string) => boolean)) {
        void update("projects", p.id, { status: "Terlambat" }).catch((err) => {
          log(
            "gagal menandai proyek terlambat",
            `${p.id} · ${err instanceof Error ? err.message : String(err)}`,
            "Proyek",
          );
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // D8: risiko otomatis dari WBS dan milestone WO saat page load.
  // Proyek yang punya WBS tersimpan dicek; milestone yang mendekati jatuh
  // tempo atau terlambat otomatis menjadi risiko aktif.
  useEffect(() => {
    const today = todayISO();
    const msDays = getSetting(data, "ALERT_MILESTONE_DAYS", 7);
    for (const p of projects) {
      const hasWbs = Boolean(data.wbsByProject?.[p.id]);
      const wos = (data.workOrders ?? []).filter((w) => w.project === p.id);
      if (!hasWbs && wos.length === 0) continue;
      const existing = (data.risks ?? []).filter((r) => r.project === p.id);
      const wbsResult = hasWbs
        ? generateRisksFromWbs(p.id, data.wbsByProject[p.id], existing, today, msDays)
        : { add: [], close: [] };
      const woResult = generateRisksFromWo(p.id, wos, existing, today, msDays);
      for (const draft of [...wbsResult.add, ...woResult.add]) {
        if (!claimAutoRisk(String(p.id), draft)) continue;
      void add("risks", draft, { action: "risiko otomatis dari WBS/WO", module: "Proyek" }).catch(() => releaseAutoRisk(String(p.id), draft));
      }
      for (const id of [...wbsResult.close, ...woResult.close]) {
        void update("risks", id, { status: "Tertutup" }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const activeFilters = [filter, tahapFilter, statusFilter, prioritasFilter, pmFilter].filter((v) => v !== "Semua").length;
  const pmOptions = [...new Set(projects.map((p) => String(p.manager ?? "")).filter(Boolean))].sort();
  const resetFilters = () => { setFilter("Semua"); setStatusFilter("Semua"); setTahapFilter("Semua"); setBranchFilter("Semua"); setPrioritasFilter("Semua"); setPmFilter("Semua"); setQ(""); };

  const list = inBranch(projects).filter((p) => {
    const matchType = filter === "Semua" || p.type === filter;
    const matchStatus = statusFilter === "Semua" || p.status === statusFilter;
    const matchTahap = tahapFilter === "Semua" || tahapOf(p) === tahapFilter;
    const matchBranch = branchFilter === "Semua" || p.branch === branchFilter;
    const matchPrioritas = prioritasFilter === "Semua" || canonPrioritas(p.prioritas) === prioritasFilter;
    const matchPm = pmFilter === "Semua" || String(p.manager ?? "") === pmFilter;
    const matchQ = rowMatches(p as unknown as Record<string, unknown>, q, ["vessel", "id", "client", "manager", "status", "type", "scope"]);
    return matchType && matchStatus && matchTahap && matchBranch && matchPrioritas && matchPm && matchQ;
  });

  const totalBudget = list.reduce((s, p) => s + Number(p.budget || 0), 0);
  /* "Berjalan" = bukan Selesai dan bukan Batal (dulu Batal ikut terhitung),
     sehingga Selesai + Berjalan + Batal = Total. */
  const isBatal = (p: StoreItem): boolean => /batal/i.test(String(p.status));
  const doneCount = list.filter((p) => p.status === "Selesai").length;
  const inProgress = list.filter((p) => p.status !== "Selesai" && !isBatal(p)).length;
  const onHold = list.filter((p) => /tunda/i.test(String(p.status))).length;
  const delayed = list.filter((p) => p.status === "Terlambat").length;
  const avgProgress = list.length ? Math.round(list.reduce((s, p) => s + projectProgressOf(p, data.wbsByProject, data.boq), 0) / list.length) : 0;
  /* Pengurutan tanggal lewat `createdAtOf`/`lastTouchedAt`, bukan field mentah:
     `updated_at` milik server adalah ISO penuh sementara `createdAt` bisa
     "YYYY-MM-DD" saja. Dicampur dalam satu kolom, urutan leksikografis
     mengurutkan "2026-1-5" sebelum "2026-10-2" - jadi keduanya dinormalkan
     ke sumber yang sudah tervalidasi lebih dulu. Yang tidak ada tanggalnya
     diberi string kosong supaya mengurut ke akhir, bukan ke awal. */
  const sorted = useMemo(() => sortRows(list, sort, (p: StoreItem, k) => {
    if (k === "budget") return Number(p.budget);
    if (k === "actual") return Number(p.actual);
    if (k === "progress") return projectProgressOf(p, data.wbsByProject, data.boq);
    if (k === "tahap") return String(tahapOf(p));
    if (k === "createdAt") return createdAtOf(p) ?? "";
    if (k === "updatedAt") return lastTouchedAt(p) ?? "";
    return String((p as StoreItem)[k] ?? "");
  }), [list, sort]);
  /* Default 25 baris (P7). Versi lama memakai default `usePager` yaitu 100,
     jadi tabel proyek memuat empat halaman penuh sebelum sempat menekan "halaman berikutnya". */
  const pager = usePager(list.length, 25);
  useEffect(() => {
    pager.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, statusFilter, tahapFilter, branchFilter, prioritasFilter, pmFilter, q]);

  const pickNotifIds = (ids: string[]): void => {
    if (ids.length === 0) return;
    const idx = sorted.findIndex((r) => ids.includes(String(r.id)));
    flashPick(flash, ids, idx, pager.go, pager.size);
  };
  const pickNotif = (rowId: string) => pickNotifIds([rowId]);
  useDeepLinkTarget("", deepParams.highlight, () => {}, pickNotifIds);

  return (
    <div>
      <PageHeader
        title={S.prjTitle}
        subtitle={S.prjSubtitle}
        icon={<Anchor className="h-5 w-5" />}
        actions={
          <>
            <button className="btn-primary-gradient" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> {S.prjNew}</button>
          </>
        }
      />

      {modAlert.active && <AlertBannerView items={modAlert.items} onPick={pickNotif} dismiss={modAlert.dismiss} />}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard tone="blue" label={S.prjKpiTotal} value={String(list.length)} hint={S.prjKpiTotalSub.replace("{d}", String(doneCount)).replace("{r}", String(inProgress))} icon={<Anchor className="h-5 w-5" />} />
        <KpiCard tone="orange" label={S.prjKpiActive} value={String(inProgress)} hint={S.prjKpiActiveSub.replace("{n}", String(onHold)).replace("{l}", String(delayed))} icon={<Clock className="h-5 w-5" />} />
        <KpiCard tone="green" label={S.prjKpiContract} value={fmtMiliar(totalBudget)} hint={S.prjKpiContractHint} icon={<Wallet className="h-5 w-5" />} />
        <KpiCard tone={delayed > 0 ? "red" : "blue"} label={S.prjKpiAvg} value={`${avgProgress}%`} hint={S.prjKpiAvgHint} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder={S.searchProjectPh}
          ariaLabel={S.searchProjectAria}
          className="min-w-52 flex-1 sm:max-w-xs"
        />
<button type="button" className="btn-secondary" aria-expanded={showFilter} onClick={() => setShowFilter((v) => !v)}>
          <Filter className="h-4 w-4" /> {S.prjFilterBtn}{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>
        {activeFilters > 0 && <button type="button" className="text-xs font-medium text-ocean-600 hover:underline" onClick={resetFilters}>{S.prjFilterReset}</button>}
        <span className="ml-auto text-xs text-steel-400">{S.prjCount.replace("{n}", String(list.length))}</span>
      </div>
      {/* Filter sebagai deret chip (PRJ-05): langsung berlaku tanpa tombol Terapkan. */}
      <AnimatePresence initial={false}>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="mb-4 space-y-2 rounded-xl border border-steel-200 bg-white p-3">
              {([
                [S.statusLabel, statusFilter, setStatusFilter, statusOptions.map((v) => ({ value: v, label: v === "Semua" ? S.prjAllStatus : v }))],
                [S.prjFieldTahap, tahapFilter, setTahapFilter, ["Semua", ...TAHAP].map((v) => ({ value: v, label: v === "Semua" ? S.prjAllTahap : v }))],
                [S.prjFieldTipe, filter, setFilter, filters.map((v) => ({ value: v, label: v === "Semua" ? S.prjAllTipe : TYPE_ID[v] ?? v }))],
                [S.prjFieldPrioritas, prioritasFilter, setPrioritasFilter, ["Semua", ...PRIORITAS].map((v) => ({ value: v, label: v === "Semua" ? S.prjAllPrioritas : v }))],
                [S.prjFieldPm, pmFilter, setPmFilter, ["Semua", ...pmOptions].map((v) => ({ value: v, label: v === "Semua" ? S.prjAllPm : v }))],
              ] as const).map(([label, value, set, options]) => (
                <div key={label} className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium text-steel-500">{label}</span>
                  <StatusChips value={value} onChange={set} options={options} ariaLabel={label} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr>
                {/* Nomor urut (P2). Angka ikutPagination: halaman 2 mulai
                    dari 26, bukan mengulang dari 1 - kalau tidak, nomor ini
                    tidak bisa dipakai rujukan ("proyek nomor 7") dan tidak
                    cocok dengan yang terlihat di layar. */}
                <th className="th w-10 text-center">{S.colNo}</th>
                <SortTh label={S.colProject} sortKey="vessel" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.colClient} sortKey="client" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.colType} sortKey="type" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.prjFieldTahap} sortKey="tahap" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.prjFieldPrioritas} sortKey="prioritas" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.statusLabel} sortKey="status" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.progLabel} sortKey="progress" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.colBudget} sortKey="budget" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.colActual} sortKey="actual" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.colPm} sortKey="manager" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
{/* Tanggal rekam (F6). Kolom ini yang bikin tabel bisa
                    diurutkan menurut umur data - tanpa itu, semua proyek
                    terlihat sama saja sejak itu dibuat. Kosong = "—", bukan hari ini:
                    data lama memang tidak punya tanggal buat, dan mengarang
                    tanggal lebih buruk daripada membiarkan kosong. */}
                <SortTh label={S.colCreated} sortKey="createdAt" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <SortTh label={S.colUpdated} sortKey="updatedAt" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                <th className="th">{S.actionTh}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {pager.slice(sorted).map((p, rowIndex) => {
                return (
                  <tr
                    key={p.id}
                    id={notifRowId(String(p.id))}
                    className={`cursor-pointer transition-colors ${rowHighlightClass({ id: String(p.id), flash, notified: notified.has(String(p.id)), base: "hover:bg-surface" })}`}
                    onClick={() => navigate(`/proyek/${p.id}`, { state: { from: "/proyek" } })}
                    onKeyDown={(e) => { if (e.key === "Enter") navigate(`/proyek/${p.id}`, { state: { from: "/proyek" } }); }}
                    tabIndex={0}
                    title={S.prjOpenRow.replace("{a}", p.id)}
                  >
                    <td className="td text-center font-mono text-xs text-steel-400">
                      {(pager.page - 1) * pager.size + rowIndex + 1}
                    </td>
                    <td className="td">
                      <span className="block">
                        <p className="font-semibold text-navy-900">{p.vessel}</p>
                        <p className="font-mono text-xs text-steel-500">{p.id}</p>
                      </span>
                    </td>
                    <td className="td text-steel-600">{p.client}</td>
                    <td className="td">
                      <Badge tone={p.type === "New Build" ? "navy" : p.type === "Repair" ? "cyan" : "violet"}>
                        {TYPE_ID[String(p.type)] ?? p.type}
                      </Badge>
                    </td>
                    <td className="td">
                      {/* Edit tahap hanya lewat detail (stepper + modal alasan).
                          Versi lama menempelkan teks "Edit hanya di detail" dan
                          link "Kelola di detail" di sini; keduanya hilang dari
                          layar dan baris tetap bisa diklik untuk masuk detail. */}
                      <Badge tone="navy">{tahapOf(p)}</Badge>
                    </td>
                    <td className="td">
                      <Badge tone={prioritasTone[canonPrioritas(p.prioritas)] ?? "blue"}>{canonPrioritas(p.prioritas)}</Badge>
                    </td>
                    <td className="td"><StatusBadge status={p.status} /></td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const prog = projectProgressOf(p, data.wbsByProject, data.boq);
                          return (
                            <>
                              <ProgressBar value={prog} className="w-20" tone={p.status === "Terlambat" ? "red" : "navy"} />
                              <span className="text-xs font-medium text-steel-600">{prog}%</span>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="td font-medium text-navy-900">{fmtMiliar(p.budget)}</td>
                    <td className="td text-steel-600">{fmtMiliar(p.actual)}</td>
                    <td className="td text-steel-600">{p.manager}</td>
                    <td className="td text-xs text-steel-600">
                      {createdAtOf(p) !== null ? fmtTanggal(createdAtOf(p)) : <span className="text-steel-400">-</span>}
                    </td>
                    <td className="td text-xs text-steel-600">
                      {lastTouchedAt(p) !== null ? fmtTanggal(lastTouchedAt(p)) : <span className="text-steel-400">-</span>}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        {/* Detail pindah ke kolom Aksi (P6). Sebelumnya
                            "Kelola di detail" menempel di sel Tahap, jauh dari
                            kolom tempat pengguna mencari aksi, dan menambah
                            teks pada kolom data yang seharusnya bersih. */}
                        <RowAction
                          icon={Eye}
                          tone="neutral"
                          label={S.btnDetail}
                          ariaLabel={`${S.btnDetail} ${p.id}`}
                          onClick={() => navigate(`/proyek/${p.id}`, { state: { from: "/proyek" } })}
                        />
                        <RowAction
                          icon={Trash2}
                          tone="danger"
                          label={locale === "en" ? "Delete" : "Hapus"}
                          ariaLabel={`${locale === "en" ? "Delete" : "Hapus"} ${p.id}`}
                          onClick={() => setDelProject(p)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="py-8 text-center text-sm text-steel-400">{S.prjEmpty}</p>}
          {pager.bar}
        </div>
      </Card>


      <ProjectAddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        S={S}
        projects={projects}
        vessels={data.vessels}
        clients={data.clients}
        employees={data.employees}
        docks={data.drydocks}
        add={add}
      />

      <ConfirmModal
        open={delProject !== null}
        title={delProject ? (locale === "en" ? `Delete project ${delProject.id}?` : `Hapus proyek ${delProject.id}?`) : ""}
        desc={(() => {
          if (!delProject) return "";
          const used = findUsages(data, "projects", String(delProject.id));
          const base = locale === "en"
            ? `Project ${delProject.id} (${String(delProject.vessel)}) will be permanently deleted.`
            : `Proyek ${delProject.id} (${String(delProject.vessel)}) akan dihapus permanen.`;
          return used.length > 0
            ? (locale === "en" ? `${base} Referenced in: ${used.join(", ")}. Deletion blocked.` : `${base} Dirujuk di: ${used.join(", ")}. Penghapusan diblokir.`)
            : base;
        })()}
        confirmLabel={delProject && findUsages(data, "projects", String(delProject.id)).length > 0
          ? (locale === "en" ? "Blocked - still in use" : "Diblokir - masih dipakai")
          : (locale === "en" ? "Delete" : "Hapus")}
        danger
        confirmDisabled={delProject ? findUsages(data, "projects", String(delProject.id)).length > 0 : false}
        onCancel={() => setDelProject(null)}
        onConfirm={async () => {
          if (!delProject) return;
          const usedBy = findUsages(data, "projects", String(delProject.id));
          if (usedBy.length > 0) { toast(locale === "en" ? `Delete blocked - referenced in: ${usedBy.join(", ")}` : `Hapus diblokir - dirujuk di: ${usedBy.join(", ")}`, "info"); return; }
          try {
            await remove("projects", String(delProject.id));
            toast(locale === "en" ? `Project ${delProject.id} deleted` : `Proyek ${delProject.id} dihapus`);
          } catch (e) { toast(e instanceof Error ? e.message : (locale === "en" ? "Delete failed" : "Gagal menghapus"), "info"); }
          setDelProject(null);
        }}
      />
    </div>
  );
}
