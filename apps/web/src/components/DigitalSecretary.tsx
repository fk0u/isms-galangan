import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Send,
  ArrowRight,
  AlertTriangle,
  Wallet,
  Ship,
  ChevronDown,
  ChevronUp,
  Boxes,
  ShieldCheck,
  Activity,
  Anchor,
} from "lucide-react";
import { useStore } from "../data/store";
import { useAuth } from "../auth/auth";
import { useT } from "../i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { fmtMiliar } from "../data";
import { warnLevelOf } from "../utils/inventoryWarn";
import { projectProgressOf } from "../utils/projectProgress";

interface ChatMessage {
  id: string;
  sender: "nadia" | "user";
  text: string;
  action?: {
    label: string;
    to: string;
  };
  time: string;
}

export default function DigitalSecretary() {
  const { user } = useAuth();
  const { locale } = useT();
  const { data, inBranch, branch } = useStore();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic real-time shipyard intelligence directly from store
  const branchProjects = inBranch(data.projects ?? []);
  const activeProjects = branchProjects.filter((p) => p.status !== "Selesai" && p.status !== "Batal");
  const delayedProjects = branchProjects.filter((p) => p.status === "Terlambat");

  const branchDrydocks = inBranch(data.drydocks ?? []);
  const branchDockIds = useMemo(() => new Set(branchDrydocks.map((d) => String(d.id))), [branchDrydocks]);
  const activeDockSlots = useMemo(() => {
    const slots = data.dockSlots ?? [];
    return slots.filter((s) => (branch === "SEMUA" || branchDockIds.has(String(s.dockId))) && s.status !== "Batal" && !s.undockDone);
  }, [data.dockSlots, branch, branchDockIds]);

  const branchInventory = inBranch(data.inventory ?? []);
  const lowStockItems = useMemo(() => {
    return branchInventory.filter((i) => {
      const lv = warnLevelOf(i).level;
      return lv === "critical" || lv === "low";
    });
  }, [branchInventory]);
  const criticalStockItems = useMemo(() => {
    return branchInventory.filter((i) => warnLevelOf(i).level === "critical");
  }, [branchInventory]);
  const stockValue = useMemo(() => {
    return branchInventory.reduce((s, i) => s + Number(i.stock ?? 0) * Number(i.cost ?? 0), 0);
  }, [branchInventory]);

  const branchInvoices = inBranch(data.invoices ?? []);
  const unpaidInvoices = useMemo(() => {
    return branchInvoices.filter((i) => i.status !== "Lunas" && i.status !== "Draft");
  }, [branchInvoices]);
  const arOutstanding = useMemo(() => {
    return unpaidInvoices.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  }, [unpaidInvoices]);

  const wonContracts = useMemo(() => {
    return inBranch(data.contracts ?? []).filter((k) => String(k.status ?? "") !== "Batal");
  }, [data.contracts, inBranch]);
  const wonContractValue = useMemo(() => {
    return wonContracts.reduce((s, k) => s + Number(k.value ?? 0), 0);
  }, [wonContracts]);

  const openNcr = useMemo(() => {
    return inBranch(data.ncr ?? []).filter((n) => n.status !== "Tertutup");
  }, [data.ncr, inBranch]);
  const criticalNcr = useMemo(() => {
    return openNcr.filter((n) => n.severity === "Critical");
  }, [openNcr]);

  const openIncidents = useMemo(() => {
    return inBranch(data.incidents ?? []).filter((i) => i.status !== "Selesai");
  }, [data.incidents, inBranch]);

  const vessels = inBranch(data.vessels ?? []);
  const employees = data.employees ?? [];
  const purchaseOrders = inBranch(data.purchaseOrders ?? []);
  const pendingPo = useMemo(() => {
    return purchaseOrders.filter((p) => p.status === "Menunggu Persetujuan" || p.status === "Draft");
  }, [purchaseOrders]);

  // Initial welcome message from Nadia
  const initialGreeting = useMemo(() => {
    const name = user?.name ? user.name.split(" ")[0] : "Rekan";
    const delayedCount = delayedProjects.length;
    if (delayedCount > 0) {
      return locale === "en"
        ? `Hello ${name}! I'm Nadia, your Shipyard Copilot. There are ${delayedCount} delayed project(s) requiring schedule review and WBS mitigation at ${branch} branch.`
        : `Halo Pak ${name}! Saya Nadia, asisten digital galangan Anda. Saat ini terdeteksi ${delayedCount} proyek berstatus terlambat yang memerlukan evaluasi jadwal di cabang ${branch}. Silakan pilih pintasan cepat atau tanyakan metrik operasional kapan saja.`;
    }
    return locale === "en"
      ? `Hello ${name}! All shipyard operations at ${branch} branch are running smoothly with ${activeProjects.length} active fleet projects and ${activeDockSlots.length} vessels in dock.`
      : `Halo Pak ${name}! Selamat bertugas. Operasional galangan cabang ${branch} terpantau kondusif dengan ${activeProjects.length} proyek armada aktif dan ${activeDockSlots.length} kapal bersandar di dok.`;
  }, [user, delayedProjects.length, activeProjects.length, activeDockSlots.length, branch, locale]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init-1",
      sender: "nadia",
      text: initialGreeting,
      time: "Baru saja",
    },
  ]);

  // Text to speech helper
  const speakText = useCallback((text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === "en" ? "en-US" : "id-ID";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis unsupported or blocked
    }
  }, [speechEnabled, locale]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Comprehensive answer generation engine synthesizing live store data
  const handleUserQuery = useCallback((queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: queryText,
      time: "Baru saja",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");

    const q = queryText.toLowerCase();
    setTimeout(() => {
      let reply = "";
      let action: { label: string; to: string } | undefined;

      // 1. Keterlambatan, Jadwal, & WBS
      if (q.includes("terlambat") || q.includes("delay") || q.includes("jadwal") || q.includes("keterlambatan") || q.includes("wbs") || q.includes("progres")) {
        if (delayedProjects.length > 0) {
          const details = delayedProjects.slice(0, 3).map((p) => {
            const prog = projectProgressOf(p, data.wbsByProject, data.boq);
            return `${p.name} (Klien: ${p.client || "Reguler"}, Progres: ${prog}%, Target: ${p.end || "Harian"})`;
          }).join("; ");
          reply = `Terdapat ${delayedProjects.length} proyek yang statusnya terlambat dari jadwal di cabang ${branch}: ${details}. Disarankan mitigasi percepatan task WBS berbobot kritis dan koordinasi alokasi jam kerja dok.`;
          action = { label: "Buka Proyek Terlambat", to: "/proyek?status=Terlambat" };
        } else {
          reply = `Kabar baik! Seluruh ${activeProjects.length} proyek aktif di cabang ${branch} berjalan sesuai jadwal (on-track). Deviasi timeline terpantau aman tanpa kendala kritis.`;
          action = { label: "Lihat Timeline Proyek", to: "/proyek" };
        }
      }
      // 2. Stok Material & Gudang
      else if (q.includes("stok") || q.includes("material") || q.includes("gudang") || q.includes("inventori") || q.includes("baja") || q.includes("plat") || q.includes("cat") || q.includes("kawat")) {
        if (lowStockItems.length > 0) {
          const sampleItems = lowStockItems.slice(0, 3).map((i) =>
            `${i.name} (sisa ${i.stock} ${i.unit || "unit"}, batas aman ${i.minStock})`
          ).join(", ");
          reply = `Perhatian logistik: Ada ${lowStockItems.length} item material di bawah safety stock (${criticalStockItems.length} berstatus kritis), di antaranya: ${sampleItems}. Total valuasi persediaan gudang aktif: ${fmtMiliar(stockValue)}.`;
          action = { label: "Cek Inventori Gudang", to: "/inventori" };
        } else {
          reply = `Stok gudang dalam kondisi aman. Sebanyak ${branchInventory.length} jenis material utama galangan (plat baja grade A, sacrificial anode, kawat las) tercukupi di atas batas minimum.`;
          action = { label: "Katalog Inventori", to: "/inventori" };
        }
      }
      // 3. Fasilitas Dok, Slipway, & Drydock Occupancy
      else if (q.includes("dok") || q.includes("dock") || q.includes("drydock") || q.includes("slipway") || q.includes("graving") || q.includes("okupansi") || q.includes("kapasitas")) {
        const dockNames = branchDrydocks.map((d) => d.name || d.id).join(", ");
        const dockingList = activeDockSlots.slice(0, 3).map((s) => `${s.vessel || "Kapal"} di ${s.dockId}`).join(", ");
        reply = `Galangan cabang ${branch} memiliki ${branchDrydocks.length} fasilitas dok (${dockNames || "Drydock 1 & Slipway"}). Saat ini ada ${activeDockSlots.length} kapal dalam pengerjaan docking: ${dockingList || "seluruh slot dok siap menerima kapal baru"}. Utilisasi dok berjalan terkendali.`;
        action = { label: "Jadwal Fasilitas Dok", to: "/drydock" };
      }
      // 4. Keuangan, Piutang (AR), & Kontrak
      else if (q.includes("keuangan") || q.includes("piutang") || q.includes("ar") || q.includes("invoice") || q.includes("tagihan") || q.includes("kas") || q.includes("kontrak") || q.includes("omset") || q.includes("nilai kontrak")) {
        reply = `Ringkasan Finansial cabang ${branch}: Total piutang usaha (AR) aktif adalah ${fmtMiliar(arOutstanding)} dari ${unpaidInvoices.length} faktur tagihan yang belum lunas. Akumulasi portofolio kontrak aktif bernilai ${fmtMiliar(wonContractValue)} dari ${wonContracts.length} kontrak yang dimenangkan.`;
        action = { label: "Buka Modul Keuangan", to: "/keuangan?tab=Piutang%20(AR)" };
      }
      // 5. QC, Mutu, K3, NCR, & Insiden
      else if (q.includes("qc") || q.includes("safety") || q.includes("k3") || q.includes("ncr") || q.includes("inspeksi") || q.includes("temuan") || q.includes("insiden") || q.includes("mutu")) {
        const ncrText = openNcr.length > 0
          ? `Terdapat ${openNcr.length} NCR terbuka (${criticalNcr.length} berkategori kritis) yang memerlukan corrective action`
          : `Seluruh temuan NCR telah tertutup`;
        const incidentText = openIncidents.length > 0
          ? `dan ${openIncidents.length} laporan insiden sedang dalam proses investigasi investigatif.`
          : `dan galangan mencatatkan performa Zero Lost Time Incident (LTI).`;
        reply = `Status Mutu & Keselamatan Kerja: ${ncrText}, ${incidentText}`;
        action = { label: "Tinjau QC & Safety", to: "/qc-safety?tab=NCR" };
      }
      // 6. Armada & Kapal
      else if (q.includes("kapal") || q.includes("vessel") || q.includes("armada") || q.includes("tugboat") || q.includes("tongkang")) {
        reply = `Database armada galangan memantau ${vessels.length} kapal aktif yang terdaftar (Tugboat ASD, Barge, Oil Barge, dan Support Vessels) dengan riwayat docking dan sertifikasi tercatat rapi.`;
        action = { label: "Lihat Direktori Kapal", to: "/kapal" };
      }
      // 7. SDM & Tenaga Kerja
      else if (q.includes("karyawan") || q.includes("sdm") || q.includes("pekerja") || q.includes("tenaga") || q.includes("welder") || q.includes("tim")) {
        reply = `Operasional galangan didukung oleh ${employees.length} tenaga kerja profesional (Engineering, Fitters, Welders bersertifikasi BKI, serta Inspektur QC & Perwira K3).`;
        action = { label: "Buka Manajemen SDM", to: "/sdm" };
      }
      // 8. Pengadaan & Purchase Order (PO)
      else if (q.includes("po") || q.includes("pengadaan") || q.includes("procurement") || q.includes("vendor") || q.includes("beli")) {
        reply = `Pengadaan galangan: Tercatat ${purchaseOrders.length} PO dalam sistem, dengan ${pendingPo.length} PO berstatus menunggu persetujuan otorisasi atau verifikasi faktur vendor.`;
        action = { label: "Modul Procurement", to: "/procurement" };
      }
      // 9. Briefing Umum / Fallback
      else {
        reply = `Executive Briefing cabang ${branch}: Ada ${activeProjects.length} proyek armada aktif (${delayedProjects.length} terlambat), ${activeDockSlots.length} kapal bersandar di dok, ${lowStockItems.length} material butuh restock, dan piutang belum tertagih sebesar ${fmtMiliar(arOutstanding)}. Seluruh protokol K3 diawasi secara ketat.`;
        action = { label: "Buka Dashboard Utama", to: "/dashboard" };
      }

      const nadiaMsg: ChatMessage = {
        id: `n-${Date.now()}`,
        sender: "nadia",
        text: reply,
        action,
        time: "Baru saja",
      };

      setMessages((prev) => [...prev, nadiaMsg]);
      speakText(reply);
    }, 380);
  }, [activeDockSlots, activeProjects.length, arOutstanding, branch, branchDrydocks, branchInventory.length, criticalNcr.length, criticalStockItems.length, data.boq, data.wbsByProject, delayedProjects, employees.length, lowStockItems, openIncidents.length, openNcr.length, pendingPo.length, purchaseOrders.length, speakText, stockValue, unpaidInvoices.length, vessels.length, wonContractValue, wonContracts.length]);

  useEffect(() => {
    const onOpenAssistant = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnread(false);
      if (customEvent.detail?.prompt) {
        handleUserQuery(customEvent.detail.prompt);
      }
    };
    window.addEventListener("open-digital-secretary", onOpenAssistant);
    return () => window.removeEventListener("open-digital-secretary", onOpenAssistant);
  }, [handleUserQuery]);

  return (
    <>
      {/* Floating Assistant Trigger & Unread Bubble */}
      <aside aria-label="Nadia - Asisten Digital Galangan" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Subtle greeting bubble when closed */}
        {!isOpen && hasUnread && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-3 max-w-xs rounded-2xl bg-white/95 p-3.5 shadow-xl border border-rose-100/80 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Nadia · Shipyard Copilot</span>
              </div>
              <button
                type="button"
                onClick={() => setHasUnread(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-medium">
              {delayedProjects.length > 0
                ? `Halo! Ada ${delayedProjects.length} proyek terlambat yang perlu dievaluasi hari ini di cabang ${branch}.`
                : `Halo! Seluruh ${activeProjects.length} proyek operasional galangan cabang ${branch} terpantau aman.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setHasUnread(false);
              }}
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
            >
              <span>Buka Asisten Digital</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </motion.div>
        )}

        {/* Floating Trigger Button with Nadia's Avatar */}
        {!isOpen && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-500 via-rose-500 to-rose-600 p-0.5 shadow-xl shadow-rose-500/30 transition-all focus:outline-none focus:ring-4 focus:ring-rose-500/20"
            title="Buka Nadia (Sekretaris Digital Galangan)"
          >
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
              <img
                src="/secretary-avatar.jpg"
                alt="Nadia - Asisten Digital"
                className="h-full w-full object-cover object-top"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </motion.button>
        )}
      </aside>

      {/* Expanded Interactive Copilot Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 transition-all ${
              isMinimized ? "h-16 w-80 sm:w-96" : "h-[36rem] max-h-[85vh] w-[22rem] sm:w-[26rem]"
            }`}
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-rose-50/70 via-white to-white px-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-rose-200/80 shadow-xs">
                  <img
                    src="/secretary-avatar.jpg"
                    alt="Nadia Avatar"
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 leading-tight">Nadia</p>
                    <span className="rounded-full bg-rose-50 px-2 py-0.2 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200/60">
                      AI Copilot
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Asisten Digital Galangan</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSpeechEnabled((v) => !v)}
                  className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                    speechEnabled ? "bg-rose-50 text-rose-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                  title={speechEnabled ? "Suara Aktif" : "Aktifkan Suara"}
                >
                  {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized((v) => !v)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  title={isMinimized ? "Perbesar" : "Kecilkan"}
                >
                  {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Body & Quick Intelligence */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
                  {/* Daily Quick Briefing Widget */}
                  <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/20 to-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-rose-600">
                        <Activity className="h-3.5 w-3.5" />
                        <span>Briefing Operasional</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Cabang {branch}</span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
                      <div className="rounded-xl bg-slate-50/80 p-1.5 border border-slate-100">
                        <span className="block text-[9px] text-slate-400 font-medium truncate">Proyek</span>
                        <span className="text-xs font-bold text-slate-800">{activeProjects.length}</span>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-1.5 border border-slate-100">
                        <span className="block text-[9px] text-slate-400 font-medium truncate">Terlambat</span>
                        <span className={`text-xs font-bold ${delayedProjects.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {delayedProjects.length}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-1.5 border border-slate-100">
                        <span className="block text-[9px] text-slate-400 font-medium truncate">Dok Aktif</span>
                        <span className="text-xs font-bold text-slate-800">{activeDockSlots.length}</span>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-1.5 border border-slate-100">
                        <span className="block text-[9px] text-slate-400 font-medium truncate">Stok Menipis</span>
                        <span className={`text-xs font-bold ${lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {lowStockItems.length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-rose-100/60 pt-2 text-[10px] text-slate-500 font-medium px-0.5">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-rose-500" />
                        <span>NCR: <strong className="text-slate-700">{openNcr.length}</strong> ({criticalNcr.length} Kritis)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-emerald-500" />
                        <span>AR: <strong className="text-slate-700">{fmtMiliar(arOutstanding)}</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* Messages Flow */}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          m.sender === "user"
                            ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xs"
                            : "bg-white text-slate-800 border border-slate-100 shadow-xs"
                        }`}
                      >
                        <p>{m.text}</p>
                        {m.action && (
                          <button
                            type="button"
                            onClick={() => {
                              navigate(m.action!.to);
                              setIsOpen(false);
                            }}
                            className="mt-2 inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <span>{m.action.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-slate-400 px-1">{m.time}</span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Prompts Chips */}
                <div className="border-t border-slate-100 bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Pintasan Cepat:
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 hide-native-bar">
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Status proyek terlambat dan kendala")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="h-3 w-3 text-rose-500" />
                      <span>Proyek Terlambat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Cek stok material kritis di gudang")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <Boxes className="h-3 w-3 text-amber-500" />
                      <span>Stok Menipis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Bagaimana kapasitas dan okupansi drydock?")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <Anchor className="h-3 w-3 text-sky-500" />
                      <span>Okupansi Dok</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Berapa piutang usaha dan nilai kontrak aktif?")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <Wallet className="h-3 w-3 text-emerald-500" />
                      <span>Piutang &amp; Kontrak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Bagaimana status mutu, temuan NCR, dan K3?")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="h-3 w-3 text-indigo-500" />
                      <span>Mutu &amp; K3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Bagaimana status armada kapal di galangan?")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <Ship className="h-3 w-3 text-cyan-600" />
                      <span>Armada Kapal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserQuery("Berikan ringkasan eksekutif operasional galangan hari ini")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      <Activity className="h-3 w-3 text-rose-500" />
                      <span>Briefing Lengkap</span>
                    </button>
                  </div>
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUserQuery(inputVal);
                  }}
                  className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Tanya Nadia seputar galangan..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputVal.trim()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
