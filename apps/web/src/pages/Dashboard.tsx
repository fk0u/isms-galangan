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
import { bucketByMonth, monthAxis, monthKeyOf } from "../utils/monthAxis";
import { numOf, pctChange } from "../utils/series";
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
  "equipment",
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

const DEFAULT_CATEGORY_FOR_SCOPE: Record<DashboardScope, ModuleAlertKey | null> = {
  overview: null,
  inventori: "inventori",
  sdm: "sdm",
  keuangan: "keuangan",
  proyek: "proyek",
  procurement: "procurement",
  qc: "qc",
  commercial: "crm",
};

/* Batasan modul alert yang boleh tampil per role di kartu Perlu Perhatian */
const ROLE_ALERT_MODULES: Record<DashboardScope, ModuleAlertKey[]> = {
  overview: DASH_ALERT_KEYS,
  sdm: ["sdm", "payroll"],
  inventori: ["inventori"],
  keuangan: ["keuangan"],
  proyek: ["proyek", "drydock", "equipment", "subkontraktor", "kapal"],
  procurement: ["procurement"],
  qc: ["qc"],
  commercial: ["crm"],
};

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
  const [selectedAttentionCategory, setSelectedAttentionCategory] = useState<ModuleAlertKey | null>(() => {
    const userR = (user?.role ?? "").toLowerCase();
    const isExec = ["developer", "direktur", "manager", "admin"].includes(userR);
    if (!isExec) {
      const sc = defaultScopeForRole(userR);
      return DEFAULT_CATEGORY_FOR_SCOPE[sc] ?? null;
    }
    return loadAttentionCategory();
  });
  const [targets, setTargets] = useState<Record<string, BranchTarget>>(() => loadTargets());
  const [showTarget, setShowTarget] = useState(false);
  const [tgtRev, setTgtRev] = useState("");
  const [tgtProj, setTgtProj] = useState("");

  const userRole = (user?.role ?? "").toLowerCase();
  const isExecutive = ["developer", "direktur", "manager", "admin"].includes(userRole);
  const scope: DashboardScope = isExecutive ? "overview" : defaultScopeForRole(user?.role);

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
  const goNotifikasi = () => {
    if (isExecutive) {
      navigate("/notifikasi?alert=1");
    } else {
      const defaultAlert = DEFAULT_CATEGORY_FOR_SCOPE[scope];
      navigate(defaultAlert ? `/notifikasi?alert=${encodeURIComponent(defaultAlert)}` : "/notifikasi");
    }
  };
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
    return revAxis.map((pt) => {
      const month = invoices.filter(
        (i) => monthKeyOf(i.paidAt ?? i.date ?? i.due) === pt.key,
      );
      const projects = new Set(month.map((i) => String(i.project ?? i.vessel ?? "")).filter(Boolean)).size;
      return {
        bln: pt.label,
        revenue: bucket[pt.key] ?? 0,
        cost: Math.round((month.reduce((s, i) => s + Number(i.neto ?? i.amount ?? 0), 0) / 1e9) * 100) / 100,
        projects,
      };
    });
  }, [data.invoices, inBranch, revAxis]);
  const utilDrydock = drydocks.length
    ? Math.round((drydocks.filter((d) => d.status === "Terpakai").length / drydocks.length) * 100)
    : 0;
  /* Ekor seri wajib dijaga: `utilSeries[len-1].equipment` melempar TypeError
     kalau deret seed kosong, dan karena render gagal seluruh pohon React
     ikut tumbang - bukan hanya kartu KPI ini. Helper lastPoint/prevPoint
     mengembalikan null; lihat utils/series.ts. */
  /* Utilisasi equipment = rata-rata `util` alat di cabang (dulu dari seri demo
     utilSeries). Belum ada riwayat per bulan, jadi tanpa delta. */
  const branchEquipment = inBranch(data.equipment);
  const utilEquipment = branchEquipment.length
    ? Math.round(branchEquipment.reduce((s, e) => s + numOf(e.util), 0) / branchEquipment.length)
    : 0;

  /* Sumbu + angka revenue dari invoice yang SUNGGUHNYA bertanggal.
     withMonthLabels() lama memutar seed revenueSeries supaya bulan berjalan
     jadi titik terakhir - numeriknya tidak berpindah, jadi label "Okt 2026"
     menempel ke angka yang sebenarnya milik Oktober tahun lalu, dan grafik
     menampilkan pertumbuhan fiktif. Sekarang label dan angka berasal dari
     bulan yang sama lewat bucketByMonth(); seed hanya dipakai sebagai
     fallback kalau tidak ada invoice bertanggal sama sekali.

     `revenue` dalam miliar, `cost` = nilai_before_tax invoice, `projects`
     = jumlah proyek berbeda di invoice bulan itu. */

  /* KPI pendapatan & margin dari data nyata (dulu seri demo revenueSeries/
     marginSeries, sehingga produksi menampilkan "Rp 79 M, +7,7%" fiktif).
     Pendapatan = chartData (invoice per bulan). Margin bulan = (nilai - biaya
     aktual) / nilai proyek yang selesai (`end`) di bulan itu. */
  // KPI selalu 12 bulan, tidak ikut tombol 6B/12B grafik.
  const axis12 = useMemo(() => monthAxis({ months: 12, locale }), [locale]);
  const kpi12 = useMemo(() => {
    const invoices = inBranch(data.invoices);
    return axis12.map((pt) => {
      const month = invoices.filter((i) => monthKeyOf(i.paidAt ?? i.date ?? i.due) === pt.key);
      return {
        bln: pt.label,
        revenue: Math.round((month.reduce((s, i) => s + Number(i.amount ?? 0), 0) / 1e9) * 100) / 100,
        projects: new Set(month.map((i) => String(i.project ?? i.vessel ?? "")).filter(Boolean)).size,
      };
    });
  }, [data.invoices, inBranch, axis12]);
  const sparkRevenue = kpi12.map((d) => ({ name: d.bln, v: d.revenue }));
  const sparkProjects = kpi12.map((d) => ({ name: d.bln, v: d.projects }));
  // Bulan berjalan belum ada invoice → delta disembunyikan (bukan "-100%").
  const revHasCurrent = numOf(kpi12[kpi12.length - 1]?.revenue) > 0;
  const revGrowth = pctChange(numOf(kpi12[kpi12.length - 1]?.revenue), numOf(kpi12[kpi12.length - 2]?.revenue));
  const marginByMonth = axis12.map((pt) => {
    const done = branchProjects.filter((p) => p.status === "Selesai" && monthKeyOf(p.end) === pt.key && numOf(p.budget) > 0);
    const val = done.reduce((s, p) => s + numOf(p.budget), 0);
    const cost = done.reduce((s, p) => s + numOf(p.actual), 0);
    return { name: pt.label, v: val > 0 ? Math.round(((val - cost) / val) * 1000) / 10 : null };
  });
  const sparkMargin = marginByMonth.map((m) => ({ name: m.name, v: m.v ?? 0 }));
  const marginPts = marginByMonth.filter((m) => m.v !== null);
  // Margin 12 bulan tertimbang nilai; delta = dua bulan terakhir yang punya proyek selesai.
  const marginVal = (() => {
    const done = branchProjects.filter((p) => p.status === "Selesai" && axis12.some((pt) => pt.key === monthKeyOf(p.end)) && numOf(p.budget) > 0);
    const val = done.reduce((s, p) => s + numOf(p.budget), 0);
    return val > 0 ? Math.round(((val - done.reduce((s, p) => s + numOf(p.actual), 0)) / val) * 1000) / 10 : 0;
  })();
  const lastMargin = { margin: marginVal };
  const marginDiff = marginPts.length >= 2 ? numOf(marginPts[marginPts.length - 1].v) - numOf(marginPts[marginPts.length - 2].v) : 0;
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

  /* Insight dari data nyata (dulu teks contoh: "Utilisasi Drydock 92%", "37 Saldo Awal", dst.). */
  const insights = [
    lowStock.length > 0 && { id: "stok", tone: "violet" as const, title: S.insStockT.replace("{n}", String(lowStock.length)), desc: S.insStockD },
    openNcr > 0 && { id: "ncr", tone: "rose" as const, title: S.insNcrT.replace("{n}", String(openNcr)), desc: criticalOpenNcr > 0 ? S.insNcrCritD.replace("{n}", String(criticalOpenNcr)) : S.insNcrD },
    arOutstanding > 0 && { id: "ar", tone: "navy" as const, title: S.insArT.replace("{n}", fmtMiliar(arOutstanding)), desc: S.insArD },
    marginVal !== 0 && { id: "margin", tone: "teal" as const, title: S.insMarginT.replace("{n}", marginVal.toLocaleString(locale === "en" ? "en-US" : "id-ID", { maximumFractionDigits: 1 })), desc: S.insMarginD },
  ].filter((x): x is { id: string; tone: "violet" | "rose" | "navy" | "teal"; title: string; desc: string } => Boolean(x));
  const totalRevenue = kpi12.reduce((s, d) => s + d.revenue, 0);
  const totalRevenueLabel = `Rp ${totalRevenue.toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  const typeDist = (["New Build", "Repair", "Retrofit"] as const).map((t, i) => ({
    name: t,
    value: projects.filter((p) => p.type === t).length,
    color: ["#2563EB", "#10B981", "#F59E0B"][i],
  }));
  const pipelineActive = inBranch(data.quotations)
    .filter((x) => x.stage !== "Menang")
    .reduce((s, x) => s + Number(x.value || 0), 0);

  /* Data Helper Khusus Tampilan Peran */
  const deptDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of inBranch(data.employees)) {
      const d = String(e.dept || "Operasional");
      counts[d] = (counts[d] ?? 0) + 1;
    }
    const colors = ["#0284C7", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B", "#06B6D4"];
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [data.employees, inBranch]);

  const leavesList = useMemo(() => {
    return inBranch(data.leaves ?? []).slice(0, 6);
  }, [data.leaves, inBranch]);

  const criticalItems = useMemo(() => {
    return lowStock.slice(0, 6);
  }, [lowStock]);

  const overdueInvoices = useMemo(() => {
    return arRows.slice(0, 6);
  }, [arRows]);

  const qcOpenList = useMemo(() => {
    return openNcrList.slice(0, 6);
  }, [openNcrList]);

  const commercialQuotationList = useMemo(() => {
    return inBranch(data.quotations ?? []).slice(0, 6);
  }, [data.quotations, inBranch]);

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
    const allowedKeys = isExecutive
      ? DASH_ALERT_KEYS
      : (ROLE_ALERT_MODULES[scope] ?? DASH_ALERT_KEYS);

    for (const k of allowedKeys) {
      if (!canOpenModule(user, k)) continue;
      for (const item of byKey[k]) out.push({ key: k, item });
    }
    return out;
  }, [scopedAlertData, user, isExecutive, scope]);

  const availableAlertKeys = useMemo(() => {
    if (isExecutive) return DASH_ALERT_CATEGORY_ORDER;
    const allowed = ROLE_ALERT_MODULES[scope] ?? [];
    return DASH_ALERT_CATEGORY_ORDER.filter((k) => allowed.includes(k));
  }, [isExecutive, scope]);

  const attentionCountByCategory = useMemo(() => {
    const counts: Partial<Record<ModuleAlertKey, number>> = {};
    for (const { key } of attentionItems) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [attentionItems]);

  const selectedAttentionItems = useMemo(() => {
    if (isExecutive) {
      return selectedAttentionCategory
        ? attentionItems.filter(({ key }) => key === selectedAttentionCategory)
        : [];
    }
    if (selectedAttentionCategory && availableAlertKeys.includes(selectedAttentionCategory)) {
      return attentionItems.filter(({ key }) => key === selectedAttentionCategory);
    }
    return attentionItems;
  }, [attentionItems, selectedAttentionCategory, isExecutive, availableAlertKeys]);

  const attentionTitle = useMemo(() => {
    if (isExecutive) return S.needAttention;
    switch (scope) {
      case "sdm": return "Perhatian SDM & Personalia";
      case "inventori": return "Perhatian Logistik & Gudang";
      case "keuangan": return "Perhatian Keuangan & Pajak";
      case "proyek": return "Perhatian Operasional Proyek";
      case "procurement": return "Perhatian Pengadaan & PO";
      case "qc": return "Perhatian Mutu & K3 Safety";
      case "commercial": return "Perhatian Komersial & CRM";
      default: return S.needAttention;
    }
  }, [isExecutive, scope, S]);

  const attentionSubtitle = useMemo(() => {
    if (isExecutive) return S.autoThreshold;
    return `Kondisi dan ambang batas yang membutuhkan tindak lanjut divisi ${scopeTitle}`;
  }, [isExecutive, scopeTitle, S]);

  /* Log Aktivitas Terkini yang disaring secara eksklusif per wewenang peran */
  const roleActivities = useMemo(() => {
    if (isExecutive || scope === "overview") return activities;

    const mapScope: Record<DashboardScope, string[]> = {
      overview: [],
      sdm: ["sdm", "hr", "absensi", "payroll", "cuti", "karyawan"],
      inventori: ["inventori", "gudang", "sparepart", "material", "stok"],
      keuangan: ["keuangan", "pajak", "billing", "kas", "bank", "invoice"],
      proyek: ["proyek", "kapal", "drydock", "equipment", "boq", "service", "subkontraktor"],
      procurement: ["procurement", "pengadaan", "po", "pr", "vendor"],
      qc: ["qc", "safety", "k3", "mutu", "inspeksi", "ncr"],
      commercial: ["crm", "commercial", "penawaran", "quotation", "klien"],
    };

    const allowed = mapScope[scope] ?? [];
    const filtered = activities.filter((a) => {
      const mod = (a.module || "").toLowerCase();
      return allowed.some((prefix) => mod.includes(prefix));
    });

    // Tanpa aktivitas nyata → kosong. Dulu diisi aktivitas contoh (nama fiktif) yang tampil di produksi.
    return filtered;
  }, [activities, isExecutive, scope]);

  const activityTitle = useMemo(() => {
    switch (scope) {
      case "sdm": return "Aktivitas SDM & Personalia";
      case "inventori": return "Aktivitas Gudang & Material";
      case "keuangan": return "Aktivitas Keuangan & Kas";
      case "procurement": return "Aktivitas Pengadaan";
      case "qc": return "Aktivitas Mutu & K3";
      case "commercial": return "Aktivitas Komersial & CRM";
      case "proyek": return "Aktivitas Lapangan & Proyek";
      default: return S.recentActivity;
    }
  }, [scope, S]);

  const activitySubtitle = useMemo(() => {
    switch (scope) {
      case "sdm": return "Log real-time aktivitas divisi SDM & Personalia";
      case "inventori": return "Log real-time aktivitas logistik & gudang material";
      case "keuangan": return "Log real-time transaksi keuangan & penagihan";
      case "procurement": return "Log real-time pengadaan & pesanan pembelian";
      case "qc": return "Log real-time pengawasan mutu & kepatuhan K3";
      case "commercial": return "Log real-time prospek penawaran & kontrak klien";
      case "proyek": return "Log real-time progres lapangan & pekerjaan kapal";
      default: return S.realtimeLog;
    }
  }, [scope, S]);

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
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={togglePresent} title={isFs ? S.exitFullscreen : S.presentBtn}>
                {isFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />} {isFs ? S.exitFullscreen : S.presentBtn}
              </button>
              {scope === "sdm" ? (
                <>
                  <Link to="/absensi" className="btn-secondary">
                    <CalendarCheck className="h-4 w-4" /> Rekap Absensi
                  </Link>
                  <Link to="/sdm" className="btn-primary-gradient">
                    <Users className="h-4 w-4" /> Kelola SDM
                  </Link>
                </>
              ) : scope === "inventori" ? (
                <>
                  <Link to="/inventori?tab=keluar" className="btn-secondary">
                    <Truck className="h-4 w-4" /> Pengeluaran
                  </Link>
                  <Link to="/inventori?tab=terima" className="btn-primary-gradient">
                    <Boxes className="h-4 w-4" /> Terima Barang
                  </Link>
                </>
              ) : scope === "keuangan" ? (
                <>
                  <Link to="/keuangan?tab=ArusKas" className="btn-secondary">
                    <Wallet className="h-4 w-4" /> Arus Kas
                  </Link>
                  <Link to="/keuangan?tab=Invoice" className="btn-primary-gradient">
                    <CreditCard className="h-4 w-4" /> Buat Invoice
                  </Link>
                </>
              ) : scope === "procurement" ? (
                <>
                  <Link to="/procurement?tab=pr" className="btn-secondary">
                    <FileText className="h-4 w-4" /> Review PR
                  </Link>
                  <Link to="/procurement?tab=po" className="btn-primary-gradient">
                    <ShoppingCart className="h-4 w-4" /> Buat PO
                  </Link>
                </>
              ) : scope === "qc" ? (
                <>
                  <Link to="/qc?tab=ptw" className="btn-secondary">
                    <HardHat className="h-4 w-4" /> Izin Kerja (PTW)
                  </Link>
                  <Link to="/qc?tab=ncr" className="btn-primary-gradient">
                    <ShieldCheck className="h-4 w-4" /> Catat NCR
                  </Link>
                </>
              ) : scope === "commercial" ? (
                <>
                  <Link to="/crm?tab=klien" className="btn-secondary">
                    <Building className="h-4 w-4" /> Mitra Klien
                  </Link>
                  <Link to="/crm" className="btn-primary-gradient">
                    <Briefcase className="h-4 w-4" /> Buat Penawaran
                  </Link>
                </>
              ) : (
                <>
                  <AsyncButton className="btn-secondary" onAction={exportSummary}>
                    <Download className="h-4 w-4" /> {S.exportBtn}
                  </AsyncButton>
                  <button className="btn-primary-gradient" onClick={() => navigate("/proyek?create=1&alert=proyek")}>
                    <Plus className="h-4 w-4" /> {S.newProjectBtn}
                  </button>
                </>
              )}
            </div>
          }
        />
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
                  {branchProjects.length} proyek terdaftar di portofolio aktif {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Total valuasi stok material tersimpan di gudang {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Total tenaga kerja galangan terdaftar di {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Total piutang usaha (AR) belum tertagih dari klien {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Proyek konstruksi &amp; reparasi berjalan aktif di galangan {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Total komitmen nilai Purchase Order aktif berjalan {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Temuan inspeksi mutu yang sedang dalam proses penanganan di {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                Nilai aktif prospek &amp; penawaran (quotation) yang sedang berjalan {branch === "SEMUA" ? <span className="font-semibold text-slate-800">semua cabang</span> : <>cabang <span className="font-semibold text-slate-800">{branch}</span></>}
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
                delta={revHasCurrent ? S.deltaPctVsMonth.replace("{n}", `${revGrowth >= 0 ? "+" : ""}${revGrowth.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`) : undefined}
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
                delta={revHasCurrent ? S.deltaPctVsMonth.replace("{n}", `${revGrowth >= 0 ? "+" : ""}${revGrowth.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`) : undefined}
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
                icon={<Cpu className="h-5 w-5" />}
                chip="amber"
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
              title={`Buka notifikasi (${attentionItems.length} kondisi) - semua baris alert akan disorot`}
              className="group flex cursor-pointer items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-600/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-900 group-hover:text-rose-700 transition-colors">
                  {attentionTitle}
                  <span className="ml-1 text-xs font-normal text-steel-500">
                    ({selectedAttentionItems.length} kondisi)
                  </span>
                </h3>
                <p className="text-[11px] text-steel-400">{attentionSubtitle}</p>
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

          {/* Untuk eksekutif: tampilkan semua chip kategori modul.
              Untuk non-eksekutif: hanya tampilkan bila memiliki > 1 sub-modul (misal SDM + Payroll). */}
          {isExecutive ? (
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={S.attentionCategoryLabel}>
              {availableAlertKeys.map((key) => {
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
          ) : availableAlertKeys.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={S.attentionCategoryLabel}>
              <button
                type="button"
                aria-pressed={!selectedAttentionCategory}
                onClick={() => setSelectedAttentionCategory(null)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 ${
                  !selectedAttentionCategory
                    ? "border-navy-900 bg-navy-900 text-white shadow-xs"
                    : "border-steel-200/90 bg-white text-steel-600 hover:bg-steel-50 hover:border-steel-300 hover:text-navy-900"
                }`}
              >
                <span>Semua Kondisi</span>
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${!selectedAttentionCategory ? "bg-white text-navy-950" : "bg-steel-100 text-steel-700"}`}>
                  {attentionItems.length}
                </span>
              </button>
              {availableAlertKeys.map((key) => {
                const selected = selectedAttentionCategory === key;
                const count = attentionCountByCategory[key] ?? 0;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedAttentionCategory(selected ? null : key)}
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
          ) : null}
          {isExecutive && !selectedAttentionCategory && (
            <p className="px-1 text-sm text-steel-400">{S.attentionSelectCategory}</p>
          )}
          {((isExecutive && selectedAttentionCategory && selectedAttentionItems.length === 0) ||
            (!isExecutive && attentionItems.length === 0)) && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-900">
                {isExecutive ? S.allThresholdsSafe : `Kondisi operasional ${scopeTitle} aman & terkendali.`}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Tidak ada ambang batas kritis atau peringatan yang membutuhkan tindakan segera saat ini.
              </p>
            </div>
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

      {/* ROLE-SPECIFIC CONTENT SECTIONS */}
      {/* 1. KHUSUS SDM & PERSONALIA (HR) */}
      {scope === "sdm" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Komposisi Tenaga Kerja Galangan"
                subtitle="Distribusi personel aktif berdasarkan departemen"
                action={
                  <Link to="/sdm" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-500">
                    Kelola SDM <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="flex flex-col items-center gap-4 p-4">
                <Donut
                  data={deptDist}
                  colors={deptDist.map((d) => d.color)}
                  size={170}
                  thickness={22}
                  centerValue={String(totalEmployees)}
                  centerLabel="Personel"
                />
                <div className="grid w-full grid-cols-2 gap-2">
                  {deptDist.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                      <span className="text-steel-600 truncate">{d.name}</span>
                      <span className="ml-auto font-semibold text-navy-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Permohonan Cuti & Izin"
                subtitle={`${pendingLeaves} pengajuan cuti menunggu proses HR`}
                action={
                  <Link to="/sdm?tab=cuti" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-500">
                    Semua Cuti <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {leavesList.length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Tidak ada pengajuan cuti yang tertunda.</p>
                ) : (
                  leavesList.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{l.employeeName || l.employeeId}</p>
                        <p className="text-xs text-steel-500">{l.type || "Cuti Tahunan"} · {l.startDate} s/d {l.endDate}</p>
                      </div>
                      <Badge tone={l.status === "Menunggu" || l.status === "Diajukan" ? "amber" : l.status === "Disetujui" ? "green" : "gray"}>
                        {l.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}

      {/* 2. KHUSUS LOGISTIK & GUDANG MATERIAL */}
      {scope === "inventori" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Material Kritis & Stok Minimum"
                subtitle={`${criticalStockCount} item perlu restock segera untuk proyek`}
                action={
                  <Link to="/inventori" className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-500">
                    Katalog Stok <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {criticalItems.length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Semua stok material dalam batas aman.</p>
                ) : (
                  criticalItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{item.name}</p>
                        <p className="text-xs text-steel-500">{item.code || item.id} · Lokasi: {item.location || "Gudang Utama"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-rose-600 tabular-nums">{item.quantity} {item.unit}</span>
                        <p className="text-[11px] text-steel-400">Min: {item.minStock ?? item.min_stock ?? 10}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Permintaan Pengeluaran Material (PR)"
                subtitle={`${openRequisitions.length} permintaan barang dari proyek lapangan`}
                action={
                  <Link to="/inventori?tab=keluar" className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-500">
                    Pengeluaran <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {openRequisitions.slice(0, 6).length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Tidak ada permintaan material yang menunggu.</p>
                ) : (
                  openRequisitions.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{r.code || r.id}</p>
                        <p className="text-xs text-steel-500">{r.project || "Proyek Lapangan"} · {r.requester || "Staff"}</p>
                      </div>
                      <Badge tone={r.status === "Menunggu Approval" ? "amber" : "blue"}>
                        {r.status || "Terbuka"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}

      {/* 3. KHUSUS KEUANGAN & PERPAJAKAN */}
      {scope === "keuangan" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Piutang (AR) Belum Lunas"
                subtitle={`${arRows.length} invoice klien belum terbayar`}
                action={
                  <Link to="/keuangan?tab=Invoice" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                    Buka Billing <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {overdueInvoices.length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Semua invoice klien telah lunas.</p>
                ) : (
                  overdueInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{inv.client || inv.customer || "Klien"}</p>
                        <p className="text-xs text-steel-500">{inv.number || inv.id} · Jatuh tempo: {inv.due || inv.dueDate || "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-navy-900 tabular-nums">{fmtMiliar(Number(inv.amount || 0))}</span>
                        <div><Badge tone={inv.status === "Overdue" ? "red" : "amber"}>{inv.status || "Belum Lunas"}</Badge></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Hutang Usaha (AP) ke Vendor"
                subtitle={`${apRows.length} kewajiban pembayaran pengadaan material`}
                action={
                  <Link to="/keuangan?tab=Hutang" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                    Kelola AP <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {apRows.slice(0, 6).length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Semua hutang vendor telah diselesaikan.</p>
                ) : (
                  apRows.slice(0, 6).map((ap) => (
                    <div key={ap.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{ap.vendor || ap.supplier || "Vendor"}</p>
                        <p className="text-xs text-steel-500">{ap.number || ap.id} · Jatuh tempo: {ap.due || "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-rose-700 tabular-nums">{fmtMiliar(Number(ap.amount || 0))}</span>
                        <div><Badge tone="amber">{ap.status || "Belum Bayar"}</Badge></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}

      {/* 4. KHUSUS QC & MUTU */}
      {scope === "qc" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Temuan Ketidaksesuaian (NCR) Aktif"
                subtitle={`${openNcr} kasus inspeksi mutu dalam pemantauan`}
                action={
                  <Link to="/qc?tab=ncr" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-500">
                    Modul QC <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {qcOpenList.length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Nihil temuan NCR terbuka.</p>
                ) : (
                  qcOpenList.map((n) => (
                    <div key={n.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{n.title || n.description || n.id}</p>
                        <p className="text-xs text-steel-500">{n.id} · Proyek: {n.project || "-"}</p>
                      </div>
                      <Badge tone={n.severity === "Critical" ? "red" : "amber"}>
                        {n.severity || "Major"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Keselamatan Kerja (K3) & Kelaikan BKI"
                subtitle="Status kepatuhan keselamatan galangan"
                action={
                  <Link to="/qc?tab=ptw" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-500">
                    Izin Kerja PTW <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-950">Zero Accident Performance</p>
                      <p className="text-xs text-emerald-700">Galangan beroperasi tanpa insiden fatal</p>
                    </div>
                  </div>
                  <Badge tone="green">Aman</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-steel-100">
                    <span className="text-steel-600">Izin Kerja Panas (Hot Work)</span>
                    <span className="font-semibold text-navy-900">100% Berizin</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-steel-100">
                    <span className="text-steel-600">Izin Ruang Terbatas (Confined Space)</span>
                    <span className="font-semibold text-navy-900">Gas Test Terverifikasi</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-steel-100">
                    <span className="text-steel-600">Sertifikasi Surveyor BKI</span>
                    <span className="font-semibold text-navy-900">Berlaku</span>
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}

      {/* 5. KHUSUS PENGADAAN (PROCUREMENT) */}
      {scope === "procurement" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Purchase Order (PO) Berjalan"
                subtitle={`${activePOs.length} pesanan aktif dalam pengiriman`}
                action={
                  <Link to="/procurement?tab=po" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-500">
                    Semua PO <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {activePOs.slice(0, 6).length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Tidak ada Purchase Order berjalan.</p>
                ) : (
                  activePOs.slice(0, 6).map((po) => (
                    <div key={po.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{po.vendor || po.vendorName || "Vendor"}</p>
                        <p className="text-xs text-steel-500">{po.code || po.id} · Tgl: {po.date || "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-navy-900 tabular-nums">{fmtMiliar(Number(po.total || 0))}</span>
                        <div><Badge tone="blue">{po.status || "Proses"}</Badge></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Purchase Requisition (PR) Pending"
                subtitle={`${pendingPrCount} pengajuan barang butuh approval / PO`}
                action={
                  <Link to="/procurement?tab=pr" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-500">
                    Review PR <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {openRequisitions.slice(0, 6).length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Semua PR telah diproses.</p>
                ) : (
                  openRequisitions.slice(0, 6).map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{pr.code || pr.id}</p>
                        <p className="text-xs text-steel-500">{pr.project || "Proyek"} · Pemohon: {pr.requester || "Staff"}</p>
                      </div>
                      <Badge tone="amber">{pr.status || "Diajukan"}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}

      {/* 6. KHUSUS KOMERSIAL & CRM */}
      {scope === "commercial" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Pipeline Penawaran (Quotation)"
                subtitle="Prospek tender & estimasi nilai penawaran"
                action={
                  <Link to="/crm" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-500">
                    Semua Penawaran <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {commercialQuotationList.length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Tidak ada penawaran aktif.</p>
                ) : (
                  commercialQuotationList.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{q.client || q.clientName || "Klien"}</p>
                        <p className="text-xs text-steel-500">{q.number || q.id} · Kapal: {q.vessel || "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-navy-900 tabular-nums">{fmtMiliar(Number(q.value || 0))}</span>
                        <div><Badge tone={q.stage === "Menang" ? "green" : q.stage === "Kalah" ? "gray" : "blue"}>{q.stage || "Terkirim"}</Badge></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="h-full">
              <CardHeader
                title="Kontrak Menang (Deal) Terbaru"
                subtitle={`${wonContracts.length} kontrak disepakati klien`}
                action={
                  <Link to="/crm?tab=kontrak" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-500">
                    Buka Kontrak <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="max-h-80 divide-y divide-steel-100 overflow-y-auto">
                {wonContracts.slice(0, 6).length === 0 ? (
                  <p className="p-6 text-center text-sm text-steel-400">Belum ada kontrak tercatat.</p>
                ) : (
                  wonContracts.slice(0, 6).map((k) => (
                    <div key={k.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{k.client || "Klien"}</p>
                        <p className="text-xs text-steel-500">{k.number || k.id} · {k.title || "Kontrak Galangan"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">{fmtMiliar(Number(k.value || 0))}</span>
                        <div><Badge tone="green">Menang</Badge></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}

      {/* 7. UNTUK EKSEKUTIF & PROYEK: STATUS PROYEK AKTIF */}
      {(scope === "overview" || scope === "proyek") && (
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
              <CardHeader title={activityTitle} subtitle={activitySubtitle} />
              <div className="max-h-80 space-y-1 overflow-y-auto p-3">
                {roleActivities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-surface">
                    <Avatar name={a.actor} className="h-8 w-8 shrink-0" />
                    <div className="min-w-0 flex-1">
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
      )}

      {/* UNTUK ROLE SELAIN OVERVIEW & PROYEK: TAMPILKAN LOG AKTIVITAS TERKINI KHUSUS ROLE */}
      {scope !== "overview" && scope !== "proyek" && (
        <StaggerItem>
          <Card className="h-full">
            <CardHeader title={activityTitle} subtitle={activitySubtitle} />
            <div className="max-h-80 space-y-1 overflow-y-auto p-3">
              {roleActivities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-surface">
                  <Avatar name={a.actor} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
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
      )}

      {/* MAIN CHARTS - HANYA TAMPIL UNTUK OVERVIEW (EKSEKUTIF) */}
      {scope === "overview" && (
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
      )}

      {/* GAUGES + TUGBOAT + INSIGHTS - HANYA UNTUK OVERVIEW ATAU PROYEK */}
      {(scope === "overview" || scope === "proyek") && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* 3D TUGBOAT FLEET CAPACITY CARD */}
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

                  </div>

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
              {/* Grafik tren utilitas dihapus: dulu seri demo, belum ada riwayat nyata per bulan. */}
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
      )}


    </Stagger>
  );
}
