import { useState, useMemo, useEffect, useRef, type ComponentType } from "react";
import { NavLink, Outlet, Link, matchPath, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Wallet,
  Users,
  Handshake,
  ShoppingCart,
  ShieldCheck,
  Ship,
  HardHat,
  FolderOpen,
  FolderKanban,
  ClipboardCheck,
  Cpu,
  BarChart3,
  Menu,
  Bell,
  ShipWheel,
  Search,
  ChevronsUpDown,
  CheckCircle2,
  FileText,
  LogOut,
  User,
  RotateCcw,
  CalendarCheck,
  Banknote,
  Activity,
  KeyRound,
  Settings as SettingsIcon,
  ChevronDown,
  PanelLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth, hasPermission, canOpenModule } from "../auth/auth";
import { moduleKeyOf, canSeePath, canSeeActivity } from "../utils/moduleKey";
import { useStore } from "../data/store";
import DemoGuide from "../components/DemoGuide";
import { Badge, Modal, Field, Toaster, toast } from "../components/ui";
import { markSessionExpired } from "../auth/sessionExpired";
import { apiFetch } from "../services/http";
import { computeAlerts } from "../utils/alerts";
import { loadNotifRead, saveNotifRead, loadModSeen } from "../utils/notifRead";
import { buildModuleAlertItems, badgeCount, countByLevel, type ModuleAlertKey } from "../utils/moduleAlerts";
import { useT } from "../i18n/LanguageContext";
import { n_misc } from "../i18n/n_misc";
import { remoteRepository } from "../services/repositories";
import { useRealtime } from "../data/useRealtime";
import { recentModuleSync, useFailedCollections, useModuleSync, useModuleSyncing, useProjectWbsSync } from "../data/useModuleSync";
import { SHELL_ALERT_COLLECTIONS } from "../data/moduleCollections";
import { scopeAlertStoreData } from "../data/scopeAlertData";
import { getJwt, isBackendConfigured } from "../services/http";

