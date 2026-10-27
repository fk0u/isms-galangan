import { Fragment, useState, useEffect, useMemo } from "react";
import { useAuth, hasPermission } from "../../auth/auth";
import { ApiError, apiFetch, getJwt, isBackendConfigured } from "../../services/http";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Plus, Trash2, FileDown, Eye, Pencil, UserPlus, History, FileText, GitBranch, Compass, Upload, Boxes, Check, CheckCircle2, Clock, Camera, AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  PageHeader,
  StatusBadge,
  ProgressBar,
  Tabs,
  KpiCard,
  Modal,
  Field,
  FormGrid,
  ConfirmModal,
  Badge,
  toast,
  Avatar,
  SecureImg,
  SortTh,
  toggleSort,
  sortRows,
  NumInput,
  MoneyInput,
  FileUploadButton,
  AsyncButton,
  RowAction,
} from "../../components/ui";
import type { SortState } from "../../components/ui";
import { useBusy } from "../../components/ui";
import BoqDocsSection from "./BoqDocsSection";
import { useMaterialRequest } from "../../data/useMaterialRequest";
import ReportSection from "./ReportSection";
import SparepartServiceSection from "./SparepartServiceSection";
import { useStore } from "../../data/store";
import type { StoreItem, WbsItem, WbsAssignee, WbsHistoryItem, CollectionKey } from "../../data/store";
import { useModuleSync } from "../../data/useModuleSync";
import { DocumentPreviewCell, DocumentPreviewPanel, DownloadFileButton, InlineDocPreview } from "../../components/DocumentPreview";
import { docAttachment, looksLikeUrl } from "../../utils/docAttachment";
import { DOC_TYPES, NEEDS_QC_LINK, qcCertCandidates, subTypesOf } from "../../utils/docTypes";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import { fmtMiliar, fmtTanggal, fmtRentang, fmtBulan } from "../../data";
import { fmtRupiah, parseRupiah, todayISO } from "../../utils/format";
import { sameName } from "../../utils/names";
import { calcProjectProgress } from "../../utils/projectProgress";
import { pdfServerReady } from "../../services/pdfClient";
import { usePdfDoc } from "../../components/usePdfDoc";
import { canonPrioritas, scopeList, scopeTotal, syncWbsWeightsWithScope, groupWbsByScope, type ScopeItem } from "../../utils/scope";
import { equipmentCostSummary } from "../../utils/projectCost";
import { employeeOptions } from "../../utils/employeeOptions";
import { projectDelayDetailsOf, runAutoWriteOnce, shouldAutoSetLate, shouldClearOverride } from "../../utils/projectDelay";
import { generateRisksFromWbs, generateRisksFromWo, claimAutoRisk, releaseAutoRisk } from "../../utils/riskAuto";
import { EntityPicker, SearchBox, rowMatches } from "../../components/ui";
import { SearchSelect } from "../../components/SearchSelect";
import WbsTree from "./WbsTree";
import { FlowTree, type FlowNode } from "../../components/FlowTree";
import { n_tree } from "../../i18n/n_tree";
import { PhotoUploader } from "../../components/PhotoUploader";
import type { PhotoUploadItem } from "../../components/PhotoUploader";
import { ChangeHistory } from "../../components/ChangeHistory";
import { PRIORITAS } from "./Projects";
import { tahapListOf, tahapAkhirOf, tahapOf, hasContract, isOverdue, tahapLabel } from "./Projects";
import {
  PLANNING_SUBCLASSES,
  getStageTransitionBlockers,
  isClassApprovalSatisfied,
} from "../../utils/classApprovalBlockers";
import { getSetting } from "../../utils/settings";
import { sbInvoiceMath, PPN_INVOICE_DEFAULT, PPH_JASA_DEFAULT } from "../../utils/sb";
import { exportExcel } from "../../utils/export";
import { readSheetRows } from "../../utils/readSheet";
import DockPlanCard from "./DockPlanCard";
import FeeProjectCard from "./FeeProjectCard";
import ImportPreviewModal, { type ImportPreviewRow } from "../../components/ImportPreviewModal";
import WbsMaterialModal, { stageMaterialCount } from "./WbsMaterialModal";

/* "Dalam Proses" = status default proyek baru (ProjectAddModal). Tanpa baris
   ini, <select> status tidak punya <option> yang cocok untuk proyek-proyek itu
   dan merender kosong -pengguna tidak pernah melihat statusnya sendiri. */
const STATUS = ["Sedang Berjalan", "Dalam Proses", "Tertunda", "Batal", "Selesai", "Terlambat"];
const RISK_LEVEL = ["Rendah", "Sedang", "Tinggi"];
const STATIONS = ["Cutting", "Bending", "Welding", "Panel", "Block", "Erection", "Alignment", "Launching"];

type WbsExt = WbsItem & { predecessor?: string };
/* #86: pilihan kondisi Trial. Data lama (Baik / Perlu Perbaiki / Rusak) tetap terbaca apa adanya. */
const TRIAL_KONDISI = ["Sudah Sesuai", "Tidak Sesuai", "Perlu Diperbaiki"] as const;
type TrialKondisi = (typeof TRIAL_KONDISI)[number];
interface WbsBaseline { at: string; wbs: WbsExt[]; }

/* Resolusi lampiran memakai utils/docAttachment (satu sumber untuk semua modul).
   Versi lokal dulu mencoba `d.fileName` LEBIH DAHULU - padahal fileName itu
   metadata nama berkas ("kontrak-kerja.pdf"), bukan URL. Akibatnya dokumen
   yang lampirannya diisi manual meminta GET /kontrak-kerja.pdf, sementara
   berkas di backend hanya dilayani di /files/*, jadi jawabannya 404 dan panel
   pratinjau hanya menampilkan "gagal memuat" tanpa sebab yang jelas.
   Sekarang kandidat URL dibaca lebih dulu, dan `looksLikeUrl` menolak nama
   berkas polos agar tidak salah dikira URL lagi. */
function docUrlOf(d: StoreItem): string {
  return docAttachment(d).url;
}

function docBaseName(d: StoreItem, url: string): string {
  const raw = docAttachment(d).fileName;
  const urlExt = docExtOf(url);
  const withExt = (name: string): string => {
    if (!urlExt) return name;
    // Pertahankan ekstensi asli: bila nama tanpa ekstensi, tempel dari URL.
    if (/\.[a-z0-9]+$/i.test(name)) return name;
    return `${name}.${urlExt}`;
  };
  if (raw && raw !== "-" && !/^(https?:|blob:|data:|\/)/i.test(raw)) return withExt(raw);
  const clean = url.split("?")[0].split("#")[0];
  const base = clean.split("/").pop() ?? "";
  if (base) return decodeURIComponent(base);
  return withExt(String(d.title ?? d.id ?? "dokumen"));
}

function docExtOf(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const m = /\.([a-z0-9]+)$/i.exec(clean);
  return (m?.[1] ?? "").toLowerCase();
}

/* Batch koleksi halaman detail proyek untuk useModuleSync. */
const PD_COLS: CollectionKey[] = ["activities", "projects", "documents", "bookings", "equipment", "maintenances", "bast", "bomItems", "boq", "boqDocs", "changeOrders", "contracts", "drydocks", "employees", "inspections", "quotations", "risks", "services", "spareparts", "subcontractors", "surveys", "trials", "warranties", "workOrders"];

export default function ProjectDetail() {
  const busy = useBusy();
  const { locale } = useT();
  const S = n_prj[locale];
  const { id } = useParams();
  const { data, update, add, remove, wbsFor, setWbs, teamFor, setTeam, log, resyncCollections } = useStore();
  const requestMaterial = useMaterialRequest();
  /* D3: inventory diakses supaya material WBS bisa terhubung ke stok.
     Saat save WBS task dengan material terpilih, stok berkurang dan
     movement dicatat otomatis. */
  const invList = data.inventory ?? [];
  const { user: session } = useAuth();
  /* Turunan otomatis (progres dari WBS, risiko otomatis, status Terlambat)
     menulis ke server. Peran yang hanya boleh membaca proyek (viewer, QC,
     finance, …) tidak boleh memicu tulis saat sekadar membuka halaman. */
  const canAutoWrite = hasPermission(session?.permissions, "projects", "w");
  const canWriteRisks = hasPermission(session?.permissions, "risks", "w");
  const fromState = (useLocation().state as { from?: unknown } | null)?.from;
  const backTo = fromState === "/proyek/monitoring" || fromState === "/dashboard" ? fromState : "/proyek";
  const backLabel = backTo === "/proyek/monitoring" ? S.detBackMon : backTo === "/dashboard" ? S.detBackDash : S.detBack;
  /* Printer PDF: BAST disusun server dari baris `bast` + relasi proyek/WO,
     jadi tidak ada jalur lokal untuk dokumen ini. */
  const pdfDoc = usePdfDoc();
  const printBastPdf = async (b: StoreItem): Promise<void> => {
    if (!pdfServerReady()) {
      toast(locale === "en" ? "Official PDF needs the server - connect the backend first." : "PDF resmi perlu server aktif - hubungkan backend dulu.", "info");
      return;
    }
    await pdfDoc.request({ kind: "bast", id: String(b.id), locale }, `BAST-${b.id}`, false);
  };
  const project = data.projects.find((p) => p.id === id) ?? data.projects[0];
  /* Fetch per-batch halaman (pengganti resync penuh): proyek + dokumen. */
  useModuleSync(PD_COLS);
  /* `?tab=` membuka tab tertentu (tautan panduan demo & tautan berbagi). */
  const [tabParams] = useSearchParams();
  /* Tab Equipment digabung ke WBS (catatan klien 17 Okt, K17-PM-07); tautan
     lama `?tab=Equipment` diarahkan ke tab WBS. */
  const normTab = (t: string): string => (t === "Equipment" ? "WBS & Anggaran" : t);
  const [tab, setTab] = useState(() => normTab(tabParams.get("tab") || "Ringkasan"));
  useEffect(() => {
    const wanted = tabParams.get("tab");
    if (wanted) setTab(normTab(wanted));
  }, [tabParams]);

  const [showScope, setShowScope] = useState(false);
  const [scopeVal, setScopeVal] = useState({ service: "", harga: "", deskripsi: "" });
  /* Pratinjau impor ruang lingkup: berkas dibaca dulu, disimpan setelah dikonfirmasi. */
  const [scopePreview, setScopePreview] = useState<{ file: string; rows: ImportPreviewRow[]; items: { service: string; lokasi?: string; deskripsi?: string }[] } | null>(null);
  const [showDoc, setShowDoc] = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [actualVal, setActualVal] = useState("");

  const saveActual = async () => {
    const v = parseRupiah(actualVal);
    if (!Number.isFinite(v) || v < 0) { toast(S.detToastActualInvalid, "info"); return; }
    try {
      await update("projects", pid, { actual: v });
      log("mencatat realisasi", `${pid} → ${fmtRupiah(v)}`, "Proyek");
      toast(S.detToastActualSaved.replace("{a}", fmtRupiah(v)));
      setShowActual(false);
      setActualVal("");
    } catch (e) {
      toast(e instanceof Error ? e.message : S.detActualFail, "info");
    }
  };
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("Laporan");
  const [docSubType, setDocSubType] = useState("");
  const [docQcCertId, setDocQcCertId] = useState("");
  /* Penanggung jawab dokumen. Default-nya nama pengguna yang sedang login.
     Sebelumnya ditulis literal `"Anda"` - jadi semua dokumen yang dibuat dari
     tab proyek tercatatatasnama "Anda", dan kolom penanggung jawab di arsip
     tidak pernah menunjuk siapa pun. */
  const [docOwner, setDocOwner] = useState("");
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  /* Id dokumen yang pratinjaunya sedang dibuka di dalam kartu. Menggantikan
     `instantPreviewId` + DocumentPreviewModal: dulu mengunggah dokumen membuka
     pop-up besar yang menutupi daftar, dan menutupnya adalah langkah wajib
     sebelum bisa lanjut. Sekarang dokumen yang baru diunggah langsung tampil di
     kartunya, dan ikon mata di baris lain cukup membuka/menutup di tempat. */
  const [openDocId, setOpenDocId] = useState<string>("");
  /* Item 5c revisi 2 Oktober: tombol Excel per dokumen diganti Detail +
     modal. Export Excel untuk SATU dokumen memaksa pengguna mengunduh
     berkas 9 baris untuk hal yang sebenarnya bisa dibaca di layar - dan
     spreadsheet tidak pernah jadi tempatanoralan riwayat revisi. */
  const [docDetail, setDocDetail] = useState<StoreItem | null>(null);
  /* `lastUploadedId` juga harus DIBERSIHKAN saat pengguna menutup pratinjau.
     Kalau tidak, isNew tetap true seumur hidup halaman, isOpen tidak pernah
     false, dan ikon mata tidak pernah bisa menutup panelnya. */
  const toggleDocPreview = (id: string): void => {
    setOpenDocId((cur) => (cur === id ? "" : id));
    if (openDocId === id) setLastUploadedId((cur) => (cur === id ? null : cur));
  };
  const [delScope, setDelScope] = useState<number | null>(null);
  /* Risiko, change order, trial, dan BAST dulu hanya punya tambah + ubah -
     tidak ada jalur hapus sama sekali, jadi record yang salah input (BAST
     salah milestone, risk yang dobel) nyangkut permanen di proyek. */
  const [delRec, setDelRec] = useState<{ kind: "risks" | "trials" | "changeOrders" | "bast"; row: StoreItem } | null>(null);
  const [showWbs, setShowWbs] = useState(false);
  const [wbsForm, setWbsForm] = useState({ task: "", category: "", start: "", end: "", progress: "0" });
  const [showWorktree, setShowWorktree] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showAddReq, setShowAddReq] = useState(false);
  const [reqForm, setReqForm] = useState({ name: "", type: "Drawing", notes: "" });
  const [showTeam, setShowTeam] = useState(false);
  const [teamPick, setTeamPick] = useState("");
  const [wbsMatTask, setWbsMatTask] = useState<string | null>(null);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [wbsTaskUpdate, setWbsTaskUpdate] = useState<string | null>(null);
  const [wbsUpdateForm, setWbsUpdateForm] = useState({ hours: "", material: "", materialQty: "1", status: "Sedang" as "Sedang" | "Selesai", progress: "", predecessor: "", station: "", photoNote: "", photoUrl: "", photos: [] as PhotoUploadItem[], dft: "" });
  const [wbsAssignTask, setWbsAssignTask] = useState<string | null>(null);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  /* woValue: nilai kontrak WO subkon untuk tahapan ini (K17-PM-14). */
  const [assignForm, setAssignForm] = useState({ type: "internal" as "internal" | "external", employeeId: "", subconId: "", woValue: "" });
  const [wbsHistoryTask, setWbsHistoryTask] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [shareForm, setShareForm] = useState({ docId: "", to: "" });
  const [statusPending, setStatusPending] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [tahapMove, setTahapMove] = useState<null | { dir: 1 | -1 }>(null);
  const [tahapReason, setTahapReason] = useState("");

  /* Ganti status kaku: konfirmasi + alasan wajib (NCR gate tetap untuk Selesai).
     P8: "Terlambat" kini bisa di-override manual. User mengubah status dari
     "Terlambat" ke sesuatu yang lain (atau ke "Terlambat" secara sadar) →
     tulis statusOverride supaya auto-logic tidak menulis balik. */
  const askStatus = (next: string) => {
    if (next === project.status) return;
    if (next === "Selesai" && project.status !== "Selesai") {
      // Aturan silang tahap×status: Selesai wajib tahap Handover.
      if (tahapOf(project) !== tahapAkhirOf(project)) { toast(`Proyek hanya bisa Selesai pada tahap ${tahapLabel(tahapAkhirOf(project), locale)}`, "info"); return; }
      const block = closeBlockReason();
      if (block) { toast(`Tutup proyek ditolak: ${block}`, "info"); return; }
      const openNcr = (data.ncr ?? []).filter((n) => n.project === pid && n.status !== "Tertutup");
      if (openNcr.length > 0) { toast(S.detToastNcrOpen.replace("{n}", String(openNcr.length)), "info"); return; }
      const itpHold = (data.inspections ?? []).filter((i) => i.project === pid && i.status === "NCR");
      if (itpHold.length > 0) { toast(S.detToastItp.replace("{n}", String(itpHold.length)), "info"); return; }
    }
    setStatusPending(next);
    setStatusReason("");
  };

  /* Prioritas proyek: dulu write-once (hanya ditulis ProjectAddModal), tidak
     bisa diubah di halaman mana pun padahal tampil sebagai badge & bisa difilter. */
  const savePrioritas = async (next: string) => {
    const cur = canonPrioritas(project.prioritas);
    if (next === cur) return;
    try {
      await update("projects", pid, { prioritas: next });
      log("mengubah prioritas proyek", `${pid} · ${cur} → ${next}`, "Proyek");
      toast(`${S.prjFieldPrioritas}: ${cur} → ${next}`);
    } catch (e) { toast(e instanceof Error ? e.message : S.saveFail, "info"); }
  };

