import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  LayoutDashboard,
  Ship,
  Users,
  TrendingUp,
  Clock,
  Bell,
  Plus,
  Download,
  Calendar,
  Boxes,
  Anchor,
  Layers,
  Settings,
  Paperclip,
  Smile,
  Send,
  MoreHorizontal,
  Radio,
  Maximize2,
} from "lucide-react";
import { useStore } from "../../data/store";
import { useAuth } from "../../auth/auth";
import { fmtMiliar } from "../../data";
import { warnLevelOf } from "../../utils/inventoryWarn";
import { projectProgressOf } from "../../utils/projectProgress";

export interface ExecutiveBentoDashboardProps {
  onToggleClassic?: () => void;
  isClassicView?: boolean;
}

export default function ExecutiveBentoDashboard({
  onToggleClassic,
  isClassicView,
}: ExecutiveBentoDashboardProps) {
  const { user } = useAuth();
  const { data, inBranch, branch, setBranch } = useStore();
  const navigate = useNavigate();

  // Active state filters matching the reference UI
  const [mapFilter, setMapFilter] = useState<"tracking" | "traffic" | "poi">("tracking");
  const [recentTab, setRecentTab] = useState<"duration" | "speed" | "stops">("duration");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Embedded Chat state (matching the Chat card)
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "nadia" | "user"; text: string; time?: string }>>([
    { sender: "nadia", text: "Hi! Bagaimana perkembangan armada hari ini?", time: "13:45" },
    { sender: "user", text: "Hi! What is your question? Cek status drydock dan proyek prioritas.", time: "13:46" },
  ]);

  // Real data intelligence from store
  const branchProjects = inBranch(data.projects ?? []);
  const activeProjects = branchProjects.filter((p) => p.status !== "Selesai" && p.status !== "Batal");
  const delayedProjects = branchProjects.filter((p) => p.status === "Terlambat");
  const drydocks = inBranch(data.drydocks ?? []);
  const dockSlots = data.dockSlots ?? [];
  const activeDockSlots = dockSlots.filter((s) => s.status !== "Batal" && !s.undockDone);

  const lowStock = inBranch(data.inventory ?? []).filter((i) => {
    const lv = warnLevelOf(i).level;
    return lv === "critical" || lv === "low";
  });

  const wonContracts = inBranch(data.contracts ?? []).filter((k) => String(k.status ?? "") !== "Batal");
  const wonContractValue = wonContracts.reduce((s, k) => s + Number(k.value || 0), 0);

  // Top priority active project for the Shipment Details card
  const priorityProject = useMemo(() => {
    return activeProjects[0] ?? {
      id: "RP-2026-003",
      name: "TB Karya Bahari 12 - Annual Docking",
      vessel: "TB Karya Bahari 12",
      client: "PT Pelayaran Bahari",
      budget: 1450000000,
      status: "Berjalan",
      end: "28.10.26",
    };
  }, [activeProjects]);

  const priorityProgress = projectProgressOf(priorityProject, data.wbsByProject, data.boq);

  // Handle embedded chat submit
  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userText, time: "Baru saja" }]);
    setChatInput("");

    // Dispatch to Nadia assistant system
    window.dispatchEvent(new CustomEvent("open-digital-secretary", { detail: { prompt: userText } }));

    // Local instant response for embedded chat widget
    setTimeout(() => {
      let reply = "Operasional galangan cabang " + branch + " berjalan optimal dengan " + activeProjects.length + " proyek aktif.";
      const q = userText.toLowerCase();
      if (q.includes("terlambat") || q.includes("delay")) {
        reply = delayedProjects.length > 0
          ? `Ada ${delayedProjects.length} proyek terlambat: ${delayedProjects.map((p) => p.name).join(", ")}.`
          : "Seluruh proyek armada on-schedule tanpa keterlambatan!";
      } else if (q.includes("dok") || q.includes("drydock")) {
        reply = `Kapasitas dok: ${activeDockSlots.length} kapal sedang dalam pengerjaan docking di ${drydocks.length} fasilitas dok.`;
      } else if (q.includes("stok") || q.includes("material")) {
        reply = `Logistik: ${lowStock.length} material butuh perhatian stok di gudang.`;
      }
      setChatMessages((prev) => [...prev, { sender: "nadia", text: reply, time: "Baru saja" }]);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-3 sm:p-5 lg:p-7 text-slate-800 font-sans antialiased selection:bg-[#FF4D4D] selection:text-white">
      {/* ===================== TOP HEADER ===================== */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: User Welcome */}
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-xs bg-slate-200">
            <img
              src="/secretary-avatar.jpg"
              alt="User Avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 leading-tight">Welcome back,</p>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {user?.name ? user.name.split(" ")[0] : "Alex"}!
            </h1>
          </div>
        </div>

        {/* Center: Title & Vessel / Branch Selector */}
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Shipment track
          </h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setBranchDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs border border-slate-200/80 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>{branch === "SEMUA" ? "Select truck" : branch}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {branchDropdownOpen && (
              <div className="absolute left-0 mt-2 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100 text-xs font-medium space-y-0.5">
                {["SEMUA", "Samarinda", "Banjarmasin"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBranch(b);
                      setBranchDropdownOpen(false);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-1.5 transition-colors cursor-pointer ${
                      branch === b ? "bg-[#FF4D4D] text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {b === "SEMUA" ? "Semua Cabang" : b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search & View Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="h-10 w-48 sm:w-60 rounded-full bg-white pl-4 pr-9 text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200/70 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/25 focus:border-[#FF4D4D] transition-all"
            />
            <Search className="absolute right-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={onToggleClassic}
            title={isClassicView ? "Tampilan Bento" : "Tampilan Tabel Lengkap"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-2xs border border-slate-200/70 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ===================== MAIN 2-COLUMN LAYOUT ===================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* ================= LEFT SIDEBAR COLUMN (3 cols on lg, 3 cols on xl) ================= */}
        <div className="space-y-4 lg:col-span-4 xl:col-span-3">
          {/* Company Card */}
          <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-xs border border-slate-200/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-xs text-slate-700">
                LS
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Company
                </span>
                <p className="text-xs font-bold text-slate-800 truncate">Load Swift NYC</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </div>

          {/* Vertical Navigation Pill Menu */}
          <nav className="rounded-3xl bg-white p-2.5 shadow-xs border border-slate-200/60 space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl bg-[#FF4D4D] px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/25 transition-all cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/kapal")}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Ship className="h-4 w-4 text-slate-400" />
              <span>Shipment</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/crm")}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Users className="h-4 w-4 text-slate-400" />
              <span>Costumer</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/analytics")}
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span>Analysis</span>
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#FF4D4D] ring-1 ring-rose-200/70">
                +20%
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/drydock")}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Clock className="h-4 w-4 text-slate-400" />
              <span>History</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/notifikasi")}
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-slate-400" />
                <span>Notification</span>
              </div>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4D4D] text-[10px] font-bold text-white">
                2
              </span>
            </button>
          </nav>

          {/* Solid Coral "Recent trips" Widget */}
          <div className="rounded-3xl bg-gradient-to-br from-[#FF4D4D] to-[#E63946] p-5 text-white shadow-lg shadow-red-500/25 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Recent trips</h3>
              <span className="text-xs font-medium text-rose-100">28 Oct</span>
            </div>

            {/* Segmented Pill Switches */}
            <div className="flex items-center gap-1 rounded-full bg-black/15 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setRecentTab("duration")}
                className={`flex-1 rounded-full py-1 text-center font-bold transition-all cursor-pointer ${
                  recentTab === "duration" ? "bg-white text-[#FF4D4D] shadow-xs" : "text-white/80 hover:text-white"
                }`}
              >
                Duration
              </button>
              <button
                type="button"
                onClick={() => setRecentTab("speed")}
                className={`flex-1 rounded-full py-1 text-center font-medium transition-all cursor-pointer ${
                  recentTab === "speed" ? "bg-white text-[#FF4D4D] shadow-xs" : "text-white/80 hover:text-white"
                }`}
              >
                Speed
              </button>
              <button
                type="button"
                onClick={() => setRecentTab("stops")}
                className={`flex-1 rounded-full py-1 text-center font-medium transition-all cursor-pointer ${
                  recentTab === "stops" ? "bg-white text-[#FF4D4D] shadow-xs" : "text-white/80 hover:text-white"
                }`}
              >
                Stops
              </button>
            </div>

            {/* Bottom Distance / Metric Stat */}
            <div className="pt-2">
              <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                1246 KM
              </p>
              <p className="mt-1 text-[10px] text-rose-100 font-medium">
                Total rute pelayaran armada
              </p>
            </div>
          </div>

          {/* Category Icons Toolbar */}
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => navigate("/proyek")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs hover:text-[#FF4D4D] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Jadwal & Kalender"
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/inventori")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs hover:text-[#FF4D4D] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Gudang & Inventori"
            >
              <Boxes className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/drydock")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs hover:text-[#FF4D4D] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Fasilitas Dok"
            >
              <Anchor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/analytics")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs hover:text-[#FF4D4D] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Modul & Lapisan"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/pengaturan")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs hover:text-[#FF4D4D] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Pengaturan"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Dashed "+ Create new Request" Card */}
          <button
            type="button"
            onClick={() => navigate("/proyek?create=1")}
            className="group flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-red-200 bg-white/70 p-5 text-center shadow-2xs transition-all hover:bg-white hover:border-[#FF4D4D] cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF4D4D] text-white shadow-md shadow-red-500/30 transition-transform group-hover:scale-110">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-[#FF4D4D] transition-colors">
              Create new Request
            </span>
          </button>
        </div>

        {/* ================= RIGHT MAIN AREA (8 cols on lg, 9 cols on xl) ================= */}
        <div className="space-y-5 lg:col-span-8 xl:col-span-9">
          {/* ================= TOP HERO CARD: ROUTE TRACKING MAP ================= */}
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xs border border-slate-200/60">
            {/* Top Filter Pills & Metric Headers */}
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMapFilter("tracking")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  mapFilter === "tracking" ? "bg-[#FF4D4D] text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tracking
              </button>
              <button
                type="button"
                onClick={() => setMapFilter("traffic")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  mapFilter === "traffic" ? "bg-[#FF4D4D] text-white" : "bg-white border border-rose-200 text-[#FF4D4D] hover:bg-rose-50"
                }`}
              >
                Traffic jams
              </button>
              <button
                type="button"
                onClick={() => setMapFilter("poi")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  mapFilter === "poi" ? "bg-[#FF4D4D] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                POI
              </button>
            </div>

            {/* Distance & Traffic Route Optimization Stats */}
            <div className="relative z-10 mt-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Distance to arrival</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  120<span className="text-sm font-bold text-slate-500">KM</span> / 1<span className="text-sm font-bold text-slate-500">h</span> 50<span className="text-sm font-bold text-slate-500">min</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Traffic and route optimization</p>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-xl font-black text-slate-900">85%</span>
                    <div className="h-2 w-28 sm:w-36 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-400 to-[#FF4D4D] rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/proyek/monitoring")}
                    className="rounded-full bg-[#FF4D4D] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    Optimize
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/proyek")}
                    className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>

            {/* Bespoke Waterway / Route SVG Map Graphic */}
            <div className="relative mt-4 h-64 sm:h-72 w-full rounded-2xl bg-gradient-to-b from-[#FFFBF7] via-[#FFF9F5] to-[#FFF5F0] overflow-hidden border border-rose-100/50">
              <svg className="h-full w-full object-cover" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background topographic contours */}
                <path d="M0 120 C 150 140, 250 80, 400 110 C 550 140, 650 90, 800 130 L 800 300 L 0 300 Z" fill="#FFEFEA" opacity="0.6" />
                <path d="M0 180 C 120 160, 300 210, 500 170 C 650 140, 750 190, 800 180 L 800 300 L 0 300 Z" fill="#FFE8E2" opacity="0.5" />
                <path d="M0 60 C 200 40, 350 90, 500 50 C 650 10, 750 40, 800 20" stroke="#FFDFD7" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                <path d="M0 240 C 200 220, 400 260, 600 230 C 700 215, 750 240, 800 230" stroke="#FFDFD7" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />

                {/* Primary Curving Transit Route Line */}
                <path
                  d="M 50 170 C 180 180, 240 100, 350 120 C 420 130, 460 210, 560 110 C 620 60, 700 80, 770 70"
                  stroke="#FF4D4D"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Waypoint 1 */}
                <g transform="translate(350, 120)">
                  <circle r="12" fill="#FF4D4D" />
                  <text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">1</text>
                </g>

                {/* Waypoint 2 (Active glowing pulse) */}
                <g transform="translate(560, 110)">
                  <circle r="22" fill="#FF4D4D" opacity="0.25">
                    <animate attributeName="r" values="16;26;16" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle r="13" fill="#FF4D4D" />
                  <text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">2</text>
                </g>

                {/* Waypoint 3 */}
                <g transform="translate(740, 72)">
                  <circle r="12" fill="#FF4D4D" />
                  <text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">3</text>
                </g>
              </svg>

              {/* Floating Alert Card on right (matching reference) */}
              <div className="absolute right-4 bottom-4 hidden sm:block max-w-[270px] rounded-2xl bg-white/95 p-3.5 shadow-md border border-slate-200/80 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-50 text-[#FF4D4D]">
                      <Radio className="h-3 w-3" />
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Alerts and Notifications</span>
                  </div>
                  <span className="text-[10px] text-slate-400">13:48</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Geofencing alert</h4>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                  Truck crossed geofence at Warehouse &amp; Driver arrival notification sent to staff
                </p>
              </div>
            </div>
          </div>

          {/* ================= MIDDLE ROW: SHIPMENT DETAILS & TRUCK CAPACITY ================= */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-stretch">
            {/* Shipment Details Card (7 cols md, 8 cols xl) */}
            <div className="flex flex-col justify-between rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/60 md:col-span-7 xl:col-span-8">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Shipment details
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate("/proyek")}
                    className="text-xs font-medium text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Read more
                  </button>
                </div>

                {/* Driver / Superintendent Profile Bar */}
                <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/secretary-avatar.jpg"
                      alt="Michael Johnson"
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Michael Johnson</p>
                      <p className="text-[10px] text-slate-400">1241AA4121882351AB - Ukraine</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Rating</span>
                    <span className="flex h-5 items-center justify-center rounded-full bg-[#FF4D4D] px-2 text-[10px] font-bold text-white shadow-2xs">
                      4.2
                    </span>
                    <button type="button" className="text-slate-300 hover:text-slate-600 px-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 3 Columns Shipment Details Grid */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Col 1: Novaposhta parcels */}
                  <div>
                    <p className="text-xs font-bold text-slate-800">Novaposhta parcels</p>
                    <p className="text-[10px] font-semibold text-rose-500">Have been paid</p>
                    <p className="mt-2 text-2xl font-black text-[#FF4D4D] tracking-tight">
                      $ 520,45
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Kontrak: {fmtMiliar(wonContractValue)}
                    </p>
                  </div>

                  {/* Col 2: Parcels Loading */}
                  <div>
                    <p className="text-xs font-bold text-slate-800">Parcels Loading</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-400">
                      <span>Kyiv</span>
                      <span>Rivne</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-400 to-[#FF4D4D]"
                        style={{ width: `${Math.max(25, priorityProgress)}%` }}
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-[10px] text-slate-400 font-medium">Date of arrival</p>
                      <p className="text-sm font-bold text-slate-800 tracking-tight">28.10.23</p>
                    </div>
                  </div>

                  {/* Col 3: Status & Type */}
                  <div>
                    <p className="text-xs font-bold text-slate-800">Status</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-[#FF4D4D] px-3 py-0.5 text-[10px] font-bold text-white">
                      Delivered
                    </span>
                    <div className="mt-2">
                      <p className="text-[10px] text-slate-400 font-medium">Type of Parcels</p>
                      <span className="mt-0.5 inline-block rounded-lg bg-rose-50 border border-rose-100/80 px-2 py-0.5 text-[10px] font-semibold text-[#FF4D4D]">
                        Household chemicals
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current truck capacity (5 cols md, 4 cols xl) */}
            <div className="flex flex-col justify-between rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/60 md:col-span-5 xl:col-span-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Current truck capacity
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/kapal")}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 underline cursor-pointer"
                >
                  Read more
                </button>
              </div>

              {/* Truck / Transport Vehicle Graphic with Diagonal Red Hatched Stripe Fill */}
              <div className="my-4 flex items-center justify-center py-2">
                <svg className="w-full max-w-[280px] h-auto" viewBox="0 0 240 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#FF4D4D" strokeWidth="2.5" />
                    </pattern>
                  </defs>

                  {/* Truck Cabin (Front) */}
                  <path d="M12 60 L12 28 L30 18 L50 18 L50 60 Z" fill="#F8FAFC" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M22 24 L42 24 L42 38 L18 38 Z" fill="#E2E8F0" stroke="#334155" strokeWidth="1.5" />
                  <rect x="14" y="44" width="8" height="6" rx="1.5" fill="#FFB703" />
                  <rect x="2" y="48" width="10" height="12" rx="2" fill="#64748B" />

                  {/* Cargo Trailer with 86% Hatched Striped Fill */}
                  <rect x="52" y="14" width="175" height="46" rx="4" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
                  <rect x="56" y="18" width="167" height="38" rx="2" fill="url(#diagonalHatch)" />

                  {/* Center 86% Badge */}
                  <rect x="110" y="24" width="60" height="26" rx="13" fill="#FF4D4D" />
                  <text x="140" y="42" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">
                    86%
                  </text>

                  {/* Wheels */}
                  <circle cx="34" cy="64" r="10" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                  <circle cx="34" cy="64" r="4" fill="#94A3B8" />
                  <circle cx="178" cy="64" r="10" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                  <circle cx="178" cy="64" r="4" fill="#94A3B8" />
                  <circle cx="204" cy="64" r="10" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                  <circle cx="204" cy="64" r="4" fill="#94A3B8" />
                </svg>
              </div>

              {/* Bottom Specs */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800">AL - 223965406</p>
                  <p className="text-[10px] text-slate-400">Max Load</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="h-2 w-2 rounded-full bg-[#FF4D4D] animate-ping" />
                    <span className="text-[11px] font-bold text-[#FF4D4D]">On Route</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">8 453 KG</p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BOTTOM ROW: TRENDS, EFFICIENCY, & CHAT ================= */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-stretch">
            {/* 1. Shipment Trends Card (4 cols md) */}
            <div className="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-xs border border-slate-200/60 md:col-span-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">Shipment trends</h3>
                    <button type="button" className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                      <Download className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <span className="rounded-full bg-[#FF4D4D] px-2 py-0.5 text-[9px] font-bold text-white">
                    Shipments
                  </span>
                </div>

                {/* Lollipop Bar Chart with Peak Pin Marker */}
                <div className="relative mt-5 h-32 w-full">
                  {/* Dashed Horizontal Threshold Line */}
                  <div className="absolute top-6 inset-x-0 border-b border-dashed border-[#FF4D4D]/40 z-0" />

                  {/* Lollipop Stems */}
                  <div className="relative z-10 flex h-full items-end justify-between px-2">
                    {[
                      { date: "26.10", val: 50 },
                      { date: "29.10", val: 65 },
                      { date: "30.10", val: 75 },
                      { date: "31.10", val: 95, highlight: true },
                      { date: "01.11", val: 70 },
                      { date: "02.11", val: 80 },
                      { date: "03.11", val: 60 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        {item.highlight ? (
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full bg-[#FF4D4D] ring-4 ring-rose-100 shadow-xs" />
                            <div className="h-20 w-0.5 bg-[#FF4D4D]" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-slate-300" />
                            <div
                              className="w-0.5 bg-slate-200"
                              style={{ height: `${item.val * 0.75}px` }}
                            />
                          </div>
                        )}
                        <span className={`text-[9px] font-medium ${item.highlight ? "text-[#FF4D4D] font-bold" : "text-slate-400"}`}>
                          {item.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Route Efficiency Card (Solid Coral Card, 4 cols md) */}
            <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#FF4D4D] to-[#E63946] p-5 text-white shadow-lg shadow-red-500/25 md:col-span-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold">Route efficiency</h3>
                  <button type="button" className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                    <Download className="h-2.5 w-2.5" />
                  </button>
                </div>

                <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight leading-none">
                  96 <span className="text-xl font-bold">%</span>
                </p>

                {/* Dotted Grid Matrix with Smooth Curved White Chart Line */}
                <div className="relative mt-3 h-24 w-full">
                  <svg className="h-full w-full" viewBox="0 0 200 80" fill="none">
                    {/* Dotted Matrix Background */}
                    {[...Array(6)].map((_, r) =>
                      [...Array(12)].map((_, c) => (
                        <circle
                          key={`${r}-${c}`}
                          cx={c * 17 + 8}
                          cy={r * 13 + 6}
                          r="1.2"
                          fill="white"
                          opacity="0.3"
                        />
                      ))
                    )}

                    {/* Smooth Rising Curve */}
                    <path
                      d="M 10 65 Q 60 62, 100 48 T 150 18 Q 170 35, 195 55"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Glowing Peak Node ("The best road") */}
                    <circle cx="150" cy="18" r="4.5" fill="white" />
                    <circle cx="150" cy="18" r="9" stroke="white" strokeWidth="1" opacity="0.6" />
                    <text x="145" y="11" textAnchor="end" fill="white" fontSize="8" fontWeight="bold">
                      The best road
                    </text>
                  </svg>
                </div>
              </div>

              <p className="mt-2 text-[10px] text-white/80 font-medium leading-tight">
                Send the best route to the driver's email
              </p>
            </div>

            {/* 3. Chat Card (Nadia Integrated Messenger, 4 cols md) */}
            <div className="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-xs border border-slate-200/60 md:col-span-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-900">Chat</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("open-digital-secretary"))}
                    className="text-slate-400 hover:text-[#FF4D4D] transition-colors cursor-pointer"
                    title="Buka Layar Penuh"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Chat Feed */}
                <div className="my-3 space-y-2.5 max-h-36 overflow-y-auto pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-200">
                        <img
                          src="/secretary-avatar.jpg"
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div
                        className={`rounded-2xl px-3 py-1.5 text-xs leading-relaxed max-w-[85%] ${
                          msg.sender === "user"
                            ? "bg-[#FF4D4D] text-white font-medium rounded-tr-xs"
                            : "bg-slate-100 text-slate-800 rounded-tl-xs"
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendChat}
                className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5"
              >
                <button
                  type="button"
                  onClick={() => navigate("/dokumen")}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Lampirkan Dokumen"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message"
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF4D4D] text-white shadow-xs disabled:opacity-40 hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
