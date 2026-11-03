import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Anchor,
  Wallet,
  TrendingUp,
  ArrowRight,
  Boxes,
  Sparkles,
  Cpu,
  Plus,
  Download,
  Calendar,
  AlertTriangle,
  Maximize,
  Minimize,
  Ship,
  Users,
  HardHat,
  ShoppingCart,
  ShieldCheck,
  Briefcase,
  Layers,
  CheckCircle2,
  Building,
  Warehouse,
  Truck,
  FileText,
  CreditCard,
  CalendarCheck,
  UserCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Tooltip,
} from "recharts";
import {
  Card,
  CardHeader,
  KpiCard,
  PageHeader,
  RadialGauge,
  Donut,
  ChartTooltip,
  Stagger,
  StaggerItem,
  Badge,
  ProgressBar,
  Avatar,
  Modal,
  Field,
  toast,
  NumInput,
  AsyncButton,
} from "../components/ui";
import { useStore } from "../data/store";
import type { CollectionKey } from "../data/store";
import { useModuleSync } from "../data/useModuleSync";
import { scopeAlertStoreData } from "../data/scopeAlertData";
import { bucketByMonth, monthAxis, monthKeyOf, rebindLegacyMonthSeries } from "../utils/monthAxis";
import { lastPoint, numOf, pctChange, prevPoint } from "../utils/series";
import { warnLevelOf } from "../utils/inventoryWarn";
import { projectProgressOf } from "../utils/projectProgress";
import {
  ALERT_LEVELS,
  MODULE_ALERT_TO,
  buildModuleAlertItems,
  countByLevel,
  groupByLevel,
  type AlertLevel,
  type ModuleAlertItem,
  type ModuleAlertKey,
} from "../utils/moduleAlerts";

/* Urutan modul untuk kartu "Perlu Perhatian". */
const DASH_ALERT_KEYS: ModuleAlertKey[] = [
  "proyek",
  "drydock",
  "equipment",
  "qc",
  "inventori",
  "keuangan",
  "crm",
  "procurement",
  "subkontraktor",
  "kapal",
  "sdm",
  "payroll",
  "dokumen",
];

/* Urutan chip mengikuti kategori utama yang diminta pada kartu F3-M-03. */
const DASH_ALERT_CATEGORY_ORDER: ModuleAlertKey[] = [
  "proyek",
  "inventori",
  "keuangan",
  "sdm",
  "equipment",
  "qc",
  "drydock",
  "crm",
  "procurement",
  "subkontraktor",
  "kapal",
  "payroll",
  "dokumen",
];
const DASH_ALERT_CATEGORY_STORAGE_KEY = "isms.dashboard.attention.category";

function loadAttentionCategory(): ModuleAlertKey | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(DASH_ALERT_CATEGORY_STORAGE_KEY);
    return DASH_ALERT_CATEGORY_ORDER.find((key) => key === saved) ?? null;
  } catch {
    return null;
  }
}

/* Label modul untuk chip pengelompokan di kartu. */
const DASH_ALERT_LABEL: Record<ModuleAlertKey, { id: string; en: string }> = {
  proyek: { id: "Proyek", en: "Projects" },
  drydock: { id: "Drydock", en: "Drydock" },
  inventori: { id: "Inventori", en: "Inventory" },
  equipment: { id: "Equipment", en: "Equipment" },
  subkontraktor: { id: "Subkontraktor", en: "Subcontractors" },
  qc: { id: "QC & Safety", en: "QC & Safety" },
  crm: { id: "CRM", en: "CRM" },
  procurement: { id: "Procurement", en: "Procurement" },
  keuangan: { id: "Keuangan", en: "Finance" },
  sdm: { id: "SDM", en: "HR" },
  payroll: { id: "Payroll", en: "Payroll" },
  kapal: { id: "Kapal", en: "Vessels" },
  dokumen: { id: "Dokumen", en: "Documents" },
};

/* Nada chip per modul supaya kartu mudah dipindai sekilas. */
const DASH_ALERT_TONE: Record<ModuleAlertKey, string> = {
  proyek: "bg-navy-50 text-navy-700",
  drydock: "bg-ocean-50 text-ocean-700",
  inventori: "bg-amber-50 text-amber-700",
  equipment: "bg-violet-50 text-violet-700",
  subkontraktor: "bg-teal-50 text-teal-700",
  qc: "bg-rose-50 text-rose-700",
  crm: "bg-emerald-50 text-emerald-700",
  procurement: "bg-indigo-50 text-indigo-700",
  keuangan: "bg-amber-50 text-amber-700",
  sdm: "bg-sky-50 text-sky-700",
  payroll: "bg-lime-50 text-lime-700",
  kapal: "bg-cyan-50 text-cyan-700",
  dokumen: "bg-slate-100 text-slate-700",
};

/* Batas tampilan: kartu harus tetap ringkas. Sisanya ada di /notifikasi. */
const DASH_ALERT_CAP = 12;

const DASH_LEVEL_KEY = {
  kritis: "levelKritis",
  perhatian: "levelPerhatian",
  info: "levelInfo",
} as const satisfies Record<AlertLevel, "levelKritis" | "levelPerhatian" | "levelInfo">;

const DASH_LEVEL_BAR: Record<AlertLevel, string> = {
  kritis: "bg-rose-500",
  perhatian: "bg-amber-500",
  info: "bg-ocean-400",
};

const DASH_LEVEL_HEAD: Record<AlertLevel, string> = {
  kritis: "text-rose-900",
  perhatian: "text-amber-900",
  info: "text-ocean-800",
};
import { useAuth, hasPermission, canOpenModule } from "../auth/auth";

import { pdfServerReady } from "../services/pdfClient";
import { usePdfDoc } from "../components/usePdfDoc";
import { todayISO } from "../utils/format";
import { scopeNames } from "../utils/scope";
import {
  revenueSeries,
  sparkRevenue,
  sparkMargin,
  sparkProjects,
  sparkUtil,
  utilSeries,
  marginSeries,
  drydockLoad,
  insights,
  fmtMiliar,
} from "../data";
import { useT } from "../i18n/LanguageContext";
import type { Locale } from "../i18n/types";
import { n_misc } from "../i18n/n_misc";

const RANGES = ["6B", "12B"] as const;

/* Label status untuk card analisis status proyek yang sedang berjalan.
   "Proyek Terlambat" dan "Proyek Tertunda" memakai awalan yang sama supaya
   keduanya mudah dibandingkan berdampingan di strip distribusi - permintaan
   eksplisit: label "tertunda" perlu ada selain "terlambat". Status lain sudah
   berupa kalimat yang berdiri sendiri sehingga ditampilkan apa adanya.

   Dua bahasa, bukan satu: kamus EN pernah dilewati di sini, jadi begitu
   locale diubah ke Inggris seluruh label ini tetap Bahasa Indonesia -
   satu-satunya bagian Dashboard yang tidak ikut `locale`.
   Nilai status di DATA tetap Bahasa Indonesia (canonical), yang diterjemahkan
   hanya label tampilannya - sama seperti `i18n/status.ts`. */
const STATUS_LABEL: Record<string, { id: string; en: string }> = {
  Terlambat: { id: "Proyek Terlambat", en: "Overdue Projects" },
  Tertunda: { id: "Proyek Tertunda", en: "Pending Projects" },
  Selesai: { id: "Proyek Selesai", en: "Completed Projects" },
  Batal: { id: "Proyek Dibatalkan", en: "Cancelled Projects" },
};
const statusLabel = (s: string, locale: Locale): string => {
  const m = STATUS_LABEL[s];
  if (!m) return s;
  return locale === "en" ? m.en : m.id;
};

/* RANGES tetap: 6B = 6 bulan, 12B = 12 bulan. */

interface BranchTarget { revenue: number; projects: number }