const confirmStatus = async () => {
      if (!statusPending) return;
      if (!statusReason.trim()) { toast(S.detToastReasonReq, "info"); return; }
      const next = statusPending;
      try {
        if (next === "Selesai" && project.status !== "Selesai") {
          const vsl = data.vessels.find((x) => x.name === project.vessel);
          if (vsl) {
            await update("vessels", vsl.id, {
              history: [...(vsl.history ?? []), { date: todayISO(), event: `Proyek ${pid} selesai - serah terima`, type: "Delivery" }],
              dockHistory: [...(vsl.dockHistory ?? []), { date: todayISO(), dock: "Galangan", scope: `Penyelesaian proyek ${pid}`, result: "Selesai", nextDue: todayISO() }],
            });
          }
          log("menyelesaikan proyek + history kapal", `${pid} · ${project.vessel} (alasan: ${statusReason.trim()})`, "Proyek");
        } else {
          log("mengubah status", `${pid} → ${next} (alasan: ${statusReason.trim()})`, "Proyek");
        }
        /* P8: override status. Kalau user memilih status berbeda dari yang
           ditulis auto-logic (khususnya keluar dari "Terlambat"), tulis
           statusOverride supaya useEffect tidak menulis balik. Override juga
           ditulis saat user sadar memilih "Terlambat" secara manual. */
        const wasLate = project.status === "Terlambat";
        const willBeLate = next === "Terlambat";
        const overridePatch: Record<string, unknown> = {};
        if (wasLate !== willBeLate) {
          overridePatch.statusOverride = { status: next, reason: statusReason.trim(), at: todayISO(), by: "Anda" };
        } else if (willBeLate && !wasLate) {
          overridePatch.statusOverride = { status: "Terlambat", reason: statusReason.trim(), at: todayISO(), by: "Anda" };
        }
        await update("projects", pid, { status: next, ...overridePatch });
        toast(S.detToastStatus.replace("{a}", next));
        setStatusPending(null);
        setStatusReason("");
      } catch (e) {
        toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  /* Geser tahap kaku di detail: E1 gate + alasan wajib + tahapLog. */
  const confirmTahapMove = async () => {
    if (!tahapMove) return;
    if (!tahapReason.trim()) { toast(S.detToastReasonReq, "info"); return; }
    const idx = tahapListOf(project).indexOf(tahapOf(project));
    const to = tahapListOf(project)[idx + tahapMove.dir];
    if (!to) { setTahapMove(null); return; }
    if (tahapMove.dir === 1) {
      const from = tahapListOf(project)[idx];
      const blockers = getStageTransitionBlockers(from, to, project, data, locale);
      if (blockers.length > 0) {
        toast(`${blockers[0].name}: ${blockers[0].statusReason}`, "info");
        return;
      }
    }
    try {
      await update("projects", pid, {
        tahap: to,
        ...(to === tahapAkhirOf(project) && tahapMove.dir === 1 ? { status: "Selesai" } : {}),
        tahapLog: [...(project.tahapLog ?? []), { from: tahapOf(project), to, date: todayISO(), by: "Anda", reason: tahapReason.trim() }],
      });
      log(tahapMove.dir === 1 ? "memajukan tahap" : "menurunkan tahap", `${pid} → ${to} (alasan: ${tahapReason.trim()})${to === tahapAkhirOf(project) && tahapMove.dir === 1 ? " + status Selesai" : ""}`, "Proyek");
      toast(S.detToastStage.replace("{a}", pid).replace("{b}", to));
      setTahapMove(null);
      setTahapReason("");
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };
  const [showCo, setShowCo] = useState(false);
  const [coForm, setCoForm] = useState({ title: "", impact: "", requestedBy: "", date: "" });
  /* F3-C-05: CO terhubung surat BoQ aktif + daftar perubahan item. */
  type CoChangeForm = { op: "add" | "update" | "remove"; itemId: string; name: string; quantity: string; unit: string; unitPrice: string };
  const [coDocId, setCoDocId] = useState("");
  const [coChanges, setCoChanges] = useState<CoChangeForm[]>([]);
  const [docFile, setDocFile] = useState("");
  const [showDelBaseline, setShowDelBaseline] = useState(false);
  const [showBast, setShowBast] = useState(false);
  const [bastForm, setBastForm] = useState({ milestone: "", tanggal: todayISO(), signer: "", lampiran: "", amount: "" });
  const [showTrial, setShowTrial] = useState(false);
  const [trialForm, setTrialForm] = useState({ tanggal: todayISO(), parameter: "", punchList: "", hasil: "Lolos", baRef: "", kondisi: "Sudah Sesuai" as TrialKondisi, checklist: [] as { wbsTask: string; done: boolean; note: string }[] });
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [sort2, setSort2] = useState<SortState>({ key: null, dir: "asc" });
  const [wbsQ, setWbsQ] = useState("");
  /* Tiga tabel lain di halaman ini juga panjang: baseline WBS per tahap dan
     rincian biaya equipment (booking + maintenance). Satu state per tabel
     supaya mengetik di tabel A tidak menyaring tabel B yang kebetulan
     terlihat di layar yang sama. */
  const [baselineQ, setBaselineQ] = useState("");
  const [detailBkQ, setDetailBkQ] = useState("");
  const [cardBkQ, setCardBkQ] = useState("");
  const [cardMaintQ, setCardMaintQ] = useState("");
  const [breakdownMaintQ, setBreakdownMaintQ] = useState("");
  const [sort3, setSort3] = useState<SortState>({ key: null, dir: "asc" });
  /* Tabel rincian biaya equipment (card HPP equipment). */
  const [sort4, setSort4] = useState<SortState>({ key: null, dir: "asc" });
  const [costDetail, setCostDetail] = useState(false);

  const createsCycle = (items: WbsExt[], task: string, pred: string): boolean => {
    const map = new Map(items.map((w) => [String(w.task), String(w.predecessor ?? "")]));
    let cur = pred;
    const seen = new Set<string>();
    while (cur) {
      if (cur === task) return true;
      if (seen.has(cur)) return true;
      seen.add(cur);
      cur = map.get(cur) ?? "";
    }
    return false;
  };

  const parseYM = (v: string): { y: number; m: number } | null => {
    const m = String(v ?? "").match(/^(\d{4})-(\d{2})/);
    if (!m) return null;
    return { y: Number(m[1]), m: Number(m[2]) };
  };

  const monthEndDate = (v: string): Date | null => {
    const m = String(v ?? "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!m) return null;
    return m[3] ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(Number(m[1]), Number(m[2]), 0);
  };

  useEffect(() => {
    if (!project || !canAutoWrite) return;
    // Hanya proyek dengan WBS nyata (tersimpan) yang progresnya diturunkan
    // otomatis - template fallback tidak boleh menimpa progres seed/manual.
    if (!data.wbsByProject?.[project.id]) return;
    const wbs = wbsFor(project.id);
    const projectBoq = (data.boq ?? []).filter((b) => String(b.projectId ?? "") === String(project.id));
    const newProgress = calcProjectProgress(wbs, projectBoq);
    if (newProgress !== project.progress) {
      update("projects", project.id, { progress: newProgress });
    }
    // D8: risiko otomatis dari WBS dan milestone WO.
    // Dipanggil bersamaan dengan update progres karena keduanya membaca
    // data WBS yang sama - satu kali baca, dua kali manfaat.
    const today = todayISO();
    const msDays = getSetting(data, "ALERT_MILESTONE_DAYS", 7);
    const existingRisks = data.risks.filter((r) => r.project === project.id);
    const wbsResult = generateRisksFromWbs(project.id, wbs, existingRisks, today, msDays);
    const woResult = generateRisksFromWo(project.id, data.workOrders.filter((w) => w.project === project.id), existingRisks, today, msDays);
    if (canWriteRisks) {
      for (const draft of [...wbsResult.add, ...woResult.add]) {
        if (!claimAutoRisk(String(project.id), draft)) continue;
        void add("risks", draft, { action: "risiko otomatis dari WBS/WO", module: "Proyek" }).catch(() => releaseAutoRisk(String(project.id), draft));
      }
      for (const id of [...wbsResult.close, ...woResult.close]) {
        void update("risks", id, { status: "Tertutup" }).catch(() => {});
      }
    }
  }, [data.projects, canAutoWrite, canWriteRisks]);

// Terlambat otomatis dari due (P8: bisa di-override manual).
    useEffect(() => {
      if (!project || !canAutoWrite) return;
      const today = todayISO();
      // Override sudah tidak relevan (mis. end diperbaiki) → clear.
      if (shouldClearOverride(project as Record<string, unknown>, today, isOverdue as (p: Record<string, unknown>, t: string) => boolean)) {
        runAutoWriteOnce(`${project.id}:override`, () => update("projects", project.id, { statusOverride: null }).catch(() => {}));
      }
      // Auto-logic hanya menulis "Terlambat" kalau tidak ada override aktif.
      if (shouldAutoSetLate(project as Record<string, unknown>, today, isOverdue as (p: Record<string, unknown>, t: string) => boolean)) {
        /* .catch(() => {}) yang dulu dipakai di sini menelan kegagalan tanpa
           umpan balik: kalau backend menolak (403/422) atau offline, proyek
           tetap tampil Running padahal sebenarnya sudah lewat tanggal, dan
           tidak ada yang tahu kenapa. Sekarang error dikembalikan ke
           pendingSync - Monitoring sudah menampilkannya sebagai banner
           "Data belum tersinkron", jadi user tetap diberi tahu. */
        runAutoWriteOnce(`${project.id}:late`, () => update("projects", project.id, { status: "Terlambat" }).catch((err) => {
          log("gagal menandai proyek terlambat", `${project.id} · ${err instanceof Error ? err.message : String(err)}`, "Proyek");
        }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.status, project?.end, project?.progress, project?.statusOverride, canAutoWrite]);

  const docOwnerOptions = useMemo(() => employeeOptions(data.employees), [data.employees]);
  /* Kandidat rujukan QC untuk form dokumen proyek. Sumbernya `qcCertCandidates`
     yang sama dengan modul Dokumen - sebelumnya form ini tidak punya cek
     apa pun, jadi tidak ada cara menunjuk sertifikat mana yang sudah
     diperiksa tim QC. */
  const docQcOptions = useMemo(
    () => qcCertCandidates(data.documents ?? [], project?.id ?? "", "", docSubType),
    [data.documents, project?.id, docSubType],
  );

  if (!project) return <p className="text-sm text-steel-500">{S.detNotFound}</p>;
  const pid = project.id;

  const saveWbsWithConflictRetry = async (draft: WbsItem[]) => {
    try {
      await setWbs(pid, draft);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409 && error.code === "STALE")) throw error;
      const confirmed = window.confirm(locale === "en"
        ? `WBS for project ${pid} changed on the server. Replace the latest server WBS with this local draft (${draft.length} stages)? This may overwrite concurrent changes.`
        : `WBS proyek ${pid} berubah di server. Ganti WBS server terbaru dengan draf lokal ini (${draft.length} tahapan)? Perubahan bersamaan dapat tertimpa.`);
      if (!confirmed) throw error;
      await setWbs(pid, draft);
    }
  };
  const saveTeamWithConflictRetry = async (draft: string[]) => {
    try {
      await setTeam(pid, draft);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409 && error.code === "STALE")) throw error;
      const confirmed = window.confirm(locale === "en"
        ? `Project team for ${pid} changed on the server. Replace the latest server team with your local selection (${draft.length} members)? This may overwrite concurrent changes.`
        : `Tim proyek ${pid} berubah di server. Ganti tim server terbaru dengan pilihan lokal ini (${draft.length} anggota)? Perubahan bersamaan dapat tertimpa.`);
      if (!confirmed) throw error;
      await setTeam(pid, draft);
    }
  };

  const wbs = syncWbsWeightsWithScope(wbsFor(pid) as WbsExt[], project.scope);
  /* Semua booking equipment proyek (juga yang masih terjadwal), dikelompokkan
     per tahapan WBS: tahapan sesuai urutan WBS, lalu "tanpa tahapan". */
  const stageOrder = new Map(wbs.map((w, i) => [w.task, i]));
  const projectBookings = (data.bookings ?? [])
    .filter((b) => String(b.proyek ?? "") === pid)
    .sort((a, b) => (stageOrder.get(String(a.wbsTask ?? "")) ?? 9999) - (stageOrder.get(String(b.wbsTask ?? "")) ?? 9999) || String(a.date ?? "").localeCompare(String(b.date ?? "")));
  const canWriteBookings = hasPermission(session?.permissions, "bookings", "w");
  const teamIds = teamFor(pid);
  /* Penugasan WBS ↔ tab Tim (catatan klien 17 Okt, K17-PM-08): karyawan yang
     ditugaskan di tahapan WBS ikut tampil di Tim (juga penugasan lama yang
     belum tercatat di team_by_project), dan subkon ditampilkan per tahapan. */
  const wbsAssignments = (() => {
    const emp = new Map<string, string[]>();
    const sub = new Map<string, { name: string; stages: string[]; woIds: string[] }>();
    for (const w of wbs) {
      const a = w.assignee;
      if (!a?.id) continue;
      if (a.type === "internal") emp.set(a.id, [...(emp.get(a.id) ?? []), w.task]);
      else {
        const cur = sub.get(a.id) ?? { name: String(a.name ?? a.id), stages: [], woIds: [] };
        cur.stages.push(w.task);
        if (a.woId && !cur.woIds.includes(a.woId)) cur.woIds.push(a.woId);
        sub.set(a.id, cur);
      }
    }
    return { emp, sub };
  })();
  const team = data.employees.filter((e) => teamIds.includes(e.id) || wbsAssignments.emp.has(String(e.id)));
  const vessel = data.vessels.find((v) => sameName(v.name, project.vessel));
  const invoices = data.invoices.filter((i) => i.project === pid);
  const ncrs = data.ncr.filter((n) => n.project === pid);

  const docNeedsQc = NEEDS_QC_LINK.has(docSubType);

  /* Nama pengguna yang sedang login, dipakai sebagai penanggung jawab
     bawaan. `name` bisa kosong di mode offline/lama, jadi ada fallback ke
     username agar tidak pernah tersimpan string kosong. */
  const sessionName = String(session?.name ?? "").trim() || String(session?.username ?? "").trim();
  const slots = data.dockSlots.filter((s) => s.project === pid);
  const docs = (() => {
    const rawDocs = data.documents.filter((d) => d.project === pid);
    const existingBoqIds = new Set(
      rawDocs
        .filter((d) => d.type === "BoQ" || d.boqDocId)
        .map((d) => String(d.boqDocId ?? d.id).replace(/^DOC-/, "")),
    );
    const projectBoqDocs = (data.boqDocs ?? []).filter((b) => String(b.projectId ?? "") === pid);
    const synthDocs: StoreItem[] = projectBoqDocs
      .filter((b) => !existingBoqIds.has(String(b.id).replace(/^DOC-/, "")) && !rawDocs.some((d) => d.id === `DOC-${b.id}` || d.id === b.id))
      .map((b) => ({
        id: `DOC-${b.id}`,
        title: `BoQ ${b.number} Rev ${b.revision}`,
        type: "BoQ",
        subType: Number(b.revision ?? 0) > 0 ? "Revisi BoQ" : "BoQ Proyek",
        project: pid,
        vessel: String(project.vessel ?? ""),
        version: `Rev ${b.revision ?? 0}`,
        status: b.status,
        updated: b.issuedAt || todayISO(),
        owner: b.assigner || b.createdBy || b.owner || "",
        assigner: b.assigner || b.createdBy || b.owner || "",
        boqDocId: b.id,
        archived: b.status === "Digantikan",
        docCopy: "Terkendali",
      }));
    return [...rawDocs, ...synthDocs].map((d) => {
      if (d.type === "BoQ" || d.boqDocId) {
        const cleanId = String(d.boqDocId ?? d.id).replace(/^DOC-/, "");
        const b = projectBoqDocs.find((x) => x.id === d.boqDocId || x.id === cleanId || x.id === d.id);
        if (b) {
          const assigner = String(b.assigner || b.createdBy || d.assigner || d.owner || "");
          return {
            ...d,
            status: b.status || d.status,
            assigner: assigner || undefined,
            owner: assigner || d.owner,
            version: `Rev ${b.revision ?? 0}`,
          };
        }
      }
      return d;
    });
  })();
  /* PRJ-20: dokumen dikelompokkan per tipe (BoQ, Kontrak, Drawing, ...). */
  const docsByType = [...docs].sort((x, y) => String(x.type ?? "").localeCompare(String(y.type ?? "")));
  const TR = n_tree[locale];
  const docTree: FlowNode[] = [...new Set(docsByType.map((d) => String(d.type ?? "-")))].map((type) => {
    const list = docsByType.filter((d) => String(d.type ?? "-") === type);
    return {
      id: `t:${type}`, kind: "group" as const, icon: <FileText className="h-4 w-4" />,
      title: type, subtitle: TR.docsN.replace("{n}", String(list.length)),
      children: list.map((d) => {
        const saved = (Array.isArray(d.revisions) ? d.revisions : []) as { version?: string; at?: string; by?: string; note?: string }[];
        const revs = saved.length > 0 ? saved : [{ version: String(d.version ?? "-"), at: String(d.updated ?? ""), by: String(d.owner ?? "-"), note: TR.currentVersion }];
        return {
          id: String(d.id), kind: "item" as const, icon: <FileText className="h-4 w-4" />,
          title: String(d.title), subtitle: `${String(d.id)} · ${String(d.version ?? "-")} · ${fmtTanggal(String(d.updated ?? ""))}`,
          trailing: <StatusBadge status={d.status} />,
          onOpen: () => setDocDetail(d),
          children: [...revs].reverse().map((r, i) => ({
            id: `${String(d.id)}:rev:${i}`, kind: "leaf" as const,
            title: `${String(r.version ?? "-")}${r.note ? ` - ${String(r.note)}` : ""}`,
            subtitle: TR.revBy.replace("{date}", r.at ? fmtTanggal(String(r.at)) : "-").replace("{by}", String(r.by ?? "-")),
          })),
        };
      }),
    };
  });
  const wos = data.workOrders.filter((w) => w.project === pid);
  const coList = data.changeOrders.filter((c) => c.project === pid);
  const riskList = data.risks.filter((r) => r.project === pid);
  /* D15: data subkon untuk tab Subkon. WO sudah ada; subcontractors dan
     termins perlu diakses dari store global. */
  const subkonList = (data.subcontractors ?? []).filter((s) => wos.some((w) => String(w.sub ?? "") === String(s.name ?? "")));
  const subkonTermins = (data.termins ?? []).filter((t) => wos.some((w) => String(w.id ?? "") === String(t.woId ?? "")));
  const warrantyList = (data.warranties ?? []).filter((w) => String(w.projectId ?? "") === pid);
  const coApproved = coList.filter((c) => c.status === "Disetujui" || c.status === "Diterapkan");
  const coApprovedImpact = coApproved.reduce((s, c) => s + Number(c.impact || 0), 0);

  const riskScore = (r: StoreItem): number =>
    (RISK_LEVEL.indexOf(String(r.likelihood ?? "")) + 1) * (RISK_LEVEL.indexOf(String(r.impact ?? "")) + 1);
  const riskTone = (score: number): "green" | "amber" | "red" => (score >= 6 ? "red" : score >= 3 ? "amber" : "green");

  const ganttRange = (() => {
    const pts = wbs.flatMap((w) => [parseYM(w.start), parseYM(w.end)]).filter((p): p is { y: number; m: number } => p !== null);
    if (pts.length === 0) return null;
    let min = pts[0];
    let max = pts[0];
    for (const p of pts) {
      if (p.y * 12 + p.m < min.y * 12 + min.m) min = p;
      if (p.y * 12 + p.m > max.y * 12 + max.m) max = p;
    }
    return { min, max, total: max.y * 12 + max.m - (min.y * 12 + min.m) + 1 };
  })();

  /* Posisi garis "hari ini" dalam persen; null bila di luar rentang. */
  const ganttToday = (() => {
    if (!ganttRange) return null;
    const [y, m, d] = todayISO().split("-").map(Number);
    const pos = ((y * 12 + m - (ganttRange.min.y * 12 + ganttRange.min.m) + (d - 1) / 30) / ganttRange.total) * 100;
    return pos >= 0 && pos <= 100 ? pos : null;
  })();
  const ganttBar = (start: string, end: string): { left: number; width: number } | null => {
    if (!ganttRange) return null;
    const s = parseYM(start) ?? ganttRange.min;
    const e = parseYM(end) ?? s;
    const base = ganttRange.min.y * 12 + ganttRange.min.m;
    const left = ((s.y * 12 + s.m - base) / ganttRange.total) * 100;
    const width = Math.max(((e.y * 12 + e.m - (s.y * 12 + s.m) + 1) / ganttRange.total) * 100, 3);
    return { left, width };
  };

  /* Horizon tampilan ringkasan 30 hari (PRJ-16) - sengaja terpisah dari
     ALERT_MILESTONE_DAYS yang dipakai mesin alert & risiko otomatis. */
  const MILE_VIEW_DAYS = 30;
  const milestonesNear = wbs.filter((w) => {
    const d = monthEndDate(w.end);
    if (!d || Number(w.progress) >= 100) return false;
    const diff = Math.round((d.getTime() - new Date(`${todayISO()}T00:00:00`).getTime()) / 86400000);
    return diff >= 0 && diff <= MILE_VIEW_DAYS;
  });
  const progressDelayDetails = project.status === "Terlambat" || project.status === "Tertunda"
    ? projectDelayDetailsOf(project.end, wbs, todayISO(), project.status === "Terlambat")
    : null;

  const baseline = (project.wbsBaseline ?? null) as WbsBaseline | null;

  const snapshotBaseline = async () => {
    try {
      await update("projects", pid, { wbsBaseline: { at: todayISO(), wbs: JSON.parse(JSON.stringify(wbs)) as WbsExt[] } });
      log("membuat baseline WBS", `${pid} · ${wbs.length} tahapan`, "Proyek");
      toast(S.detToastBaseline);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const coDocs = (data.boqDocs ?? []).filter((d) => String(d.projectId ?? "") === pid && String(d.status ?? "") === "Disetujui");
  const coDocItems = (data.boq ?? []).filter((b) => String(b.boqDocId ?? "") === coDocId);
  /* Dampak dihitung dari perubahan item bila CO menunjuk surat BoQ. */
  const coChangeImpact = coChanges.reduce((sum, ch) => {
    const item = coDocItems.find((b) => String(b.id) === ch.itemId);
    const oldTotal = Number(item?.totalPrice ?? 0);
    if (ch.op === "remove") return sum - oldTotal;
    const qty = Number(ch.quantity || (ch.op === "update" ? item?.quantity : 0) || 0);
    // Kolom kosong = pakai harga lama; "0" eksplisit berarti harga memang nol.
    const price = ch.unitPrice.trim() !== "" ? parseRupiah(ch.unitPrice) : (ch.op === "update" ? Number(item?.unitPrice ?? 0) : 0);
    return sum + Math.round(qty * price) - (ch.op === "update" ? oldTotal : 0);
  }, 0);
  // Keputusan CO hanya untuk owner (direktur/developer), juga di mode demo lokal.
  const coOwner = ["direktur", "developer"].includes(String(session?.role ?? "").toLowerCase());

  const saveCo = async () => {
    if (!coForm.title.trim()) { toast(S.detToastCoTitle, "info"); return; }
    const linked = coDocId !== "" && coChanges.length > 0;
    const impact = linked ? coChangeImpact : parseRupiah(coForm.impact);
    if (!linked && (coForm.impact === "" || !Number.isFinite(impact))) { toast(S.detToastCoImpact, "info"); return; }
    if (!coForm.requestedBy.trim()) { toast(S.detToastCoBy, "info"); return; }
    if (linked && coChanges.some((ch) => (ch.op !== "add" && !ch.itemId) || (ch.op === "add" && (!ch.name.trim() || !(Number(ch.quantity) > 0))))) { toast(S.detCoChangeInvalid, "info"); return; }
    try {
      await add("changeOrders", {
        project: pid, title: coForm.title.trim(), impact,
        status: "Diajukan", requestedBy: coForm.requestedBy.trim(), date: coForm.date || todayISO(),
        ...(linked ? {
          boqDocId: coDocId,
          changes: coChanges.map((ch) => ({
            op: ch.op,
            ...(ch.op !== "add" ? { itemId: ch.itemId } : { name: ch.name.trim(), unit: ch.unit.trim() || "ls" }),
            ...(ch.op !== "remove" && ch.quantity !== "" ? { quantity: Number(ch.quantity) } : {}),
            ...(ch.op !== "remove" && ch.unitPrice !== "" ? { unitPrice: parseRupiah(ch.unitPrice) } : {}),
          })),
        } : {}),
      }, { action: "mengajukan change order", module: "Proyek" });
      toast(S.detToastCoSent);
      setCoForm({ title: "", impact: "", requestedBy: "", date: "" });
      setCoDocId(""); setCoChanges([]);
      setShowCo(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const setCoStatus = async (id: string, status: string) => {
    try {
      /* F3-C-05: keputusan owner & penerapan lewat endpoint (server memeriksa
         peran, membuat revisi BoQ, dan memperbarui anggaran). Mode lokal: status saja. */
      if (isBackendConfigured() && getJwt() !== null) {
        if (status === "Diterapkan") {
          const res = await apiFetch<{ resultBoqDocId: string | null; newTotal: number }>(`/api/changeOrders/${encodeURIComponent(id)}/apply`, { method: "POST" });
          await resyncCollections(["changeOrders", "boqDocs", "boq", "projects", "activities"]);
          toast(res.resultBoqDocId ? S.detCoAppliedBoq.replace("{v}", fmtRupiah(res.newTotal)) : S.detToastCoStatus.replace("{a}", status.toLowerCase()));
          return;
        }
        let note = "";
        if (status === "Ditolak") {
          // Alasan penolakan wajib (dicatat di ownerApproval & audit).
          note = (window.prompt(S.detCoRejectAsk) ?? "").trim();
          if (!note) return;
        }
        await apiFetch(`/api/changeOrders/${encodeURIComponent(id)}/decision`, { method: "POST", body: JSON.stringify({ decision: status, ...(note ? { note } : {}) }) });
        await resyncCollections(["changeOrders", "activities"]);
        toast(S.detToastCoStatus.replace("{a}", status.toLowerCase()));
        return;
      }
      await update("changeOrders", id, { status });
      log("mengubah change order", `${id} - ${status}`, "Proyek");
      toast(S.detToastCoStatus.replace("{a}", status.toLowerCase()));
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  // Garansi/DLP: dibuat sekali saat proyek Selesai (pintasan di tab Terkait).
const createWarranty = async (wbsTask?: string) => {
      const year = todayISO().slice(0, 4);
      const seq = (data.warranties ?? []).filter((w) => String(w.id ?? "").startsWith(`WRT-${year}-`)).length + 1;
      try {
        const created = await add("warranties", {
          id: `WRT-${year}-${String(seq).padStart(3, "0")}`,
          projectId: pid, vessel: project.vessel, start: todayISO(), months: 12,
          status: "Aktif", branch: String(project.branch ?? ""),
          ...(wbsTask ? { wbsTask } : {}),
        }, { action: "membuat garansi/DLP", module: "Proyek" });
        toast(S.detToastWarranty.replace("{a}", created.id));
      } catch (e) {
        toast(e instanceof Error ? e.message : S.saveFail, "info");
      }
    };

  /* Hapus risk / change order / trial / BAST. Tiga di antaranya sudah
     appet jadi dokumen resmi proyek, jadi Record yang sudah disetujui
     tidak boleh hilang diam-diam. */
  const recLocked = (kind: string, row: StoreItem): string | null => {
    if (kind === "bast" && String(row.status ?? "") === "Disetujui") {
      return locale === "en"
        ? "This BAST is approved - it already counts toward the contract balance and project closing. Create a correcting BAST instead."
        : "BAST ini sudah Disetujui - sudah masuk sisa kontrak dan syarat tutup proyek. Buat BAST koreksi.";
    }
    if (kind === "changeOrders" && String(row.status ?? "") === "Diterapkan") {
      return locale === "en"
        ? "This change order is already applied to the contract value. Reverse it through a new change order."
        : "Change order ini sudah Diterapkan ke nilai kontrak. Batalkan lewat change order baru.";
    }
    if (kind === "trials" && String(row.hasil ?? "") === "Lolos" && String(row.baRef ?? "") !== "") {
      return locale === "en"
        ? "This trial passed and is signed off (BA reference present) - it is a commissioning record."
        : "Trial ini Lolos dan sudah ditandatangani (ada nomor BA) - itu record commissioning.";
    }
    return null;
  };

  const confirmDelRec = async () => {
    if (!delRec) return;
    const { kind, row } = delRec;
    const locked = recLocked(kind, row);
    if (locked) { toast(locked, "info"); setDelRec(null); return; }
    try {
      await remove(kind, String(row.id));
      log(`menghapus ${kind}`, `${String(row.id)} - ${project.name}`, "Proyek");
      toast(locale === "en" ? `${String(row.id)} deleted` : `${String(row.id)} dihapus`);
      setDelRec(null);
    } catch (e) { toast(e instanceof Error ? e.message : S.saveFail, "info"); }
  };

  const bastList = (data.bast ?? []).filter((b) => b.projectId === pid);
  const projectBoq = (data.boq ?? []).filter((b) => b.projectId === pid);
  const boqTotal = projectBoq.reduce((s, b) => s + Number(b.totalPrice || 0), 0);

  /* ================= BIAYA EQUIPMENT -> HPP PROYEK =================
     Relasi ini SEBELUMNYA tidak ada di modul Proyek sama sekali: biaya
     sewa equipment (booking selesai) dan material servis hanya tampil di
     modul Equipment sebagai angka terpisah, tidak pernah masuk ke HPP.
     Akibatnya CPI/EAC di bawah terlihat lebih baik dari kenyataan -
     modal kerja crane/genset/sparepart hilang dari biaya.

     equipmentCostSummary() adalah SATU sumber angka yang juga dipakai
     tab "Biaya" modul Equipment, jadi kedua modul tidak bisa melenceng.
     Yang dibebankan:
       - rental  : hours × equipment.rate, dari booking Terpakai/Selesai
       - fuel    : fuelLiters × equipment.fuelPrice
       - maint.  : material maintenance yang statusnya sudah Selesai
     Yang BELUM terealisasi (maintenance berjalan) ditampilkan terpisah
     sebagai "committed" - bukan dicampur ke realized. */
  const equipCost = equipmentCostSummary(pid, data.bookings, data.maintenances, data.equipment);
  const equipHasCost = equipCost.totalRealized > 0 || equipCost.totalCommitted > 0;
  /* F3-D-02: biaya service yang sudah Selesai ikut dibebankan ke biaya proyek. */
  const serviceCostDone = (data.services ?? [])
    .filter((sv) => String(sv.projectId ?? "") === pid && String(sv.status ?? "") === "Done")
    .reduce((sum, sv) => sum + (Number(sv.cost) || 0), 0);
  // Komitmen: service disetujui yang sedang berjalan/terjadwal (belum dibebankan).
  const serviceCostCommitted = (data.services ?? [])
    .filter((sv) => String(sv.projectId ?? "") === pid && ["Scheduled", "In Progress"].includes(String(sv.status ?? ""))
      && String(sv.approval ?? "Disetujui") === "Disetujui")
    .reduce((sum, sv) => sum + (Number(sv.cost) || 0), 0);
  /* Subkon ↔ WBS ↔ anggaran (catatan klien 17 Okt, K17-PM-14): komitmen = nilai
     kontrak WO proyek, realisasi = termin Lunas. Realisasi ikut biaya aktual EVM
     seperti equipment & service. */
  const subkonByWo = wos.map((w) => {
    const paid = (data.termins ?? []).filter((t) => String(t.woId ?? "") === String(w.id) && String(t.status ?? "") === "Lunas")
      .reduce((s2, t) => s2 + (Number(t.amount) || 0), 0);
    return { wo: w, task: String(w.wbsTask ?? w.scope ?? ""), value: Number(w.value) || 0, paid };
  });
  const subkonCommitted = subkonByWo.reduce((s2, r) => s2 + r.value, 0);
  const subkonPaid = subkonByWo.reduce((s2, r) => s2 + r.paid, 0);
  const hppWithEquip = Number(project.actual ?? 0) + equipCost.totalRealized + serviceCostDone + subkonPaid;

  // SATU angka grand invoice: grandTotal bila ada, else amount dikurangi retensi.
  const invGrand = (i: StoreItem): number => {
    const g = Number(i.grandTotal) || 0;
    if (g > 0) return g;
    return Math.max(0, (Number(i.amount) || 0) - (Number(i.retentionAmt) || 0));
  };

  // Kontrak proyek ini (via quotationId hasil konversi, atau link projectId langsung).
  const contractOf = (data.contracts ?? []).find((c) =>
    (project.quotationId && String(c.quotationId ?? "") === String(project.quotationId)) ||
    String(c.projectId ?? "") === pid
  );
  const contractValue = Number(contractOf?.value) || 0;
  const bastApprovedSum = bastList
    .filter((b) => String(b.status) === "Disetujui")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  // Nominal default BAST = sisa kontrak (bukan BoQ buta); tanpa kontrak fallback ke BoQ.
  const sisaKontrak = contractValue > 0 ? Math.max(0, contractValue - bastApprovedSum) : boqTotal;

  // Tutup proyek cek: WBS 100% + BAST Disetujui + invoice Lunas (NCR dicek terpisah).
  const closeBlockReason = (): string | null => {
    const prog = calcProjectProgress(wbs, projectBoq);
    if (prog !== 100) return `WBS belum 100% (progres ${prog}%)`;
    if (!bastList.some((b) => String(b.status) === "Disetujui")) return "belum ada BAST yang Disetujui";
    if (invoices.length === 0) return "belum ada invoice";
    const open = invoices.filter((i) => String(i.status) !== "Lunas");
    if (open.length > 0) return `${open.length} invoice belum Lunas (${open.map((i) => String(i.id)).join(", ")})`;
    return null;
  };

  const nextBastId = (tanggalISO: string): string => {
    const year = (tanggalISO || todayISO()).slice(0, 4);
    const prefix = `BAST-SMD-${year}-`;
    let max = 0;
    for (const b of (data.bast ?? [])) {
      const m = String(b.id ?? "").match(new RegExp(`^BAST-SMD-${year}-(\\d+)$`));
      if (m) max = Math.max(max, Number(m[1]) || 0);
    }
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  };

  // Nomor invoice tunggal format Finance (INV/<TIPE>-SMD-YYYY-NNN).
  const nextMilestoneInvId = (tanggalISO: string): string => {
    const year = (tanggalISO || todayISO()).slice(0, 4);
    const head = `INV/MS-SMD-${year}-`;
    let max = 0;
    for (const i of (data.invoices ?? [])) {
      const id = String(i.id ?? "");
      if (id.startsWith(head)) {
        const n = Number(id.slice(head.length));
        if (Number.isFinite(n) && n > max) max = n;
      }
    }
    let invId = `${head}${String(max + 1).padStart(3, "0")}`;
    let bump = 1;
    while ((data.invoices ?? []).some((i) => String(i.id) === invId)) {
      bump += 1;
      invId = `${head}${String(max + bump).padStart(3, "0")}`;
    }
    return invId;
  };

  // Gate anti-bypass: milestone BAST wajib cocok persis dengan satu task WBS.
  // Tanpa kecocokan (tanpa fuzzy) → tolak.
  const findLinkedWbs = (milestone: string): WbsExt | undefined => {
    const ms = String(milestone ?? "");
    return wbs.find((t) => t.task === ms);
  };

  const saveBast = async () => {
    if (!bastForm.milestone) { toast(S.detToastBastMile, "info"); return; }
    if (!bastForm.tanggal) { toast(S.detToastBastDate, "info"); return; }
    if (!bastForm.signer.trim()) { toast(S.detToastBastSigner, "info"); return; }
    const amt = bastForm.amount === "" ? 0 : parseRupiah(bastForm.amount);
    if (bastForm.amount !== "" && (!Number.isFinite(amt) || amt < 0)) { toast(S.detToastAmount, "info"); return; }
    if (!wbs.some((t) => t.task === bastForm.milestone)) {
      toast(`BAST ditolak: milestone tidak cocok dengan WBS mana pun`, "info");
      return;
    }
    const id = nextBastId(bastForm.tanggal);
    try {
      await add("bast", {
        id, projectId: pid, milestone: bastForm.milestone, tanggal: bastForm.tanggal,
        penandatangan: bastForm.signer.trim(), lampiran: bastForm.lampiran.trim(),
        amount: amt > 0 ? amt : sisaKontrak, status: "Draft",
      }, { action: "membuat BAST", target: `${id} · ${bastForm.milestone}`, module: "Proyek" });
      toast(S.detToastBastMade.replace("{a}", id));
      setBastForm({ milestone: "", tanggal: todayISO(), signer: "", lampiran: "", amount: "" });
      setShowBast(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const advanceBast = async (b: StoreItem, next: string) => {
    const order = ["Draft", "Diajukan", "Disetujui"];
    const curIdx = order.indexOf(String(b.status));
    const nextIdx = order.indexOf(next);
    if (nextIdx !== curIdx + 1) { toast(S.detToastBastFlow.replace("{a}", order.join(" → ")), "info"); return; }
    const linked = findLinkedWbs(String(b.milestone ?? ""));
    if (!linked) {
      toast(`BAST ${String(b.id)} ditolak: milestone tidak cocok dengan WBS mana pun`, "info");
      return;
    }
    if (next === "Disetujui" && Number(linked.progress) !== 100) {
      toast(S.detToastBastProg.replace("{a}", linked.task).replace("{b}", String(linked.progress)), "info");
      return;
    }
    try {
      if (next === "Disetujui") {
        const amount = Number(b.amount) > 0 ? Number(b.amount) : sisaKontrak;
        // Cegah tagih ganda manual-vs-auto per BAST: satu BAST satu invoice.
        const existing = (data.invoices ?? []).find((i) =>
          String(i.milestoneRef ?? "") === `BAST ${String(b.id)}` || String(i.bastId ?? "") === String(b.id)
        );
        if (existing) {
          await update("bast", String(b.id), { status: next, invoiceId: String(existing.id) });
          log("menyetujui BAST (invoice sudah ada)", `${String(b.id)} → ${String(existing.id)}`, "Proyek");
          toast(`BAST disetujui - memakai invoice ${String(existing.id)} yang sudah ada`);
          return;
        }
        const invId = nextMilestoneInvId(String(b.tanggal ?? todayISO()));
        let due = String(b.tanggal ?? todayISO());
        const d = new Date(`${due}T00:00:00`);
        if (!Number.isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          due = d.toISOString().slice(0, 10);
        } else {
          due = todayISO();
        }
        // Pajak/retensi ikut aturan Finance (sbInvoiceMath, tarif tidak ditulis ulang):
        // jasa = nominal BAST, retensi milestone 5%.
        const ppnRateUsed = getSetting(data, "PPN_INVOICE_RATE", PPN_INVOICE_DEFAULT);
        const pphRateUsed = getSetting(data, "PPH_JASA_RATE", PPH_JASA_DEFAULT);
        const sb = sbInvoiceMath({
          jasa: amount, material: 0,
          ppnRate: ppnRateUsed, pphRate: pphRateUsed,
          skdt: false, dpApplied: 0, retentionPct: 5,
        });
        try {
          await add("invoices", {
            id: invId, client: project.client, project: pid, vessel: String(project.vessel ?? ""), amount,
            due, status: "Draft", paymentTerm: `Termin ${String(b.milestone)}`,
            billingType: "Milestone", type: "Milestone", milestoneRef: `BAST ${String(b.id)}`,
            bastId: String(b.id),
            dunning: "Belum Ditagih",
            jasaTotal: sb.jasa, matTotal: 0, dpp: sb.dpp, ppnAmt: sb.ppn, pphAmt: sb.pph,
            ppnRate: ppnRateUsed, pphRate: pphRateUsed, dpApplied: 0,
            grandTotal: sb.grand,
            retentionPct: 5, retentionAmt: sb.retentionAmt,
            retentionStatus: sb.retentionAmt > 0 ? "Ditahan" : "-",
            skdt: false,
          }, { action: "menerbitkan invoice milestone (BAST)", target: `${invId} ← ${String(b.id)}`, module: "Keuangan" });
          await update("bast", String(b.id), { status: next, invoiceId: invId });
          log("menyetujui BAST + auto-invoice", `${String(b.id)} → ${invId}`, "Proyek");
          toast(S.detToastBastInv.replace("{a}", invId));
        } catch {
          toast(S.detToastBastInvFail.replace("{a}", String(b.id)), "info");
          return;
        }
      } else {
        log("mengajukan BAST", `${String(b.id)} → ${next}`, "Proyek");
        toast(S.detToastBastStatus.replace("{a}", next.toLowerCase()));
        await update("bast", String(b.id), { status: next });
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  // E1: sub-stage desain + class approval, tersimpan di project.designStages.
  // D1: blok edit dihapus; data tetap ada di store untuk backward compat.
  // Gate kini membaca dokumen Sertifikat Kelas + fallback ke designStages.
  const designStages = (project.designStages ?? []) as { name: string; status: string; society: string; date: string; doc: string }[];

  // D1: Class Approved = ada dokumen Sertifikat Kelas yang Disetujui,
  // ATAU designStages lama yang statusnya Disetujui (backward compat).
  const classApproved = isClassApprovalSatisfied(project, data);

  // D1: baris tabel Log Penawaran dan Tagihan.
  // Sumber: quotation terkait project, contract terkait project, invoices.
  interface LogRow { kind: "Penawaran" | "Kontrak" | "Tagihan"; id: string; date: string; ref: string; value: number; status: string; }
  const quotation = data.quotations.find((q) => q.id === project.quotationId);
  const contractsForProject = (data.contracts ?? []).filter(
    (c) => (project.quotationId && String(c.quotationId ?? "") === String(project.quotationId)) || String(c.projectId ?? "") === pid,
  );
  const logRows: LogRow[] = [
    ...(quotation ? [{ kind: "Penawaran" as const, id: String(quotation.id), date: String(quotation.date ?? ""), ref: String(quotation.id), value: Number(quotation.value ?? 0), status: String(quotation.stage ?? "Draft") }] : []),
    ...contractsForProject.map((c) => ({ kind: "Kontrak" as const, id: String(c.id), date: String(c.signedAt ?? ""), ref: String(c.id), value: Number(c.value ?? 0), status: String(c.status ?? "Aktif") })),
    ...invoices.map((i) => ({ kind: "Tagihan" as const, id: String(i.id), date: String(i.due ?? i.date ?? ""), ref: String(i.id), value: Number(i.grandTotal ?? i.amount ?? 0), status: String(i.status ?? "Draft") })),
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  /* saveDesignStage dihapus (D1): blok edit Desain & Class Approval sudah
     diganti dengan tabel Log Penawaran dan Tagihan. Class Approval kini
     diproses di modul Dokumen (tipe Sertifikat, subType Sertifikat Kelas).
     Data designStages lama tetap ada di store untuk backward compat dan
     masih dibaca sebagai fallback gate tahap. */

  // E4: trials (sea trial / commissioning) per proyek.
  const trialList = (data.trials ?? []).filter((t) => t.projectId === pid);
  const nextTrialId = (tanggalISO: string): string => {
    const year = (tanggalISO || todayISO()).slice(0, 4);
    const prefix = `STL-${year}-`;
    let max = 0;
    for (const t of (data.trials ?? [])) {
      const m = String(t.id ?? "").match(new RegExp(`^STL-${year}-(\\d+)$`));
      if (m) max = Math.max(max, Number(m[1]) || 0);
    }
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  };

  /* D10: buka form trial dengan checklist otomatis dari WBS task yang
     progress >= 100. User bisa centang/nota per task. */
  const openTrialNew = () => {
    const doneTasks = wbs.filter((w) => Number(w.progress ?? 0) >= 100);
    setTrialForm({
      tanggal: todayISO(), parameter: "", punchList: "", hasil: "Lolos", baRef: "", kondisi: "Sudah Sesuai",
      checklist: doneTasks.map((w) => ({ wbsTask: w.task, done: false, note: "" })),
    });
    setShowTrial(true);
  };

  const saveTrial = async () => {
    if (!trialForm.tanggal) { toast(S.detToastTrialDate, "info"); return; }
    if (!trialForm.parameter.trim()) { toast(S.detToastTrialParam, "info"); return; }
    const id = nextTrialId(trialForm.tanggal);
    try {
      await add("trials", {
        id, projectId: pid, tanggal: trialForm.tanggal, parameter: trialForm.parameter.trim(),
        punchList: trialForm.punchList.trim(), hasil: "Berjalan", baRef: trialForm.baRef.trim(),
        ...(trialForm.checklist.length > 0 ? { checklist: trialForm.checklist } : {}),
        kondisi: trialForm.kondisi,
      }, { action: "membuat sea trial", target: `${id} · ${pid}`, module: "Proyek" });
      toast(S.detToastTrialMade.replace("{a}", id));
      setTrialForm({ tanggal: todayISO(), parameter: "", punchList: "", hasil: "Lolos", baRef: "", kondisi: "Sudah Sesuai", checklist: [] });
      setShowTrial(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const advanceTrial = async (t: StoreItem, hasil: string) => {
    if (String(t.hasil) === hasil) return;
    if (hasil === "Lolos") {
      // E5: trial exit butuh Class Survey row yang ter-link ke trial ini.
      const linked = (data.surveys ?? []).some((s) => String(s.linkedTrial ?? "") === String(t.id));
      if (!linked) { toast(S.detToastSurvey, "info"); return; }
    }
    try {
      if (hasil === "Lolos") {
        const bastId = nextBastId(String(t.tanggal ?? todayISO()));
        // Milestone BAST wajib cocok persis dengan WBS (gate anti-bypass):
        // pakai task Trial bila ada, else string Sea Trial (persetujuan akan menolak
        // bila tak cocok sampai milestone diselaraskan ke WBS).
        const exactTrial = `Sea Trial - ${String(t.parameter ?? "")}`;
        const trialTask = wbs.find((w) => w.task === exactTrial) ?? wbs.find((w) => /trial/i.test(w.task));
        await add("bast", {
          id: bastId, projectId: pid, milestone: trialTask ? trialTask.task : exactTrial,
          tanggal: String(t.tanggal ?? todayISO()), penandatangan: "", lampiran: String(t.punchList ?? ""),
          amount: sisaKontrak, status: "Draft",
        }, { action: "membuat BAST draft dari trial", target: `${bastId} ← ${String(t.id)}`, module: "Proyek" });
        toast(S.detToastTrialPass.replace("{a}", bastId));
      } else {
        toast(S.detToastTrialMark.replace("{a}", String(t.id)).replace("{b}", hasil), "info");
      }
      await update("trials", String(t.id), { hasil });
      log("memperbarui hasil trial", `${String(t.id)} → ${hasil}`, "Proyek");
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  // E7: QA gate + history otomatis saat Selesai.
  /* Impor Ruang Lingkup dari Excel/CSV (catatan klien 17 Okt, K17-PM-13).
     Kolom: Jenis pekerjaan | Lokasi | Deskripsi. Baris judul dilewati otomatis;
     baris tanpa jenis pekerjaan dilaporkan nomornya, bukan disimpan setengah. */
  const downloadScopeTemplate = (): void => {
    void exportExcel([[S.detScopeColService, S.detScopeColLoc, S.detScopeColDesc], [S.detScopeTplEx1, S.detScopeTplEx2, S.detScopeTplEx3]], "template-ruang-lingkup", "Ruang Lingkup");
  };
  const importScope = async (file: File): Promise<void> => {
    try {
      const rows = await readSheetRows(file);
      const header = rows[0] && /jenis|pekerjaan|service|lingkup|scope|work/i.test(rows[0][0] ?? "") ? 1 : 0;
      const key = (service: string, lokasi = ""): string => `${service.trim().toLowerCase()}|${lokasi.trim().toLowerCase()}`;
      const seen = new Set(scopeList(project.scope).map((x) => key(x.service, x.lokasi)));
      const items: { service: string; lokasi?: string; deskripsi?: string }[] = [];
      const preview: ImportPreviewRow[] = rows.slice(header).map((row, i) => {
        const cells = [row[0] ?? "", row[1] ?? "", row[2] ?? ""].map((c) => c.trim());
        const [service, lokasi, deskripsi] = cells as [string, string, string];
        const line = i + header + 1;
        if (!service) return { line, cells, error: S.detScopeImpNoService };
        if (seen.has(key(service, lokasi))) return { line, cells, error: S.detScopeImpDup };
        seen.add(key(service, lokasi));
        items.push({ service, ...(lokasi ? { lokasi } : {}), ...(deskripsi ? { deskripsi } : {}) });
        return { line, cells };
      });
      if (preview.length === 0) { toast(S.detScopeImportEmpty, "info"); return; }
      setScopePreview({ file: file.name, rows: preview, items });
    } catch (e) {
      toast(S.detScopeImportFail.replace("{a}", e instanceof Error ? e.message : String(e)), "info");
    }
  };
  const confirmScopeImport = async (): Promise<void> => {
    if (!scopePreview || scopePreview.items.length === 0) return;
    const { items, rows, file } = scopePreview;
    try {
      await update("projects", pid, { scope: [...scopeList(project.scope), ...items] });
      log("mengimpor lingkup", `${pid} · ${items.length} baris dari ${file}`, "Proyek");
      const skipped = rows.filter((r) => r.error).map((r) => r.line);
      toast(S.detScopeImportDone.replace("{n}", String(items.length)) + (skipped.length ? S.detScopeImportSkipped.replace("{m}", String(skipped.length)).replace("{rows}", skipped.slice(0, 8).join(", ")) : ""));
      setScopePreview(null);
    } catch (e) {
      toast(S.detScopeImportFail.replace("{a}", e instanceof Error ? e.message : String(e)), "info");
    }
  };

  const saveScope = async () => {
    if (!scopeVal.service.trim()) { toast(S.detToastSvcReq, "info"); return; }
    const rawHarga = parseRupiah(scopeVal.harga);
    const item: ScopeItem = {
      service: scopeVal.service.trim(),
      ...(rawHarga > 0 ? { harga: rawHarga } : {}),
      ...(scopeVal.deskripsi.trim() ? { deskripsi: scopeVal.deskripsi.trim() } : {}),
    };
    const nextScope = [...scopeList(project.scope), item];
    const totalP = scopeTotal(nextScope);
    const patch: Record<string, unknown> = { scope: nextScope };
    if (totalP > 0) patch.budget = totalP;
    try {
      await update("projects", pid, patch);
      log("menambah lingkup", `${pid} · ${item.service}`, "Proyek");
      toast(S.detToastScopeAdd);
      setScopeVal({ service: "", harga: "", deskripsi: "" });
      setShowScope(false);
    } catch {
      toast(S.detToastScopeFail, "info");
    }
  };

  const saveWbsTask = async () => {
    if (!wbsTaskUpdate) return;
    const hours = Number(wbsUpdateForm.hours) || 0;
    const prog = Math.max(0, Math.min(100, Number(wbsUpdateForm.progress)));
    if (wbsUpdateForm.progress === "" || Number.isNaN(prog)) { toast(S.detToastProgRange, "info"); return; }
    /* Perubahan progres WBS wajib disertai minimal satu foto bukti */
    const progBefore = Number(wbs.find((w) => w.task === wbsTaskUpdate)?.progress ?? 0);
    const hasPhoto = wbsUpdateForm.photos.length > 0 || Boolean(wbsUpdateForm.photoUrl);
    if (prog !== progBefore && !hasPhoto) { toast(S.detToastPhotoRequired, "info"); return; }
    // E2: hull tasks wajib isi station.
    if (/hull/i.test(wbsTaskUpdate) && !wbsUpdateForm.station) { toast(S.detToastStation, "info"); return; }
    const dftNum = wbsUpdateForm.dft === "" ? undefined : Number(wbsUpdateForm.dft);
    if (wbsUpdateForm.dft !== "" && (!Number.isFinite(dftNum!) || dftNum! < 0)) { toast(S.detToastDft, "info"); return; }
    const pred = wbsUpdateForm.predecessor || "";
    if (pred && pred !== wbsTaskUpdate && createsCycle(wbs, wbsTaskUpdate, pred)) { toast(S.detToastCycle, "info"); return; }
    const status = prog >= 100 ? "Selesai" : wbsUpdateForm.status === "Selesai" && prog < 100 ? "Sedang" : wbsUpdateForm.status;
    const appendedPhotos = wbsUpdateForm.photos.map((photo) => ({ url: photo.url, note: photo.caption.trim() || wbsUpdateForm.photoNote.trim(), date: todayISO() }));
    const currentTask = wbs.find((w) => w.task === wbsTaskUpdate);
    const prevProg = Number(currentTask?.progress ?? 0);
    const qtyNum = Math.max(1, Number(wbsUpdateForm.materialQty) || 1);

    const historyEntry: WbsHistoryItem = {
      id: `wbs-hist-${Date.now()}`,
      date: new Date().toISOString(),
      actor: sessionName || "User",
      action: `Update progres: ${prevProg}% → ${prog}%`,
      from: prevProg,
      to: prog,
      note: wbsUpdateForm.photoNote.trim() || undefined,
      photos: appendedPhotos.map((p) => p.url),
      material: wbsUpdateForm.material || undefined,
      qty: wbsUpdateForm.material ? qtyNum : undefined,
    };

    const updated = wbs.map((w) =>
      w.task === wbsTaskUpdate
        ? {
            ...w, actualHours: hours, materialUsed: wbsUpdateForm.material, materialQty: wbsUpdateForm.material ? qtyNum : undefined,
            status, progress: prog, predecessor: pred || undefined,
            ...(wbsUpdateForm.station ? { station: wbsUpdateForm.station } : { station: undefined }),
            ...(wbsUpdateForm.photoNote.trim() || appendedPhotos.length > 0
                ? { photos: [...(w.photos ?? []), ...appendedPhotos] }
                : {}),
              ...(wbsUpdateForm.photoNote.trim() ? { photoNote: wbsUpdateForm.photoNote.trim() } : { photoNote: undefined }),
              ...(appendedPhotos.length > 0 ? { photoUrl: appendedPhotos[appendedPhotos.length - 1]?.url } : {}),
            ...(dftNum !== undefined ? { dft: dftNum } : { dft: undefined }),
            history: [...(w.history ?? []), historyEntry],
          }
        : w
    );
    try {
      await saveWbsWithConflictRetry(updated);
      await update("projects", pid, { progress: calcProjectProgress(updated, projectBoq) });
      /* D3 & F3-D-01: material terpilih → alur permintaan material (server
         transaksional bila tersambung): stok cukup = barang keluar, kurang =
         keluar sebagian + PR, habis = PR. Stok tidak pernah minus. */
      if (wbsUpdateForm.material) {
        const invItem = invList.find((inv) => String(inv.name ?? "") === wbsUpdateForm.material);
        if (invItem) {
          const res = await requestMaterial({
            projectId: pid, itemId: String(invItem.id), qty: qtyNum, purpose: "wbs",
            wbsTask: wbsTaskUpdate, actor: sessionName || "WBS",
          });
          if (res.shortage > 0) {
            toast(S.detMaterialStockLess.replace("{stock}", String(res.issued)).replace("{diff}", String(res.shortage)), "info");
          }
        }
      }
      log("mengupdate progres WBS", `${wbsTaskUpdate} → ${prog}% (${status})`, "Proyek");
      toast(S.detToastWbsProg);
      setWbsTaskUpdate(null);
      setWbsUpdateForm({ hours: "", material: "", materialQty: "1", status: "Sedang", progress: "", predecessor: "", station: "", photoNote: "", photoUrl: "", photos: [], dft: "" });
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const saveAssign = async () => {
    if (!wbsAssignTask) return;
    const targetTask = wbs.find((w) => w.task === wbsAssignTask);
    if (!targetTask) return;

    let assignee: WbsAssignee | undefined;
    if (assignForm.type === "internal") {
      if (!assignForm.employeeId) {
        toast(S.detPickEmployee, "info");
        return;
      }
      const emp = (data.employees ?? []).find((e) => String(e.id) === assignForm.employeeId);
      assignee = {
        type: "internal",
        id: assignForm.employeeId,
        name: String(emp?.name ?? assignForm.employeeId),
      };
    } else {
      if (!assignForm.subconId) {
        toast(S.detAssignSubconLabel, "info");
        return;
      }
      const sub = (data.subcontractors ?? []).find((s) => String(s.id) === assignForm.subconId);
      const subName = String(sub?.name ?? assignForm.subconId);
      const existingWo = (data.workOrders ?? []).find(
        (w) => w.project === pid && String(w.sub ?? "") === subName && String(w.scope ?? "") === wbsAssignTask
      );
      let woId = existingWo ? String(existingWo.id) : "";
      if (!existingWo) {
        const createdWo = await add("workOrders", {
          sub: subName,
          project: pid,
          scope: wbsAssignTask,
          progress: 0,
          status: "Dalam Proses",
          date: todayISO(),
          targetDate: targetTask.end || todayISO(),
          ...(parseRupiah(assignForm.woValue) > 0 ? { value: parseRupiah(assignForm.woValue) } : {}),
          branch: project.branch || session?.branch || "Samarinda",
          wbsTask: wbsAssignTask,
        }, { action: "buat WO dari penugasan WBS", module: "Proyek" });
        woId = String(createdWo.id);
        toast(S.detAssignWoCreated.replace("{id}", woId));
      }
      assignee = {
        type: "external",
        id: assignForm.subconId,
        name: subName,
        woId,
      };
    }

    const updated = wbs.map((w) => (w.task === wbsAssignTask ? { ...w, assignee } : w));
    try {
      await saveWbsWithConflictRetry(updated);
      log("menugaskan tahap WBS", `${wbsAssignTask} → ${assignee.type}: ${assignee.name}`, "Proyek");
      /* Karyawan yang ditugaskan otomatis masuk Tim proyek: keanggotaan tim juga
         menentukan akses (mis. mekanik hanya bisa memperbarui proyek timnya). */
      if (assignee.type === "internal" && !teamIds.includes(assignee.id)) {
        try { await setTeam(pid, [...teamIds, assignee.id]); }
        catch { toast(S.detAssignTeamFail, "info"); }
      }
      toast(S.detAssignSuccess);
      setWbsAssignTask(null);
      setAssignForm({ type: "internal", employeeId: "", subconId: "", woValue: "" });
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const saveWbs = async () => {
    if (!wbsForm.task.trim()) { toast(S.detToastStageName, "info"); return; }
    if (wbs.some((w) => w.task === wbsForm.task.trim())) { toast(S.detToastStageDup, "info"); return; }
    const scopes = scopeList(project.scope);
    const cat = wbsForm.category.trim() || scopes[0]?.service || "Umum";
    const newTask: WbsExt = {
      task: wbsForm.task.trim(),
      category: cat,
      scopeRef: cat,
      start: wbsForm.start || "-",
      end: wbsForm.end || "-",
      progress: Number(wbsForm.progress) || 0,
      weight: 0,
    };
    const next = syncWbsWeightsWithScope([...(wbsFor(pid) as WbsExt[]), newTask], project.scope);
    try {
      await saveWbsWithConflictRetry(next);
      await update("projects", pid, { progress: calcProjectProgress(next, projectBoq) });
      log("menambah tahapan WBS", `${pid} · ${wbsForm.task.trim()}`, "Proyek");
      toast(S.detToastStageAdd);
      setShowWbs(false);
      setWbsForm({ task: "", category: "", start: "", end: "", progress: "0" });
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  return (
    <div>
      {/* F3-E-04: kembali ke halaman asal (state.from tersimpan di history,
          jadi tetap benar setelah refresh); tanpa state → daftar proyek. */}
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ocean-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      <PageHeader
        title={project.vessel}
        subtitle={`${project.id} · ${project.type} · ${project.client}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Prioritas sebelumnya write-once: hanya ditulis saat proyek dibuat,
                tidak bisa diubah di halaman mana pun padahal ditampilkan sebagai
                badge & bisa difilter. */}
            {canAutoWrite ? (
              <>
                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-steel-500">{S.prjFieldPrioritas}</span>
                  <select
                    className="input w-auto py-1.5 text-sm"
                    value={canonPrioritas(project.prioritas)}
                    onChange={(e) => {
                      const next = e.target.value;
                      void busy.run("savePrioritas", () => savePrioritas(next));
                    }}
                    disabled={busy.isBusy("savePrioritas")}
                    aria-label={S.prjFieldPrioritas}
                  >
                    {PRIORITAS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <select
                  className="input w-auto py-1.5 text-sm"
                  value={project.status}
                  onChange={(e) => askStatus(e.target.value)}
                  title={S.detStatusLateTitle}
                >
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            ) : (
              <span className="text-xs text-steel-600 font-medium">
                {S.prjFieldPrioritas}: <span className="font-semibold text-navy-900">{canonPrioritas(project.prioritas)}</span>
              </span>
            )}
            <StatusBadge status={project.status} />
            {project.statusOverride && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                title={`${locale === "en" ? "Manual override" : "Override manual"}: ${String(project.statusOverride.reason ?? "")} (${String(project.statusOverride.at ?? "")})`}>
                {locale === "en" ? "Override" : "Override"}
              </span>
            )}
          </div>
        }
      />

      {/* Stepper tahap kaku: posisi + geser via modal beralasan. */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Tahap proyek">
        {tahapListOf(project).map((t, i) => {
          const cur = tahapListOf(project).indexOf(tahapOf(project));
          const done = i < cur;
          const on = i === cur;
          const label = tahapLabel(t, locale);
          return (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${on ? "bg-navy-700 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-steel-100 text-steel-500"}`}>
                {i + 1}. {label}
              </span>
              {i < tahapListOf(project).length - 1 && <span aria-hidden className="text-steel-300">→</span>}
            </span>
          );
        })}
        {canAutoWrite ? (
          <span className="ml-1 flex items-center gap-1.5">
            <button className="btn-secondary px-2 py-1 text-xs" disabled={tahapListOf(project).indexOf(tahapOf(project)) <= 0} onClick={() => { setTahapMove({ dir: -1 }); setTahapReason(""); }}>{S.detTahapBack}</button>
            <button className="btn-secondary px-2 py-1 text-xs" disabled={tahapListOf(project).indexOf(tahapOf(project)) >= tahapListOf(project).length - 1} onClick={() => { setTahapMove({ dir: 1 }); setTahapReason(""); }}>{S.detTahapNext}</button>
            {(() => {
              const curIdx = tahapListOf(project).indexOf(tahapOf(project));
              const nextStage = curIdx < tahapListOf(project).length - 1 ? tahapListOf(project)[curIdx + 1] : null;
              const nxtBlockers = nextStage ? getStageTransitionBlockers(tahapOf(project), nextStage, project, data, locale) : [];
              if (nxtBlockers.length === 0) return null;
              return (
                <Badge tone="amber" title={nxtBlockers.map((b) => `${b.name}: ${b.statusReason}`).join("; ")}>
                  {S.detBlockerBadge.replace("{n}", String(nxtBlockers.length))}
                </Badge>
              );
            })()}
          </span>
        ) : (
          <span className="ml-2 text-xs text-steel-400 italic">
            ({S.detBlockerReadOnlyNotice})
          </span>
        )}
        <span className="ml-2 text-xs font-medium text-steel-500">
          Posisi tahap {tahapListOf(project).indexOf(tahapOf(project)) + 1}/{tahapListOf(project).length}: {tahapLabel(tahapOf(project), locale)} · Status {project.status}
        </span>
        {project.quotationId && !hasContract(project, data.contracts ?? []) ? (
          <Badge tone="amber">Belum ada kontrak</Badge>
        ) : null}
        {contractOf && (Number(contractOf.value) || 0) !== (Number(project.budget) || 0) ? (
          <Badge tone="red">Kontrak ≠ budget</Badge>
        ) : null}
      </div>

      {/* #83: beri jarak antara deret tahap dan kartu status. */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={S.colBudget} value={fmtMiliar(project.budget)} hint={S.detKpiBudgetHint} icon={<Calendar className="h-5 w-5" />} />
        <KpiCard label={S.colActual} value={fmtMiliar(project.actual)} delta={S.detKpiUsed.replace("{a}", String(project.budget ? Math.round((project.actual / project.budget) * 100) : 0))} deltaDirection={project.actual > project.budget ? "down" : "flat"} hint={S.detKpiActualHint} />
        <Card className="card-hover relative overflow-hidden p-4">
          <p className="text-xs font-medium text-steel-500">{S.progLabel}</p>
          <p className="mt-1 text-[26px] font-bold tracking-tight text-navy-900">{project.progress}%</p>
          {progressDelayDetails ? (
            <>
              <div className="mt-1"><StatusBadge status={project.status} /></div>
              <div
                role="note"
                className={`mt-2 space-y-1.5 rounded-xl border p-2.5 ${project.status === "Terlambat" ? "border-rose-100 bg-rose-50" : "border-amber-100 bg-amber-50"}`}
              >
                <p className={`text-[11px] font-semibold ${project.status === "Terlambat" ? "text-rose-700" : "text-amber-700"}`}>
                  {project.status === "Tertunda" && progressDelayDetails.causeDaysLate !== null
                    ? S.detDelayWbsDays.replace("{n}", String(progressDelayDetails.causeDaysLate))
                    : progressDelayDetails.daysLate !== null
                    ? S.detDelayDays.replace("{n}", String(progressDelayDetails.daysLate))
                    : progressDelayDetails.projectDaysRemaining === null
                      ? S.detDelayDaysUnknown
                      : S.detDelayDaysNone}
                </p>
                <p className="text-[11px] text-steel-600">
                  {S.detDelayCause.replace("{a}", progressDelayDetails.cause ?? S.detDelayCauseUnknown)}
                </p>
                {progressDelayDetails.causeTargetDate && (
                  <p className="text-[11px] text-steel-600">
                    {S.detDelayCauseTarget.replace("{a}", fmtTanggal(progressDelayDetails.causeTargetDate))}
                  </p>
                )}
                {progressDelayDetails.targetDate && (
                  <p className="text-[11px] text-steel-600">
                    {S.detDelayTarget.replace("{a}", fmtTanggal(progressDelayDetails.targetDate))}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-1"><Badge tone="green">{S.detKpiOnTrack}</Badge></div>
              <p className="mt-1 text-[11px] text-steel-400">{S.detKpiAvgHint}</p>
            </>
          )}
        </Card>
        <KpiCard label={S.detKpiPeriod} value={fmtRentang(project.start, project.end)} hint={project.branch} icon={<MapPin className="h-5 w-5" />} />
      </div>

      <div className="mt-5 card">
        <Tabs tabs={["Ringkasan", "BoQ", "WBS & Anggaran", "Dokumen & Laporan", "Perubahan & Risiko", "Subkon", "Terkait", ...(getSetting(data, "SHOW_3D_PROJECT", 0) === 1 ? ["3D Viewer"] : []), "Service", "Sparepart", "Tim"]} active={tab} onChange={setTab} labels={{ Ringkasan: S.tabRingkasan, "WBS & Anggaran": S.tabWbs, BoQ: S.tabBoq, "Dokumen & Laporan": S.tabDocs, Equipment: S.detEqTab, "Perubahan & Risiko": S.tabChange, Subkon: S.tabSubkon, Terkait: S.tabRelated, "3D Viewer": S.tabViewer, Service: S.tabService, Sparepart: S.tabSparepart, Tim: S.tabTeam }} />
        <div className="p-5">
          {tab === "Ringkasan" && (
            <div className="space-y-6">
              {/* Banner Panduan Step-by-Step Awal Proyek */}
              {(wbs.length === 0 || teamIds.length <= 1) && (
                <div className="rounded-2xl border border-ocean-200 bg-ocean-50/60 p-4 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-ocean-700" />
                    <h4 className="text-sm font-semibold text-navy-900">{S.prjGuideTitle}</h4>
                  </div>
                  <p className="mt-1 text-xs text-steel-600">{S.prjGuideSub}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    <button type="button" onClick={() => setTab("Tim")} className="rounded-xl border border-steel-200 bg-white p-3 text-left transition hover:border-ocean-400 hover:shadow-xs">
                      <span className="text-[11px] font-bold text-ocean-700">{S.prjGuideStep1}</span>
                      <p className="mt-1 text-xs text-steel-600 line-clamp-2">{S.prjGuideStep1Desc}</p>
                    </button>
                    <button type="button" onClick={() => setTab("BoQ")} className="rounded-xl border border-steel-200 bg-white p-3 text-left transition hover:border-ocean-400 hover:shadow-xs">
                      <span className="text-[11px] font-bold text-ocean-700">{S.prjGuideStep2}</span>
                      <p className="mt-1 text-xs text-steel-600 line-clamp-2">{S.prjGuideStep2Desc}</p>
                    </button>
                    <button type="button" onClick={() => setTab("WBS & Anggaran")} className="rounded-xl border border-steel-200 bg-white p-3 text-left transition hover:border-ocean-400 hover:shadow-xs">
                      <span className="text-[11px] font-bold text-ocean-700">{S.prjGuideStep3}</span>
                      <p className="mt-1 text-xs text-steel-600 line-clamp-2">{S.prjGuideStep3Desc}</p>
                    </button>
                    <button type="button" onClick={() => setTab("Dokumen & Laporan")} className="rounded-xl border border-steel-200 bg-white p-3 text-left transition hover:border-ocean-400 hover:shadow-xs">
                      <span className="text-[11px] font-bold text-ocean-700">{S.prjGuideStep4}</span>
                      <p className="mt-1 text-xs text-steel-600 line-clamp-2">{S.prjGuideStep4Desc}</p>
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">{S.detScopeTitle}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn-secondary text-xs" onClick={downloadScopeTemplate}><FileDown className="h-3.5 w-3.5" /> {S.detScopeTemplate}</button>
                    {canAutoWrite && (
                      <>
                        <label className="btn-secondary cursor-pointer text-xs">
                          <Upload className="h-3.5 w-3.5" /> {S.detScopeImport}
                          <input type="file" accept=".xlsx,.csv" className="hidden" aria-label={S.detScopeImport}
                            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importScope(f); }} />
                        </label>
                        <button className="btn-secondary text-xs" onClick={() => setShowScope(true)}><Plus className="h-3.5 w-3.5" /> {S.addBtn}</button>
                      </>
                    )}
                  </div>
                </div>
                <ul className="space-y-2">
                  {scopeList(project.scope).map((s, i) => (
                    <li key={`${s.service}-${i}`} className="group flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-700">{i + 1}</span>
                      <span className="flex-1 text-sm text-steel-700">
                        <span className="font-medium text-navy-900">{s.service}</span>
                        {s.harga ? <span className="font-medium text-emerald-700"> · {fmtRupiah(s.harga)}</span> : (s.lokasi ? <span className="text-steel-500"> · {s.lokasi}</span> : null)}
                        {s.deskripsi ? <span className="block text-xs text-steel-500">{s.deskripsi}</span> : null}
                      </span>
                      {canAutoWrite && (
                        <button className="hidden rounded p-1 text-rose-400 hover:bg-rose-50 group-hover:block" onClick={() => setDelScope(i)} title={S.detScopeDelTitle}><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </li>
                  ))}
                  {scopeList(project.scope).length === 0 && <p className="text-sm text-steel-400">{S.detScopeEmpty}</p>}
                </ul>

                {/* Ringkasan & Breakdown Subclass Perencanaan / Class Approval */}
                {(() => {
                  const projectDocs = data.documents.filter((d) => d.project === pid);
                  const rawCustom = Array.isArray(project.customRequirements)
                    ? (project.customRequirements as Array<{ id: string; name: string; type?: string; notes?: string }>)
                    : null;
                  const effectiveList = (rawCustom && rawCustom.length > 0)
                    ? rawCustom.map((c) => ({
                        id: c.id,
                        name: c.name,
                        nameEn: c.name,
                        type: c.type || "Drawing",
                        kw: new RegExp(c.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i"),
                        isCustom: true,
                        notes: c.notes,
                      }))
                    : [];

                  const isItemDone = (item: (typeof effectiveList)[number]) => {
                    if (classApproved && item.id === "SAFETY") return true;
                    const docMatched = projectDocs.some((d) => item.kw.test(String(d.title ?? "")) && d.status === "Disetujui");
                    if (docMatched) return true;
                    const wbsMatched = wbs.some((w) => item.kw.test(String(w.task ?? "")) && Number(w.progress ?? 0) >= 100);
                    if (wbsMatched) return true;
                    const stageMatched = designStages.some((s) => item.kw.test(String(s.name ?? "")) && s.status === "Disetujui");
                    return stageMatched;
                  };

                  const doneItems = effectiveList.filter(isItemDone);
                  const pendingItems = effectiveList.filter((item) => !isItemDone(item));
                  const progressPct = effectiveList.length > 0 ? Math.round((doneItems.length / effectiveList.length) * 100) : 0;
                  const classBlockers = getStageTransitionBlockers("Desain", "Produksi", project, data, locale);

                  const deleteReq = async (reqId: string) => {
                    const current = (rawCustom && rawCustom.length > 0) ? rawCustom : [];
                    const next = current.filter((r) => r.id !== reqId);
                    try {
                      await update("projects", pid, { customRequirements: next });
                      toast(S.detReqDocDeleted, "info");
                    } catch (e) {
                      toast(e instanceof Error ? e.message : S.saveFail, "info");
                    }
                  };

                  return (
                    <div className="mt-6 rounded-2xl border border-steel-200 bg-surface/50 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-steel-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-navy-900">{S.detDesignTitle}</h3>
                            {classApproved
                              ? <Badge tone="green">{S.detClassOk}</Badge>
                              : <Badge tone="amber">{S.detClassPending.replace("{a}", "Belum")}</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-steel-500">
                            {effectiveList.length === 0
                              ? (locale === "en" ? "No requirements defined yet" : "Belum ada persyaratan dokumen ditentukan")
                              : `${doneItems.length}/${effectiveList.length} ${locale === "en" ? "requirements completed" : "persyaratan selesai"} (${progressPct}%)`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => setShowAddReq(true)}
                          >
                            <Plus className="h-3.5 w-3.5" /> {S.detReqDocAddBtn}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => setShowClassDetails(!showClassDetails)}
                          >
                            {showClassDetails ? (locale === "en" ? "Hide Details" : "Tutup Rincian") : (locale === "en" ? "View Requirements" : "Lihat Persyaratan")}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <ProgressBar value={progressPct} tone={progressPct >= 100 ? "green" : "navy"} />
                      </div>

                      {showClassDetails && (
                        effectiveList.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-steel-300 p-4 text-center">
                            <p className="text-xs text-steel-500">
                              {locale === "en"
                                ? "No requirements defined yet for this project. Click '+ Add Requirement' above to add documents."
                                : "Belum ada persyaratan dokumen untuk proyek ini. Klik '+ Tambah Persyaratan' di atas untuk menambahkan dokumen."}
                            </p>
                          </div>
                        ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 pt-2 border-t border-steel-100 md:grid-cols-2">
                          {/* Item Selesai */}
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 text-xs font-semibold text-emerald-800">
                              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{locale === "en" ? "Completed Items" : "Item Selesai"}</span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{doneItems.length}</span>
                            </div>
                            <ul className="mt-2 space-y-1.5 text-xs text-steel-700">
                              {doneItems.length === 0 ? (
                                <li className="italic text-steel-400 py-1">{locale === "en" ? "No completed items yet" : "Belum ada item selesai"}</li>
                              ) : (
                                doneItems.map((it) => (
                                  <li key={it.id} className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-start gap-1.5 min-w-0">
                                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className="font-medium text-navy-900 truncate">{locale === "en" ? it.nameEn : it.name}</span>
                                    </div>

                                  </li>
                                ))
                              )}
                            </ul>
                          </div>

                          {/* Item Belum Selesai (Pending) dengan Status & Tombol Buka Bagian */}
                          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 text-xs font-semibold text-amber-800">
                              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-amber-600" />{locale === "en" ? "Pending Items" : "Belum Selesai (Pending)"}</span>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{pendingItems.length}</span>
                            </div>
                            <ul className="mt-2 space-y-2 text-xs text-steel-700">
                              {pendingItems.length === 0 ? (
                                <li className="flex items-center gap-1.5 italic text-emerald-600 py-1"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />{locale === "en" ? "All items completed!" : "Semua item telah rampung!"}</li>
                              ) : (
                                pendingItems.map((it) => {
                                  const blk = classBlockers.find((b) => b.id === `SUBCLASS_${it.id}`);
                                  const pendingDoc = projectDocs.find((d) => it.kw.test(String(d.title ?? "")));
                                  return (
                                    <li key={it.id} className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-amber-100 bg-white/80 p-2 shadow-2xs">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-amber-500 font-bold shrink-0">•</span>
                                          <span className="font-medium text-navy-900">{locale === "en" ? it.nameEn : it.name}</span>
                                        </div>
                                        {blk ? (
                                          <p className="mt-0.5 ml-3 text-[11px] text-steel-500">{blk.statusReason}</p>
                                        ) : (
                                          <p className="mt-0.5 ml-3 text-[11px] text-steel-500">{it.notes || (locale === "en" ? "Document required" : "Dokumen wajib dilengkapi")}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {it.isCustom && (
                                          <button
                                            type="button"
                                            className="rounded p-1 text-steel-400 hover:bg-rose-50 hover:text-rose-600"
                                            onClick={() => void deleteReq(it.id)}
                                            title={locale === "en" ? "Delete requirement" : "Hapus persyaratan"}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className="btn-secondary text-[11px] py-1 px-2 shrink-0 font-medium"
                                          onClick={() => {
                                            if (pendingDoc || blk?.targetDocId) {
                                              const docTarget = pendingDoc || data.documents.find((d) => d.id === blk?.targetDocId);
                                              setTab("Dokumen & Laporan");
                                              if (docTarget) setDocDetail(docTarget);
                                            } else if (blk?.tab === "WBS") {
                                              setTab("WBS & Anggaran");
                                            } else {
                                              // Direct button: langsung buka form tambah dokumen dengan nama & tipe terisi!
                                              setDocTitle(locale === "en" ? it.nameEn : it.name);
                                              setDocType(it.type || "Drawing");
                                              setDocFile("");
                                              setShowDoc(true);
                                            }
                                          }}
                                        >
                                          {pendingDoc || blk?.targetDocId ? S.detReqDirectOpen : blk?.tab === "WBS" ? S.detReqDirectWbs : S.detReqDirectUpload} →
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })
                              )}
                            </ul>
                          </div>
                        </div>
                        )
                      )}
                    </div>
                  );
                })()}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy-900">{S.detLogTitle}</h3>
                    {classApproved
                      ? <Badge tone="green">{S.detClassOk}</Badge>
                      : <Badge tone="amber">{S.detClassPending.replace("{a}", "Belum")}</Badge>}
                  </div>
                  <p className="mb-2 text-xs text-steel-500">{S.detLogSubtitle}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface sticky top-0 z-10">
                        <tr>
                          <th className="th">{S.detLogNo}</th>
                          <th className="th">{S.detLogDate}</th>
                          <th className="th">{S.detLogType}</th>
                          <th className="th">{S.detLogRef}</th>
                          <th className="th text-right">{S.detLogValue}</th>
                          <th className="th">{S.detLogStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-steel-100">
                        {logRows.length === 0 && (
                          <tr><td colSpan={6} className="td text-center text-steel-400">{S.detLogEmpty}</td></tr>
                        )}
                        {logRows.map((row, idx) => (
                          <tr key={`${row.kind}-${row.id}-${idx}`} className="hover:bg-surface">
                            <td className="td font-mono text-xs text-steel-500">{idx + 1}</td>
                            <td className="td text-xs text-steel-600">{fmtTanggal(row.date)}</td>
                            <td className="td text-xs">
                              <Badge tone={row.kind === "Penawaran" ? "navy" : row.kind === "Kontrak" ? "teal" : "amber"}>{row.kind}</Badge>
                            </td>
                            <td className="td font-mono text-xs font-semibold text-navy-900">{row.ref}</td>
                            <td className="td text-right text-xs font-semibold">{row.value > 0 ? fmtRupiah(row.value) : "-"}</td>
                            <td className="td"><StatusBadge status={row.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy-900">{S.detOverallTitle}</h3>
                    <span className="text-xs text-steel-500">{S.detKpiAvgHint}</span>
                  </div>
                   <ProgressBar value={project.progress} tone={project.status === "Terlambat" ? "red" : "navy"} />
                    <p className="mt-1 text-xs text-steel-500">{S.detOverallDone.replace("{a}", String(project.progress)).replace("{b}", fmtTanggal(project.end))}</p>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy-900">{S.detMileTitle.replace("{n}", String(MILE_VIEW_DAYS))}</h3>
                    <Link to="/proyek/monitoring" className="text-xs font-medium text-ocean-600 hover:underline">{S.detMonitoringLink}</Link>
                  </div>
                  {milestonesNear.length === 0 ? (
                    <p className="text-xs text-steel-400">{S.detMileEmpty.replace("{n}", String(MILE_VIEW_DAYS))}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {milestonesNear.map((w) => (
                        <div key={w.task} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm">
                          <span className="font-medium text-navy-900"><span className="mr-2 font-mono text-xs text-steel-500">{fmtBulan(w.end)}</span>{w.task}</span>
                          <span className="text-xs text-steel-500">{S.detMileRow.replace("{a}", String(w.progress)).replace("{b}", fmtBulan(w.end))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {vessel && (
                  <div className="mt-6 rounded-xl border border-steel-100 bg-surface p-3 text-sm">
                    <span className="text-steel-500">{S.detVesselLink}</span>
                    <Link to={`/kapal/${vessel.id}`} className="font-semibold text-ocean-600 hover:underline">{vessel.name} ({vessel.imo})</Link>
                  </div>
                )}
              </div>
              <Card className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-navy-900">{S.detInfoTitle}</h3>
                <dl className="dl-div text-sm">
                  <div className="flex justify-between"><dt className="text-steel-500">{S.detManager}</dt><dd className="font-medium">{project.manager}</dd></div>
                  <div className="flex justify-between"><dt className="text-steel-500">{S.branchLabel}</dt><dd className="font-medium">{project.branch}</dd></div>
                   <div className="flex justify-between"><dt className="text-steel-500">{S.detStart}</dt><dd className="font-medium">{fmtTanggal(project.start)}</dd></div>
                   <div className="flex justify-between"><dt className="text-steel-500">{S.detEnd}</dt><dd className="font-medium">{fmtTanggal(project.end)}</dd></div>
                  <div className="flex justify-between"><dt className="text-steel-500">{S.statusLabel}</dt><dd><StatusBadge status={project.status} /></dd></div>
                  <div className="flex justify-between"><dt className="text-steel-500">{S.detInvoices}</dt><dd className="font-medium">{S.detDocCount.replace("{n}", String(invoices.length))}</dd></div>
                  <div className="flex justify-between"><dt className="text-steel-500">{S.detNcrOpen}</dt><dd className="font-medium">{ncrs.filter((n) => n.status !== "Tertutup").length}</dd></div>
                </dl>
              </Card>
            </div>
            </div>
          )}

          {tab === "WBS & Anggaran" && (
            <div>
              <DockPlanCard
                project={project}
                drydocks={data.drydocks ?? []}
                canEdit={canAutoWrite}
                onSave={async (patch) => {
                  await update("projects", pid, patch);
                  log("mengubah rencana docking", `${pid} · dock ${patch.plannedDockId || "-"} · ${patch.start || "-"} s.d. ${patch.end || "-"}`, "Proyek");
                }}
              />
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-navy-900">{S.detWbsTitle}</h3>
                {wbs.length > 0 && (
                  <button
                    type="button"
                    className={`btn-secondary text-xs flex items-center gap-1.5 ${showWorktree ? "bg-navy-50 text-navy-800 border-navy-300 font-semibold" : ""}`}
                    onClick={() => setShowWorktree(!showWorktree)}
                    title={showWorktree ? S.detHideWorktree : S.detShowWorktree}
                  >
                    <GitBranch className="h-3.5 w-3.5 text-navy-600" />
                    {showWorktree ? S.detHideWorktree : S.detShowWorktree}
                  </button>
                )}
              </div>
              {/* Alur bercabang: fase → pekerjaan → foto & riwayat. Ditampilkan jika toggle showWorktree aktif. */}
              {showWorktree && wbs.length > 0 && (
                <div className="mb-4 rounded-xl border border-steel-200 bg-surface/40 p-3">
                  <WbsTree wbs={wbs} />
                </div>
              )}
{/* Search WBS. Tabel lain di tab ini TIDAK diberi search dan itu disengaja:
              tabel baseline dibatasi jumlah tahap, tabel booking/maintenance
              sudah punya tombol Detail, dan matriks risiko 5x5 bukan daftar -
              memberi kotak search di sana cuma menambah noise tanpa pernah
              dipakai. Yang bisa tumbuh panjang tanpa batas adalah WBS. */}
              <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                <SearchBox value={wbsQ} onChange={setWbsQ} placeholder={locale === "en" ? "Search WBS..." : "Cari WBS..."} ariaLabel={locale === "en" ? "Search WBS" : "Cari WBS"} className="w-full max-w-xs" />
                {canAutoWrite && (
                  <button className="btn-secondary text-xs" onClick={() => { setWbsForm({ task: "", category: scopeList(project.scope)[0]?.service ?? "", start: "", end: "", progress: "0" }); setShowWbs(true); }}><Plus className="h-3.5 w-3.5" /> {S.detAddStage}</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface sticky top-0 z-10">
                    <tr>
                      <SortTh label={S.colStageName} sortKey="task" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                      <SortTh label={S.detStart} sortKey="start" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                      <SortTh label={S.detEnd} sortKey="end" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                      <SortTh label={S.colWeight} sortKey="weight" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                      <SortTh label={S.progLabel} sortKey="progress" sort={sort} onSort={(k) => setSort((s) => toggleSort(s, k))} />
                      <th className="th">{S.detAssignCol}</th>
                      <th className="th">{S.actionTh}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100">
                    {wbs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-steel-400">
                          {S.detNoWbs}
                        </td>
                      </tr>
                    ) : (
                      groupWbsByScope(wbs, project.scope).map((group) => {
                        const matchingTasks = group.tasks.filter((w) =>
                          rowMatches(w as unknown as Record<string, unknown>, wbsQ, ["task", "station", "dft", "predecessor"])
                        );
                        if (wbsQ && matchingTasks.length === 0) return null;
                        const sortedTasks = sortRows(matchingTasks, sort, (w: WbsExt, k) =>
                          k === "weight" ? Number(w.weight) : k === "progress" ? Number(w.progress) : String((w as unknown as Record<string, unknown>)[k] ?? "")
                        );
                        return (
                          <Fragment key={`scope-group-${group.category}`}>
                            {/* Kategori Header Row */}
                            <tr className="bg-steel-50/90 border-y border-steel-200">
                              <td colSpan={3} className="td font-semibold text-navy-900 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-5 items-center rounded bg-navy-100 px-2 text-[11px] font-bold text-navy-800">
                                    {S.prjScopeCat || (locale === "en" ? "Scope" : "Ruang Lingkup")}
                                  </span>
                                  <span className="font-bold text-navy-900">{group.category}</span>
                                  {group.cost > 0 && (
                                    <span className="text-xs font-semibold text-emerald-700">
                                      ({fmtRupiah(group.cost)})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="td font-bold text-navy-900 py-2.5">
                                {group.weight}%
                              </td>
                              <td className="td py-2.5">
                                <div className="flex items-center gap-2">
                                  <ProgressBar value={group.avgProgress} className="w-24" tone={group.avgProgress >= 100 ? "green" : "navy"} />
                                  <span className="text-xs font-semibold text-steel-700">{group.avgProgress}%</span>
                                </div>
                              </td>
                              <td className="td py-2.5" />
                              <td className="td py-2.5 text-right">
                                {canAutoWrite && (
                                  <button
                                    type="button"
                                    className="btn-secondary text-[11px] py-1 px-2 inline-flex items-center gap-1"
                                    onClick={() => {
                                      setWbsForm({ task: "", category: group.category, start: "", end: "", progress: "0" });
                                      setShowWbs(true);
                                    }}
                                    title={`${S.detAddStage} - ${group.category}`}
                                  >
                                    <Plus className="h-3 w-3" /> {S.detAddStage}
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Sub-kategori: Tahapan WBS di dalam kategori ini */}
                            {sortedTasks.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-2.5 pl-8 text-xs italic text-steel-400">
                                  {locale === "en" ? "No stages in this category yet." : "Belum ada tahapan dalam kategori ini."}
                                </td>
                              </tr>
                            ) : (
                              sortedTasks.map((w) => (
                                <tr key={w.task} className="hover:bg-steel-50/50">
                                  <td className="td font-medium text-navy-900 pl-8">
                                    <span className="mr-2 text-steel-400">↳</span>
                                    {w.task}
                                    {w.station ? <span className="ml-2 rounded bg-navy-50 px-1.5 py-0.5 text-[11px] font-semibold text-navy-700">{w.station}</span> : null}
                                    {w.dft !== undefined && w.dft !== null && String(w.dft) !== "" ? <span className="ml-1 text-[11px] text-steel-400">DFT {w.dft}</span> : null}
                                    {w.photos && w.photos.length > 0 && <span className="ml-1 inline-flex items-center gap-1 rounded bg-ocean-50 px-1.5 py-0.5 text-[11px] font-semibold text-ocean-700"><Camera className="h-3 w-3" />{w.photos.length}</span>}
                                  </td>
                                  <td className="td font-mono text-xs text-steel-500">{fmtBulan(w.start)}</td>
                                  <td className="td font-mono text-xs text-steel-500">{fmtBulan(w.end)}</td>
                                  <td className="td font-medium text-steel-700">{w.weight}%</td>
                                  <td className="td">
                                    <div className="flex items-center gap-3">
                                      <ProgressBar value={w.progress} className="w-28" tone={w.progress >= 100 ? "green" : "navy"} />
                                      <span className="text-xs font-medium">{w.progress}%</span>
                                    </div>
                                  </td>
                                  <td className="td">
                                    {w.assignee ? (
                                      w.assignee.type === "internal" ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-ocean-50 px-2 py-0.5 text-xs font-medium text-ocean-700" title={w.assignee.name}>
                                          <span className="font-semibold">{S.detAssignInternalBadge}:</span> {w.assignee.name}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700" title={`${w.assignee.name} (${w.assignee.woId ?? ""})`}>
                                          <span className="font-semibold">{S.detAssignExternalBadge}:</span> {w.assignee.name} {w.assignee.woId ? `(${w.assignee.woId})` : ""}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-xs text-steel-400">-</span>
                                    )}
                                  </td>
                                  <td className="td">
                                    <div className="flex items-center gap-1">
                                      <RowAction
                                        icon={Boxes}
                                        tone="neutral"
                                        label={`${S.wbsMatBtn} ${w.task} (${stageMaterialCount(data.bomItems ?? [], pid, w.task)})`}
                                        onClick={() => setWbsMatTask(w.task)}
                                      />
                                      {canAutoWrite && (
                                        <RowAction
                                          icon={UserPlus}
                                          tone="neutral"
                                          label={`${S.detAssignBtn} ${w.task}`}
                                          onClick={() => {
                                            setWbsAssignTask(w.task);
                                            setAssignForm({
                                              type: w.assignee?.type ?? "internal",
                                              employeeId: w.assignee?.type === "internal" ? w.assignee.id : "",
                                              subconId: w.assignee?.type === "external" ? w.assignee.id : "",
                                              woValue: "",
                                            });
                                          }}
                                        />
                                      )}
                                      <RowAction
                                        icon={History}
                                        tone="neutral"
                                        label={`${S.detWbsHistoryBtn} ${w.task}`}
                                        onClick={() => setWbsHistoryTask(w.task)}
                                      />
                                      {canAutoWrite && (
                                        <>
                                          <RowAction
                                            icon={Pencil}
                                            tone="neutral"
                                            label={`${S.detUpdateBtn} ${w.task}`}
                                            onClick={() => { setWbsTaskUpdate(w.task); setWbsUpdateForm({ hours: String(w.actualHours ?? ""), material: w.materialUsed ?? "", materialQty: String(w.materialQty ?? "1"), status: w.status === "Selesai" ? "Selesai" : "Sedang", progress: String(w.progress ?? 0), predecessor: w.predecessor ?? "", station: w.station ?? "", photoNote: w.photoNote ?? "", photoUrl: String(w.photoUrl ?? ""), photos: [], dft: w.dft === undefined || w.dft === null ? "" : String(w.dft) }); }}
                                          />
                                          <RowAction
                                            icon={Trash2}
                                            tone="danger"
                                            label={`${S.detDelStageTitle} ${w.task}`}
                                            onClick={() => {
                                              const terpakai = Number(w.progress) > 0 || (w.history?.length ?? 0) > 0 || (w.photos?.length ?? 0) > 0 || Boolean(w.photoUrl) || Boolean(w.assignee);
                                              if (terpakai) { toast(S.detDelStageBlocked.replace("{a}", w.task), "info"); return; }
                                              setStageToDelete(w.task);
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {ganttRange && wbs.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-navy-900">{S.detGantt}</h4>
                    <span className="text-[11px] text-steel-500">{fmtBulan(`${ganttRange.min.y}-${String(ganttRange.min.m).padStart(2, "0")}`)} → {fmtBulan(`${ganttRange.max.y}-${String(ganttRange.max.m).padStart(2, "0")}`)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {wbs.map((w) => {
                      const bar = ganttBar(w.start, w.end);
                      if (!bar) return null;
                      return (
                        <div key={`gantt-${w.task}`} className="flex items-center gap-2">
                          <span className="w-40 truncate text-[11px] text-steel-600">{w.task}</span>
                          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-steel-100">
                            <div className="absolute top-0 h-full rounded-full bg-ocean-300" style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
                            <div className="absolute top-0 h-full rounded-full bg-navy-700" style={{ left: `${bar.left}%`, width: `${(bar.width * Math.max(0, Math.min(100, Number(w.progress) || 0))) / 100}%` }} />
                            {ganttToday !== null && <div className="absolute top-0 h-full w-px bg-rose-500" style={{ left: `${ganttToday}%` }} />}
                          </div>
                          <span className="w-9 text-right text-[11px] font-medium text-steel-600">{w.progress}%</span>
                        </div>
                      );
                    })}
                    {/* Sumbu bulan (PRJ-18); rentang panjang hanya menampilkan sebagian label. */}
                    <div className="flex items-center gap-2">
                      <span className="w-40" />
                      <div className="flex flex-1">
                        {Array.from({ length: ganttRange.total }, (_, i) => {
                          const ym = ganttRange.min.y * 12 + ganttRange.min.m - 1 + i;
                          const step = Math.ceil(ganttRange.total / 12);
                          return (
                            <span key={i} className="flex-1 truncate border-l border-steel-200 pl-0.5 text-[10px] text-steel-400">
                              {i % step === 0 ? new Date(Date.UTC(Math.floor(ym / 12), ym % 12, 1)).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { month: "short", timeZone: "UTC" }) : ""}
                            </span>
                          );
                        })}
                      </div>
                      <span className="w-9" />
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 rounded-xl border border-steel-100 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-navy-900">
                    {S.detBaseline}{baseline ? S.detBaselineSnap.replace("{a}", fmtTanggal(baseline.at)) : S.detBaselineNone}
                  </h4>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs" onClick={snapshotBaseline}>{S.detSnapBtn}</button>
                    {baseline && <button className="btn-secondary text-xs" onClick={() => setShowDelBaseline(true)}>{S.detDelBaselineBtn}</button>}
                  </div>
                </div>
                {!baseline ? (
                  <p className="text-xs text-steel-400">{S.detBaselineEmpty}</p>
                ) : (
                  <>
                    <div className="mb-2 flex justify-end">
                      <SearchBox value={baselineQ} onChange={setBaselineQ} className="max-w-xs" placeholder={locale === "en" ? "Search baseline..." : "Cari baseline..."} ariaLabel={locale === "en" ? "Search baseline WBS" : "Cari baseline WBS"} />
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface">
                        <tr><SortTh label={S.colStageName} sortKey="task" sort={sort2} onSort={(k) => setSort2((s) => toggleSort(s, k))} /><SortTh label={S.detPlanBase} sortKey="planned" sort={sort2} onSort={(k) => setSort2((s) => toggleSort(s, k))} /><SortTh label={S.detActualCol} sortKey="actual" sort={sort2} onSort={(k) => setSort2((s) => toggleSort(s, k))} /><SortTh label={S.detDevCol} sortKey="dev" sort={sort2} onSort={(k) => setSort2((s) => toggleSort(s, k))} /></tr>
                      </thead>
                      <tbody className="divide-y divide-steel-100">
                        {sortRows(wbs.filter((w) => rowMatches(w as unknown as Record<string, unknown>, baselineQ, ["task", "station", "pic", "start", "end", "status", "progress", "catatan"])), sort2, (w: WbsExt, k) => { const base = baseline?.wbs.find((b) => b.task === w.task); const planned = base ? Number(base.progress) || 0 : 0; const actual = Number(w.progress) || 0; if (k === "planned") return planned; if (k === "actual") return actual; if (k === "dev") return actual - planned; return String(w.task); }).map((w) => {
                          const base = baseline.wbs.find((b) => b.task === w.task);
                          const planned = base ? Number(base.progress) || 0 : 0;
                          const actual = Number(w.progress) || 0;
                          const dev = actual - planned;
                          return (
                            <tr key={`base-${w.task}`}>
                              <td className="td font-medium text-navy-900">{w.task}</td>
                              <td className="td text-xs text-steel-500">{base ? S.detBaseRow.replace("{a}", String(planned)).replace("{b}", fmtTanggal(baseline.at)) : S.detNewOutside}</td>
                              <td className="td text-xs font-medium">{actual}%</td>
                              <td className={`td text-xs font-semibold ${dev < 0 ? "text-rose-600" : dev > 0 ? "text-emerald-600" : "text-steel-500"}`}>
                                {dev > 0 ? `+${dev}%` : `${dev}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "WBS & Anggaran" && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detBudgetTitle}</h3>
              <FeeProjectCard
                project={project}
                canEdit={canAutoWrite}
                onSaveFees={async (fees, note) => {
                  await update("projects", pid, { fees });
                  log("fee proyek", `${pid} · ${note}`, "Proyek");
                }}
                onTagih={async (fee, amount) => {
                  const created = await add("payables", {
                    v: fee.penerima, kodePembantu: fee.penerima, po: `FEE ${pid} / ${fee.id}`, projectId: pid,
                    openAwal: 0, amt: amount, due: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                    pph: "-", st: "Belum Dibayar", vessel: String(project.vessel ?? ""), item: `Fee proyek ${pid} - ${fee.penerima}`,
                    pay1: 0, pay2: 0, sumber: "Fee proyek",
                  }, { action: "hutang fee proyek", target: pid, module: "Proyek" });
                  return String(created.id);
                }}
              />
              {subkonByWo.length > 0 && (
                <Card className="mb-4 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-navy-900">{S.subBudgetTitle}</h4>
                    <p className="text-xs text-steel-500">{S.subBudgetSummary.replace("{a}", fmtRupiah(subkonCommitted)).replace("{b}", fmtRupiah(subkonPaid))}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface"><tr>
                        <th className="th">{S.eqStageCol}</th><th className="th">WO</th><th className="th">{S.subBudgetColSub}</th>
                        <th className="th text-right">{S.subBudgetColValue}</th><th className="th text-right">{S.subBudgetColPaid}</th>
                      </tr></thead>
                      <tbody className="divide-y divide-steel-100">
                        {subkonByWo.map(({ wo, task, value, paid }) => (
                          <tr key={String(wo.id)}>
                            <td className="td text-xs">{wbs.some((w) => w.task === task) ? task : <span className="text-steel-400">{task || S.eqNoStage}</span>}</td>
                            <td className="td font-mono text-xs">{String(wo.id)}</td>
                            <td className="td text-sm">{String(wo.sub ?? "-")}</td>
                            <td className="td text-right text-sm">{value > 0 ? fmtRupiah(value) : <span className="text-xs text-amber-600">{S.subBudgetNoValue}</span>}</td>
                            <td className="td text-right text-sm font-semibold">{fmtRupiah(paid)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">{S.detBudgetVs}</h3>
                  <button className="btn-secondary text-xs" onClick={() => { setActualVal(String(project.actual ?? 0)); setShowActual(true); }}>{S.detRecordActual}</button>
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <p className="text-2xl font-bold text-navy-900">{fmtMiliar(project.actual)}</p>
                    <p className="text-xs text-steel-500">{S.detActualOf.replace("{a}", fmtMiliar(project.budget))}</p>
                  </div>
                  <Badge tone={project.actual > project.budget ? "red" : "green"}>
                    {project.budget ? Math.round((project.actual / project.budget) * 100) : 0}%
                  </Badge>
                </div>
                <ProgressBar value={project.budget ? (project.actual / project.budget) * 100 : 0} tone="ocean" className="mt-3" />
                <p className="mt-3 text-xs text-steel-500">
                  {S.detCoImpact.replace("{a}", fmtRupiah(coApprovedImpact)).replace("{n}", String(coApproved.length))}
                </p>
              </Card>
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detEvmTitle}</h3>
                {(() => {
                  const pv = project.budget;
                  const ev = Math.round((project.budget * project.progress) / 100);
                  // AC = biaya aktual + equipment + service Selesai (lihat hppWithEquip).
                  const ac = hppWithEquip;
                  const spi = pv > 0 ? ev / pv : 0;
                  const cpi = ac > 0 ? ev / ac : 0;
                  const eac = cpi > 0 ? Math.round(ac / cpi) : ac;
                  return (
                    <>
                      <dl className="dl-div text-sm">
                        <div className="flex justify-between"><dt className="text-steel-500">{S.detPv}</dt><dd className="font-medium">{fmtMiliar(pv)}</dd></div>
                        <div className="flex justify-between"><dt className="text-steel-500">{S.detEv}</dt><dd className="font-medium">{fmtMiliar(ev)}</dd></div>
                        <div className="flex justify-between"><dt className="text-steel-500">{S.detAc}</dt><dd className="font-medium">{fmtMiliar(ac)}</dd></div>
                        <div className="flex justify-between"><dt className="text-steel-500">{S.detSpiCpi}</dt><dd className="font-medium">{spi.toFixed(2)} / {cpi.toFixed(2)}</dd></div>
                      </dl>
                      <p className="mt-3 text-sm text-steel-600">
                        {S.detEacPrefix}<span className="font-semibold text-amber-600">{fmtMiliar(eac)}</span>{" "}
                        {cpi < 1 && ac > 0 ? S.detEacOver : cpi >= 1 ? S.detEacOk : S.detEacNone}
                      </p>
                    </>
                  );
                })()}
                <h3 className="mb-2 mt-4 text-sm font-semibold text-navy-900">{S.detProjInv.replace("{n}", String(invoices.length))}</h3>
                <div className="space-y-1.5">
                  {invoices.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-navy-900">{i.id}</span>
                      <span className="text-steel-600">{fmtMiliar(invGrand(i))}</span>
                      <StatusBadge status={i.status} />
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="text-xs text-steel-400">{S.detNoInv}</p>}
                </div>
              </Card>
            </div>

            {/* F3-D-02: biaya service masuk biaya proyek (Selesai = realisasi). */}
            <Card className="mt-4 p-5">
              <h3 className="mb-1 text-sm font-semibold text-navy-900">{S.detSvcCostTitle}</h3>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([
                  [S.detSvcCostDone, serviceCostDone],
                  [S.detSvcCostCommitted, serviceCostCommitted],
                  [S.detSvcCostTotal, hppWithEquip],
                ] as [string, number][]).map(([label, v]) => (
                  <div key={label} className="rounded-xl border border-steel-100 p-2.5">
                    <p className="text-[11px] text-steel-500">{label}</p>
                    <p className="text-sm font-semibold tabular-nums text-navy-900">{fmtRupiah(v)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-steel-500">{S.detSvcCostHint}</p>
            </Card>

            {/* ==== BIAYA EQUIPMENT YANG DIBEBANKAN KE HPP PROYEK ====
                Booking equipment (alokasi) + material maintenanceequipment
                ikut dibebankan ke HPP proyek ini. Sebelumnya tidak ada
                sama sekali, sehingga EAC/CPI terlihat terlalu optimis. */}
            <Card className="mt-4 p-5">
              <h3 className="mb-1 text-sm font-semibold text-navy-900">
                {locale === "en" ? "Equipment cost charged to this project (HPP)" : "Biaya Equipment yang Dibebankan ke Proyek Ini (HPP)"}
              </h3>
              <p className="text-xs text-steel-500">
                {locale === "en"
                  ? "From equipment allocation bookings and maintenance material. Same figures as the Equipment module, so the two cannot drift."
                  : "Dari alokasi/booking equipment dan material maintenance. Angka sama dengan modul Equipment, jadi keduanya tidak bisa melenceng."}
              </p>

              {!equipHasCost ? (
                <p className="mt-3 text-xs text-steel-400">
                  {locale === "en"
                    ? "No equipment cost booked to this project yet."
                    : "Belum ada biaya equipment yang dibebankan ke proyek ini."}
                </p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] text-steel-500">{locale === "en" ? "Rental" : "Sewa"}</p>
                      <p className="text-sm font-semibold text-navy-900">{fmtRupiah(equipCost.rental)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-steel-500">{locale === "en" ? "Fuel" : "BBM"}</p>
                      <p className="text-sm font-semibold text-navy-900">{fmtRupiah(equipCost.fuel)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-steel-500">{locale === "en" ? "Maintenance" : "Maintenance"}</p>
                      <p className="text-sm font-semibold text-navy-900">{fmtRupiah(equipCost.maintenanceRealized)}</p>
                      {equipCost.maintenanceCommitted > 0 && (
                        <p className="text-[11px] text-amber-600">
                          + {fmtRupiah(equipCost.maintenanceCommitted)} {locale === "en" ? "in progress" : "berjalan"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-steel-500">{locale === "en" ? "Charged to HPP" : "Dibebankan ke HPP"}</p>
                      <p className="text-sm font-bold text-navy-900">{fmtRupiah(equipCost.totalRealized)}</p>
                    </div>
                  </div>

                  {/* Rincian per booking - bisa diklik ke modul equipment. */}
                  <div className="mt-4 mb-2 flex flex-wrap items-center justify-end gap-2">
                    <SearchBox value={detailBkQ} onChange={setDetailBkQ} className="max-w-xs" placeholder={locale === "en" ? "Search bookings..." : "Cari booking..."} ariaLabel={locale === "en" ? "Search bookings" : "Cari booking"} />
                    <button className="btn-secondary text-xs" onClick={() => setCostDetail(true)}>
                      {locale === "en" ? "Detail" : "Detail"}
                    </button>
                  </div>
                  {equipCost.bookingRows.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-surface">
                          <tr>
                            <SortTh label={locale === "en" ? "Booking" : "Booking"} sortKey="id" sort={sort4} onSort={(k) => setSort4((s) => toggleSort(s, k))} />
                            <SortTh label={locale === "en" ? "Equipment" : "Equipment"} sortKey="eq" sort={sort4} onSort={(k) => setSort4((s) => toggleSort(s, k))} />
                            <th className="th">{locale === "en" ? "Date" : "Tanggal"}</th>
                            <SortTh label={locale === "en" ? "Hours" : "Jam"} sortKey="h" sort={sort4} onSort={(k) => setSort4((s) => toggleSort(s, k))} />
                            <SortTh label={locale === "en" ? "Cost" : "Biaya"} sortKey="c" sort={sort4} onSort={(k) => setSort4((s) => toggleSort(s, k))} />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-steel-100">
                          {sortRows(equipCost.bookingRows.filter((r) => rowMatches(r as unknown as Record<string, unknown>, detailBkQ, ["id", "equipmentName", "date", "hours", "rental", "fuel", "cost"])), sort4, (r, k) => {
                            if (k === "eq") return r.equipmentName;
                            if (k === "h") return r.hours;
                            if (k === "c") return r.cost;
                            return r.id;
                          }).map((r) => (
                            <tr key={r.id} className="hover:bg-surface">
                              <td className="td font-mono text-xs text-navy-900">{r.id}</td>
                              <td className="td text-steel-600">{r.equipmentName}</td>
                              <td className="td text-steel-600 text-xs">{fmtTanggal(r.date)}</td>
                              <td className="td text-steel-600">{r.hours} jam</td>
                              <td className="td font-semibold">{fmtRupiah(r.cost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Rincian per siklus maintenance yang diproyekkan. */}
                  {equipCost.maintenanceRows.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {equipCost.maintenanceRows.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-steel-100 py-1.5 text-sm">
                          <span className="min-w-0 truncate text-navy-900">
                            <span className="font-mono text-xs text-steel-500">{r.id}</span>{" "}
                            {r.equipmentName}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <Badge tone={r.realized ? "green" : "amber"}>
                              {r.realized ? (locale === "en" ? "Charged" : "Terbebankan") : (locale === "en" ? "In progress" : "Berjalan")}
                            </Badge>
                            <span className="text-xs text-steel-500">{fmtTanggal(r.date)}</span>
                            {r.labor > 0 && (
                              <span className="text-[11px] text-steel-400">
                                {locale === "en"
                                  ? `${fmtRupiah(r.material)} + ${fmtRupiah(r.labor)} labour`
                                  : `${fmtRupiah(r.material)} + ${fmtRupiah(r.labor)} tenaga`}
                              </span>
                            )}
                            <span className="font-semibold">{fmtRupiah(r.cost)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Efek ke EAC: CPI dengan AC + equipment, bukan AC saja. */}
                  <p className="mt-4 rounded-lg bg-steel-50 px-3 py-2 text-xs text-steel-600">
                    {locale === "en"
                      ? `Actual cost used in EVM: ${fmtRupiah(Number(project.actual ?? 0))} + equipment ${fmtRupiah(equipCost.totalRealized)} + services ${fmtRupiah(serviceCostDone)} + subcontractors (paid terms) ${fmtRupiah(subkonPaid)} = ${fmtRupiah(hppWithEquip)}.`
                      : `Biaya aktual dipakai untuk EVM: ${fmtRupiah(Number(project.actual ?? 0))} + equipment ${fmtRupiah(equipCost.totalRealized)} + service ${fmtRupiah(serviceCostDone)} + subkon (termin lunas) ${fmtRupiah(subkonPaid)} = ${fmtRupiah(hppWithEquip)}.`}
                    {equipCost.maintenanceCommitted > 0 && (
                      <span className="block text-amber-600">
                        {locale === "en"
                          ? `Plus ${fmtRupiah(equipCost.maintenanceCommitted)} committed but not yet realised.`
                          : `Plus ${fmtRupiah(equipCost.maintenanceCommitted)} terkunci tapi belum terealisasi.`}
                      </span>
                    )}
                  </p>
                </>
              )}
            </Card>
            </div>
          )}

          {tab === "Tim" && (
            <div>
              <div className="mb-3 flex justify-end">
                <button className="btn-secondary text-xs" onClick={() => setShowTeam(true)}><Plus className="h-3.5 w-3.5" /> {S.detAddMember}</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((e) => (
                  <Card key={e.id} className="flex items-center gap-3 p-4">
                    {e.photo ? (
                      <SecureImg src={String(e.photo)} alt={String(e.name)} name={String(e.name)} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <Avatar name={String(e.name)} className="h-10 w-10 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link to={`/sdm/karyawan/${e.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-ocean-600 hover:underline">{e.name}</Link>
                      <p className="text-xs text-steel-500">{e.role} · {e.dept}</p>
                      {(e.phone || e.email) ? <p className="truncate text-xs text-steel-400">{[e.phone, e.email].filter(Boolean).join(" · ")}</p> : null}
                      {wbsAssignments.emp.has(String(e.id)) && (
                        <p className="mt-1 truncate text-xs text-ocean-700" title={(wbsAssignments.emp.get(String(e.id)) ?? []).join(", ")}>
                          {S.detTeamWbsStages.replace("{a}", (wbsAssignments.emp.get(String(e.id)) ?? []).join(", "))}
                        </p>
                      )}
                    </div>
                    {!teamIds.includes(e.id) ? (
                      <Badge tone="blue">{S.detTeamFromWbs}</Badge>
                    ) : (
                    <button className="rounded p-1 text-rose-400 hover:bg-rose-50" title={S.detRemoveTitle} onClick={async () => { try { await saveTeamWithConflictRetry(teamIds.filter((t) => t !== e.id)); toast(S.detToastRemoved.replace("{a}", e.name), "info"); } catch (err) { toast(err instanceof Error ? err.message : S.saveFail, "info"); } }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                    )}
                  </Card>
                ))}
                {team.length === 0 && <p className="text-sm text-steel-400">{S.detNoTeam}</p>}
              </div>
              {wbsAssignments.sub.size > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detTeamSubTitle}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[...wbsAssignments.sub.entries()].map(([id, sc]) => (
                      <Card key={id} className="p-4">
                        <p className="text-sm font-semibold text-navy-900">{sc.name}</p>
                        <p className="mt-1 text-xs text-steel-500" title={sc.stages.join(", ")}>{S.detTeamWbsStages.replace("{a}", sc.stages.join(", "))}</p>
                        {sc.woIds.length > 0 && <p className="mt-1 font-mono text-xs text-amber-700">{sc.woIds.join(", ")}</p>}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Dokumen & Laporan" && (
            <div>
              <style>{`@media print { .doc-card, .bast-card, .report-card { break-inside: avoid; page-break-inside: avoid; } table, thead, tbody, tr { break-inside: auto; page-break-inside: auto; } }`}</style>
              <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detDocTitle}</h3>
              <div className="mb-3 flex justify-end">
                {canAutoWrite && (
                  <button className="btn-secondary text-xs" onClick={() => setShowDoc(true)}><Plus className="h-3.5 w-3.5" /> {S.detAddDoc}</button>
                )}
              </div>
              {/* Alur bercabang: tipe → dokumen → riwayat revisi. Kartu di bawah tetap untuk pratinjau & berbagi. */}
              {docsByType.length > 0 && (
                <div className="mb-4 rounded-xl border border-steel-100 p-3">
                  <FlowTree nodes={docTree} defaultOpen={docTree.map((n) => n.id)} labels={{ expand: TR.expand, collapse: TR.collapse, expandAll: TR.expandAll, collapseAll: TR.collapseAll }} />
                </div>
              )}
              <div className="space-y-2">
                {docsByType.map((d, idx) => {
                  const url = docUrlOf(d);
                  const fname = docBaseName(d, url);
                  const isNew = lastUploadedId === String(d.id);
                  /* Pratinjau inline, bukan modal: klik ikon mata langsung memuat
                     dokumen DI DALAM kartu ini.

                     `isOpen` HANYA bergantung pada `openDocId`. Sebelumnya
                     ikut `isNew`, jadi dokumen yang baru diunggah langsung
                     memuat dirinya ke dalam kartu tanpa diminta - dan karena
                     `lastUploadedId` tidak pernah dibersihkan, semua dokumen
                     yang pernah diunggah pada sesi itu ikut terbuka setiap
                     kali tabel dirender ulang. `isNew` sekarang hanya
                     memberi tanda "Baru diunggah" + sorotan tepi. */
                  const isOpen = url !== "" && openDocId === String(d.id);
                  return (
                  <Fragment key={d.id}>
                  {(idx === 0 || String(docsByType[idx - 1].type ?? "") !== String(d.type ?? "")) && (
                    <h4 className="pt-2 text-xs font-semibold uppercase tracking-wide text-steel-500">{String(d.type ?? "-")} ({docsByType.filter((x) => String(x.type ?? "") === String(d.type ?? "")).length})</h4>
                  )}
                  <div className={`doc-card rounded-xl border p-3 text-sm ${isNew ? "border-ocean-400 ring-2 ring-ocean-100" : "border-steel-100"}`} style={{ breakInside: "avoid" }}>
                    <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-900">{d.title} {isNew && <Badge tone="teal">Baru diunggah</Badge>}</p>
                      {/* Sub-tipe + rujukan QC ikut tampil di kartu. Tanpa ini
                          data yang baru disimpan ada di DB tapi tidak pernah
                          terlihat di halaman tempat user mengisinya. */}
                      {(d.subType !== undefined || d.qcCertId !== undefined) && (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          {d.subType !== undefined && <Badge tone="gray">{String(d.subType)}</Badge>}
                          {d.qcCertId !== undefined && <Badge tone="blue">QC: {String(d.qcCertId)}</Badge>}
                        </span>
                      )}
                      <p className="text-xs text-steel-500">{d.id} · {d.type} · {d.version} · {d.updated}{fname !== "" ? ` · lampiran: ${fname}` : ""}</p>
                      <p className="mt-1 text-xs text-steel-600">
                        <span className="font-medium text-steel-700">{S.detAssignerLabel}:</span>{" "}
                        {d.assigner ? String(d.assigner) : (d.type === "BoQ" && d.owner ? String(d.owner) : <span className="font-normal text-steel-400">-</span>)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {d.type === "BoQ" && (
                        <button
                          type="button"
                          className="btn-secondary text-xs text-ocean-700 hover:bg-ocean-50"
                          onClick={() => setTab("BoQ")}
                          title={S.detGoToBoq}
                        >
                          {S.detGoToBoq}
                        </button>
                      )}
                      <button className="btn-secondary text-xs" aria-label={`${locale === "en" ? "Detail" : "Detail"}: ${d.title}`} onClick={() => setDocDetail(d)}>
                        <Eye className="h-3.5 w-3.5" /> {locale === "en" ? "Detail" : "Detail"}
                      </button>
                      <button className="btn-secondary text-xs" onClick={() => { setShareForm({ docId: String(d.id), to: "" }); setShowShare(true); }}>{S.detShareBtn}</button>
                      <StatusBadge status={d.status} />
                    </div>
                    </div>
                    <div className="mt-2">
                      {url === "" ? (
                        <p className="text-xs text-steel-400">Belum ada lampiran file.</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-steel-500 hover:bg-steel-100 hover:text-ocean-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
                              title={`Pratinjau: ${String(d.title ?? d.id)}`}
                              aria-label={`Pratinjau: ${String(d.title ?? d.id)}`}
                              aria-expanded={isOpen}
                              onClick={() => toggleDocPreview(String(d.id))}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <DownloadFileButton url={url} fileName={fname !== "" ? fname : undefined} className="btn-secondary px-2 py-1 text-xs" />
                          </div>
                          {isOpen && (
                            <div className="mt-2">
                              <InlineDocPreview
                                url={url}
                                height={/\.pdf(\?|$)/i.test(url) ? "h-80" : "h-56"}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  </Fragment>
                  );
                })}
                {docs.length === 0 && <p className="text-sm text-steel-400">{S.detNoDocs}</p>}
              </div>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">{S.detBastTitle.replace("{n}", String(bastList.length))}</h3>
                  {canAutoWrite && (
                    <button className="btn-secondary text-xs" onClick={() => { setBastForm({ milestone: "", tanggal: todayISO(), signer: "", lampiran: "", amount: "" }); setShowBast(true); }}><Plus className="h-3.5 w-3.5" /> {S.detCreateBast}</button>
                  )}
                </div>
                <div className="space-y-2">
                  {bastList.map((b) => {
                    const linked = findLinkedWbs(String(b.milestone ?? ""));
                    return (
                      <div key={String(b.id)} className="bast-card flex flex-wrap items-center justify-between gap-2 rounded-xl border border-steel-100 p-3 text-sm" style={{ breakInside: "avoid" }}>
                        <div className="min-w-0">
                          <p className="font-medium text-navy-900">{String(b.id)} · {String(b.milestone)}</p>
                          <p className="text-xs text-steel-500">{fmtTanggal(String(b.tanggal))}{S.detBastSigner}{String(b.penandatangan ?? "-")}{b.lampiran ? `${S.detBastAttach}${String(b.lampiran)}` : ""} · {fmtRupiah(Number(b.amount || 0))}{linked ? S.detBastWbs.replace("{a}", linked.task).replace("{b}", String(linked.progress)) : ""}</p>
</div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={String(b.status)} />
                          {canAutoWrite && String(b.status) === "Draft" && (
                            <button className="btn-secondary text-xs" onClick={() => advanceBast(b, "Diajukan")}>{S.detProposeBtn}</button>
                          )}
                          {canAutoWrite && String(b.status) === "Diajukan" && (
                            <button className="btn-secondary text-xs" onClick={() => advanceBast(b, "Disetujui")}>{S.detApproveInvBtn}</button>
                          )}
                          {/* BAST boleh dicetak begitu sudah diajukan: suratnya
                              sedang ditandatangani. Draft tidak - isinya belum
                              pernah ditandatangani siapa pun, jadi salinannya
                              tidak ada nilainya. */}
                          {String(b.status) !== "Draft" && (
                            <button
                              className="btn-secondary text-xs"
                              onClick={() => void printBastPdf(b)}
                              title={locale === "en" ? "Print the handover certificate" : "Cetak Berita Acara Serah Terima"}
                            >
                              BAST PDF
                            </button>
                          )}
                          {canAutoWrite && String(b.status) === "Draft" && (
                            <button className="btn-secondary text-xs text-rose-600" onClick={() => setDelRec({ kind: "bast", row: b })}>{locale === "en" ? "Delete" : "Hapus"}</button>
                          )}
                          {String(b.status) !== "Draft" && (
                            <span className="text-xs text-steel-400" title={String(b.status) === "Disetujui" ? (locale === "en" ? "Approved BAST is a signed record" : "BAST Disetujui sudah jadi dokumen bertanda tangan") : (locale === "en" ? "Already submitted for approval" : "Sudah diajukan untuk persetujuan")}>
                              {locale === "en" ? "Locked" : "Terkunci"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {bastList.length === 0 && <p className="text-sm text-steel-400">{S.detNoBast}</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "WBS & Anggaran" && (
            /* Item 5d revisi 2 Oktober: equipment yang dipakai PROYEK INI.
               Modul Equipment punya tab "Sedang Dipakai", tapi isinya
               seluruh yard - manajer proyek tidak bisa memilih unit
               miliknya sendiri tanpa menyaring manual.
               Sumbernya `equipCost`, yang sudah difilter per proyek, jadi
               tidak ada perhitungan baru di sini dan angkanya tidak mungkin
               berbeda dari kartu Biaya. */
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title={locale === "en" ? "Equipment in use on this project" : "Equipment yang dipakai proyek ini"}
                  subtitle={locale === "en"
                    ? "Bookings and maintenance recorded against this project."
                    : "Booking dan maintenance yang tercatat pada proyek ini."}
                />
                <div className="p-4">
                  {projectBookings.length === 0 && equipCost.maintenanceRows.length === 0 ? (
                    <p className="py-6 text-center text-sm text-steel-400">
                      {locale === "en" ? "No equipment used on this project yet." : "Belum ada equipment yang dipakai proyek ini."}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {projectBookings.length > 0 && (
                        <div>
                          <SearchBox value={cardBkQ} onChange={setCardBkQ} className="mb-2 max-w-xs" placeholder={locale === "en" ? "Search bookings..." : "Cari booking..."} ariaLabel={locale === "en" ? "Search bookings" : "Cari booking"} />
                          <div className="overflow-x-auto">
                            <table className="w-full">
                            <thead className="bg-surface">
                              <tr>
                                <th className="th">{S.eqStageCol}</th>
                                <th className="th">Booking</th>
                                <th className="th">Equipment</th>
                                <th className="th">{locale === "en" ? "Date" : "Tanggal"}</th>
                                <th className="th">{locale === "en" ? "Status" : "Status"}</th>
                                <th className="th text-right">{locale === "en" ? "Cost" : "Biaya"}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-steel-100">
                              {projectBookings.filter((b) => rowMatches(b, cardBkQ, ["id", "equipName", "equip", "date", "status", "wbsTask"])).map((b) => {
                                const costRow = equipCost.bookingRows.find((r) => r.id === String(b.id));
                                return (
                                <tr key={String(b.id)} className="hover:bg-surface">
                                  <td className="td text-xs">
                                    {canWriteBookings ? (
                                      <select className="input py-1 text-xs" value={String(b.wbsTask ?? "")} aria-label={S.eqStageCol}
                                        onChange={async (e) => { try { await update("bookings", String(b.id), { wbsTask: e.target.value }); log("mengaitkan booking ke tahap WBS", `${String(b.id)} → ${e.target.value || "-"}`, "Proyek"); } catch (err) { toast(err instanceof Error ? err.message : S.saveFail, "info"); } }}>
                                        <option value="">{S.eqNoStage}</option>
                                        {wbs.map((w) => <option key={w.task} value={w.task}>{w.task}</option>)}
                                      </select>
                                    ) : (
                                      <span className={b.wbsTask ? "font-medium text-navy-900" : "text-steel-400"}>{String(b.wbsTask || S.eqNoStage)}</span>
                                    )}
                                  </td>
                                  <td className="td font-mono text-xs text-navy-900">{String(b.id)}</td>
                                  <td className="td text-steel-600">{costRow?.equipmentName ?? String(b.equipName ?? b.equip ?? "-")}</td>
                                  <td className="td text-xs text-steel-600">{fmtTanggal(String(b.date ?? ""))}{b.jam ? ` · ${String(b.jam)}` : ""}</td>
                                  <td className="td"><StatusBadge status={String(b.status ?? "-")} /></td>
                                  <td className="td text-right font-semibold">{costRow ? fmtRupiah(costRow.cost) : <span className="text-steel-400">-</span>}</td>
                                </tr>
                                );
                              })}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {equipCost.maintenanceRows.length > 0 && (
                        <div>
                          <SearchBox value={cardMaintQ} onChange={setCardMaintQ} className="mb-2 max-w-xs" placeholder={locale === "en" ? "Search maintenance..." : "Cari maintenance..."} ariaLabel={locale === "en" ? "Search maintenance" : "Cari maintenance"} />
                          <div className="overflow-x-auto">
                            <table className="w-full">
                            <thead className="bg-surface">
                              <tr>
                                <th className="th">{locale === "en" ? "Maintenance" : "Maintenance"}</th>
                                <th className="th">{locale === "en" ? "Equipment" : "Equipment"}</th>
                                <th className="th">{locale === "en" ? "Status" : "Status"}</th>
                                <th className="th text-right">{locale === "en" ? "Cost" : "Biaya"}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-steel-100">
{equipCost.maintenanceRows.filter((r) => rowMatches(r as unknown as Record<string, unknown>, cardMaintQ, ["id", "equipmentName", "status", "date", "material", "labor", "cost", "realized"])).map((r) => (
                                  <tr key={r.id} className="hover:bg-surface">
                                  <td className="td font-mono text-xs text-navy-900">{r.id}</td>
                                  <td className="td text-steel-600">{r.equipmentName}</td>
                                  <td className="td"><StatusBadge status={r.status} /></td>
                                  <td className="td text-right font-semibold">{fmtRupiah(r.material + r.labor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-4 border-t border-steel-100 pt-3">
                        <div className="text-right">
                          <p className="text-[11px] text-steel-500">{locale === "en" ? "Charged to COGS" : "Dibebankan ke HPP"}</p>
                          <p className="text-sm font-bold text-navy-900">{fmtRupiah(equipCost.totalRealized)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-steel-500">{locale === "en" ? "Incl. committed" : "Incl. komitmen"}</p>
                          <p className="text-sm font-bold text-navy-900">{fmtRupiah(equipCost.totalCommitted)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {tab === "Perubahan & Risiko" && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">{S.detCoTitle.replace("{n}", String(coList.length))}</h3>
                  {canAutoWrite && (
                    <button className="btn-secondary text-xs" onClick={() => setShowCo(true)}><Plus className="h-3.5 w-3.5" /> {S.detProposeCo}</button>
                  )}
                </div>
                <div className="mb-3 rounded-xl border border-steel-100 bg-surface p-3 text-sm">
                  <span className="text-steel-500">{S.detCoTotalPrefix}</span>
                  <span className="font-semibold text-navy-900">{fmtRupiah(coApprovedImpact)}</span>
                  <span className="text-steel-500">{S.detCoTotalSuffix.replace("{n}", String(coApproved.length))}</span>
                </div>
                <div className="space-y-2">
                  {coList.map((c) => (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-steel-100 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900">{c.title}</p>
                        <p className="text-xs text-steel-500">{c.id} · {fmtTanggal(c.date)} · {S.detCoRequester}{c.requestedBy} · {S.detCoImpactLbl}<span className={`font-semibold ${Number(c.impact) < 0 ? "text-emerald-600" : "text-navy-900"}`}>{fmtRupiah(Number(c.impact))}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} />
                        {c.boqDocId ? <span className="text-[11px] text-steel-500">{S.detCoLinked.replace("{n}", String(Array.isArray(c.changes) ? c.changes.length : 0))}</span> : null}
                        {c.status === "Diajukan" && !coOwner && <span className="text-[11px] text-steel-500">{S.detCoWaitOwner}</span>}
                        {canAutoWrite && c.status === "Diajukan" && coOwner && (
                          <>
                            <button className="btn-secondary text-xs" onClick={() => setCoStatus(c.id, "Disetujui")}>{S.detApproveBtn}</button>
                            <button className="btn-secondary text-xs" onClick={() => setCoStatus(c.id, "Ditolak")}>{S.detRejectBtn}</button>
                          </>
                        )}
                        {canAutoWrite && c.status === "Disetujui" && (
                            <button className="btn-secondary text-xs" onClick={() => setCoStatus(c.id, "Diterapkan")}>{S.detApplyBtn}</button>
                        )}
                        {canAutoWrite && c.status !== "Diterapkan" && (
                          <button className="btn-secondary text-xs text-rose-600" onClick={() => setDelRec({ kind: "changeOrders", row: c })}>{locale === "en" ? "Delete" : "Hapus"}</button>
                        )}
                        {c.status === "Diterapkan" && (
                          <span className="text-xs text-steel-400" title={locale === "en" ? "Applied to contract value" : "Sudah masuk nilai kontrak"}>
                            {locale === "en" ? "Locked" : "Terkunci"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {coList.length === 0 && <p className="text-sm text-steel-400">{S.detNoCo}</p>}
                </div>
              </div>

              {/* PRJ-22: tabel risiko disembunyikan (keputusan Q12). Risiko otomatis
                  tetap dihitung untuk alert/monitoring; setting ini hanya tampilan. */}
              {getSetting(data, "SHOW_RISK_TABLE", 0) === 1 && <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy-900">{S.detRiskTitle.replace("{n}", String(riskList.length))}</h3>
                </div>
                <p className="mb-2 text-xs text-steel-400">{S.detRiskAutoNote}</p>
                <div className="mb-3 overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr>
                        <SortTh label={S.detMatrixCorner} sortKey="level" sort={sort3} onSort={(k) => setSort3((s) => toggleSort(s, k))} />
                        {RISK_LEVEL.map((l) => <SortTh key={l} label={l} sortKey={l} sort={sort3} onSort={(k) => setSort3((s) => toggleSort(s, k))} />)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-steel-100">
                      {sortRows(RISK_LEVEL, sort3, (lh, k) => k === "level" ? String(lh) : Number(riskList.filter((r) => String(r.likelihood) === String(lh) && String(r.impact) === String(k) && String(r.status) !== "Tertutup").length)).map((lh) => (
                        <tr key={lh}>
                          <td className="td text-left font-medium text-navy-900">{lh}</td>
                          {RISK_LEVEL.map((im) => {
                            const n = riskList.filter((r) => r.likelihood === lh && r.impact === im && r.status !== "Tertutup").length;
                            const score = (RISK_LEVEL.indexOf(lh) + 1) * (RISK_LEVEL.indexOf(im) + 1);
                            return (
                              <td key={im} className="td">
                                <Badge tone={n > 0 ? riskTone(score) : "gray"}>{S.detRiskCount.replace("{n}", String(n))}</Badge>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2">
                  {riskList.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-steel-100 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900">{r.title}</p>
                        <p className="text-xs text-steel-500">{r.id} · {S.detMitigation}{r.mitigation || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={riskTone(riskScore(r))}>{r.likelihood} × {r.impact}</Badge>
                        <StatusBadge status={r.status} />
                        <button className="btn-secondary text-xs text-rose-600" onClick={() => setDelRec({ kind: "risks", row: r })}>{locale === "en" ? "Delete" : "Hapus"}</button>
                      </div>
                    </div>
                  ))}
                  {riskList.length === 0 && <p className="text-sm text-steel-400">{S.detNoRisk}</p>}
                </div>
              </div>}
            </div>
          )}

          {/* D15: tab Subkon — ringkasan subkontraktor, WO, dan termin per proyek. */}
          {tab === "Subkon" && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-navy-900">{S.detSubkonTitle.replace("{n}", String(subkonList.length))}</h3>
                  <Link to="/subkontraktor" className="text-xs font-medium text-ocean-600 hover:underline">{S.detSubkonOpen}</Link>
                </div>
                {subkonList.length === 0 ? (
                  <p className="text-xs text-steel-400">{S.detNoSubkon}</p>
                ) : (
                  <div className="space-y-3">
                    {subkonList.map((s) => {
                      const subWos = wos.filter((w) => String(w.sub ?? "") === String(s.name ?? ""));
                      const subTermins = subkonTermins.filter((t) => subWos.some((w) => String(w.id ?? "") === String(t.woId ?? "")));
                      return (
                        <div key={s.id} className="rounded-xl border border-steel-100 p-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-navy-900">{String(s.name ?? "")}</p>
                            <Badge tone={s.status === "Aktif" ? "green" : s.status === "Blacklist" ? "red" : "amber"}>{String(s.status ?? "-")}</Badge>
                          </div>
                          <p className="mb-2 text-xs text-steel-500">
                            {S.detSubkonContract.replace("{a}", fmtRupiah(Number(s.contract ?? 0)))}
                            {s.k3 ? ` · K3 ${String(s.k3)}` : ""}
                          </p>
                          <div className="space-y-1">
                            {subWos.map((w) => {
                              const woTerms = subTermins.filter((t) => String(t.woId ?? "") === String(w.id ?? ""));
                              return (
                                <div key={w.id} className="rounded-lg bg-steel-50 px-3 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="font-mono text-xs font-semibold text-navy-900">{w.id}</span>
                                    <span className="text-xs text-steel-600">{String(w.scope ?? "")}</span>
                                    {Number(w.value || 0) > 0 && <span className="text-xs font-semibold tabular-nums text-navy-900">{fmtRupiah(Number(w.value))}</span>}
                                    <Badge tone={w.status === "Selesai" ? "green" : "blue"}>{w.progress}%</Badge>
                                  </div>
                                  {woTerms.length > 0 && (
                                    <div className="mt-1.5 space-y-0.5">
                                      {woTerms.map((t) => (
                                        <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-steel-500">
                                          <span>{String(t.milestone ?? "")}</span>
                                          <span className="font-semibold">{fmtRupiah(Number(t.amount ?? 0))}</span>
                                          <StatusBadge status={String(t.status ?? "Draf")} />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {tab === "Terkait" && (
            <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detDockTitle.replace("{n}", String(slots.length))}</h3>
                {slots.map((s) => <p key={s.id} className="py-1 text-sm text-steel-600">{S.detDockRow.replace("{a}", s.dockId).replace("{b}", String(s.from)).replace("{c}", String(s.to))}</p>)}
                {slots.length === 0 && <p className="text-xs text-steel-400">{S.detNoDock}</p>}
              </Card>
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detWoTitle.replace("{n}", String(wos.length))}</h3>
                {wos.map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-steel-600">{w.id} · {w.sub}</span>
                    <Badge tone={w.status === "Selesai" ? "green" : "blue"}>{w.progress}%</Badge>
                  </div>
                ))}
                {wos.length === 0 && <p className="text-xs text-steel-400">{S.detNoWo}</p>}
              </Card>
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-navy-900">{S.detNcrTitle.replace("{n}", String(ncrs.length))}</h3>
                {ncrs.map((n) => (
                  <div key={n.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="font-mono text-navy-900">{n.id}</span>
                    <StatusBadge status={n.status} />
                  </div>
                ))}
                {ncrs.length === 0 && <p className="text-xs text-steel-400">{S.detNoNcr}</p>}
              </Card>
            </div>
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-900">{S.detWarTitle.replace("{n}", String(warrantyList.length))}</h3>
                {canAutoWrite && project.status === "Selesai" && (
                  <button className="btn-secondary text-xs" onClick={() => createWarranty()}><Plus className="h-3.5 w-3.5" /> {S.detCreateWar}</button>
                )}
              </div>
              {project.status !== "Selesai" && (
                <p className="mb-2 text-xs text-steel-500">{S.detWarHint}</p>
              )}
              {/* D11: garansi per WBS task yang sudah selesai. */}
              {canAutoWrite && project.status === "Selesai" && wbs.some((w) => Number(w.progress ?? 0) >= 100) && (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-steel-500">{S.detWarPerTask}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wbs.filter((w) => Number(w.progress ?? 0) >= 100 && !warrantyList.some((wr) => String(wr.wbsTask ?? "") === w.task)).map((w) => (
                      <button key={w.task} className="btn-secondary text-xs" onClick={() => createWarranty(w.task)}>
                        <Plus className="h-3 w-3" /> {w.task}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {warrantyList.map((w) => (
                  <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-steel-100 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-900 font-mono">{w.id}</p>
                      {w.wbsTask && <p className="text-xs text-ocean-700">{w.wbsTask}</p>}
                      <p className="text-xs text-steel-500">{S.detWarRow.replace("{a}", fmtTanggal(String(w.start ?? ""))).replace("{b}", String(w.months ?? 12)).replace("{c}", String(w.status ?? "Aktif"))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={String(w.status ?? "Aktif")} />
                      <button className="btn-secondary text-xs" onClick={() => void pdfDoc.request({ kind: "garansi", id: String(w.id), locale }, `Garansi-${String(w.id)}`, false)}>{S.detWarPrint}</button>
                    </div>
                  </div>
                ))}
                {warrantyList.length === 0 && <p className="text-xs text-steel-400">{S.detNoWar}</p>}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-900">{S.detTrialTitle.replace("{n}", String(trialList.length))}</h3>
                {canAutoWrite && (
                  <button className="btn-secondary text-xs" onClick={openTrialNew}><Plus className="h-3.5 w-3.5" /> {S.detCreateTrial}</button>
                )}
              </div>
              <p className="mb-2 text-xs text-steel-500">{S.detTrialHint}</p>
              <div className="space-y-2">
                {trialList.map((t) => (
                  <div key={String(t.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-steel-100 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-900">{String(t.id)} · {fmtTanggal(String(t.tanggal))}</p>
                      <p className="text-xs text-steel-500">{S.detTrialParam}{String(t.parameter ?? "-")}{t.punchList ? `${S.detTrialPunch}${String(t.punchList)}` : ""}{t.baRef ? `${S.detTrialBa}${String(t.baRef)}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={String(t.hasil ?? "Berjalan")} />
                      {canAutoWrite && String(t.hasil) !== "Lolos" && (
                        <button className="btn-secondary text-xs" onClick={() => advanceTrial(t, "Lolos")}>{S.detTrialPassBtn}</button>
                      )}
                      {canAutoWrite && String(t.hasil) !== "Gagal" && (
                        <button className="btn-secondary text-xs" onClick={() => advanceTrial(t, "Gagal")}>{S.detTrialFailBtn}</button>
                      )}
                      {canAutoWrite && !t.baRef && (
                        <button className="btn-secondary text-xs text-rose-600" onClick={() => setDelRec({ kind: "trials", row: t })}>{locale === "en" ? "Delete" : "Hapus"}</button>
                      )}
                      {String(t.baRef ?? "") !== "" && (
                        <span className="text-xs text-steel-400" title={locale === "en" ? "Signed off with a BA reference" : "Sudah ditandatangani dengan nomor BA"}>
                          {locale === "en" ? "Locked" : "Terkunci"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {trialList.length === 0 && <p className="text-xs text-steel-400">{S.detNoTrial}</p>}
              </div>
            </Card>
            </div>
          )}
          {tab === "BoQ" && <BoqDocsSection projectId={pid} />}
          {tab === "Dokumen & Laporan" && <div className="report-print mt-6" style={{ breakInside: "auto" }}><ReportSection projectId={pid} /></div>}
          {tab === "3D Viewer" && getSetting(data, "SHOW_3D_PROJECT", 0) === 1 && <SparepartServiceSection projectId={pid} view="3d" />}
          {tab === "Service" && <SparepartServiceSection projectId={pid} view="service" />}
          {tab === "Sparepart" && <SparepartServiceSection projectId={pid} view="sparepart" />}
        </div>
      </div>

      {/* Modal Trial */}
      <Modal open={showTrial} onClose={() => setShowTrial(false)} title={S.detCreateTrial} subtitle={`${pid} · ${nextTrialId(trialForm.tanggal || todayISO())}`}
        footer={<><button className="btn-secondary" onClick={() => setShowTrial(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={saveTrial}>{S.saveBtn}</button></>}>
        <div className="space-y-3">
          <Field label={S.dateField} required><input type="date" className="input" value={trialForm.tanggal} onChange={(e) => setTrialForm({ ...trialForm, tanggal: e.target.value })} /></Field>
          <Field label={S.detParamField} required><input className="input" value={trialForm.parameter} onChange={(e) => setTrialForm({ ...trialForm, parameter: e.target.value })} placeholder={S.detParamPh} /></Field>
          <Field label={S.detPunchField}><input className="input" value={trialForm.punchList} onChange={(e) => setTrialForm({ ...trialForm, punchList: e.target.value })} placeholder={S.detPunchPh} /></Field>
          <Field label={S.detBaField}><input className="input" value={trialForm.baRef} onChange={(e) => setTrialForm({ ...trialForm, baRef: e.target.value })} placeholder={S.detBaPh} /></Field>
          <Field label={S.detTrialKondisi}>
<select className="input" value={trialForm.kondisi} onChange={(e) => setTrialForm({ ...trialForm, kondisi: e.target.value as TrialKondisi })}>
              {TRIAL_KONDISI.map((k) => <option key={k} value={k}>{k === "Sudah Sesuai" ? S.detTrialKSesuai : k === "Tidak Sesuai" ? S.detTrialKTidak : S.detTrialKPerbaiki}</option>)}
            </select>
          </Field>
          {/* D10: checklist dari WBS task yang sudah selesai. */}
          {trialForm.checklist.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-steel-500">{S.detTrialChecklist}</p>
              <div className="space-y-1.5">
                {trialForm.checklist.map((item, idx) => (
                  <div key={item.wbsTask} className="flex items-center gap-2 rounded-lg border border-steel-100 px-2.5 py-1.5">
                    <input type="checkbox" checked={item.done} onChange={(e) => {
                      const next = [...trialForm.checklist];
                      next[idx] = { ...next[idx], done: e.target.checked };
                      setTrialForm({ ...trialForm, checklist: next });
                    }} />
                    <span className="flex-1 text-xs font-medium text-navy-900">{item.wbsTask}</span>
                    <input className="input max-w-40 !py-0.5 text-xs" value={item.note} placeholder={locale === "en" ? "Note" : "Catatan"} onChange={(e) => {
                      const next = [...trialForm.checklist];
                      next[idx] = { ...next[idx], note: e.target.value };
                      setTrialForm({ ...trialForm, checklist: next });
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Detail Biaya Equipment (item 8d revisi 2 Oktober).
          Angkanya SAMA dengan kartu di atas - keduanya diambil dari
          `equipCost`, jadi tidak mungkin melenceng. Yang ditambah di sini
          adalah dua hal yang perlu dibuka: pekerjaan maintenance yang
          dihitung sebagai komitmen, dan baris detail per maintenance yang
          di halaman hanya diringkas jadi satu angka. */}
      <Modal
        open={costDetail}
        onClose={() => setCostDetail(false)}
        wide
        title={locale === "en" ? "Equipment cost detail" : "Detail Biaya Equipment"}
        subtitle={pid}
        footer={<button className="btn-secondary" onClick={() => setCostDetail(false)}>{S.cancelBtn}</button>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              { label: locale === "en" ? "Rental" : "Sewa", value: equipCost.rental, bold: false },
              { label: locale === "en" ? "Fuel" : "BBM", value: equipCost.fuel, bold: false },
              { label: locale === "en" ? "Maintenance (realized)" : "Maintenance (terealisasi)", value: equipCost.maintenanceRealized, bold: false },
              { label: locale === "en" ? "Maintenance (committed)" : "Maintenance (komitmen)", value: equipCost.maintenanceCommitted, bold: false },
              { label: locale === "en" ? "Charged to COGS" : "Dibebankan ke HPP", value: equipCost.totalRealized, bold: true },
              { label: locale === "en" ? "Budget incl. committed" : "Anggaran incl. komitmen", value: equipCost.totalCommitted, bold: true },
            ] as { label: string; value: number; bold: boolean }[]).map((k) => (
                <div key={k.label} className="rounded-xl border border-steel-100 p-2.5">
                  <p className="text-[11px] text-steel-500">{k.label}</p>
                  <p className={`text-sm ${k.bold ? "font-bold" : "font-semibold"} text-navy-900`}>{fmtRupiah(k.value)}</p>
                </div>
              ))}
          </div>

          {equipCost.maintenanceRows.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-navy-900">
                {locale === "en" ? "Maintenance breakdown" : "Rincian maintenance"}
              </p>
              <SearchBox value={breakdownMaintQ} onChange={setBreakdownMaintQ} className="mb-2 max-w-xs" placeholder={locale === "en" ? "Search maintenance..." : "Cari maintenance..."} ariaLabel={locale === "en" ? "Search maintenance" : "Cari maintenance"} />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface">
                    <tr>
                      <th className="th">{locale === "en" ? "ID" : "ID"}</th>
                      <th className="th">{locale === "en" ? "Equipment" : "Equipment"}</th>
                      <th className="th">{locale === "en" ? "Status" : "Status"}</th>
                      <th className="th text-right">{locale === "en" ? "Material" : "Material"}</th>
                      <th className="th text-right">{locale === "en" ? "Labor" : "Tenaga"}</th>
                      <th className="th text-right">{locale === "en" ? "Total" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100">
                    {equipCost.maintenanceRows.map((r) => (
                      <tr key={r.id} className="hover:bg-surface">
                        <td className="td font-mono text-xs text-navy-900">{r.id}</td>
                        <td className="td text-steel-600">{r.equipmentName}</td>
                        <td className="td"><StatusBadge status={r.status} /></td>
                        <td className="td text-right">{fmtRupiah(r.material)}</td>
                        <td className="td text-right">{fmtRupiah(r.labor)}</td>
                        <td className="td text-right font-semibold">{fmtRupiah(r.material + r.labor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-[11px] text-steel-400">
            {locale === "en"
              ? "Realized figures are already charged to project COGS. Committed figures are ongoing work not yet charged."
              : "Angka terealisasi sudah dibebankan ke HPP proyek. Angka komitmen adalah pekerjaan berjalan yang belum dibebankan."}
          </p>
        </div>
      </Modal>

      {/* Modal BAST */}
      <Modal open={showBast} onClose={() => setShowBast(false)} title={S.detCreateBast} subtitle={`${pid} · ${nextBastId(bastForm.tanggal || todayISO())}`}
        footer={<><button className="btn-secondary" onClick={() => setShowBast(false)}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={saveBast}>{S.detSaveDraft}</AsyncButton></>}>
        <div className="space-y-3">
          <Field label={S.detMileField} hint={S.detMileHint} required>
            <select className="input" value={bastForm.milestone} onChange={(e) => setBastForm({ ...bastForm, milestone: e.target.value })}>
              <option value="">{S.detPickMile}</option>
              {wbs.map((t) => <option key={t.task} value={t.task}>{t.task} · {t.progress}%</option>)}
            </select>
          </Field>
          <FormGrid>
            <Field label={S.dateField} required><input type="date" className="input" value={bastForm.tanggal} onChange={(e) => setBastForm({ ...bastForm, tanggal: e.target.value })} /></Field>
            <Field label={S.detAmountField} hint={contractValue > 0 ? `Sisa kontrak ${fmtRupiah(sisaKontrak)}` : (boqTotal > 0 ? S.detAmountHintBoq.replace("{a}", fmtRupiah(boqTotal)) : S.detAmountHintPlain)}>
              <MoneyInput className="input" value={bastForm.amount} onChange={(v) => setBastForm({ ...bastForm, amount: v })} placeholder={contractValue > 0 ? String(sisaKontrak) : (boqTotal > 0 ? String(boqTotal) : S.detAmountPh)} />
            </Field>
          </FormGrid>
          <Field label={S.detSignerField} required><input className="input" value={bastForm.signer} onChange={(e) => setBastForm({ ...bastForm, signer: e.target.value })} placeholder={S.detSignerPh} /></Field>
          <Field label={S.detAttachField}><input className="input" value={bastForm.lampiran} onChange={(e) => setBastForm({ ...bastForm, lampiran: e.target.value })} placeholder={S.detAttachPh} /></Field>
          <FileUploadButton label={S.detAttachUpload} onUploaded={(url) => setBastForm((v) => ({ ...v, lampiran: url }))} />
        </div>
      </Modal>

      {/* Modal change order */}
      <Modal open={showCo} onClose={() => setShowCo(false)} title={S.detCoModal} subtitle={pid}
        footer={<><button className="btn-secondary" onClick={() => setShowCo(false)}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={saveCo}>{S.detProposeCo}</AsyncButton></>}>
        <div className="space-y-3">
          <Field label={S.detCoTitleField} required><input className="input" value={coForm.title} onChange={(e) => setCoForm({ ...coForm, title: e.target.value })} placeholder={S.detCoTitlePh} /></Field>
          <FormGrid>
            <Field label={S.detCoImpactField} hint={S.detCoImpactHint}><MoneyInput className="input" value={coForm.impact} onChange={(v) => setCoForm({ ...coForm, impact: v })} placeholder={S.detCoImpactPh} /></Field>
            <Field label={S.dateField}><input type="date" className="input" value={coForm.date} onChange={(e) => setCoForm({ ...coForm, date: e.target.value })} /></Field>
          </FormGrid>
          <Field label={S.detRequester} required><input className="input" value={coForm.requestedBy} onChange={(e) => setCoForm({ ...coForm, requestedBy: e.target.value })} placeholder={S.detRequesterPh} /></Field>
          {/* F3-C-05: perubahan item pada surat BoQ aktif */}
          {coDocs.length > 0 && (
            <Field label={S.detCoDoc} hint={S.detCoDocHint}>
              <select className="input" value={coDocId} onChange={(e) => { setCoDocId(e.target.value); setCoChanges([]); }}>
                <option value="">{S.detCoDocNone}</option>
                {coDocs.map((d) => <option key={String(d.id)} value={String(d.id)}>{String(d.number)} · Rev {String(d.revision ?? 0)}</option>)}
              </select>
            </Field>
          )}
          {coDocId && (
            <div className="space-y-2 rounded-xl border border-steel-200 p-3">
              {coChanges.map((ch, i) => {
                const patch = (p: Partial<CoChangeForm>) => setCoChanges(coChanges.map((x, j) => (j === i ? { ...x, ...p } : x)));
                return (
                  <div key={i} className="grid grid-cols-12 items-end gap-2">
                    <div className="col-span-4 sm:col-span-2">
                      <select className="input" aria-label={S.detCoOp} value={ch.op} onChange={(e) => patch({ op: e.target.value as CoChangeForm["op"] })}>
                        <option value="update">{S.detCoOpUpdate}</option><option value="add">{S.detCoOpAdd}</option><option value="remove">{S.detCoOpRemove}</option>
                      </select>
                    </div>
                    <div className="col-span-8 sm:col-span-4">
                      {ch.op === "add"
                        ? <input className="input" placeholder={S.detCoItemName} value={ch.name} onChange={(e) => patch({ name: e.target.value })} />
                        : <select className="input" aria-label={S.detCoItem} value={ch.itemId} onChange={(e) => patch({ itemId: e.target.value })}>
                            <option value="">{S.detCoItem}</option>
                            {coDocItems.map((b) => <option key={String(b.id)} value={String(b.id)}>{String(b.name)} · {fmtRupiah(Number(b.totalPrice ?? 0))}</option>)}
                          </select>}
                    </div>
                    {ch.op !== "remove" && (
                      <>
                        <div className="col-span-4 sm:col-span-2"><NumInput min={0} className="input" placeholder={S.detCoQty} value={ch.quantity} onChange={(e) => patch({ quantity: e.target.value })} /></div>
                        <div className="col-span-6 sm:col-span-3"><MoneyInput className="input" placeholder={S.detCoPrice} value={ch.unitPrice} onChange={(v) => patch({ unitPrice: v })} /></div>
                      </>
                    )}
                    <button type="button" className="btn-secondary col-span-2 h-9 px-2 text-xs sm:col-span-1" aria-label={S.detCoRemoveRow} onClick={() => setCoChanges(coChanges.filter((_, j) => j !== i))}>×</button>
                  </div>
                );
              })}
              <button type="button" className="btn-secondary text-xs" onClick={() => setCoChanges([...coChanges, { op: "update", itemId: "", name: "", quantity: "", unit: "", unitPrice: "" }])}><Plus className="h-3.5 w-3.5" /> {S.detCoAddRow}</button>
              {coChanges.length > 0 && <p className="text-xs text-steel-600">{S.detCoAutoImpact.replace("{v}", fmtRupiah(coChangeImpact))}</p>}
            </div>
          )}
        </div>
</Modal>

      {/* Modal risiko dihapus (D8): risiko kini dihasilkan otomatis dari WBS
          dan milestone WO. Form input manual tidak diperlukan lagi. */}

      {/* Modal catat realisasi (R2: tombol toast-only dijadikan tulis beneran) */}
      <Modal open={showActual} onClose={() => setShowActual(false)} title={S.detActualModal}
        footer={<><button className="btn-secondary" onClick={() => setShowActual(false)}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={saveActual}>{S.saveBtn}</AsyncButton></>}>
        <Field label={S.detActualAmount}>
          <MoneyInput className="input" value={actualVal} onChange={(v) => setActualVal(v)} placeholder={S.detActualPh} />
        </Field>
        <p className="mt-2 text-xs text-steel-500">{S.detActualNow.replace("{a}", fmtRupiah(Number(project.actual ?? 0)))}</p>
      </Modal>

      {/* Modal ubah status (kaku: konfirmasi + alasan wajib) */}
      <Modal open={statusPending !== null} onClose={() => { setStatusPending(null); setStatusReason(""); }} title={S.detStatusTitle.replace("{a}", statusPending ?? "")}
        footer={<><button className="btn-secondary" onClick={() => { setStatusPending(null); setStatusReason(""); }}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={confirmStatus}>{S.saveBtn}</AsyncButton></>}>
        <p className="text-sm text-steel-600">{project.id} · {project.status} → {statusPending}</p>
        <Field label={S.detStatusReason}>
          <textarea className="input" rows={3} value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
        </Field>
      </Modal>

      {/* Modal geser tahap (kaku: E1 gate + alasan wajib + rincian blocker) */}
      {(() => {
        const destTahap = tahapMove ? tahapListOf(project)[tahapListOf(project).indexOf(tahapOf(project)) + tahapMove.dir] : "";
        const moveBlockers = tahapMove && tahapMove.dir === 1 && destTahap
          ? getStageTransitionBlockers(tahapOf(project), destTahap, project, data, locale)
          : [];
        const isBlocked = moveBlockers.length > 0;

        return (
          <Modal
            open={tahapMove !== null}
            onClose={() => { setTahapMove(null); setTahapReason(""); }}
            title={S.detTahapTitle.replace("{a}", pid)}
            wide={isBlocked}
            footer={<>
              <button className="btn-secondary" onClick={() => { setTahapMove(null); setTahapReason(""); }}>{S.cancelBtn}</button>
              <AsyncButton
                className="btn-primary"
                disabled={isBlocked}
                onAction={confirmTahapMove}
              >
                {S.saveBtn}
              </AsyncButton>
            </>}
          >
            <p className="text-sm font-semibold text-navy-900">
              {tahapOf(project)} → {destTahap || "-"}
            </p>

            {isBlocked && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <h4>{S.detBlockerTitle}</h4>
                </div>
                <p className="mt-1 text-amber-800">
                  {S.detBlockerDesc.replace("{to}", tahapLabel(destTahap, locale))}
                </p>
                <div className="mt-2.5 max-h-60 overflow-y-auto space-y-2 pr-1">
                  {moveBlockers.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white p-2.5 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900">{b.name}</span>
                          <Badge tone={b.statusTone}>{b.section}</Badge>
                        </div>
                        <p className="mt-0.5 text-steel-600">{b.statusReason}</p>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary text-[11px] shrink-0"
                        onClick={() => {
                          setTahapMove(null);
                          setTahapReason("");
                          setTab(b.tab);
                          if (b.targetDocId) {
                            const targetDoc = data.documents.find((d) => d.id === b.targetDocId);
                            if (targetDoc) setDocDetail(targetDoc);
                          }
                          toast(`${b.name} (${b.section})`, "info");
                        }}
                      >
                        {S.detBlockerAction} →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field label={S.detTahapReason}>
              <textarea className="input" rows={3} value={tahapReason} onChange={(e) => setTahapReason(e.target.value)} placeholder="Tulis alasan perubahan tahap..." />
            </Field>
          </Modal>
        );
      })()}

      {/* Modal share */}
      <Modal open={docDetail !== null} onClose={() => setDocDetail(null)} wide
        title={docDetail ? String(docDetail.title) : ""}
        subtitle={docDetail ? `${String(docDetail.id)} · ${String(docDetail.type)} · ${String(docDetail.version)}` : undefined}
        footer={<>
          <button className="btn-secondary" onClick={() => setDocDetail(null)}>{S.cancelBtn}</button>
          {docDetail && docDetail.type === "BoQ" && (
            <button
              type="button"
              className="btn-secondary text-ocean-700 hover:bg-ocean-50"
              onClick={() => {
                setDocDetail(null);
                setTab("BoQ");
              }}
            >
              {S.detGoToBoq}
            </button>
          )}
          {docDetail && (
            /* Excel tetap ada, tapi sebagai aksi kedua di dalam modal - bukan
               satu-satunya jalan melihat isi dokumen. */
            <button className="btn-primary" onClick={() => {
              const d = docDetail;
              void exportExcel(
                [["Kolom", "Nilai"], ["ID", d.id], ["Judul", d.title], ["Tipe", d.type], ["Proyek", pid], ["Versi", d.version], ["Status", d.status], ["Diperbarui", d.updated], ["Pemilik", d.owner]],
                `${d.id}-ringkasan`,
              ).then(() => toast(S.detToastExported.replace("{a}", String(d.id)))).catch(() => toast(S.saveFail, "info"));
            }}>
              <FileDown className="h-3.5 w-3.5" /> {S.excelBtn}
            </button>
          )}
        </>}
      >
        {docDetail && (() => {
          const d = docDetail;
          const att = docAttachment(d);
          const revs = Array.isArray(d.revisions) ? (d.revisions as Array<Record<string, unknown>>) : [];
          const assignerVal = String(d.assigner || (d.type === "BoQ" ? d.owner : "") || "");
          const fields: Array<[string, string]> = [
            [locale === "en" ? "Document ID" : "ID dokumen", String(d.id)],
            [locale === "en" ? "Title" : "Judul", String(d.title)],
            [locale === "en" ? "Type" : "Tipe", String(d.type)],
            [locale === "en" ? "Project" : "Proyek", pid],
            [locale === "en" ? "Version" : "Versi", String(d.version)],
            [locale === "en" ? "Status" : "Status", String(d.status)],
            [S.detAssignerLabel, assignerVal ? assignerVal : "-"],
            [locale === "en" ? "Owner" : "Pemilik", String(d.owner)],
            [locale === "en" ? "Updated" : "Diperbarui", fmtTanggal(String(d.updated))],
            [locale === "en" ? "Copy" : "Salinan", String(d.docCopy ?? "Terkendali")],
          ];
          const approval = [d.approvalStatus, d.approvedBy, d.approvedAt ? fmtTanggal(String(d.approvedAt)) : ""].filter((x) => x !== "" && x !== undefined && String(x) !== "-").map(String).join(" · ");
          return (
            <div className="space-y-4">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {fields.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-steel-500">{k}</dt>
                    <dd className="text-right font-medium text-navy-900">{v}</dd>
                  </div>
                ))}
                {approval !== "" && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-steel-500">{locale === "en" ? "Approval" : "Persetujuan"}</dt>
                    <dd className="text-right font-medium text-navy-900">{approval}</dd>
                  </div>
                )}
              </dl>
              {att.url !== "" && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-navy-900">{locale === "en" ? "Attachment" : "Lampiran"}</h4>
                  <DocumentPreviewPanel doc={{ title: String(d.title), fileUrl: att.url, fileName: att.fileName, subtitle: String(d.id) }} />
                </div>
              )}
              {revs.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-navy-900">{locale === "en" ? "Revision history" : "Riwayat revisi"}</h4>
                  <div className="space-y-1 text-xs text-steel-600">
                    {revs.map((r, i) => (
                      <p key={`${String(r.version)}-${i}`}>
                        <span className="font-mono text-navy-900">{String(r.version ?? "-")}</span>
                        {" · "}{fmtTanggal(String(r.at ?? ""))}
                        {" · "}{String(r.by ?? "-")}
                        {r.note ? ` · ${String(r.note)}` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <Modal open={showShare} onClose={() => setShowShare(false)} title={S.detShareModal}
        footer={<><button className="btn-secondary" onClick={() => setShowShare(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={async () => {
          if (!shareForm.docId || !shareForm.to) { toast(S.detToastPickDoc, "info"); return; }
          const doc = docs.find((d: any) => d.id === shareForm.docId);
          try {
            await update("documents", shareForm.docId, { sharedWith: [...(doc?.sharedWith ?? []), shareForm.to] });
            log("berbagi dokumen dengan atasan", `${shareForm.docId} → ${shareForm.to}`, "Dokumen");
            toast(S.detToastShared.replace("{a}", shareForm.to));
            setShowShare(false);
            setShareForm({ docId: "", to: "" });
          } catch (e) {
            toast(e instanceof Error ? e.message : S.saveFail, "info");
          }
        }}>{S.detSendBtn}</button></>}>
        <FormGrid>
          <Field label={S.detDocField} required>
            <select className="input" value={shareForm.docId} onChange={(e) => setShareForm({ ...shareForm, docId: e.target.value })}>
              <option value="">{S.detPickDoc}</option>
              {docs.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </Field>
          <Field label={S.detShareTo} required><input className="input" value={shareForm.to} onChange={(e) => setShareForm({ ...shareForm, to: e.target.value })} placeholder={S.detShareToPh} /></Field>
        </FormGrid>
      </Modal>

      {/* Modal update WBS task */}
      <Modal open={wbsTaskUpdate !== null} onClose={() => setWbsTaskUpdate(null)} title={S.detWbsUpdateTitle.replace("{a}", wbsTaskUpdate ?? "")}
        footer={<><button className="btn-secondary" onClick={() => setWbsTaskUpdate(null)}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={saveWbsTask}>{S.saveBtn}</AsyncButton></>}>
        <div className="space-y-3">
          <Field label={S.detProgField} hint={S.detProgHint} required><NumInput min={0} max={100} className="input" value={wbsUpdateForm.progress} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, progress: e.target.value })} placeholder={S.detProgPh} /></Field>
          <FormGrid>
            <Field label={S.detHours}><NumInput className="input" value={wbsUpdateForm.hours} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, hours: e.target.value })} placeholder={S.detHoursPh} /></Field>
            <Field label={S.detDft} hint={S.detDftHint}><NumInput min={0} className="input" value={wbsUpdateForm.dft} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, dft: e.target.value })} placeholder={S.detDftPh} /></Field>
          </FormGrid>
          <Field label={S.detMaterial}>
            <SearchSelect
              value={wbsUpdateForm.material}
              onChange={(val) => setWbsUpdateForm({ ...wbsUpdateForm, material: val })}
              options={invList.map((inv) => ({
                value: String(inv.name ?? ""),
                label: String(inv.name ?? ""),
                sublabel: `Stok: ${Number(inv.stock ?? 0)} ${String(inv.unit ?? "unit")}`,
              }))}
              ariaLabel={S.detMaterial}
              placeholder={locale === "en" ? "Select material…" : "Pilih material…"}
              emptyText={locale === "en" ? "No materials found" : "Material tidak ditemukan"}
            />
          </Field>
          {wbsUpdateForm.material && (
            <Field label={S.detMaterialQty} hint={S.detMaterialQtyHint}>
              <NumInput min={1} className="input" value={wbsUpdateForm.materialQty} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, materialQty: e.target.value })} placeholder="1" />
            </Field>
          )}
          <Field label={S.detStation} hint={wbsTaskUpdate && /hull/i.test(wbsTaskUpdate) ? S.detStationReq : S.detStationOpt}>
            <select className="input" value={wbsUpdateForm.station} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, station: e.target.value })}>
              <option value="">{S.detPickStation}</option>
              {STATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={S.detPhotoNote} hint={S.detPhotoHint}><input className="input" value={wbsUpdateForm.photoNote} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, photoNote: e.target.value })} placeholder={S.detPhotoPh} /></Field>
          {wbsUpdateForm.photoUrl && (
            <div className="flex items-center gap-2">
              <SecureImg src={wbsUpdateForm.photoUrl} alt={S.detPhotoImage} name={S.detPhotoImage} className="h-14 w-20 rounded-lg border border-steel-200 object-cover" />
              <DocumentPreviewCell doc={{ title: S.detPhotoImage, fileUrl: wbsUpdateForm.photoUrl }} />
            </div>
          )}
          <Field label={`${S.detPhotoUpload} *`} hint={S.detPhotoHint}>
            <PhotoUploader
              value={wbsUpdateForm.photos}
              onChange={(photos) => setWbsUpdateForm((current) => ({ ...current, photos }))}
              labels={{ add: S.detPhotoUpload, caption: S.detPhotoCaption, remove: S.detPhotoRemove, empty: S.detPhotoEmpty, uploading: S.detPhotoUploading, uploadError: S.detPhotoUploadError, imageAlt: S.detPhotoImage }}
              onUploadError={() => toast(S.detPhotoUploadError, "info")}
            />
          </Field>
          {(() => {
            const currentTask = wbs.find((w) => w.task === wbsTaskUpdate);
            const entries = (currentTask?.history ?? []).map((h) => ({
              id: h.id,
              actor: h.actor,
              date: h.date,
              action: h.action,
              before: h.from !== undefined ? `${h.from}%` : undefined,
              after: h.to !== undefined ? `${h.to}%` : undefined,
              note: h.note,
              photos: h.photos,
            }));
            return (
              <ChangeHistory
                entries={entries}
                locale={locale}
                labels={{ title: S.detHistoryTitle, loading: S.detHistoryLoading, empty: S.detHistoryEmpty, error: S.detHistoryError, serverUnavailable: S.detHistoryUnavailable, before: S.detHistoryBefore, after: S.detHistoryAfter, redacted: S.detHistoryRedacted }}
              />
            );
          })()}
          <Field label={S.statusLabel}>
            <select className="input" value={wbsUpdateForm.status} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, status: e.target.value as "Sedang" | "Selesai" })}>
              <option value="Sedang">Sedang Dikerjakan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </Field>
          <Field label={S.detPred} hint={S.detPredHint}>
            <select className="input" value={wbsUpdateForm.predecessor} onChange={(e) => setWbsUpdateForm({ ...wbsUpdateForm, predecessor: e.target.value })}>
              <option value="">{S.detNoPred}</option>
              {wbs.filter((w) => w.task !== wbsTaskUpdate).map((w) => <option key={w.task} value={w.task}>{w.task}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Modal Assign WBS */}
      <WbsMaterialModal projectId={pid} task={wbsMatTask} onClose={() => setWbsMatTask(null)} />
      <ImportPreviewModal
        open={scopePreview !== null}
        title={S.detScopeImpPreviewTitle}
        fileName={scopePreview?.file ?? ""}
        columns={[S.detScopeColService, S.detScopeColLoc, S.detScopeColDesc]}
        rows={scopePreview?.rows ?? []}
        onCancel={() => setScopePreview(null)}
        onConfirm={confirmScopeImport}
      />
      <Modal
        open={wbsAssignTask !== null}
        onClose={() => setWbsAssignTask(null)}
        title={S.detAssignTitle.replace("{a}", wbsAssignTask ?? "")}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setWbsAssignTask(null)}>{S.cancelBtn}</button>
            <AsyncButton className="btn-primary" onAction={saveAssign}>{S.saveBtn}</AsyncButton>
          </>
        }
      >
        <div className={`space-y-4 transition-all duration-200 ${assignDropdownOpen ? "min-h-[25rem]" : "min-h-0"}`}>
          <Field label={S.detAssignType}>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-steel-700">
                <input
                  type="radio"
                  name="assignType"
                  value="internal"
                  checked={assignForm.type === "internal"}
                  onChange={() => setAssignForm({ ...assignForm, type: "internal" })}
                />
                {S.detAssignInternal}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-steel-700">
                <input
                  type="radio"
                  name="assignType"
                  value="external"
                  checked={assignForm.type === "external"}
                  onChange={() => setAssignForm({ ...assignForm, type: "external" })}
                />
                {S.detAssignExternal}
              </label>
            </div>
          </Field>

          {assignForm.type === "internal" ? (
            <Field label={S.detAssignEmployeeLabel}>
              <SearchSelect
                value={assignForm.employeeId}
                onChange={(val) => setAssignForm({ ...assignForm, employeeId: val })}
                options={(data.employees ?? []).map((e) => ({
                  value: String(e.id),
                  label: String(e.name ?? e.id),
                  sublabel: `${String(e.role ?? e.jabatan ?? "")} · ${String(e.branch ?? "")}`,
                }))}
                ariaLabel={S.detAssignEmployeeLabel}
                placeholder={S.detPickEmployee}
                emptyText={locale === "en" ? "No employees found" : "Karyawan tidak ditemukan"}
                onOpenChange={setAssignDropdownOpen}
              />
            </Field>
          ) : (
            <Field label={S.detAssignSubconLabel}>
              <SearchSelect
                value={assignForm.subconId}
                onChange={(val) => setAssignForm({ ...assignForm, subconId: val })}
                options={(data.subcontractors ?? []).map((s) => ({
                  value: String(s.id),
                  label: String(s.name ?? s.id),
                  sublabel: `${String(s.specialty ?? s.bidang ?? "")} · ${String(s.city ?? "")}`,
                }))}
                ariaLabel={S.detAssignSubconLabel}
                placeholder={S.detAssignSubconLabel}
                emptyText={locale === "en" ? "No subcontractors found" : "Subkontraktor tidak ditemukan"}
                onOpenChange={setAssignDropdownOpen}
              />
            </Field>
          )}
          {assignForm.type === "external" && (
            <Field label={S.subWoValueLabel} hint={S.subWoValueHint}>
              <MoneyInput className="input" value={assignForm.woValue} onChange={(v) => setAssignForm({ ...assignForm, woValue: v })} placeholder="0" />
            </Field>
          )}
        </div>
      </Modal>

      {/* Modal Riwayat WBS Task */}
      <Modal
        open={wbsHistoryTask !== null}
        onClose={() => setWbsHistoryTask(null)}
        title={S.detWbsHistoryTitle.replace("{a}", wbsHistoryTask ?? "")}
        footer={<button className="btn-secondary" onClick={() => setWbsHistoryTask(null)}>{S.cancelBtn}</button>}
      >
        {(() => {
          const targetWbs = wbs.find((w) => w.task === wbsHistoryTask);
          const entries = (targetWbs?.history ?? []).map((h) => ({
            id: h.id,
            actor: h.actor,
            date: h.date,
            action: h.action,
            before: h.from !== undefined ? `${h.from}%` : undefined,
            after: h.to !== undefined ? `${h.to}%` : undefined,
            note: h.note,
            photos: h.photos,
          }));
          return (
            <ChangeHistory
              entries={entries}
              locale={locale}
              labels={{
                title: S.detHistoryTitle,
                loading: S.detHistoryLoading,
                empty: S.detHistoryEmpty,
                error: S.detHistoryError,
                serverUnavailable: S.detHistoryUnavailable,
                before: S.detHistoryBefore,
                after: S.detHistoryAfter,
                redacted: S.detHistoryRedacted,
              }}
            />
          );
        })()}
      </Modal>

      {/* Modal WBS */}
      <Modal open={showWbs} onClose={() => setShowWbs(false)} title={S.detWbsModal}
        footer={<><button className="btn-secondary" onClick={() => setShowWbs(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={saveWbs}>{S.addBtn}</button></>}>
        <div className="space-y-3">
          <Field label={S.prjScopeCat || (locale === "en" ? "Scope Category" : "Ruang Lingkup (Kategori)")} required>
            <select
              className="input"
              value={wbsForm.category}
              onChange={(e) => setWbsForm({ ...wbsForm, category: e.target.value })}
            >
              <option value="">{S.prjScopeCatSelect || (locale === "en" ? "-- Select Scope --" : "-- Pilih Ruang Lingkup --")}</option>
              {scopeList(project.scope).map((s) => (
                <option key={s.service} value={s.service}>
                  {s.service} {s.harga ? `(${fmtRupiah(s.harga)})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label={S.detStageName} required>
            <input className="input" placeholder={S.prjScopeSubTask || (locale === "en" ? "Stage / sub-task name" : "Nama tahapan / sub-pekerjaan")} value={wbsForm.task} onChange={(e) => setWbsForm({ ...wbsForm, task: e.target.value })} />
          </Field>
          <FormGrid>
            <Field label={S.detStart}><input type="date" className="input" placeholder={S.detWbsStartPh} value={wbsForm.start === "-" ? "" : wbsForm.start} onChange={(e) => setWbsForm({ ...wbsForm, start: e.target.value })} /></Field>
            <Field label={S.detEnd}><input type="date" className="input" placeholder={S.detWbsEndPh} value={wbsForm.end === "-" ? "" : wbsForm.end} onChange={(e) => setWbsForm({ ...wbsForm, end: e.target.value })} /></Field>
            <Field label={S.detProgField}><NumInput className="input" value={wbsForm.progress} onChange={(e) => setWbsForm({ ...wbsForm, progress: e.target.value })} /></Field>
          </FormGrid>

          {/* Bobot otomatis dari Ruang Lingkup */}
          <div className="rounded-xl border border-steel-200 bg-steel-50/80 p-3 text-xs space-y-1">
            <span className="font-semibold text-navy-800">{S.prjWbsAutoWeightNote || (locale === "en" ? "Automatic Weight Calculation" : "Bobot Otomatis Ruang Lingkup")}</span>
            <p className="text-steel-600 leading-relaxed">
              {locale === "en"
                ? "Percentage weight is automatically derived from the scope cost ratio. Each stage under this category divides the category weight evenly."
                : "Bobot persentase tahapan dihitung otomatis dari nilai biaya ruang lingkup pekerjaan. Tahapan di bawah kategori ini membagi bobot kategori secara proporsional."}
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal konfirmasi hapus tahapan WBS */}
      <ConfirmModal
        open={stageToDelete !== null}
        onCancel={() => setStageToDelete(null)}
        onConfirm={async () => {
          if (!stageToDelete) return;
          // Predecessor yang menunjuk tahapan terhapus ikut dilepas agar tidak yatim.
          const remaining = wbs.filter((w) => w.task !== stageToDelete)
            .map((w) => (w.predecessor === stageToDelete ? { ...w, predecessor: undefined } : w));
          const next = syncWbsWeightsWithScope(remaining, project.scope);
          try {
            await saveWbsWithConflictRetry(next);
            log("menghapus tahapan WBS", `${pid} · ${stageToDelete}`, "Proyek");
            toast(S.detDelStageSuccess.replace("{a}", stageToDelete));
            // Tahapan sudah terhapus; gagal menyelaraskan progres bukan gagal hapus.
            await update("projects", pid, { progress: calcProjectProgress(next, projectBoq) }).catch(() => undefined);
          } catch (e) {
            const pesan = e instanceof ApiError && e.code === "STAGE_IN_USE" ? S.detDelStageBlocked : S.detDelStageFailed;
            toast(pesan.replace("{a}", stageToDelete), "info");
          }
          setStageToDelete(null);
        }}
        title={S.detDelStageTitle}
        desc={S.detDelStageConfirm.replace("{a}", stageToDelete ?? "")}
        danger
      />

      {/* Modal tim */}
      <Modal open={showTeam} onClose={() => setShowTeam(false)} title={S.detTeamModal}
        footer={<><button className="btn-secondary" onClick={() => setShowTeam(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={async () => {
          if (!teamPick) { toast(S.detToastPickEmp, "info"); return; }
          if (teamIds.includes(teamPick)) { toast(S.detToastDupMember, "info"); return; }
          try {
            await saveTeamWithConflictRetry([...teamIds, teamPick]);
            log("menambah anggota tim", `${pid} · ${data.employees.find((e) => e.id === teamPick)?.name}`, "Proyek");
            toast(S.detToastMemberAdd); setShowTeam(false); setTeamPick("");
          } catch (e) {
            toast(e instanceof Error ? e.message : S.saveFail, "info");
          }
        }}>{S.addBtn}</button></>}>
        {/* Modal height menyesuaikan: saat option aktif min-h-[19rem], saat dropdown mati min-h-0 (compact) */}
        <div className={`transition-all duration-200 ${teamDropdownOpen ? "min-h-[19rem]" : "min-h-0"}`}>
        <Field label={S.detEmployee}>
          <SearchSelect
            value={teamPick}
            onChange={setTeamPick}
            options={data.employees.filter((e) => !teamIds.includes(e.id)).map((e) => ({ value: String(e.id), label: String(e.name), subLabel: `${String(e.role ?? "")} · ${String(e.dept ?? "")}` }))}
            placeholder={S.detPickEmployee}
            ariaLabel={S.detEmployee}
            onOpenChange={setTeamDropdownOpen}
          />
        </Field>
        </div>
      </Modal>

      {/* Modal dokumen proyek */}
      <Modal open={showDoc} onClose={() => setShowDoc(false)} title={S.detDocModal} subtitle={pid}
        footer={<><button className="btn-secondary" onClick={() => setShowDoc(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={async () => {
          if (!docTitle.trim()) { toast(S.detToastDocTitle, "info"); return; }
          try {
            /* Nilai yang diketik user disimpan sesuai sifatnya: kalau berbentuk
               URL, ini lampiran yang bisa langsung dipratinjau; kalau hanya
               nama berkas, itu metadata dan disimpan di `fileName`. Versi lama
               selalu menulis ke `fileName`, jadi lampiran yang diketik sebagai
               URL tidak pernah bisa dibuka. */
            const typed = docFile.trim();
            const created = await add("documents", {
              title: docTitle.trim(),
              type: docType,
              ...(docSubType.trim() !== "" ? { subType: docSubType.trim() } : {}),
              ...(docQcCertId.trim() !== "" ? { qcCertId: docQcCertId.trim() } : {}),
              project: pid,
              vessel: project.vessel,
              version: "v1.0",
              status: "Draft",
              updated: new Date().toISOString().slice(0, 10),
              owner: docOwner.trim() !== "" ? docOwner.trim() : sessionName,
              sharedWith: [],
              approvalStatus: "Draft",
              ...(looksLikeUrl(typed) ? { fileUrl: typed } : { fileName: typed || "-" }),
            }, { action: "mengarsipkan dokumen", module: "Dokumen" });
            toast(S.detToastDocAdd); setShowDoc(false); setDocTitle(""); setDocFile("");
            /* Pratinjau TIDAK dibuka otomatis lagi (item 6 revisi 2 Oktober).
               Sebelumnya `setOpenDocId` + `setLastUploadedId` langsung memuat
               berkas di dalam kartu begitu disimpan, jadi pengguna tidak
               pernah bisa menutup apa pun untuk melanjutkan pekerjaan - dan
               modal yang baru saja ditutup ikut dibuka lagi dari bawah.

               `lastUploadedId` tetap diisi: itu yang memberi ringkasan "Baru
               diunggah" dan sorotan tepi pada kartu, jadi pengguna tahu
               dokumen mana yang baru, tanpa isinya merebut layar. */
            setLastUploadedId(String(created.id));
            setOpenDocId("");
            setTab("Dokumen & Laporan");
          } catch (e) {
            toast(e instanceof Error ? e.message : S.saveFail, "info");
          }
        }} >{S.saveBtn}</button></>}>
        <div className="space-y-3">
          <Field label={S.detDocTitleField}><input className="input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} /></Field>
          {/* Tipe + sub-tipe + rujukan QC (item 5e revisi 2 Oktober).
              Ketiganya satu form yang sama dengan modul Dokumen: daftar tipe
              dari `DOC_TYPES`, bukan 8 nilai yang ditulis manual di sini -
              dokumen Penawaran/Dock Space/Surat Jalan/Tanda Terima tidak bisa
              dibuat dari tab proyek sebelumnya. "Kontrak Kerja" kini sub-tipe
              dari Kontrak, bukan tipe sendiri. */}
          <Field label={S.detDocType}>
            <select
              className="input"
              value={docType}
              onChange={(e) => { setDocType(e.target.value); setDocSubType(""); setDocQcCertId(""); }}
            >
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          {subTypesOf(docType).length > 0 && (
            <Field label={locale === "en" ? "Sub-type" : "Sub-tipe"}>
              <select className="input" value={docSubType} onChange={(e) => { setDocSubType(e.target.value); setDocQcCertId(""); }}>
                <option value="">-</option>
                {subTypesOf(docType).map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )}
          {docNeedsQc && (
            <Field
              label={locale === "en" ? "QC certificate reference" : "Rujukan Sertifikat QC"}
              hint={locale === "en"
                ? "Required so the archive can prove QC inspected this."
                : "Wajib diisi agar arsip bisa membuktikan tim QC sudah memeriksanya."}
            >
              <select className="input" value={docQcCertId} onChange={(e) => setDocQcCertId(e.target.value)}>
                <option value="">-</option>
                {docQcOptions.map((d) => (
                  <option key={String(d.id)} value={String(d.id)}>{String(d.id)} · {String(d.title ?? "")}</option>
                ))}
              </select>
              {docQcOptions.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-700">
                  {locale === "en"
                    ? "No QC certificate in this project yet."
                    : "Belum ada Sertifikat QC di proyek ini."}
                </p>
              )}
            </Field>
          )}
          <Field label={locale === "en" ? "Owner (person in charge)" : "Penanggung jawab"}>
            <EntityPicker
              value={docOwner}
              onChange={setDocOwner}
              options={docOwnerOptions}
              placeholder={locale === "en" ? "Search employee..." : "Cari karyawan..."}
              ariaLabel={locale === "en" ? "Owner" : "Penanggung jawab"}
              emptyText={locale === "en" ? "No matching employee." : "Tidak ada karyawan yang cocok."}
            />
          </Field>
          <Field label={S.detDocFile} hint={S.detDocFileHint}>
            <input className="input" value={docFile} onChange={(e) => setDocFile(e.target.value)} placeholder={S.detDocFilePh} />
          </Field>
          <FileUploadButton label={S.detAttachUpload} onUploaded={(url) => setDocFile(url)} />
          {/* Pratinjau langsung muncul begitu ada URL di field di atas -_Unggah_
              sudah mengisinya, dan mengetik URL juga langsung menambah pratinjau.
              Tidak ada tombol "tampilkan pratinjau" terpisah. Kalau yang diketik
              cuma nama berkas (bukan URL), panelnya sengaja tidak muncul dan
              field-nya diberi catatan, karena tidak ada berkas yang bisa
              diambil. */}
          {looksLikeUrl(docFile) ? (
            <div className="rounded-xl border border-steel-100 bg-surface p-2">
              <p className="mb-1 text-[11px] font-semibold text-steel-500">Pratinjau sebelum simpan</p>
              <InlineDocPreview url={docFile.trim()} height={/\.pdf(\?|$)/i.test(docFile) ? "h-64" : "h-44"} />
            </div>
          ) : docFile.trim() !== "" ? (
            <p className="text-[11px] text-amber-700">
              &ldquo;{docFile.trim()}&rdquo; dibaca sebagai nama berkas, bukan URL, jadi tidak bisa dipratinjau. Gunakan tombol Unggah bila ingin melampirkan berkasnya.
            </p>
          ) : null}
        </div>
      </Modal>

      {/* Modal scope */}
      <Modal open={showScope} onClose={() => setShowScope(false)} title={S.detScopeModal}
        footer={<><button className="btn-secondary" onClick={() => setShowScope(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={saveScope}>{S.addBtn}</button></>}>
        <div className="grid gap-3">
          <Field label={S.prjScopeType} required>
            <input className="input" placeholder={S.detScopeTypePh2} value={scopeVal.service} onChange={(e) => setScopeVal((v) => ({ ...v, service: e.target.value }))} />
          </Field>
          <Field label={S.prjScopePrice}>
            <MoneyInput className="input" placeholder={S.prjScopePricePh} value={scopeVal.harga} onChange={(v) => setScopeVal((prev) => ({ ...prev, harga: v }))} />
          </Field>
          <Field label={S.prjScopeDesc}>
            <input className="input" placeholder={S.detScopeDescPh} value={scopeVal.deskripsi} onChange={(e) => setScopeVal((v) => ({ ...v, deskripsi: e.target.value }))} />
          </Field>
        </div>
      </Modal>
      <ConfirmModal open={delRec !== null}
        title={delRec ? (locale === "en" ? `Delete ${delRec.kind.slice(0, -1)} ${String(delRec.row.id)}?` : `Hapus ${delRec.row.id}?`) : ""}
        desc={delRec ? (recLocked(delRec.kind, delRec.row) ?? (locale === "en"
          ? "This record will be permanently removed from the project."
          : "Record ini akan dihapus permanen dari proyek.")) : ""}
        confirmLabel={S.detConfirmDelete} danger
        confirmDisabled={delRec ? recLocked(delRec.kind, delRec.row) !== null : false}
        onCancel={() => setDelRec(null)}
        onConfirm={confirmDelRec}
      />

      <ConfirmModal open={delScope !== null} title={S.detDelScopeTitle} desc={S.detDelScopeDesc}
        confirmLabel={S.detConfirmDelete} danger onCancel={() => setDelScope(null)}
        onConfirm={async () => {
          try {
            if (delScope !== null) {
              const nextScope = scopeList(project.scope).filter((_, i) => i !== delScope);
              const totalP = scopeTotal(nextScope);
              const patch: Record<string, unknown> = { scope: nextScope };
              if (totalP > 0) patch.budget = totalP;
              await update("projects", pid, patch);
            }
          } catch {
            toast(S.detToastScopeDelFail, "info");
          }
          setDelScope(null);
        }} />
      <ConfirmModal open={showDelBaseline} title={S.detDelBaseTitle} desc={S.detDelBaseDesc}
        confirmLabel={S.detConfirmDelete} danger onCancel={() => setShowDelBaseline(false)}
        onConfirm={async () => { try { await update("projects", pid, { wbsBaseline: undefined }); log("menghapus baseline WBS", pid, "Proyek"); toast(S.detToastBaseDel, "info"); setShowDelBaseline(false); } catch (e) { toast(e instanceof Error ? e.message : S.saveFail, "info"); } }} />

      {/* Modal Tambah Persyaratan Dokumen Proyek */}
      <Modal
        open={showAddReq}
        onClose={() => setShowAddReq(false)}
        title={S.detReqDocModalTitle}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowAddReq(false)}>{S.cancelBtn}</button>
            <button
              className="btn-primary"
              onClick={async () => {
                if (!reqForm.name.trim()) {
                  toast(locale === "en" ? "Enter requirement name" : "Masukkan nama persyaratan", "info");
                  return;
                }
                const current = Array.isArray(project.customRequirements) && project.customRequirements.length > 0
                  ? (project.customRequirements as Array<{ id: string; name: string; type?: string; notes?: string }>)
                  : PLANNING_SUBCLASSES.map((p) => ({ id: p.id, name: p.name, type: "Drawing" }));
                const newId = `REQ-${Date.now().toString(36).toUpperCase()}`;
                const next = [...current, { id: newId, name: reqForm.name.trim(), type: reqForm.type, notes: reqForm.notes.trim() }];
                try {
                  await update("projects", pid, { customRequirements: next });
                  toast(S.detReqDocAdded, "success");
                  setShowAddReq(false);
                  setReqForm({ name: "", type: "Drawing", notes: "" });
                } catch (e) {
                  toast(e instanceof Error ? e.message : S.saveFail, "info");
                }
              }}
            >
              {S.addBtn}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={S.detReqDocName}>
            <input
              className="input"
              value={reqForm.name}
              onChange={(e) => setReqForm({ ...reqForm, name: e.target.value })}
              placeholder={locale === "en" ? "e.g. Fire Control Plan" : "misal: Fire Control Plan"}
            />
          </Field>
          <Field label={S.detReqDocType}>
            <select
              className="input"
              value={reqForm.type}
              onChange={(e) => setReqForm({ ...reqForm, type: e.target.value })}
            >
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label={S.detReqDocNotes}>
            <input
              className="input"
              value={reqForm.notes}
              onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
              placeholder={locale === "en" ? "Notes / details..." : "Catatan atau rincian persyaratan..."}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