export default function AppShell() {
  const { user, logout } = useAuth();
  useRealtime(Boolean(user));
  const { t, locale, setLocale } = useT();
  const { data, reset, branch, setBranch, backendMode, backendError, pendingSync, pushPending, resync, inBranch } = useStore();
  const location = useLocation();
  useModuleSync(SHELL_ALERT_COLLECTIONS, [user?.id]);
  const alertProjectIds = useMemo(
    () => inBranch(data.projects ?? []).map((project) => String(project.id)),
    [data.projects, inBranch],
  );
  /* Cabang yang boleh diakses akun ini, dari claim JWT (`/api/auth/me`).
     "SEMUA" untuk akun demo/developer dan sesi lokal tanpa backend - mode
     lokal tidak punya server yang bisa menolak, jadi tidak perlu dibatasi. */
  const userBranch = String(user?.branch ?? "SEMUA") || "SEMUA";
  const S = n_misc[locale];
  const navigate = useNavigate();
  /* Badge global: tampil selama batch halaman mana pun (useModuleSync)
     sedang berjalan - tak ada jeda tanpa umpan balik saat pindah modul. */
  const moduleSyncing = useModuleSyncing();
  const failedSync = useFailedCollections();

  /* Filter cabang global disimpan di localStorage, jadi bisa tertinggal
     nilai yang tidak boleh dipakai akun ini - localStorage bisa diubah
     dari sesi sebelumnya, atau sebelum akun dipindahkan ke cabang lain.
     Efek ini memaksa kembali ke cabang sendiri. Tanpa itu layar menampilkan
     angka cabang lain sementara ekspor PDF-nya 403: dua-duanya salah, dan
     yang kedua baru ketahuan setelah pengguna menekan tombol. */
  useEffect(() => {
    if (userBranch === "SEMUA") return;
    if (branch !== userBranch) setBranch(userBranch);
  }, [userBranch, branch, setBranch]);

  useEffect(() => {
    const onExpired = () => {
      /* Toaster hidup di AppShell yang ikut lepas saat pindah ke /login, jadi
         toast di sini tidak pernah terlihat. Pesan "Sesi berakhir" ditandai di
         sessionStorage dan ditampilkan halaman Login (K17-UMUM-01) - state
         navigasi tidak cukup karena RequireAuth ikut mengalihkan dan menimpanya. */
      markSessionExpired();
      logout(true);
      reset();
      navigate("/login");
    };
    window.addEventListener("isms:auth-expired", onExpired);
    return () => window.removeEventListener("isms:auth-expired", onExpired);
  }, [logout, navigate, t]);

  // Heartbeat sesi realtime (BE: upsert last_seen, 60 dtk, hanya bila login).
  // Deps user?.id: mulai ulang setelah login dalam sesi SPA yang sama
  // (sebelumnya deps [] sehingga login tanpa remount tak pernah beat).
  useEffect(() => {
    if (!isBackendConfigured() || !getJwt()) return;
    let stopped = false;
    const beat = () => {
      if (stopped || !getJwt()) return;
      void apiFetch("/api/auth/heartbeat", { method: "POST" }).catch(() => undefined);
    };
    beat();
    const id = window.setInterval(beat, 60000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);
  const [open, setOpen] = useState(false);
  // Sidebar minimize (desktop): rail ikon animasi, preferensi persist.
  const [minSide, setMinSide] = useState(() => {
    try {
      return localStorage.getItem("isms.minSide") === "1";
    } catch {
      return false;
    }
  });
  const toggleMinSide = () => {
    setMinSide((v) => {
      try {
        localStorage.setItem("isms.minSide", v ? "0" : "1");
      } catch {
        /* abaikan */
      }
      return !v;
    });
  };
  // Accordion grup nav: default open semua, pilihan persist.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("isms.navGroups");
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      /* abaikan */
    }
    return {};
  });
  const isGroupOpen = (label: string): boolean => openGroups[label] !== false;
  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !isGroupOpen(label) };
      try {
        localStorage.setItem("isms.navGroups", JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  };
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // Peta WBS hanya diperlukan untuk milestone/critical-path alert di bell.
  // Jangan tarik semua WBS saat Finance/P&L dibuka; sync on-demand saat bell dibuka.
  const shellNeedsWbs = !location.pathname.startsWith("/keuangan") || notifOpen;
  useProjectWbsSync(shellNeedsWbs ? alertProjectIds : []);
  const [bellExpanded, setBellExpanded] = useState(false);
  const [bellMin, setBellMin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [q, setQ] = useState("");

  const scopedAlertData = useMemo(() => scopeAlertStoreData(data, branch), [data, branch]);
  // #288: notifikasi hanya untuk modul yang boleh dibuka role ini.
  const alerts = useMemo(() => computeAlerts(scopedAlertData).filter((al) => canSeePath(user, al.to)), [scopedAlertData, user]);
  const visibleActs = useMemo(() => (data.activities ?? []).filter((a) => canSeeActivity(user, a.module)), [data.activities, user]);

  /* Badge bell = item belum dibaca beneran (alert + 30 aktivitas terakhir - yang sudah dibaca). */
  const notifIds = useMemo(
    () => [...alerts.map((al) => `alert-${al.id}`), ...visibleActs.slice(0, 30).map((a) => `act-${String(a.id)}`)],
    [alerts, visibleActs]
  );
  const [readTick, setReadTick] = useState(0);
  const unreadCount = useMemo(() => {
    void readTick;
    const read = loadNotifRead();
    return notifIds.filter((id) => !read.has(id)).length;
  }, [notifIds, readTick]);
  const markNotifRead = (id: string) => {
    const read = loadNotifRead();
    if (read.has(id)) return;
    read.add(id);
    saveNotifRead(read);
    setReadTick((t) => t + 1);
  };

  /* Badge sidebar "tampil sekali": jumlah item kondisi yang belum seen.
     Modul dibuka (jalur mana pun) → hook useModuleAlert mencatat seen +
     event isms:modseen → hitung ulang. Tanpa cap 500 (bug lama).
     Banner + highlight di halaman tetap ikut kondisi. */
  const [seenTick, setSeenTick] = useState(0);
  useEffect(() => {
    const onSeen = () => setSeenTick((v) => v + 1);
    window.addEventListener("isms:modseen", onSeen);
    return () => window.removeEventListener("isms:modseen", onSeen);
  }, []);
  const unreadModuleCount = useMemo(() => {
    void seenTick;
    const seen = loadModSeen();
    const all = buildModuleAlertItems(scopedAlertData);
    const out = {} as Record<ModuleAlertKey, number>;
    (Object.keys(all) as ModuleAlertKey[]).filter((k) => canOpenModule(user, k)).forEach((k) => {
      const s = new Set(seen[k] ?? []);
      /* Badge = KRITIS + PERHATIAN saja. `info` selalu tampil di banner,
         jadi menghitungnya di sini hanya menambah angka yang tidak bisa
         ditindaklanjuti - dan membuat badge jadi alasan menutup banner
         yang isinya memang tidak perlu ditutup. */
      out[k] = badgeCount(countByLevel(all[k].filter((a) => !s.has(a.id))));
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedAlertData, seenTick]);

  /* Urutan grup ikut alur bisnis galangan: Utama → Komersial (CRM melahirkan
     Proyek) → Operasional → SDM → Aset (master) → Analisis → Sistem. */
  const navGroups: { label: string; items: { to: string; label: string; icon: ComponentType<{ className?: string }>; alertKey?: ModuleAlertKey; child?: boolean; col?: string }[] }[] = useMemo(() => [
    {
      label: t.nav.utama,
      items: [
        { to: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
      ],
    },
    {
      label: t.nav.komersial,
      items: [
        { to: "/crm", label: t.nav.crm, icon: Handshake, alertKey: "crm", col: "clients" },
        { to: "/procurement", label: t.nav.procurement, icon: ShoppingCart, alertKey: "procurement", col: "purchaseOrders" },
        { to: "/keuangan", label: t.nav.keuangan, icon: Wallet, alertKey: "keuangan", col: "invoices" },
      ],
    },
    {
      label: t.nav.operasional,
      items: [
        { to: "/proyek", label: t.nav.proyek, icon: FolderKanban, alertKey: "proyek", col: "projects" },
        { to: "/proyek/monitoring", label: t.nav.monitoring, icon: Activity, col: "projects" },
        { to: "/drydock", label: t.nav.drydock, icon: ShipWheel, alertKey: "drydock", col: "drydocks" },
        { to: "/inventori", label: t.nav.inventori, icon: Boxes, alertKey: "inventori", col: "inventory" },
        { to: "/equipment", label: t.nav.equipment, icon: Cpu, alertKey: "equipment", col: "equipment" },
        { to: "/subkontraktor", label: t.nav.subkontraktor, icon: HardHat, alertKey: "subkontraktor", col: "subcontractors" },
        { to: "/qc-safety", label: t.nav.qc, icon: ClipboardCheck, alertKey: "qc", col: "ncr" },
      ],
    },
    {
      label: t.nav.grupSdm,
      items: [
        { to: "/sdm", label: t.nav.sdm, icon: Users, alertKey: "sdm", col: "employees" },
        { to: "/absensi", label: t.nav.absensi, icon: CalendarCheck, col: "attendance" },
        { to: "/payroll", label: t.nav.payroll, icon: Banknote, alertKey: "payroll", col: "payroll" },
      ],
    },
    {
      label: t.nav.aset,
      items: [
        { to: "/kapal", label: t.nav.kapal, icon: Ship, alertKey: "kapal", col: "vessels" },
        { to: "/dokumen", label: t.nav.dokumen, icon: FolderOpen, alertKey: "dokumen", col: "documents" },
      ],
    },
    {
      label: t.nav.analisis,
      items: [
        { to: "/analytics", label: t.nav.analytics, icon: BarChart3, col: "projects" },
        { to: "/laporan", label: t.nav.laporan, icon: FileText, col: "projects" },
      ],
    },
    {
      label: t.nav.sistem,
      items: [
        { to: "/notifikasi", label: t.nav.notifikasi, icon: Bell },
        { to: "/pengaturan", label: t.nav.pengaturan, icon: SettingsIcon, col: "settings" },
        { to: "/pengaturan/peran", label: t.nav.peran, icon: KeyRound, child: true, col: "users" },
        { to: "/audit", label: t.nav.audit, icon: ShieldCheck, col: "audit" },
      ],
    },
  ], [t]);

  const visibleNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // #289: modul yang tidak diizinkan untuk role ini tidak tampil.
          if (!canOpenModule(user, moduleKeyOf(item.to))) return false;
          if (!item.col || !user?.permissions) return true;
          return hasPermission(user.permissions, item.col, "r");
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, user]);

  const doLogout = () => {
    const ok = logout();
    if (!ok) return;
    if (isBackendConfigured() && getJwt()) {
      void apiFetch("/api/auth/logout", { method: "DELETE" }).catch(() => undefined);
    }
    reset();
    navigate("/login");
  };

  const doReset = () => {
    reset();
    setProfileOpen(false);
    toast(t.session.demoReset, "info");
  };

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const doChangePassword = async () => {
    if (!isBackendConfigured()) {
      toast(S.tLocalPasswordInfo, "info");
      return;
    }
    if (newPw.length < 8) {
      toast(S.tNewPasswordMin, "info");
      return;
    }
    try {
      await apiFetch("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      setOldPw("");
      setNewPw("");
      toast(S.tPasswordChanged);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.tPasswordFailed, "info");
    }
  };

  // Pencarian global: lokal (fallback) + backend saat remote (q → BE).
  interface Hit { label: string; sub: string; to: string; kind: string }
  const query = q.trim().toLowerCase();
  const rawQuery = q.trim();
  const remoteSearchable = backendMode === "remote";
  const [remoteHits, setRemoteHits] = useState<Hit[] | null>(null);

  useEffect(() => {
    if (!remoteSearchable || !rawQuery || !isBackendConfigured() || !getJwt()) {
      setRemoteHits(null);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const [prj, vsl, doc, vnd] = await Promise.all([
            remoteRepository("projects").listFiltered?.({ q: rawQuery }) ?? Promise.resolve([]),
            remoteRepository("vessels").listFiltered?.({ q: rawQuery }) ?? Promise.resolve([]),
            remoteRepository("documents").listFiltered?.({ q: rawQuery }) ?? Promise.resolve([]),
            remoteRepository("vendors").listFiltered?.({ q: rawQuery }) ?? Promise.resolve([]),
          ]);
          if (cancelled) return;
          setRemoteHits([
            ...(prj ?? []).slice(0, 3).map((p) => ({
              label: String(p.vessel ?? p.id), sub: `${p.id} · ${p.client ?? ""}`, to: `/proyek/${p.id}`, kind: "Proyek",
            })),
            ...(vsl ?? []).slice(0, 2).map((v) => ({
              label: String(v.name ?? v.id), sub: String(v.type ?? v.imo ?? ""), to: `/kapal/${v.id}`, kind: "Kapal",
            })),
            ...(doc ?? []).slice(0, 2).map((d) => ({
              label: String(d.title ?? d.id), sub: `${d.type ?? ""} · ${d.project ?? ""}`, to: "/dokumen", kind: "Dokumen",
            })),
            ...(vnd ?? []).slice(0, 2).map((v) => ({
              label: String(v.name ?? v.id), sub: String(v.cat ?? ""), to: "/procurement", kind: "Vendor",
            })),
          ]);
        } catch {
          if (!cancelled) setRemoteHits(null);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [rawQuery, remoteSearchable]);

  // Fallback lokal: proyek, kapal, invoice, PO, penawaran, karyawan
  const localHits: Hit[] = useMemo(() => {
    if (!query) return [];
    return [
      ...data.projects
        .filter((p) => `${p.vessel} ${p.id} ${p.client}`.toLowerCase().includes(query))
        .slice(0, 3)
        .map((p) => ({ label: p.vessel, sub: `${p.id} · ${p.client}`, to: `/proyek/${p.id}`, kind: "Proyek" })),
      ...data.vessels
        .filter((v) => `${v.name} ${v.imo ?? ""} ${v.owner ?? ""}`.toLowerCase().includes(query))
        .slice(0, 2)
        .map((v) => ({ label: v.name, sub: String(v.type ?? v.imo ?? ""), to: `/kapal/${v.id}`, kind: "Kapal" })),
      ...data.invoices
        .filter((i) => `${i.id} ${i.client}`.toLowerCase().includes(query))
        .slice(0, 2)
        .map((i) => ({ label: i.id, sub: `${i.client} · ${i.project}`, to: "/keuangan", kind: "Invoice" })),
      ...data.purchaseOrders
        .filter((p) => `${p.id} ${p.item} ${p.vendor}`.toLowerCase().includes(query))
        .slice(0, 2)
        .map((p) => ({ label: p.id, sub: `${p.item} · ${p.vendor}`, to: "/procurement", kind: "PO" })),
      ...data.quotations
        .filter((x) => `${x.id} ${x.vessel} ${x.client}`.toLowerCase().includes(query))
        .slice(0, 2)
        .map((x) => ({ label: x.id, sub: `${x.vessel} · ${x.client}`, to: "/crm", kind: "Quotation" })),
      ...data.employees
        .filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(query))
        .slice(0, 2)
        .map((e) => ({ label: e.name, sub: `${e.role} · ${e.dept}`, to: "/sdm", kind: "Karyawan" })),
    ];
  }, [query, data.projects, data.vessels, data.invoices, data.purchaseOrders, data.quotations, data.employees]);

  const hits: Hit[] = remoteSearchable && remoteHits !== null ? remoteHits : localHits;

  /* Refetch per modul: tiap pindah route, tarik ulang dari backend bila online
     dan resync terakhir >60 dtk. Dilewati saat mengetik di pencarian global,
     saat modal/dropdown terbuka, atau tab tersembunyi - resync menimpa draft
     tabel. Throttle via ref timestamp. */
  const projectDetailRoute = matchPath({ path: "/proyek/:id", end: true }, location.pathname) !== null
    && matchPath({ path: "/proyek/monitoring", end: true }, location.pathname) === null;
  const stateFrom = (location.state as { from?: unknown } | null)?.from;
  const requestedNavOrigin = typeof stateFrom === "string" ? stateFrom.split(/[?#]/, 1)[0] : "/proyek";
  const activeProjectOrigin = projectDetailRoute
    ? navGroups.flatMap((group) => group.items).find((item) => item.to === requestedNavOrigin)?.to ?? "/proyek"
    : null;
  const lastResyncRef = useRef(0);
  const lastPathRef = useRef("");
  const qRef = useRef(q);
  qRef.current = q;
  const modalOpenRef = useRef(false);
  modalOpenRef.current = profileOpen || notifOpen || userOpen;
  useEffect(() => {
    if (document.hidden) return;
    if (backendMode !== "remote") return;
    if (qRef.current.trim() !== "") return;
    if (modalOpenRef.current) return;
    /* Halaman baru saja menarik batch-nya sendiri (useModuleSync) → resync
       penuh hanya mendobel request yang sama. */
    if (recentModuleSync()) return;
    /* Pindah modul/halaman = WAJIB data baru. Throttle 60 dtk hanya untuk
       render ulang pada path yang sama (bukan perpindahan modul). */
    const pathChanged = location.pathname !== lastPathRef.current;
    const now = Date.now();
    if (!pathChanged && now - lastResyncRef.current < 60000) return;
    lastPathRef.current = location.pathname;
    lastResyncRef.current = now;
    void resync();
  }, [location.pathname, backendMode, resync]);

  const renderSidebar = (mini: boolean) => (
    /* Sidebar merah merek (permintaan klien 14 Okt). Latar ocean-600 (#C41212),
       bukan #E61919: teks putih 6,1:1 dan putih 90% 5,1:1 (lolos AA untuk teks
       kecil), sedangkan di #E61919 teks redup jatuh di bawah 4,5:1. Elemen yang
       semula merah (logo, ikon aktif, badge, cincin fokus) dibuat putih supaya
       tetap terlihat di atas latar merah.
       Ramah pengguna senior (permintaan 14 Okt): teks menu 15px, baris setinggi
       ~44px (target sentuh), ikon 20px, menu aktif ditandai tiga cara sekaligus
       (latar putih, huruf tebal, garis kiri) supaya tidak bergantung pada warna,
       dan animasi buka-tutup grup mati bila pengguna memilih kurangi gerakan. */
    <div className="flex h-full flex-col bg-ocean-600 text-white [&_:focus-visible]:outline-white">
      <div className={`flex h-16 items-center gap-3 border-b border-white/20 px-4 ${mini ? "justify-center px-3" : ""}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
          <img src="/logo-sb.png" alt="Logo perusahaan" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
        </span>
        {!mini && (
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight tracking-[-0.01em]">ISMS Galangan</p>
            <p className="truncate text-xs text-white/90">PT Syukur Bersaudara</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu utama">
        {visibleNavGroups.map((group) => {
          const gOpen = mini ? true : isGroupOpen(group.label);
          return (
          <div key={group.label} className="mb-4">
            {!mini ? (
              <button
                className="mb-1 flex min-h-9 w-full items-center gap-1 rounded-md px-3 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={gOpen}
              >
                <span className="truncate">{group.label}</span>
                <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${gOpen ? "" : "-rotate-90"}`} />
              </button>
            ) : (
              <div className="mx-2 mb-1 border-b border-white/20" aria-hidden />
            )}
            <div className={`grid transition-all duration-200 ease-out motion-reduce:transition-none ${gOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <ul className="space-y-1 overflow-hidden">
              {group.items.map((item) => {
                // Badge sidebar tampil-sekali; link tetap bawa ?alert= agar
                // banner modul langsung terbuka.
                const badge = item.alertKey ? (unreadModuleCount[item.alertKey] ?? 0) : 0;
                const to = item.alertKey ? `${item.to}?alert=${item.alertKey}` : item.to;
                return (
                <li key={item.to}>
                  <NavLink
                    to={to}
                    end={item.to === "/proyek" || item.to === "/pengaturan"}
                    title={mini ? item.label : undefined}
                    onClick={() => {
                      setOpen(false);
                      window.scrollTo({ top: 0 });
                    }}
                    className={({ isActive }) =>
                      `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] leading-snug transition-colors duration-150 active:scale-[0.98] motion-reduce:transform-none ${mini ? "justify-center" : ""} ${
                        item.child && !mini ? "ml-4" : ""
                      } ${
                        isActive || activeProjectOrigin === item.to
                          ? "bg-white font-semibold text-ocean-700 shadow-sm [&>svg]:text-ocean-600 before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-white"
                          : "font-medium text-white/90 hover:bg-white/15 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!mini && <span className="truncate" title={item.label}>{item.label}</span>}
                    {!mini && badge > 0 ? (
                      <span
                        className="ml-auto min-w-6 rounded-full bg-white px-2 py-1 text-center text-xs font-bold leading-none text-ocean-700 tabular-nums"
                        title={S.shNewNotif.replace("{n}", String(badge))}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
                );
              })}
              </ul>
            </div>
          </div>
          );
        })}
      </nav>
      <div className="border-t border-white/20 p-3">
        <div className={`flex items-center gap-2.5 px-2 py-1.5 ${mini ? "justify-center" : ""}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-ocean-700">
            {user?.initials ?? "?"}
          </div>
          {!mini && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name ?? "-"}</p>
              <p className="truncate text-xs capitalize text-white/90">{user?.role ?? "-"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[19rem] max-w-[85vw]">{renderSidebar(false)}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block ${minSide ? "w-20" : "w-[17.5rem]"}`}>{renderSidebar(minSide)}</aside>

      <div className={`relative min-h-screen transition-all duration-300 ${minSide ? "lg:pl-20" : "lg:pl-[17.5rem]"}`}>
        {/* Ambient top light mesh for modern enterprise visual richness */}
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[56rem] max-w-full rounded-full bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,0.038),transparent_68%)] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-12 right-0 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.03),transparent_70%)] blur-3xl" />

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-steel-200/80 bg-white/75 px-4 backdrop-blur-xl shadow-xs lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="text-steel-600 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              className="hidden rounded-lg p-1.5 text-steel-500 hover:bg-steel-100 lg:block"
              onClick={toggleMinSide}
              aria-label={minSide ? S.shExpandSide : S.shMinSide}
              title={minSide ? S.shExpandSide : S.shMinSide}
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-steel-500">
              <span className="font-medium text-navy-900">{S.shGalangan}</span>
              <span>/</span>
              <span
                title={backendError ?? (backendMode === "remote" ? S.shConnectedServer : S.shRunningLocal)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${backendMode === "remote" && !backendError ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-steel-50 text-steel-500 ring-steel-500/15"}`}
              >
                {backendMode === "remote" && !backendError ? S.shServerBadge : S.shLocalBadge}
              </span>
            </div>
          </div>

          <div className="relative hidden max-w-md flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
              <input
                placeholder={t.nav.searchPh}
                className="input pl-9 py-2 text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-steel-200 bg-steel-100 px-1.5 py-0.5 text-[10px] font-medium text-steel-400">
                ⌘K
              </kbd>
            </div>
            {query && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setQ("")} />
                <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-steel-200 bg-white shadow-lift">
                  {hits.length === 0 && (
                    <p className="px-4 py-3 text-sm text-steel-400">{t.nav.noResultsFor} “{q}”.</p>
                  )}
                  {hits.map((h, i) => (
                    <Link
                      key={`${h.kind}-${i}`}
                      to={h.to}
                      onClick={() => setQ("")}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface"
                    >
                      <Badge tone="navy">{h.kind}</Badge>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy-900">{h.label}</span>
                        <span className="block truncate text-xs text-steel-500">{h.sub}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Live Operational Status Pill - Enterprise Maritime */}
            <div
              className="hidden items-center gap-2 rounded-full border border-steel-200/80 bg-white/80 px-2.5 py-1 text-xs shadow-xs backdrop-blur-sm sm:flex"
              title={S.shYardStatusTooltip}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-steel-600">
                <span className="font-semibold text-navy-800">Samarinda Yard</span> · {locale === "en" ? "Live" : "Aktif"}
              </span>
            </div>

            {moduleSyncing && (
              <span className="hidden items-center gap-1.5 rounded-full bg-ocean-50 px-2.5 py-1 text-[11px] font-semibold text-ocean-600 sm:inline-flex" role="status" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {locale === "en" ? "Syncing…" : "Memuat…"}
              </span>
            )}
            {failedSync.length > 0 && (
              <span
                className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:inline-flex"
                role="status"
                aria-live="polite"
                title={
                  locale === "en"
                    ? `Showing cached data for ${failedSync.length} collection(s) that could not be loaded from the server: ${failedSync.join(", ")}`
                    : `Menampilkan data cache untuk ${failedSync.length} koleksi yang gagal ditarik dari server: ${failedSync.join(", ")}`
                }
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                {locale === "en" ? `${failedSync.length} offline` : `${failedSync.length} offline`}
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-steel-500 hover:bg-steel-100"
                aria-label={S.shNotifAria}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ocean-500 px-1 text-[9px] font-semibold text-white ring-2 ring-white">
                    {Math.min(unreadCount, 99)}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setNotifOpen(false); setBellExpanded(false); setBellMin(false); }} />
                  <div className="absolute right-0 z-20 mt-2 flex max-h-96 w-80 flex-col overflow-hidden rounded-xl border border-steel-200 bg-white shadow-lift">
                    <div className="flex shrink-0 items-center justify-between border-b border-steel-100 px-4 py-2.5">
                      <p className="text-sm font-semibold text-navy-900">
                        {t.notif.title}{unreadCount > 0 ? ` (${unreadCount} ${t.notif.unread})` : ""}
                      </p>
                      <button
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-steel-500 hover:bg-steel-100"
                        onClick={() => setBellMin((v) => !v)}
                        aria-label={bellMin ? t.notif.expand : t.notif.minimize}
                      >
                        {bellMin ? t.notif.expand : t.notif.minimize}
                      </button>
                    </div>
                    {!bellMin && (
                      <div className="min-h-0 flex-1 overflow-y-auto">
                    {alerts.length > 0 && (
                      <>
                        <p className="border-b border-steel-100 px-4 py-2 text-xs font-medium text-steel-400">
                          {t.notif.attention} ({alerts.length})
                        </p>
                        {(bellExpanded ? alerts : alerts.slice(0, 5)).map((al) => (
                          <Link
                            key={al.id}
                            to={al.to}
                            onClick={() => { markNotifRead(`alert-${al.id}`); setNotifOpen(false); setBellExpanded(false); }}
                            className={`flex items-center gap-2 border-b border-steel-50 px-4 py-2.5 text-xs font-medium last:border-0 hover:bg-surface ${
                              al.tone === "red" ? "text-rose-700" : al.tone === "amber" ? "text-amber-700" : "text-ocean-600"
                            }`}
                          >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${!loadNotifRead().has(`alert-${al.id}`) ? (al.tone === "red" ? "bg-rose-500" : al.tone === "amber" ? "bg-amber-500" : "bg-ocean-500") : "bg-steel-200"}`} />
                            {al.text}
                          </Link>
                        ))}
                        {alerts.length > 5 && (
                          <button
                            className="block w-full px-4 py-2 text-center text-[11px] font-semibold text-ocean-600 hover:bg-surface"
                            onClick={() => setBellExpanded((v) => !v)}
                          >
                            {bellExpanded ? t.notif.showLess : `${t.notif.showAll} ${alerts.length} ↓`}
                          </button>
                        )}
                      </>
                    )}
                    <p className="border-b border-steel-100 px-4 py-2 text-xs font-medium text-steel-400">
                      {t.notif.activities}
                    </p>
                    {visibleActs.slice(0, 5).map((a) => (
                      <Link
                        key={a.id}
                        to="/notifikasi"
                        onClick={() => { markNotifRead(`act-${String(a.id)}`); setNotifOpen(false); setBellExpanded(false); }}
                        className="block border-b border-steel-50 px-4 py-2.5 last:border-0 hover:bg-surface"
                      >
                        <p className="text-xs text-steel-700">
                          <span className="font-semibold text-navy-900">{a.actor}</span> {a.action}{" "}
                          <span className="font-medium">{a.target}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-steel-400">{a.module} · {a.time}</p>
                      </Link>
                    ))}
                      </div>
                    )}
                    <Link
                      to="/notifikasi"
                      onClick={() => { setNotifOpen(false); setBellExpanded(false); setBellMin(false); }}
                      className="block shrink-0 border-t border-steel-100 px-4 py-2.5 text-center text-xs font-semibold text-ocean-600 hover:bg-surface"
                    >
                      {t.notif.seeAll}
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-steel-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                  {user?.initials ?? "?"}
                </div>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-xs font-semibold text-navy-900">{user?.name ?? "-"}</p>
                  <p className="text-[10px] text-steel-500">{user?.role ?? "-"}</p>
                </div>
                <ChevronsUpDown className="hidden h-3.5 w-3.5 text-steel-400 sm:block" />
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-steel-200 bg-white shadow-lift">
                    <div className="border-b border-steel-100 px-4 py-3">
                      <p className="text-sm font-semibold text-navy-900">{user?.name}</p>
                      <p className="text-xs text-steel-500">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setUserOpen(false); setProfileOpen(true); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-steel-700 hover:bg-steel-100"
                      >
                        <User className="h-4 w-4 text-steel-400" /> {t.nav.profile}
                      </button>
                      <button
                        onClick={() => { setUserOpen(false); navigate("/audit"); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-steel-700 hover:bg-steel-100"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t.nav.myActivity}
                      </button>
                      <button
                        onClick={() => { setUserOpen(false); navigate("/dokumen"); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-steel-700 hover:bg-steel-100"
                      >
                        <FileText className="h-4 w-4 text-steel-400" /> {t.nav.myDocs}
                      </button>
                      <div className="my-1.5 border-t border-steel-100" />
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-semibold text-steel-500">ID | EN</span>
                        <div className="flex gap-1">
                          {(["id", "en"] as const).map((l) => (
                            <button
                              key={l}
                              onClick={() => setLocale(l)}
                              className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${locale === l ? "bg-navy-700 text-white" : "text-steel-500 hover:bg-steel-100"}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="my-1.5 border-t border-steel-100" />
                      <button
                        onClick={doLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" /> {t.nav.logout}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {pendingSync.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 lg:px-6">
            <span>
              {pendingSync.length} {t.session.pendingSync} ({pendingSync.join(", ")})
            </span>
            <button
              className="btn-secondary px-2 py-1 text-xs"
              onClick={() => {
              void pushPending().catch(() => undefined);
            }}
            >
              {t.session.syncNow}
            </button>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-5 lg:p-6 2xl:p-8">
          {canOpenModule(user, moduleKeyOf(location.pathname)) ? <Outlet /> : (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-steel-200 bg-white p-6 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-steel-400" />
              <p className="mt-3 text-base font-semibold text-navy-900">{S.noModuleAccess}</p>
              <p className="mt-1 text-sm text-steel-500">{S.noModuleAccessHint}</p>
            </div>
          )}
          {/* Panduan demo presentasi (Shift + D). Matikan dengan VITE_DEMO_GUIDE=false. */}
          {import.meta.env.VITE_DEMO_GUIDE !== "false" && <DemoGuide />}
        </main>
      </div>

      {/* Modal profil */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title={t.nav.profile} subtitle={t.session.demoSession}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white">
            {user?.initials}
          </div>
          <div>
            <p className="font-bold text-navy-900">{user?.name}</p>
            <p className="text-sm text-steel-500">{user?.role}</p>
            <p className="text-xs text-steel-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-surface p-3 text-xs leading-relaxed text-steel-600">
          {S.shSessionDesc}
        </div>
        <Field label={S.shResetDemoLabel}>
          <button onClick={doReset} className="btn-secondary w-full justify-center">
            <RotateCcw className="h-4 w-4" /> {S.shRestoreInitial}
          </button>
        </Field>
        <Field label={S.shChangePasswordLabel}>
          <div className="grid gap-2">
            <input
              type="password"
              className="input"
              placeholder={S.shOldPasswordPh}
              aria-label={S.shOldPasswordPh}
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
            />
            <input
              type="password"
              className="input"
              placeholder={S.shNewPasswordPh}
              aria-label={S.shNewPasswordPh}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <button onClick={() => void doChangePassword()} className="btn-secondary w-full justify-center">
              <KeyRound className="h-4 w-4" /> {S.shSaveNewPassword}
            </button>
          </div>
        </Field>
      </Modal>

      <Toaster />
    </div>
  );
}