function loadTargets(): Record<string, BranchTarget> {
  try {
    const raw = localStorage.getItem("isms.targets");
    const obj = raw ? JSON.parse(raw) as Record<string, BranchTarget> : {};
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch { return {}; }
}

/* Batch koleksi modul Dashboard untuk useModuleSync (pengganti resync penuh). */
const DB_COLS: CollectionKey[] = [
  "activities",
  "drydocks",
  "employees",
  "incidents",
  "inventory",
  "invoices",
  "ncr",
  "projects",
  "quotations",
  "vessels",
  "boq",
  "contracts",
  "purchaseOrders",
  "requisitions",
  "materialRequests",
  "leaves",
  "payables",
  "vendors",
  "movements",
];

export type DashboardScope =
  | "overview"
  | "inventori"
  | "sdm"
  | "keuangan"
  | "proyek"
  | "procurement"
  | "qc"
  | "commercial";

function defaultScopeForRole(role?: string): DashboardScope {
  const r = (role ?? "").toLowerCase();
  if (/gudang|warehouse|inventory|logistik/.test(r)) return "inventori";
  if (/\bhr\b|sdm|payroll|personalia/.test(r)) return "sdm";
  if (/finance|keuangan|pajak|tax|account/.test(r)) return "keuangan";
  if (/proyek|project|mekanik|bengkel|produksi/.test(r)) return "proyek";
  if (/procurement|purchasing|pengadaan/.test(r)) return "procurement";
  if (/qc|hse|safety|quality|inspeksi/.test(r)) return "qc";
  if (/commercial|crm|sales|marketing|kontrak/.test(r)) return "commercial";
  return "overview";
}

const DASH_SCOPES: { id: DashboardScope; labelKey: keyof typeof n_misc.id; icon: typeof Layers; tone: string }[] = [
  { id: "overview", labelKey: "dashScopeOverview", icon: Layers, tone: "from-sky-500 to-indigo-600" },
  { id: "inventori", labelKey: "dashScopeInventory", icon: Boxes, tone: "from-amber-500 to-orange-600" },
  { id: "sdm", labelKey: "dashScopeHr", icon: Users, tone: "from-blue-500 to-cyan-600" },
  { id: "keuangan", labelKey: "dashScopeFinance", icon: Wallet, tone: "from-emerald-500 to-teal-600" },
  { id: "proyek", labelKey: "dashScopeProject", icon: Anchor, tone: "from-indigo-500 to-blue-700" },
  { id: "procurement", labelKey: "dashScopeProcurement", icon: ShoppingCart, tone: "from-violet-500 to-purple-600" },
  { id: "qc", labelKey: "dashScopeQc", icon: ShieldCheck, tone: "from-rose-500 to-red-600" },
  { id: "commercial", labelKey: "dashScopeCommercial", icon: Briefcase, tone: "from-teal-500 to-emerald-600" },
];

export default function Dashboard() {

  const { data, branch, inBranch } = useStore();
  const scopedAlertData = useMemo(() => scopeAlertStoreData(data, branch), [data, branch]);
  const pdfDoc = usePdfDoc();
  /* Fetch per-batch modul (pengganti resync penuh). */
  useModuleSync(DB_COLS);
  const { locale, t } = useT();
  const S = n_misc[locale];
  const { user } = useAuth();
  const allowedTarget = hasPermission(user?.permissions, "projects", "w") || ["developer", "direktur", "manager"].includes(user?.role ?? "");
  const navigate = useNavigate();
  const [isFs, setIsFs] = useState(() => typeof document !== "undefined" && !!document.fullscreenElement);
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const branchProjects = inBranch(data.projects);
  const projects = branchProjects;
  const activities = data.activities;
  const [range, setRange] = useState<(typeof RANGES)[number]>("12B");
  const [selectedAttentionCategory, setSelectedAttentionCategory] = useState<ModuleAlertKey | null>(loadAttentionCategory);
  const [targets, setTargets] = useState<Record<string, BranchTarget>>(() => loadTargets());
  const [showTarget, setShowTarget] = useState(false);
  const [tgtRev, setTgtRev] = useState("");
  const [tgtProj, setTgtProj] = useState("");

  const [scope, setScope] = useState<DashboardScope>(() => defaultScopeForRole(user?.role));
  useEffect(() => {
    if (user?.role) {
      setScope(defaultScopeForRole(user.role));
    }
  }, [user?.role]);

  const handleScopeChange = (newScope: DashboardScope) => {
    setScope(newScope);
    const mapAlert: Record<DashboardScope, ModuleAlertKey | null> = {
      overview: null,
      inventori: "inventori",
      sdm: "sdm",
      keuangan: "keuangan",
      proyek: "proyek",
      procurement: "procurement",
      qc: "qc",
      commercial: "crm",
    };
    const nextAlert = mapAlert[newScope];
    setSelectedAttentionCategory(nextAlert);
    try {
      if (nextAlert) window.localStorage.setItem(DASH_ALERT_CATEGORY_STORAGE_KEY, nextAlert);
      else window.localStorage.removeItem(DASH_ALERT_CATEGORY_STORAGE_KEY);
    } catch {}
  };

  const scopeTitle = useMemo(() => {
    switch (scope) {
      case "inventori": return S.dashTitleInventory;
      case "sdm": return S.dashTitleHr;
      case "keuangan": return S.dashTitleFinance;
      case "proyek": return S.dashTitleProject;
      case "procurement": return S.dashTitleProcurement;
      case "qc": return S.dashTitleQc;
      case "commercial": return S.dashTitleCommercial;
      default: return S.dashTitle;
    }
  }, [scope, S]);

  const scopeSubtitle = useMemo(() => {
    switch (scope) {
      case "inventori": return S.dashSubtitleInventory;
      case "sdm": return S.dashSubtitleHr;
      case "keuangan": return S.dashSubtitleFinance;
      case "proyek": return S.dashSubtitleProject;
      case "procurement": return S.dashSubtitleProcurement;
      case "qc": return S.dashSubtitleQc;
      case "commercial": return S.dashSubtitleCommercial;
      default: return S.dashSubtitle;
    }
  }, [scope, S]);

  const scopeIcon = useMemo(() => {
    switch (scope) {
      case "inventori": return <Boxes className="h-5 w-5 text-amber-600" />;
      case "sdm": return <Users className="h-5 w-5 text-sky-600" />;
      case "keuangan": return <Wallet className="h-5 w-5 text-emerald-600" />;
      case "proyek": return <Anchor className="h-5 w-5 text-indigo-600" />;
      case "procurement": return <ShoppingCart className="h-5 w-5 text-violet-600" />;
      case "qc": return <ShieldCheck className="h-5 w-5 text-rose-600" />;
      case "commercial": return <Briefcase className="h-5 w-5 text-teal-600" />;
      default: return <TrendingUp className="h-5 w-5 text-navy-800" />;
    }
  }, [scope]);
/* Hampir semua angka di Dashboard ini dulu dibaca dari `data.*` mentah,
     sedangkan modul tujuan memakai inBranch(). Akibatnya di luar cabang
     "SEMUA" kartu menampilkan angka global, tapi baris highlight-nya tidak
     ada di daftar tujuan, jadi klik hanya diam-diam tidak terjadi.
     Semua pembacaan di bawah sudah memakai inBranch. */
  const totalActive = branchProjects.filter((p) => p.status !== "Selesai").length;
  const delayed = branchProjects.filter((p) => p.status === "Terlambat").length;
  const activeContracts = branchProjects
    .filter((p) => p.status !== "Selesai")
    .reduce((s, p) => s + Number(p.budget || 0), 0);
  const drydocks = inBranch(data.drydocks);
  const openNcrList = inBranch(data.ncr).filter((n) => n.status !== "Tertutup");
  const openNcr = openNcrList.length;
  const criticalOpenNcr = openNcrList.filter((n) => n.severity === "Critical").length;

  /* Navigasi deep-link dari Dashboard: pindah modul + tab + highlight baris tujuan.
     Sekarang semua baris yang dihitung kartu ikut disorot, bukan hanya satu.

     BUG YANG DIPERBAIKI: ketiganya dulu meneruskan `highlight=<satu id>` -
     id pertama yang kebetulan ketemu. Jadi kartu "NCR Terbuka" yang menghitung
     lima baris hanya membuat SATU baris berkedip di tab tujuan, dan pengguna
     menyimpulkan sisanya tidak ada. Worse, kartu "Piutang Tertagih" yang
     menjumlahkan seluruh sisa piutang bisa menunjuk invoice yang justru LUNAS,
     karena urutannya tidak sama dengan urutan filter di tabel tujuan.

     Sekarang id dikirim sebagai daftar (dipisah koma; lihat useDeepLink.ts) dan
     tabel tujuan menyorot semuanya. Kartu tetap redirect ke modul + tab yang
     benar, dan baris notifikasi warning yang sudah ada tetap memakai
     .notif-hl - penanda kelompok hanya menambah, tidak menghapus. */
  const highlightOf = (ids: string[]): string =>
    ids.length > 0 ? `&highlight=${encodeURIComponent(ids.join(","))}` : "";

  /* Semua NCR terbuka di cabang aktif, urut stabil (paling kritis dulu). */
  const openNcrIds = openNcrList.map((n) => String(n.id));

  const goNcr = () => {
    const q = `?alert=qc&tab=NCR${highlightOf(openNcrIds)}`;
    navigate(`/qc-safety${q}`);
  };

  /* Piutang yang benar-benar masih harus ditagih: bukan Draft (belum tagih) dan
     bukan Lunas. Diurutkan jatuh tempo paling awal supaya baris pertama yang
     terlihat adalah yang paling mendesak. */
  const arRows = inBranch(data.invoices)
    .filter((i) => i.status !== "Lunas" && i.status !== "Draft")
    .sort((a, b) => String(a.due ?? "").localeCompare(String(b.due ?? "")));

  const goAR = () => {
    const q = `?alert=keuangan&tab=${encodeURIComponent("Piutang (AR)")}${highlightOf(arRows.map((i) => String(i.id)))}`;
    navigate(`/keuangan${q}`);
  };

  /* Kartu ini diarahkan ke tab "Kontrak" CRM, dan isi tab itu adalah
     `data.contracts` - BUKAN `data.quotations`. Versi lama mengirim id
     quotation ke tab Kontrak; CRM mencari id itu lebih dulu di daftar
     penawaran, jadi ia justru membuka tab "Penawaran" dan menimpa tab yang
     diminta - persis bug yang useDeepLink.ts bilang sudah ditutup.

     Jadi yang dikirim, yang dihitung, dan yang ditampilkan sekarang satu
     sumber: kontrak yang ditandatangani. Jumlah = kontrak, nilai = kontrak,
     id yang disorot = kontrak. */
  const wonContracts = inBranch(data.contracts).filter((k) => String(k.status ?? "") !== "Batal");
  const wonContractValue = wonContracts.reduce((s, k) => s + Number(k.value || 0), 0);

  const goKontrak = () => {
    const q = `?alert=crm&tab=Kontrak${highlightOf(wonContracts.map((k) => String(k.id)))}`;
    navigate(`/crm${q}`);
  };

  /* Kartu "Perlu Perhatian" berisi kondisi dari 13 modul sekaligus, jadi tidak
     ada satu tab tujuan yang memuat semuanya. Yang diklik adalah header kartu:
     buka /notifikasi pada tab "Perlu Perhatian" lalu sorot SEMUA baris alert
     yang tampil, supaya angka di kartu dan yang terlihat di layar sama.

Id tidak diteruskan di sini. Kartu ini memakai engine utils/moduleAlerts
     (ModuleAlertItem.id = "mod-qc-NCR-001") sedangkan /notifikasi memakai
     utils/alerts (NotifItem.id = "alert-<id>") - dua skema id yang berbeda
     dan tidak bisa dipetakan satu-satu tanpa tabel pemetaan yang rapuh.
     Jadi yang dikirim adalah perintah "tampilkan semua alert", dan halaman
     tujuan yang menyorot barisnya sendiri. */
  const goNotifikasi = () => navigate("/notifikasi?alert=1");
  const arOutstanding = inBranch(data.invoices)
    .filter((i) => i.status !== "Lunas" && i.status !== "Draft")
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  /* Badge "stok menipis" memakai klasifikasi yang sama dengan Katalog dan
     sidebar (inventoryWarn.warnLevelOf), bukan `stock <= minStock` telanjang.
     Aturan telanjang ikut menghitung kategori Service/Jasa yang minStok-nya
     memang tidak berlaku, sehingga badge ini pernah menampilkan angka yang
     tidak cocok dengan jumlah alert di /notifikasi. */
  const lowStock = inBranch(data.inventory).filter((i) => {
    const lv = warnLevelOf(i).level;
    return lv === "critical" || lv === "low";
  });
  const stockValue = inBranch(data.inventory).reduce((s, i) => s + Number(i.stock || 0) * Number(i.cost || 0), 0);
  /* Sumbu + angka revenue dari invoice yang SUNGGUHNYA bertanggal.
     withMonthLabels() lama memutar seed revenueSeries supaya bulan berjalan
     jadi titik terakhir, padahal numeriknya tidak berpindah: label
     "Okt 2026" menempel ke angka yang sebenarnya milik Oktober tahun lalu,
     sehingga grafik menampilkan pertumbuhan fiktif. Analytics.tsx:78
     mencatat pola ini sebagai "tidak bisa di tolerate" dan sudah
     menghapusnya di sana; halaman ini adalah sisa satu-satunya yang masih memakainya.

     Sekarang label dan angka berasal dari bulan yang sama lewat
     bucketByMonth(). Seed hanya jadi fallback kalau tidak ada invoice
     bertanggal sama sekali, supaya tab tidak kosong di install kosong.

     `revenue` dalam miliar, `cost` = nilai neto invoice, `projects` =
     jumlah proyek berbeda yang invoice di bulan itu. */
  const monthCount = range === "6B" ? 6 : 12;
  const revAxis = useMemo(() => monthAxis({ months: monthCount, locale }), [monthCount, locale]);

  const chartData = useMemo(() => {
    const invoices = inBranch(data.invoices);
    const bucket = bucketByMonth(
      invoices,
      revAxis,
      (i) => i.paidAt ?? i.date ?? i.due,
      (i) => Number(i.amount ?? 0),
      (vals) => Math.round((vals.reduce((s, x) => s + x, 0) / 1e9) * 100) / 100,
    );
    const anyReal = Object.values(bucket).some((v) => v > 0);
    if (!anyReal) {
      const base = monthCount >= revenueSeries.length ? revenueSeries : revenueSeries.slice(-monthCount);
      return rebindLegacyMonthSeries(base, { locale }).map((r) => ({
        bln: r.bln,
        revenue: Number(r.revenue || 0),
        cost: Number(r.cost || 0),
        projects: Number(r.projects || 0),
      }));
    }
    return revAxis.map((pt) => {
      const month = invoices.filter(
        (i) => monthKeyOf(i.paidAt ?? i.date ?? i.due) === pt.key,
      );
      const projects = new Set(month.map((i) => String(i.project ?? i.vessel ?? ""))).size;
      return {
        bln: pt.label,
        revenue: bucket[pt.key] ?? 0,
        cost: Math.round((month.reduce((s, i) => s + Number(i.neto ?? i.amount ?? 0), 0) / 1e9) * 100) / 100,
        projects,
      };
    });
  }, [data.invoices, branch, revAxis, monthCount, locale]);
  const utilDrydock = drydocks.length
    ? Math.round((drydocks.filter((d) => d.status === "Terpakai").length / drydocks.length) * 100)
    : 0;
  /* Ekor seri wajib dijaga: `utilSeries[len-1].equipment` melempar TypeError
     kalau deret seed kosong, dan karena render gagal seluruh pohon React
     ikut tumbang - bukan hanya kartu KPI ini. Helper lastPoint/prevPoint
     mengembalikan null; lihat utils/series.ts. */
  const utilLastPoint = lastPoint(utilSeries);
  const utilEquipment = Math.round(numOf(utilLastPoint?.equipment));

  /* Sumbu + angka revenue dari invoice yang SUNGGUHNYA bertanggal.
     withMonthLabels() lama memutar seed revenueSeries supaya bulan berjalan
     jadi titik terakhir - numeriknya tidak berpindah, jadi label "Okt 2026"
     menempel ke angka yang sebenarnya milik Oktober tahun lalu, dan grafik
     menampilkan pertumbuhan fiktif. Sekarang label dan angka berasal dari
     bulan yang sama lewat bucketByMonth(); seed hanya dipakai sebagai
     fallback kalau tidak ada invoice bertanggal sama sekali.

     `revenue` dalam miliar, `cost` = nilai_before_tax invoice, `projects`
     = jumlah proyek berbeda di invoice bulan itu. */

  const lastRev = lastPoint(revenueSeries);
  const prevRev = prevPoint(revenueSeries);
  const revGrowth = pctChange(numOf(lastRev?.revenue), numOf(prevRev?.revenue));
  const lastMargin = lastPoint(marginSeries);
  const prevMargin = prevPoint(marginSeries);
  const marginDiff = numOf(lastMargin?.margin) - numOf(prevMargin?.margin);
  const lastUtil = lastPoint(utilSeries);
  const prevUtil = prevPoint(utilSeries);
  const utilDiff = numOf(lastUtil?.equipment) - numOf(prevUtil?.equipment);
  const activeEmployees = inBranch(data.employees).filter((e) => e.status === "Aktif").length;
  const seaTrialVessel =
    projects.find((p) => p.status !== "Selesai" && scopeNames(p.scope).includes("Sea Trial"))?.vessel ?? "-";

  const tgt = targets[branch] ?? { revenue: 0, projects: 0 };
  const aktualRev = branchProjects.reduce((s, p) => s + Number(p.budget || 0), 0);
  const aktualProj = branchProjects.filter((p) => p.status !== "Selesai").length;

  /* Ringkasan portofolio dicetak oleh server dari baris DB-nya sendiri.
   Versi lama menangkap DOM (`exportPDF` + html2canvas), jadi angka di PDF bisa
   berbeda dari pembukuan dan grafiknya jadi gambar. `monthCount` dan target
   diteruskan sebagai filter; server yang menghitung. */
  const exportSummary = async () => {
    if (!pdfServerReady()) {
      toast(S.tPortfolioPdfExported, "info");
      return;
    }
    const done = await pdfDoc.request(
      {
        kind: "analitik",
        locale,
        branch,
        filters: {
          scope: "Dashboard",
          months: monthCount,
          targetRevenue: tgt.revenue,
          targetProjects: tgt.projects,
        },
      },
      `Ringkasan-Portofolio-${branch}-${todayISO()}`,
      false,
    );
    if (done) toast(S.tPortfolioPdfExported);
  };

  const saveTarget = () => {
    if (!allowedTarget) { toast(S.tOnlyDirectorManager, "info"); return; }
    const revenue = Number(tgtRev);
    const nProj = Number(tgtProj);
    if (!Number.isFinite(revenue) || revenue < 0 || !Number.isFinite(nProj) || nProj < 0) { toast(S.tTargetNonNegative, "info"); return; }
    const next = { ...targets, [branch]: { revenue, projects: Math.round(nProj) } };
    setTargets(next);
    try { localStorage.setItem("isms.targets", JSON.stringify(next)); } catch { /* abaikan */ }
    toast(S.tTargetSaved.replace("{n}", branch));
    setShowTarget(false);
    setTgtRev("");
    setTgtProj("");
  };

  const openTargetModal = () => {
    if (!allowedTarget) { toast(S.tOnlyDirectorManager, "info"); return; }
    setTgtRev(String(tgt.revenue || ""));
    setTgtProj(String(tgt.projects || ""));
    setShowTarget(true);
  };

  const togglePresent = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } catch { toast(S.tFullscreenUnsupported, "info"); }
  };

  const totalRevenue = revenueSeries.reduce((s, d) => s + d.revenue, 0);
  const totalRevenueLabel = `Rp ${totalRevenue.toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  const typeDist = (["New Build", "Repair", "Retrofit"] as const).map((t, i) => ({
    name: t,
    value: projects.filter((p) => p.type === t).length,
    color: ["#2563EB", "#10B981", "#F59E0B"][i],
  }));
  const pipelineActive = inBranch(data.quotations)
    .filter((x) => x.stage !== "Menang")
    .reduce((s, x) => s + Number(x.value || 0), 0);

  const userRole = (user?.role ?? "").toLowerCase();
  const isExecutive = ["developer", "direktur", "manager", "admin"].includes(userRole);

  const availableScopes = useMemo(() => {
    if (isExecutive) return DASH_SCOPES;
    return DASH_SCOPES.filter((sc) => {
      if (sc.id === "overview") return true;
      if (sc.id === "inventori") return canOpenModule(user, "inventori");
      if (sc.id === "sdm") return canOpenModule(user, "sdm");
      if (sc.id === "keuangan") return canOpenModule(user, "keuangan");
      if (sc.id === "proyek") return canOpenModule(user, "proyek");
      if (sc.id === "procurement") return canOpenModule(user, "procurement");
      if (sc.id === "qc") return canOpenModule(user, "qc");
      if (sc.id === "commercial") return canOpenModule(user, "crm");
      return false;
    });
  }, [isExecutive, user]);

  /* Metrik Inventori */
  const inventoryList = inBranch(data.inventory);
  const totalSkus = inventoryList.length;
  const criticalStockCount = lowStock.filter((i) => warnLevelOf(i).level === "critical").length;
  const openRequisitions = inBranch(data.requisitions ?? []).filter(
    (r) => r.status !== "Sudah PO" && r.status !== "Selesai" && r.status !== "Ditolak",
  );

  /* Metrik SDM */
  const employeeList = inBranch(data.employees);
  const totalEmployees = employeeList.length;
  const pendingLeaves = inBranch(data.leaves ?? []).filter(
    (l) => l.status === "Menunggu" || l.status === "Diajukan",
  ).length;

  /* Metrik Keuangan */
  const apRows = inBranch(data.payables ?? []).filter((p) => p.status !== "Lunas");
  const apOutstanding = apRows.reduce((s, p) => s + Number(p.amount || 0), 0);

  /* Metrik Procurement */
  const poList = inBranch(data.purchaseOrders ?? []);
  const activePOs = poList.filter((p) => p.status !== "Selesai" && p.status !== "Dibatalkan");
  const totalPoValue = activePOs.reduce((s, p) => s + Number(p.total || 0), 0);
  const pendingPrCount = inBranch(data.requisitions ?? []).filter(
    (r) => r.status === "Menunggu Approval" || r.status === "Diajukan",
  ).length;
  const vendorCount = inBranch(data.vendors ?? []).length;

  /* Ambang alert (ALERT_*) DIHAPUS dari Dashboard. Sekarang setiap kondisi
     dihitung sekali di utils/moduleAlerts.ts, jadi-changing-the-setting
     di Pengaturan tetap berlaku lewat satu jalur saja. */

  /* Daftar per-item dari sistem alert modul (utils/moduleAlerts.ts).
     Sebelumnya kartu ini hanya menampilkan agregat jumlah yang ditulis
     manual di dalam Dashboard, sedangkan data per-item yang sudah punya
     rowId - dipakai sidebar badge dan AlertBanner di tiap modul - tidak
     pernah sampai ke sini. Sekarang keduanya bersumber dari satu tempat:
     klik item langsung melompat ke modul, tab, lalu baris yang DIPAKAI. */
  const attentionItems = useMemo(() => {
    const byKey = buildModuleAlertItems(scopedAlertData);
    const out: { key: ModuleAlertKey; item: ModuleAlertItem }[] = [];
    /* Urutan modul = urutan trademark kartu di bawah, jadi stable. */
    for (const k of DASH_ALERT_KEYS) {
      // #288: hanya modul yang boleh dibuka role ini.
      if (!canOpenModule(user, k)) continue;
      for (const item of byKey[k]) out.push({ key: k, item });
    }
    return out;
  }, [scopedAlertData, user]);

  const attentionCountByCategory = useMemo(() => {
    const counts: Partial<Record<ModuleAlertKey, number>> = {};
    for (const { key } of attentionItems) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [attentionItems]);

  const selectedAttentionItems = useMemo(
    () => selectedAttentionCategory
      ? attentionItems.filter(({ key }) => key === selectedAttentionCategory)
      : [],
    [attentionItems, selectedAttentionCategory],
  );

  /* Group per tingkat, cap PER TINGKAT. Cap global dulu disembunyikan semua
     alert `info` begitu ada 12 `kritis` - padahal yang paling butuh dilihat
     justru yang kritis itu. */
  const attentionGroups = useMemo(() => {
    const items = selectedAttentionItems.map(({ key, item }) => ({ key, item }));
    return groupByLevel(
      items.map((x) => x.item),
      DASH_ALERT_CAP,
    ).map((g) => ({
      ...g,
      entries: items.filter((x) => x.item.level === g.level),
    }));
  }, [selectedAttentionItems]);

  const attentionCount = useMemo(() => countByLevel(selectedAttentionItems.map((x) => x.item)), [selectedAttentionItems]);

  /* Banner "Perlu perhatian" mengirim SATU id. Modul tujuan membuka tab/
     filter yang memuat baris itu lalu kedipkan - tidak perlu tab di URL
     karena setiap modul sudah bisa menurunkan tab dari id-nya. */
  const goAttentionItem = (key: ModuleAlertKey, rowId: string) => {
    const q = `?alert=${encodeURIComponent(key)}&highlight=${encodeURIComponent(rowId)}`;
    navigate(`${MODULE_ALERT_TO[key]}${q}`);
  };

  const toggleAttentionCategory = (key: ModuleAlertKey) => {
    const next = selectedAttentionCategory === key ? null : key;
    setSelectedAttentionCategory(next);
    try {
      if (next) window.localStorage.setItem(DASH_ALERT_CATEGORY_STORAGE_KEY, next);
      else window.localStorage.removeItem(DASH_ALERT_CATEGORY_STORAGE_KEY);
    } catch {
      /* Tetap izinkan filter dipakai jika penyimpanan browser dinonaktifkan. */
    }
  };

  /* PDF sudah dibuat server dari baris DB (lihat exportSummary), jadi tidak
     ada lagi area cetak tersembunyi, tidak ada kop HTML di dalam dashboard,
     dan tidak ada mode yang mematikan animasi hanya untuk foto. */
  return (
    <Stagger className="space-y-5">
      <StaggerItem>
        <PageHeader
          title={scopeTitle}
          subtitle={scopeSubtitle}
          icon={scopeIcon}
          actions={
            /* Filter, tombol presentasi, dan "Proyek Baru" adalah kontrol UI. */
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={togglePresent} title={isFs ? S.exitFullscreen : S.presentBtn}>
                {isFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />} {isFs ? S.exitFullscreen : S.presentBtn}
              </button>
              <AsyncButton className="btn-secondary" onAction={exportSummary}>
                <Download className="h-4 w-4" /> {S.exportBtn}
              </AsyncButton>
              <button className="btn-primary-gradient" onClick={() => navigate("/proyek?create=1&alert=proyek")}>
                <Plus className="h-4 w-4" /> {S.newProjectBtn}
              </button>
            </div>
          }
        />
      </StaggerItem>

      {/* SCOPE SELECTOR & ROLE BAR */}
      <StaggerItem>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-steel-200/90 bg-white p-2.5 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-steel-500 shrink-0">
              {S.dashScopeLabel || "Lingkup"}:
            </span>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pilih Lingkup Dashboard">
              {availableScopes.map((sc) => {
                const active = scope === sc.id;
                const ScIcon = sc.icon;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleScopeChange(sc.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-navy-900 text-white shadow-xs"
                        : "bg-steel-50 text-steel-600 hover:bg-steel-100 hover:text-navy-900"
                    }`}
                  >
                    <ScIcon className="h-3.5 w-3.5" />
                    <span>{S[sc.labelKey] ?? sc.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-300/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{S.roleScopeBadge || "Peran"}: <strong className="font-semibold text-slate-900 uppercase">{userRole || "User"}</strong></span>
            </span>
          </div>
        </div>
      </StaggerItem>

      {/* EXECUTIVE OVERVIEW GRID (Apple HIG Luminous Cockpit - Vibrant, High-Contrast & Alive) */}
      {scope === "overview" && (
        <StaggerItem>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Executive Portfolio Cockpit (7 cols lg, 8 cols 2xl) */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-rose-50/15 to-white border border-slate-100 p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] lg:col-span-7 2xl:col-span-8">
              {/* Top gradient highlight bar */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-400" />
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-slate-600">
                      {S.totalPortfolio}
                    </span>
                    <span className="block text-[11px] text-slate-400">Pusat kendali operasional galangan aktif</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/25">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {S.systemOperational}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                    {S.activeWorkers.replace("{n}", String(activeEmployees))}
                  </span>
                </div>
              </div>

              <div className="relative z-10 my-5">
                <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {fmtMiliar(activeContracts)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {branchProjects.length} proyek terdaftar di portofolio aktif cabang <span className="font-semibold text-slate-800">{branch}</span>
                </p>
              </div>

              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-200/80 pt-3.5">
                <div className="rounded-xl bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 p-3 border border-violet-200/70 shadow-2xs">
                  <span className="text-[11px] font-semibold text-violet-700 block truncate">{S.activeQuotationLabel}</span>
                  <span className="text-sm font-extrabold text-violet-950 tabular-nums">{fmtMiliar(pipelineActive)}</span>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                  <span className="text-[11px] font-semibold text-emerald-700 block truncate">{S.seaTrialLabel}</span>
                  <span className="text-sm font-extrabold text-emerald-950 truncate block" title={seaTrialVessel}>{seaTrialVessel}</span>
                </div>
                <div className="hidden sm:block rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3 border border-amber-200/70 shadow-2xs">
                  <span className="text-[11px] font-semibold text-amber-700 block truncate">{S.stockValueLabel}</span>
                  <span className="text-sm font-extrabold text-amber-950 tabular-nums">{fmtMiliar(stockValue)}</span>
                </div>
              </div>
            </div>

            {/* Target vs Aktual Executive Widget (5 cols lg, 4 cols 2xl) */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-steel-200/90 p-6 shadow-soft lg:col-span-5 2xl:col-span-4">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-steel-100">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-navy-900 truncate">
                      {S.targetVsActual.replace("{n}", branch)}
                    </h3>
                    <p className="text-[11px] text-steel-500">Pencapaian performa galangan</p>
                  </div>
                  {allowedTarget ? (
                    <button className="btn-secondary text-xs px-2.5 py-1 shrink-0 font-medium" onClick={openTargetModal}>
                      {S.setTargetBtn}
                    </button>
                  ) : (
                    <span className="text-[11px] text-steel-400 shrink-0">{S.onlyDirectorManager}</span>
                  )}
                </div>

                {(!tgt.revenue || tgt.revenue <= 0) && (!tgt.projects || tgt.projects <= 0) ? (
                  <div className="my-3.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-bold text-amber-950">Target cabang {branch} belum diatur</p>
                        <p className="mt-0.5 text-amber-800 leading-relaxed text-[11px]">
                          Aktual saat ini {fmtMiliar(aktualRev)} ({aktualProj} proyek). Atur target untuk memantau performa.
                        </p>
                        {allowedTarget && (
                          <button
                            className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800"
                            onClick={openTargetModal}
                          >
                            Atur Target Sekarang
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3.5 pt-2.5">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-steel-600">Pendapatan Aktual</span>
                      <span className="font-bold text-navy-900 tabular-nums">
                        {fmtMiliar(aktualRev)} {tgt.revenue > 0 ? `/ ${fmtMiliar(tgt.revenue)}` : ""}
                      </span>
                    </div>
                    <ProgressBar value={tgt.revenue > 0 ? (aktualRev / tgt.revenue) * 100 : 0} tone="navy" />
                    <div className="mt-1 flex justify-between text-[11px] font-medium text-steel-500">
                      <span>Target Kuartal</span>
                      <span className={tgt.revenue > 0 ? "font-bold text-navy-900" : "italic text-steel-400"}>
                        {tgt.revenue > 0 ? `${Math.round((aktualRev / tgt.revenue) * 100)}% tercapai` : "Belum diatur"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-steel-600">Proyek Berjalan</span>
                      <span className="font-bold text-navy-900 tabular-nums">
                        {aktualProj} proyek {tgt.projects > 0 ? `/ ${tgt.projects} target` : ""}
                      </span>
                    </div>
                    <ProgressBar value={tgt.projects > 0 ? (aktualProj / tgt.projects) * 100 : 0} tone="teal" />
                    <div className="mt-1 flex justify-between text-[11px] font-medium text-steel-500">
                      <span>Target Proyek</span>
                      <span className={tgt.projects > 0 ? "font-bold text-navy-900" : "italic text-steel-400"}>
                        {tgt.projects > 0 ? `${Math.round((aktualProj / tgt.projects) * 100)}% tercapai` : "Belum diatur"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-steel-100 pt-2.5 text-[11px] text-steel-500 flex items-center justify-between">
                <span>Siklus Pelaporan Aktif</span>
                <span className="font-bold text-navy-900">Kuartal 4 (Q4 2026)</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* INVENTORI COCKPIT */}
      {scope === "inventori" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-amber-50/20 to-white border border-amber-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
                  <Boxes className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-amber-800">
                    Pusat Kendali Logistik &amp; Gudang Galangan
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring ketersediaan material, stok minimum, dan permintaan proyek</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/25">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Stok Gudang Real-Time
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {totalSkus} SKU Terdaftar
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {fmtMiliar(stockValue)}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Total valuasi stok material tersimpan di gudang cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3 border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 block truncate">Total Item SKU</span>
                <span className="text-sm font-extrabold text-amber-950 tabular-nums">{totalSkus} Item</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 p-3 border border-rose-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-700 block truncate">Stok Kritis / Kurang</span>
                <span className="text-sm font-extrabold text-rose-700 tabular-nums">{criticalStockCount} Item</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 p-3 border border-violet-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-violet-700 block truncate">Permintaan Terbuka</span>
                <span className="text-sm font-extrabold text-violet-950 tabular-nums">{openRequisitions.length} PR</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Status Gudang</span>
                <span className="text-sm font-extrabold text-emerald-950 truncate block">Siap Operasional</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* SDM COCKPIT */}
      {scope === "sdm" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-sky-50/20 to-white border border-sky-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-600" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-sky-800">
                    Pusat Kendali SDM &amp; Personalia Galangan
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring karyawan aktif, penugasan lapangan, absensi, dan pengajuan cuti</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-600/25">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  SDM Galangan Aktif
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {totalEmployees} Karyawan
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {totalEmployees} <span className="text-2xl font-bold text-slate-600">Personel</span>
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Total tenaga kerja galangan terdaftar di cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 p-3 border border-sky-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-sky-700 block truncate">Bertugas di Lapangan</span>
                <span className="text-sm font-extrabold text-sky-950 tabular-nums">{activeEmployees} Orang</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3 border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 block truncate">Permohonan Cuti</span>
                <span className="text-sm font-extrabold text-amber-800 tabular-nums">{pendingLeaves} Pengajuan</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Tingkat Kehadiran</span>
                <span className="text-sm font-extrabold text-emerald-950 tabular-nums">96.4%</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-3 border border-indigo-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 block truncate">Kepatuhan K3</span>
                <span className="text-sm font-extrabold text-indigo-950 truncate block">Tersertifikasi</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* KEUANGAN COCKPIT */}
      {scope === "keuangan" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-emerald-50/20 to-white border border-emerald-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                  <Wallet className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-emerald-800">
                    Pusat Kendali Keuangan &amp; Perpajakan
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring piutang usaha (AR), hutang vendor (AP), dan arus kas galangan</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/25">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Billing &amp; Kas Terkendali
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {arRows.length} Tagihan Aktif
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {fmtMiliar(arOutstanding)}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Total piutang usaha (AR) belum tertagih dari klien cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 p-3 border border-blue-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-blue-700 block truncate">Piutang (AR) Belum Lunas</span>
                <span className="text-sm font-extrabold text-blue-950 tabular-nums">{fmtMiliar(arOutstanding)}</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3 border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 block truncate">Hutang (AP) Vendor</span>
                <span className="text-sm font-extrabold text-amber-950 tabular-nums">{fmtMiliar(apOutstanding)}</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Pendapatan Kuartal</span>
                <span className="text-sm font-extrabold text-emerald-950 tabular-nums">{totalRevenueLabel}</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 p-3 border border-violet-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-violet-700 block truncate">Estimasi Margin</span>
                <span className="text-sm font-extrabold text-violet-950 tabular-nums">{numOf(lastMargin?.margin).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* PROYEK COCKPIT */}
      {scope === "proyek" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-indigo-50/20 to-white border border-indigo-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-700" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white shadow-xs">
                  <Anchor className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-indigo-800">
                    Pusat Kendali Proyek &amp; Produksi Galangan
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring kemajuan fisik kapal, jadwal dok, dan kurva S pekerjaan</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-600/25">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  Produksi Aktif
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {totalActive} Proyek Berjalan
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {totalActive} <span className="text-2xl font-bold text-slate-600">Kapal</span>
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Proyek konstruksi &amp; reparasi berjalan aktif di galangan cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-3 border border-indigo-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 block truncate">Nilai Kontrak Aktif</span>
                <span className="text-sm font-extrabold text-indigo-950 tabular-nums">{fmtMiliar(activeContracts)}</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 p-3 border border-rose-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-700 block truncate">Proyek Terlambat</span>
                <span className="text-sm font-extrabold text-rose-700 tabular-nums">{delayed} Kapal</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 p-3 border border-blue-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-blue-700 block truncate">Utilisasi Dok</span>
                <span className="text-sm font-extrabold text-blue-950 tabular-nums">{utilDrydock}%</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Sea Trial Siap</span>
                <span className="text-sm font-extrabold text-emerald-950 truncate block" title={seaTrialVessel}>{seaTrialVessel}</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* PROCUREMENT COCKPIT */}
      {scope === "procurement" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-violet-50/20 to-white border border-violet-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xs">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-violet-800">
                    Pusat Kendali Pengadaan &amp; Pembelian (Procurement)
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring Purchase Order, permintaan barang (PR), dan rekanan vendor</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-600/25">
                  <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                  Pengadaan Berjalan
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {activePOs.length} PO Aktif
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {fmtMiliar(totalPoValue)}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Total komitmen nilai Purchase Order aktif berjalan cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 p-3 border border-violet-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-violet-700 block truncate">PO Berjalan</span>
                <span className="text-sm font-extrabold text-violet-950 tabular-nums">{activePOs.length} PO</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3 border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 block truncate">PR Menunggu Approval</span>
                <span className="text-sm font-extrabold text-amber-800 tabular-nums">{pendingPrCount} PR</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 p-3 border border-sky-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-sky-700 block truncate">Vendor Rekanan</span>
                <span className="text-sm font-extrabold text-sky-950 tabular-nums">{vendorCount} Vendor</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Status Pemesanan</span>
                <span className="text-sm font-extrabold text-emerald-950 truncate block">Terkontrol</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* QC COCKPIT */}
      {scope === "qc" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-rose-50/20 to-white border border-rose-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-600 to-rose-700" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-rose-800">
                    Pusat Kendali Mutu &amp; K3 Safety Galangan
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring temuan ketidaksesuaian (NCR), kepatuhan keselamatan kerja, dan inspeksi</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-600/25">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  Pengawasan K3 Aktif
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {openNcr} Temuan Terbuka
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {openNcr} <span className="text-2xl font-bold text-slate-600">Kasus NCR</span>
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Temuan inspeksi mutu yang sedang dalam proses penanganan di cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 p-3 border border-rose-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-700 block truncate">Temuan Kritis (Critical)</span>
                <span className="text-sm font-extrabold text-rose-700 tabular-nums">{criticalOpenNcr} Kasus</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Insiden K3 Keselamatan</span>
                <span className="text-sm font-extrabold text-emerald-950 truncate block">Zero Accident</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 p-3 border border-sky-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-sky-700 block truncate">Standar Kelaikan</span>
                <span className="text-sm font-extrabold text-sky-950 truncate block">BKI / SOLAS</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-3 border border-indigo-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 block truncate">Kepatuhan Inspeksi</span>
                <span className="text-sm font-extrabold text-indigo-950 tabular-nums">100% Terverifikasi</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* COMMERCIAL COCKPIT */}
      {scope === "commercial" && (
        <StaggerItem>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-teal-50/20 to-white border border-teal-200/80 p-6 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-700" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-teal-800">
                    Pusat Kendali Komersial &amp; CRM Klien
                  </span>
                  <span className="block text-[11px] text-slate-400">Monitoring pipeline penawaran tender, kontrak deal klien, dan relasi mitra</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-600/25">
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  Pipeline Aktif
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40">
                  {wonContracts.length} Kontrak Deal
                </span>
              </div>
            </div>

            <div className="relative z-10 my-5">
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {fmtMiliar(pipelineActive)}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Nilai aktif prospek &amp; penawaran (quotation) yang sedang berjalan cabang <span className="font-semibold text-slate-800">{branch}</span>
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3.5">
              <div className="rounded-xl bg-gradient-to-br from-teal-50/90 via-white to-teal-50/40 p-3 border border-teal-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-teal-700 block truncate">Nilai Kontrak Menang</span>
                <span className="text-sm font-extrabold text-teal-950 tabular-nums">{fmtMiliar(wonContractValue)}</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-3 border border-indigo-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 block truncate">Proyek Kapal Aktif</span>
                <span className="text-sm font-extrabold text-indigo-950 tabular-nums">{totalActive} Unit</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3 border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 block truncate">Estimasi Win Rate</span>
                <span className="text-sm font-extrabold text-amber-950 tabular-nums">78%</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-3 border border-emerald-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block truncate">Sea Trial Armada</span>
                <span className="text-sm font-extrabold text-emerald-950 truncate block" title={seaTrialVessel}>{seaTrialVessel}</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      <Modal open={showTarget} onClose={() => setShowTarget(false)} title={S.setTargetTitle.replace("{n}", branch)} subtitle={S.setTargetSub}
        footer={<><button className="btn-secondary" onClick={() => setShowTarget(false)}>{S.cancelBtn}</button><button className="btn-primary" onClick={saveTarget}>{S.saveTargetBtn}</button></>}>
        <div className="space-y-3">
          <Field label={S.targetRevenueLabel}><NumInput min={0} className="input" placeholder={S.targetRevenuePh} value={tgtRev} onChange={(e) => setTgtRev(e.target.value)} /></Field>
          <Field label={S.targetProjectLabel}><NumInput min={0} className="input" placeholder={S.targetProjectPh} value={tgtProj} onChange={(e) => setTgtProj(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {scope === "inventori" ? (
          <>
            <StaggerItem>
              <KpiCard
                label="Total SKU Material"
                value={String(totalSkus)}
                delta="Item aktif terdaftar di gudang"
                deltaDirection="flat"
                icon={<Boxes className="h-5 w-5" />}
                chip="amber"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Nilai Total Stok"
                value={fmtMiliar(stockValue)}
                delta="Valuasi stok fisik gudang"
                deltaDirection="up"
                icon={<Warehouse className="h-5 w-5" />}
                chip="teal"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Stok di Bawah Minimum"
                value={String(criticalStockCount)}
                delta={criticalStockCount > 0 ? "Perlu restock segera" : "Stok aman"}
                deltaDirection={criticalStockCount > 0 ? "down" : "flat"}
                icon={<AlertTriangle className="h-5 w-5" />}
                chip="rose"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Permintaan Material (PR)"
                value={String(openRequisitions.length)}
                delta="Menunggu pemenuhan lapangan"
                deltaDirection="flat"
                icon={<FileText className="h-5 w-5" />}
                chip="violet"
              />
            </StaggerItem>
          </>
        ) : scope === "sdm" ? (
          <>
            <StaggerItem>
              <KpiCard
                label="Tenaga Kerja Terdaftar"
                value={String(totalEmployees)}
                delta="Karyawan aktif cabang"
                deltaDirection="flat"
                icon={<Users className="h-5 w-5" />}
                chip="navy"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Personel di Lapangan"
                value={String(activeEmployees)}
                delta="Ditugaskan pada proyek aktif"
                deltaDirection="up"
                icon={<HardHat className="h-5 w-5" />}
                chip="teal"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Permohonan Cuti Pending"
                value={String(pendingLeaves)}
                delta={pendingLeaves > 0 ? "Menunggu persetujuan HR" : "Semua cuti diproses"}
                deltaDirection={pendingLeaves > 0 ? "down" : "flat"}
                icon={<CalendarCheck className="h-5 w-5" />}
                chip="amber"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Tingkat Presensi"
                value="96.4%"
                delta="Rata-rata kehadiran tim"
                deltaDirection="up"
                icon={<UserCheck className="h-5 w-5" />}
                chip="violet"
              />
            </StaggerItem>
          </>
        ) : scope === "keuangan" ? (
          <>
            <StaggerItem>
              <KpiCard
                label="Piutang (AR) Outstanding"
                value={fmtMiliar(arOutstanding)}
                delta={`${arRows.length} invoice belum lunas`}
                deltaDirection="flat"
                icon={<CreditCard className="h-5 w-5" />}
                chip="blue"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Hutang (AP) Vendor"
                value={fmtMiliar(apOutstanding)}
                delta={`${apRows.length} kewajiban pembayaran`}
                deltaDirection="flat"
                icon={<FileText className="h-5 w-5" />}
                chip="amber"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Pendapatan Kuartal"
                value={totalRevenueLabel}
                delta={S.deltaPctVsMonth.replace("{n}", `${revGrowth >= 0 ? "+" : ""}${revGrowth.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`)}
                deltaDirection={revGrowth > 0 ? "up" : revGrowth < 0 ? "down" : "flat"}
                icon={<Wallet className="h-5 w-5" />}
                chip="teal"
                spark={sparkRevenue}
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Estimasi Margin Galangan"
                value={`${numOf(lastMargin?.margin).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`}
                delta={S.deltaPoinVsMonth.replace("{n}", `${marginDiff >= 0 ? "+" : ""}${marginDiff.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`)}
                deltaDirection={marginDiff > 0 ? "up" : marginDiff < 0 ? "down" : "flat"}
                icon={<TrendingUp className="h-5 w-5" />}
                chip="violet"
                spark={sparkMargin}
              />
            </StaggerItem>
          </>
        ) : scope === "procurement" ? (
          <>
            <StaggerItem>
              <KpiCard
                label="Purchase Order Aktif"
                value={String(activePOs.length)}
                delta="Pesanan pengadaan berjalan"
                deltaDirection="flat"
                icon={<ShoppingCart className="h-5 w-5" />}
                chip="violet"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Total Komitmen PO"
                value={fmtMiliar(totalPoValue)}
                delta="Nilai belanja aktif"
                deltaDirection="up"
                icon={<Wallet className="h-5 w-5" />}
                chip="teal"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="PR Menunggu Approval"
                value={String(pendingPrCount)}
                delta={pendingPrCount > 0 ? "Butuh approval pengadaan" : "Semua PR diproses"}
                deltaDirection={pendingPrCount > 0 ? "down" : "flat"}
                icon={<FileText className="h-5 w-5" />}
                chip="amber"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Mitra Vendor Terdaftar"
                value={String(vendorCount)}
                delta="Rekanan pemasok material"
                deltaDirection="flat"
                icon={<Building className="h-5 w-5" />}
                chip="navy"
              />
            </StaggerItem>
          </>
        ) : scope === "qc" ? (
          <>
            <StaggerItem>
              <KpiCard
                label="Temuan NCR Terbuka"
                value={String(openNcr)}
                delta={criticalOpenNcr > 0 ? `${criticalOpenNcr} kritis butuh tindakan` : "Nihil temuan kritis"}
                deltaDirection={criticalOpenNcr > 0 ? "down" : "flat"}
                icon={<ShieldCheck className="h-5 w-5" />}
                chip="rose"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Temuan Kritis (Critical)"
                value={String(criticalOpenNcr)}
                delta="Prioritas perbaikan mutu"
                deltaDirection={criticalOpenNcr > 0 ? "down" : "flat"}
                icon={<AlertTriangle className="h-5 w-5" />}
                chip="red"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Insiden K3 Keselamatan"
                value="Zero Accident"
                delta="Nihil insiden di galangan"
                deltaDirection="up"
                icon={<HardHat className="h-5 w-5" />}
                chip="teal"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Kepatuhan Mutu"
                value="100%"
                delta="Standar BKI / SOLAS"
                deltaDirection="up"
                icon={<CheckCircle2 className="h-5 w-5" />}
                chip="navy"
              />
            </StaggerItem>
          </>
        ) : scope === "commercial" ? (
          <>
            <StaggerItem>
              <KpiCard
                label="Pipeline Quotation"
                value={fmtMiliar(pipelineActive)}
                delta="Penawaran tender aktif"
                deltaDirection="up"
                icon={<Briefcase className="h-5 w-5" />}
                chip="teal"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Nilai Kontrak Menang"
                value={fmtMiliar(wonContractValue)}
                delta={`${wonContracts.length} kontrak disepakati`}
                deltaDirection="up"
                icon={<Wallet className="h-5 w-5" />}
                chip="navy"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Proyek Kapal Dikerjakan"
                value={String(totalActive)}
                delta="Proyek aktif galangan"
                deltaDirection="flat"
                icon={<Anchor className="h-5 w-5" />}
                chip="blue"
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label="Estimasi Win Rate"
                value="78%"
                delta="Konversi penawaran tender"
                deltaDirection="up"
                icon={<TrendingUp className="h-5 w-5" />}
                chip="violet"
              />
            </StaggerItem>
          </>
        ) : (
          /* Default: Overview & Proyek */
          <>
            <StaggerItem>
              <KpiCard
                label={S.kpiActiveProjects}
                value={String(totalActive)}
                delta={S.delayedSuffix.replace("{n}", String(delayed))}
                deltaDirection="down"
                icon={<Anchor className="h-5 w-5" />}
                chip="navy"
                spark={sparkProjects}
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label={S.kpiRevenue12}
                value={totalRevenueLabel}
                delta={S.deltaPctVsMonth.replace("{n}", `${revGrowth >= 0 ? "+" : ""}${revGrowth.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`)}
                deltaDirection={revGrowth > 0 ? "up" : revGrowth < 0 ? "down" : "flat"}
                icon={<Wallet className="h-5 w-5" />}
                chip="teal"
                spark={sparkRevenue}
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label={S.kpiGrossMargin}
                value={`${numOf(lastMargin?.margin).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`}
                delta={S.deltaPoinVsMonth.replace("{n}", `${marginDiff >= 0 ? "+" : ""}${marginDiff.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`)}
                deltaDirection={marginDiff > 0 ? "up" : marginDiff < 0 ? "down" : "flat"}
                icon={<TrendingUp className="h-5 w-5" />}
                chip="violet"
                spark={sparkMargin}
              />
            </StaggerItem>
            <StaggerItem>
              <KpiCard
                label={S.kpiEquipUtil}
                value={`${utilEquipment}%`}
                delta={S.deltaPoinVsMonth.replace("{n}", `${utilDiff >= 0 ? "+" : ""}${utilDiff.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`)}
                deltaDirection={utilDiff > 0 ? "up" : utilDiff < 0 ? "down" : "flat"}
                icon={<Cpu className="h-5 w-5" />}
                chip="amber"
                spark={sparkUtil}
              />
            </StaggerItem>
          </>
        )}
      </div>

      {/* RADAR OPERASIONAL & TINDAKAN CEPAT (Apple HIG / Linear Matrix) */}
      <StaggerItem>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between border-b border-steel-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy-900">
                {scope === "inventori"
                  ? "Aksi Cepat Logistik & Material Gudang"
                  : scope === "sdm"
                  ? "Aksi Cepat SDM & Personalia Galangan"
                  : scope === "keuangan"
                  ? "Aksi Cepat Keuangan, Tagihan & Pajak"
                  : scope === "procurement"
                  ? "Aksi Cepat Pengadaan & Pembelian (Procurement)"
                  : scope === "qc"
                  ? "Aksi Cepat Mutu, Safety & K3 Lapangan"
                  : scope === "commercial"
                  ? "Aksi Cepat Komersial, CRM & Penawaran Klien"
                  : "Radar Operasional & Indikator Langsung"}
              </h3>
              <p className="text-xs text-steel-500">
                {scope === "inventori"
                  ? "Tautan tindakan langsung untuk kelola katalog stok, pengeluaran barang, dan penerimaan PO"
                  : scope === "sdm"
                  ? "Tautan tindakan langsung ke database personil, verifikasi cuti, absensi, dan payroll"
                  : scope === "keuangan"
                  ? "Tautan tindakan langsung ke monitoring piutang usaha (AR), hutang vendor (AP), dan billing"
                  : scope === "procurement"
                  ? "Tautan tindakan langsung ke purchase order, purchase request (PR), dan direktori vendor"
                  : scope === "qc"
                  ? "Tautan tindakan langsung ke tindak lanjut temuan NCR, inspeksi berkala, dan checklist K3"
                  : scope === "commercial"
                  ? "Tautan tindakan langsung ke pembuatan quotation, pembaruan kontrak klien, dan CRM"
                  : "Metrik utama galangan & tautan tindakan langsung ke modul kerja"}
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-steel-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sinkron langsung
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {scope === "inventori" ? (
              <>
                <Link
                  to="/inventori"
                  className="group flex items-center justify-between rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 p-3.5 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 ring-1 ring-amber-600/30 shadow-2xs">
                      <Warehouse className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-amber-800 truncate block">Katalog Stok Material</span>
                      <p className="mt-0.5 text-base font-extrabold text-amber-950 tabular-nums">{totalSkus} Item SKU</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-800" />
                </Link>

                <Link
                  to="/inventori?tab=keluar"
                  className="group flex items-center justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 p-3.5 shadow-xs transition-all hover:border-sky-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800 ring-1 ring-sky-600/30 shadow-2xs">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-sky-800 truncate block">Pengeluaran Barang Proyek</span>
                      <p className="mt-0.5 text-base font-extrabold text-sky-950">{openRequisitions.length} PR Menunggu</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-800" />
                </Link>

                <Link
                  to="/inventori?tab=terima"
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-3.5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/30 shadow-2xs">
                      <Boxes className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-800 truncate block">Penerimaan Barang PO</span>
                      <p className="mt-0.5 text-base font-extrabold text-emerald-950">{activePOs.length} PO Masuk</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </Link>

                <Link
                  to="/procurement?tab=pr"
                  className="group flex items-center justify-between rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/70 via-white to-violet-50/20 p-3.5 shadow-xs transition-all hover:border-violet-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100/80 text-violet-800 ring-1 ring-violet-600/30 shadow-2xs">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-violet-800 truncate block">Permintaan PR Lapangan</span>
                      <p className="mt-0.5 text-base font-extrabold text-violet-950 tabular-nums">{openRequisitions.length} Permintaan</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-violet-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-800" />
                </Link>
              </>
            ) : scope === "sdm" ? (
              <>
                <Link
                  to="/sdm"
                  className="group flex items-center justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 p-3.5 shadow-xs transition-all hover:border-sky-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800 ring-1 ring-sky-600/30 shadow-2xs">
                      <Users className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-sky-800 truncate block">Data Induk Karyawan</span>
                      <p className="mt-0.5 text-base font-extrabold text-sky-950 tabular-nums">{totalEmployees} Karyawan</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-800" />
                </Link>

                <Link
                  to="/sdm?tab=cuti"
                  className="group flex items-center justify-between rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 p-3.5 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 ring-1 ring-amber-600/30 shadow-2xs">
                      <CalendarCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-amber-800 truncate block">Pengajuan &amp; Saldo Cuti</span>
                      <p className="mt-0.5 text-base font-extrabold text-amber-950 tabular-nums">{pendingLeaves} Pending</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-800" />
                </Link>

                <Link
                  to="/absensi"
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-3.5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/30 shadow-2xs">
                      <UserCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-800 truncate block">Presensi &amp; Rekap Absensi</span>
                      <p className="mt-0.5 text-base font-extrabold text-emerald-950">96.4% Hadir</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </Link>

                <Link
                  to="/payroll"
                  className="group flex items-center justify-between rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/20 p-3.5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-800 ring-1 ring-indigo-600/30 shadow-2xs">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-indigo-800 truncate block">Penggajian &amp; Payroll</span>
                      <p className="mt-0.5 text-base font-extrabold text-indigo-950">Slip &amp; Lembur</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-800" />
                </Link>
              </>
            ) : scope === "keuangan" ? (
              <>
                <Link
                  to="/keuangan?tab=Invoice"
                  className="group flex items-center justify-between rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/20 p-3.5 shadow-xs transition-all hover:border-blue-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-800 ring-1 ring-blue-600/30 shadow-2xs">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-blue-800 truncate block">Invoice &amp; Billing Klien</span>
                      <p className="mt-0.5 text-base font-extrabold text-blue-950">{arRows.length} Tagihan Aktif</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-800" />
                </Link>

                <Link
                  to="/keuangan?tab=Piutang (AR)"
                  className="group flex items-center justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 p-3.5 shadow-xs transition-all hover:border-sky-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800 ring-1 ring-sky-600/30 shadow-2xs">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-sky-800 truncate block">Piutang Usaha (AR)</span>
                      <p className="mt-0.5 text-base font-extrabold text-sky-950 tabular-nums">{fmtMiliar(arOutstanding)}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-800" />
                </Link>

                <Link
                  to="/keuangan?tab=Hutang (AP)"
                  className="group flex items-center justify-between rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 p-3.5 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 ring-1 ring-amber-600/30 shadow-2xs">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-amber-800 truncate block">Hutang Usaha (AP)</span>
                      <p className="mt-0.5 text-base font-extrabold text-amber-950 tabular-nums">{fmtMiliar(apOutstanding)}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-800" />
                </Link>

                <Link
                  to="/keuangan?tab=Kas & Bank"
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-3.5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/30 shadow-2xs">
                      <Building className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-800 truncate block">Kas &amp; Rekening Bank</span>
                      <p className="mt-0.5 text-base font-extrabold text-emerald-950">Arus Kas Galangan</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </Link>
              </>
            ) : scope === "procurement" ? (
              <>
                <Link
                  to="/procurement"
                  className="group flex items-center justify-between rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/70 via-white to-violet-50/20 p-3.5 shadow-xs transition-all hover:border-violet-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100/80 text-violet-800 ring-1 ring-violet-600/30 shadow-2xs">
                      <ShoppingCart className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-violet-800 truncate block">Purchase Order (PO)</span>
                      <p className="mt-0.5 text-base font-extrabold text-violet-950 tabular-nums">{activePOs.length} PO Berjalan</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-violet-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-800" />
                </Link>

                <Link
                  to="/procurement?tab=pr"
                  className="group flex items-center justify-between rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 p-3.5 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 ring-1 ring-amber-600/30 shadow-2xs">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-amber-800 truncate block">Permintaan Barang (PR)</span>
                      <p className="mt-0.5 text-base font-extrabold text-amber-950 tabular-nums">{pendingPrCount} Pending</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-800" />
                </Link>

                <Link
                  to="/procurement?tab=vendor"
                  className="group flex items-center justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 p-3.5 shadow-xs transition-all hover:border-sky-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800 ring-1 ring-sky-600/30 shadow-2xs">
                      <Building className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-sky-800 truncate block">Direktori Vendor</span>
                      <p className="mt-0.5 text-base font-extrabold text-sky-950 tabular-nums">{vendorCount} Mitra</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-800" />
                </Link>

                <Link
                  to="/inventori?tab=terima"
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-3.5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/30 shadow-2xs">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-800 truncate block">Penerimaan Barang</span>
                      <p className="mt-0.5 text-base font-extrabold text-emerald-950">Gudang &amp; PO</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </Link>
              </>
            ) : scope === "qc" ? (
              <>
                <button
                  type="button"
                  onClick={goNcr}
                  className="group flex items-center justify-between rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/20 p-3.5 text-left shadow-xs transition-all hover:border-rose-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100/80 text-rose-800 ring-1 ring-rose-600/30 shadow-2xs">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-rose-800 truncate block">Temuan Kasus NCR</span>
                      <p className="mt-0.5 text-base font-extrabold text-rose-700 tabular-nums">{openNcr} Kasus Terbuka</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-rose-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-800" />
                </button>

                <Link
                  to="/qc?tab=safety"
                  className="group flex items-center justify-between rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 p-3.5 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 ring-1 ring-amber-600/30 shadow-2xs">
                      <HardHat className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-amber-800 truncate block">Keselamatan K3 HSE</span>
                      <p className="mt-0.5 text-base font-extrabold text-amber-950">Zero Accident</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-800" />
                </Link>

                <Link
                  to="/qc?tab=inspeksi"
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-3.5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/30 shadow-2xs">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-800 truncate block">Inspeksi &amp; Uji Coba</span>
                      <p className="mt-0.5 text-base font-extrabold text-emerald-950">100% Terjadwal</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </Link>

                <Link
                  to="/equipment"
                  className="group flex items-center justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 p-3.5 shadow-xs transition-all hover:border-sky-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800 ring-1 ring-sky-600/30 shadow-2xs">
                      <Cpu className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-sky-800 truncate block">Kalibrasi Alat Uji</span>
                      <p className="mt-0.5 text-base font-extrabold text-sky-950">{utilEquipment}% Utilisasi</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-800" />
                </Link>
              </>
            ) : scope === "commercial" ? (
              <>
                <Link
                  to="/crm"
                  className="group flex items-center justify-between rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-teal-50/20 p-3.5 shadow-xs transition-all hover:border-teal-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100/80 text-teal-800 ring-1 ring-teal-600/30 shadow-2xs">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-teal-800 truncate block">Pipeline Quotation</span>
                      <p className="mt-0.5 text-base font-extrabold text-teal-950 tabular-nums">{fmtMiliar(pipelineActive)}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-teal-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-800" />
                </Link>

                <button
                  type="button"
                  onClick={goKontrak}
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-3.5 text-left shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/30 shadow-2xs">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-800 truncate block">Kontrak Proyek Deal</span>
                      <p className="mt-0.5 text-base font-extrabold text-emerald-950 tabular-nums">{fmtMiliar(wonContractValue)}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" />
                </button>

                <Link
                  to="/crm?tab=klien"
                  className="group flex items-center justify-between rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/20 p-3.5 shadow-xs transition-all hover:border-blue-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-800 ring-1 ring-blue-600/30 shadow-2xs">
                      <Building className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-blue-800 truncate block">Database Klien &amp; Owner</span>
                      <p className="mt-0.5 text-base font-extrabold text-blue-950">Kemitraan Aktif</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-800" />
                </Link>

                <Link
                  to="/keuangan?tab=Invoice"
                  className="group flex items-center justify-between rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/20 p-3.5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-800 ring-1 ring-indigo-600/30 shadow-2xs">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-indigo-800 truncate block">Penagihan Uang Muka</span>
                      <p className="mt-0.5 text-base font-extrabold text-indigo-950">Billing Termin</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-800" />
                </Link>
              </>
            ) : (
              /* Overview & Proyek (Original 6 cards) */
              <>
                <Link
                  to="/inventori"
                  className="group flex items-center justify-between rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 p-3.5 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 ring-1 ring-amber-600/30 shadow-2xs">
                      <Boxes className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-amber-800 truncate">{S.stockValueLabel}</span>
                        {lowStock.length > 0 && (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 ring-1 ring-rose-600/30">
                            {S.lowStockBadge.replace("{n}", String(lowStock.length))}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-lg font-extrabold text-amber-950 tabular-nums">{fmtMiliar(stockValue)}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-800" />
                </Link>

                <div className="flex items-center justify-between rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 p-3.5 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-800 ring-1 ring-sky-600/30 shadow-2xs">
                      <Calendar className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-sky-800 block truncate">{S.seaTrialLabel}</span>
                      <p className="mt-0.5 text-lg font-extrabold text-sky-950 truncate" title={seaTrialVessel}>
                        {seaTrialVessel}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full ring-1 ring-sky-600/30 shrink-0">
                    Terjadwal
                  </span>
                </div>

                <Link
                  to="/crm"
                  className="group flex items-center justify-between rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/20 p-3.5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-800 ring-1 ring-indigo-600/30 shadow-2xs">
                      <Anchor className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-indigo-800 block truncate">{S.activeQuotationLabel}</span>
                      <p className="mt-0.5 text-lg font-extrabold text-indigo-950 tabular-nums">{fmtMiliar(pipelineActive)}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-800" />
                </Link>

                <button
                  type="button"
                  onClick={goNcr}
                  title={`Buka ${openNcrIds.length} NCR terbuka di QC & Safety`}
                  className="group flex items-center justify-between rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 p-3.5 text-left shadow-xs transition-all hover:border-rose-400 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded ring-1 ring-rose-600/30">QC &amp; Safety</span>
                      <span className="text-[10px] font-semibold text-rose-600">Buka modul &rarr;</span>
                    </div>
                    <span className="text-xs font-semibold text-rose-900 block truncate">{S.openNcrLabel}</span>
                    <p
                      className="mt-0.5 text-base font-extrabold text-rose-700 tabular-nums"
                      title={criticalOpenNcr > 0 ? S.criticalCount.replace("{n}", String(criticalOpenNcr)) : S.nihilCritical}
                    >
                      {criticalOpenNcr > 0
                        ? S.ncrCasesCritical.replace("{n}", String(openNcr)).replace("{a}", String(criticalOpenNcr))
                        : S.ncrCases.replace("{n}", String(openNcr))}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goAR}
                  title={`Buka ${arRows.length} invoice belum tertagih di Keuangan`}
                  className="group flex items-center justify-between rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 p-3.5 text-left shadow-xs transition-all hover:border-blue-400 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded ring-1 ring-blue-600/30">Keuangan &amp; Billing</span>
                      <span className="text-[10px] font-semibold text-blue-600">Buka modul &rarr;</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-900 block truncate">{S.arLabel}</span>
                    <p className="mt-0.5 text-base font-extrabold text-blue-950 tabular-nums">{fmtMiliar(arOutstanding)}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goKontrak}
                  title={`Buka ${wonContracts.length} kontrak menang di CRM`}
                  className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-3.5 text-left shadow-xs transition-all hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded ring-1 ring-emerald-600/30">CRM &amp; Klien</span>
                      <span className="text-[10px] font-semibold text-emerald-600">Buka modul &rarr;</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-900 block truncate">Kontrak Menang</span>
                    <p className="mt-0.5 text-base font-extrabold text-emerald-950 tabular-nums">{fmtMiliar(wonContractValue)}</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </Card>
      </StaggerItem>

      {/* PERLU PERHATIAN - pilih kategori sebelum melihat laporan; pilihan terakhir
          disimpan di perangkat, dan item tetap menuju modul + tab + baris terkait. */}
      <StaggerItem>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between border-b border-steel-100 pb-3">
            <button
              type="button"
              onClick={goNotifikasi}
              title={`Buka semua notifikasi (${attentionItems.length} kondisi) - semua baris alert akan disorot`}
              className="group flex cursor-pointer items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-600/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-900 group-hover:text-rose-700 transition-colors">
                  {S.needAttention}
                  {selectedAttentionCategory && (
                    <span className="ml-1 text-xs font-normal text-steel-500">
                      {S.attentionSelectedCount.replace("{n}", String(selectedAttentionItems.length))}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-steel-400">{S.autoThreshold}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={goNotifikasi}
              className="btn-secondary text-xs px-2.5 py-1"
            >
              {S.seeAll} di Notifikasi &rarr;
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={S.attentionCategoryLabel}>
            {DASH_ALERT_CATEGORY_ORDER.map((key) => {
              const selected = selectedAttentionCategory === key;
              const count = attentionCountByCategory[key] ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAttentionCategory(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 ${
                    selected
                      ? "border-navy-900 bg-navy-900 text-white shadow-xs"
                      : "border-steel-200/90 bg-white text-steel-600 hover:bg-steel-50 hover:border-steel-300 hover:text-navy-900"
                  }`}
                >
                  <span>{DASH_ALERT_LABEL[key][locale === "en" ? "en" : "id"]}</span>
                  {count > 0 && (
                    <span
                      className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        selected
                          ? "bg-white text-navy-950"
                          : "bg-rose-100 text-rose-700 ring-1 ring-rose-600/20"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!selectedAttentionCategory && (
            <p className="px-1 text-sm text-steel-400">{S.attentionSelectCategory}</p>
          )}
          {selectedAttentionCategory && selectedAttentionItems.length === 0 && (
            <p className="px-1 text-sm text-steel-400">{S.allThresholdsSafe}</p>
          )}
          {selectedAttentionCategory && selectedAttentionItems.length > 0 && (
            <div className="space-y-4">
              {/* Ringkasan per tingkat tetap tampil walau tiap grup sudah
                  di-cap, jadi pengguna tahu ada yang belum terlihat. */}
              <p className="flex flex-wrap items-center gap-2 px-1 text-[11px] text-steel-500">
                {ALERT_LEVELS.map((lv) =>
                  attentionCount[lv] > 0 ? (
                    <span key={lv} className="rounded-md bg-steel-50 px-1.5 py-0.5 font-medium">
                      {t.notif[DASH_LEVEL_KEY[lv]]}: {attentionCount[lv]}
                    </span>
                  ) : null,
                )}
              </p>
              {attentionGroups.map((g) => (
                <div key={g.level}>
                  <div className="mb-1.5 flex items-center gap-2 px-1">
                    <span className={`h-3 w-1 rounded-full ${DASH_LEVEL_BAR[g.level]}`} aria-hidden="true" />
                    <span className={`text-xs font-semibold ${DASH_LEVEL_HEAD[g.level]}`}>
                      {t.notif[DASH_LEVEL_KEY[g.level]]}
                    </span>
                    <span className="text-[11px] text-steel-400">{g.total}</span>
                    {g.hidden > 0 && (
                      <span className="text-[11px] text-steel-400">
                        {locale === "en"
                          ? `+${g.hidden} more`
                          : `+${g.hidden} lainnya`}
                      </span>
                    )}
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {g.entries.slice(0, DASH_ALERT_CAP).map(({ key, item }) => (
                      <li key={`${key}:${item.id}`}>
                        <button
                          type="button"
                          onClick={() => goAttentionItem(key, item.rowId)}
                          className="flex h-full w-full flex-col items-start gap-1 rounded-xl border border-steel-100 bg-surface p-3 text-left hover:border-ocean-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
                        >
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${DASH_ALERT_TONE[key]}`}>
                            {DASH_ALERT_LABEL[key][locale === "en" ? "en" : "id"]}
                          </span>
                          <span className="text-xs font-medium leading-relaxed text-navy-800">{item.label}</span>
                          {item.detail && (
                            <span className="line-clamp-2 text-[11px] text-steel-500">{item.detail}</span>
                          )}
                          {item.impact && (
                            <span className="mt-auto pt-1 text-[11px] font-medium text-steel-400">{item.impact}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {selectedAttentionCategory && selectedAttentionItems.length > DASH_ALERT_CAP && (
            <p className="mt-3 px-1 text-xs text-steel-400">
              {locale === "en"
                ? `Showing up to ${DASH_ALERT_CAP} per level - see all in Notifications.`
                : `Menampilkan hingga ${DASH_ALERT_CAP} per tingkat - lihat semua di Notifikasi.`}
            </p>
          )}
        </Card>
      </StaggerItem>

      {/* STATUS + ACTIVITY - tepat di bawah Perlu Perhatian */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StaggerItem>
          <Card>
            <CardHeader
              title={S.activeProjectStatus}
              subtitle={S.latestProgress}
              action={
                <Link to="/proyek" className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-600 hover:text-ocean-500">
                  {S.seeAll} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="flex flex-wrap gap-1.5 px-5 pb-3" role="group" aria-label="Distribusi status proyek aktif">
              {(() => {
                const groups: Record<string, number> = {};
                for (const p of branchProjects) groups[String(p.status)] = (groups[String(p.status)] ?? 0) + 1;
                const order = ["Sedang Berjalan", "Dalam Proses", "Tertunda", "Terlambat", "Batal", "Selesai"];
const toneFor = (s: string): "blue" | "amber" | "red" | "gray" | "green" =>
                  s === "Terlambat" ? "red" : s === "Selesai" ? "green" : s === "Tertunda" ? "amber" : s === "Batal" ? "gray" : "blue";
                return order.filter((s) => (groups[s] ?? 0) > 0 || s !== "Selesai").map((s) => (
                  <Link key={s} to={`/proyek?status=${encodeURIComponent(s)}`} className="inline-flex items-center gap-1.5 rounded-full border border-steel-200 px-2.5 py-1 text-xs font-semibold hover:border-ocean-400" title={`Filter proyek ${s}`}>
                    <Badge tone={toneFor(s)}>{statusLabel(s, locale)}</Badge>
                    <span className="text-navy-900">{groups[s] ?? 0}</span>
                  </Link>
                ));
              })()}
            </div>
            <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
              {branchProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/proyek/${p.id}`}
                  state={{ from: "/dashboard" }}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate" title={p.vessel}>{p.vessel}</p>
                    <p className="text-xs text-steel-500">{p.id} · {p.client}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const prog = projectProgressOf(p, data.wbsByProject, data.boq);
                      return (
                        <div className="w-24">
                          <ProgressBar value={prog} tone={p.status === "Terlambat" ? "red" : "navy"} />
                          <p className="mt-1 text-right text-[11px] text-steel-500">{prog}%</p>
                        </div>
                      );
                    })()}
                    <Badge tone={p.status === "Terlambat" ? "red" : p.status === "Selesai" ? "green" : p.status === "Tertunda" ? "amber" : p.status === "Batal" ? "gray" : "blue"}>
                      {statusLabel(String(p.status), locale)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full">
            <CardHeader title={S.recentActivity} subtitle={S.realtimeLog} />
            <div className="max-h-80 space-y-1 overflow-y-auto p-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-surface">
                  <Avatar name={a.actor} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    {/* #79: isi aktivitas dibungkus, tidak dipotong - target panjang (kode proyek + nama) tetap terbaca. */}
                    <p className="break-words text-sm text-steel-700">
                      <span className="font-semibold text-navy-900">{a.actor}</span> {a.action}{" "}
                      <span className="font-medium text-navy-800">{a.target}</span>
                    </p>
                    <p className="text-[11px] text-steel-400">{a.time}</p>
                  </div>
                  <span className="shrink-0"><Badge tone={a.tone as never}>{a.module}</Badge></span>
                </div>
              ))}
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <StaggerItem className="lg:col-span-2">
          <Card>
            <CardHeader
              title={S.revenueVsVolume}
              subtitle={`${S.trend12Months} · Bulan berjalan paling kanan`}
              action={
                <div className="flex items-center gap-1 rounded-lg border border-steel-200 bg-surface p-0.5">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                        range === r ? "bg-white text-navy-800 shadow-sm" : "text-steel-500 hover:text-navy-700"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="h-64 p-4 pt-0 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="bln" tick={{ fontSize: 12, fill: "#64748B" }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 12, fill: "#64748B" }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="proj" orientation="right" tick={{ fontSize: 12, fill: "#64748B" }} stroke="#CBD5E1" axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip formatter={(v) => (typeof v === "number" ? `Rp ${v} M` : v)} />} />
                  <Area yAxisId="rev" type="monotone" dataKey="revenue" name={S.legendRevenue} stroke="#0284C7" strokeWidth={3} fill="url(#revGrad)" isAnimationActive />
                  <Bar yAxisId="proj" dataKey="projects" name={S.legendProjectCount} fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive />
                  <Line yAxisId="rev" type="monotone" dataKey="cost" name={S.legendCost} stroke="#F43F5E" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3, fill: "#F43F5E" }} isAnimationActive />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full">
            <CardHeader title={S.projectComposition} subtitle={S.byJobType} />
            <div className="flex flex-col items-center gap-4 p-4">
              <Donut
                data={typeDist}
                colors={typeDist.map((d) => d.color)}
                size={170}
                thickness={22}
                centerValue={String(typeDist.reduce((s, d) => s + d.value, 0))}
                centerLabel={S.donutProjects}
              />
              <div className="grid w-full grid-cols-2 gap-2">
                {typeDist.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                    <span className="text-steel-600">{d.name}</span>
                    <span className="ml-auto font-semibold text-navy-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* GAUGES + HEATMAP + INSIGHTS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* 3D TUGBOAT FLEET CAPACITY CARD (Inspired by Modern Logistics 3D Reference) */}
        <StaggerItem className="lg:col-span-2">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/80 p-5 shadow-soft h-full">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

            {/* Header */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/20">
                    <Ship className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Kapasitas Armada &amp; Fasilitas Galangan</h3>
                    <p className="text-[11px] text-slate-500">Tugboat, Tongkang &amp; Daya Tampung Drydock</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-800 ring-1 ring-cyan-600/30">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  Operasional Aktif
                </span>
              </div>

              {/* Big Metric & 3D Render Layout */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Metrics on left (5 cols) */}
                <div className="sm:col-span-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Utilisasi Dok &amp; Slipway</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl font-black text-slate-900 tracking-tight">{utilDrydock}%</span>
                      <span className="text-xs font-semibold text-emerald-600">+4.2% bln ini</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Daya Tampung DWT</span>
                      <span className="font-bold text-slate-800 tabular-nums">14.800 DWT</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Armada Dikerjakan</span>
                      <span className="font-bold text-slate-800 tabular-nums">{branchProjects.length} Unit Kapal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Fasilitas Dok</span>
                      <span className="font-bold text-slate-800">{drydocks.length} Area Dok</span>
                    </div>
                  </div>

                  {/* Top 2 Drydock facility status */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {drydockLoad.slice(0, 2).map((d) => (
                      <div key={d.dock}>
                        <div className="mb-0.5 flex justify-between text-[11px]">
                          <span className="font-medium text-slate-600 truncate">{d.dock}</span>
                          <span className="font-semibold text-slate-800">{d.kapasitas}%</span>
                        </div>
                        <ProgressBar value={d.kapasitas} tone={d.kapasitas > 85 ? "red" : d.kapasitas > 70 ? "amber" : "navy"} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3D Vessel Render on right (7 cols) */}
                <div className="sm:col-span-7 relative">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 p-1.5 shadow-lg border border-slate-700/50 group">
                    <div className="relative h-44 w-full overflow-hidden rounded-lg bg-slate-950">
                      <img
                        src="/tugboat-render.jpg"
                        alt="3D Tugboat Fleet Vessel"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                        <span className="font-bold drop-shadow-sm flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Armada Tugboat 3.200 BHP
                        </span>
                        <span className="rounded bg-black/50 px-2 py-0.5 backdrop-blur-xs text-[10px] text-slate-200">
                          Standar BKI / SOLAS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Monitoring real-time slipway &amp; floating dock</span>
              <div className="flex items-center gap-2">
                <Link
                  to="/kapal"
                  className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-800 px-2.5 py-1 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  <span>Daftar Armada</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/drydock"
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <span>Jadwal Dok</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full">
            <CardHeader title={S.productionUtil} subtitle={S.drydockVsEquip} />
            <div className="flex items-center justify-center gap-6 p-4">
              <RadialGauge value={utilDrydock} label="Drydock" color="#2563EB" />
              <RadialGauge value={utilEquipment} label="Equipment" color="#F59E0B" />
            </div>
            <div className="mt-2 -mb-1 h-16 px-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilSeries} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="equipment" stroke="#F59E0B" strokeWidth={2.5} fill="url(#utilGrad)" isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full">
            <CardHeader title={S.smartInsights} subtitle={S.autoRecommendations} />
            <div className="max-h-80 space-y-2.5 overflow-y-auto p-4 pt-0">
              {insights.map((i) => {
                const borderTone =
                  i.tone === "rose"
                    ? "border-l-4 border-l-rose-500 bg-rose-50/40"
                    : i.tone === "teal"
                    ? "border-l-4 border-l-emerald-500 bg-emerald-50/40"
                    : i.tone === "violet"
                    ? "border-l-4 border-l-indigo-500 bg-indigo-50/40"
                    : "border-l-4 border-l-sky-500 bg-sky-50/40";
                const dot =
                  i.tone === "rose" ? "bg-rose-500" : i.tone === "teal" ? "bg-emerald-500" : i.tone === "violet" ? "bg-indigo-500" : "bg-sky-500";
                return (
                  <div key={i.id} className={`rounded-xl border border-steel-100 p-3 shadow-2xs ${borderTone}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                      <p className="text-sm font-bold text-navy-900">{i.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-steel-600 leading-relaxed">{i.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </StaggerItem>
      </div>


    </Stagger>
  );
}
