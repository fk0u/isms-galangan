import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Send,
  ArrowRight,
  Clock,
  AlertTriangle,
  Wallet,
  Ship,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStore } from "../data/store";
import { useAuth } from "../auth/auth";
import { useT } from "../i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { fmtMiliar } from "../data";

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
  const { data, inBranch } = useStore();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic real-time shipyard intelligence
  const projects = inBranch(data.projects ?? []);
  const activeProjects = projects.filter((p) => p.status === "Berjalan" || p.status === "Produksi");
  const delayedProjects = projects.filter((p) => p.status === "Terlambat");
  const drydockSlots = (data.dockSlots ?? []).filter((s) => String(s.status ?? "") === "Aktif" || String(s.status ?? "") === "Digunakan");
  const lowStock = (data.inventory ?? []).filter((i) => Number(i.stock ?? 0) <= Number(i.minStock ?? 5));
  const totalBudget = activeProjects.reduce((s, p) => s + Number(p.budget ?? 0), 0);

  // Initial welcome message from Nadia
  const initialGreeting = useMemo(() => {
    const name = user?.name ? user.name.split(" ")[0] : "Rekan";
    const delayedCount = delayedProjects.length;
    if (delayedCount > 0) {
      return locale === "en"
        ? `Hello ${name}! I'm Nadia, your Shipyard Copilot. You have ${delayedCount} delayed project(s) requiring schedule review, and ${activeProjects.length} active fleet builds underway.`
        : `Halo Pak ${name}! Saya Nadia, sekretaris digital galangan Anda. Saat ini ada ${delayedCount} proyek terlambat yang perlu evaluasi jadwal, dan ${activeProjects.length} proyek armada aktif berjalan.`;
    }
    return locale === "en"
      ? `Hello ${name}! All shipyard operations at Samarinda Yard are running smoothly with ${activeProjects.length} active projects.`
      : `Halo Pak ${name}! Selamat bertugas. Seluruh operasional galangan Samarinda Yard terpantau kondusif dengan ${activeProjects.length} proyek aktif.`;
  }, [user, delayedProjects.length, activeProjects.length, locale]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init-1",
      sender: "nadia",
      text: initialGreeting,
      time: "Baru saja",
    },
  ]);

  // Text to speech helper
  const speakText = (text: string) => {
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
  };

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Answer generation engine based on live store data
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

      if (q.includes("terlambat") || q.includes("delay") || q.includes("jadwal")) {
        if (delayedProjects.length > 0) {
          const names = delayedProjects.slice(0, 3).map((p) => p.name).join(", ");
          reply = `Terdapat ${delayedProjects.length} proyek yang statusnya terlambat dari jadwal, di antaranya: ${names}. Saya sarankan cek timeline WBS dan ketersediaan material di gudang.`;
          action = { label: "Buka Proyek Terlambat", to: "/proyek?status=Terlambat" };
        } else {
          reply = "Luar biasa! Tidak ada proyek yang terlambat saat ini di Samarinda Yard. Seluruh timeline on-schedule.";
        }
      } else if (q.includes("proyek") || q.includes("project") || q.includes("kontrak")) {
        reply = `Total ada ${projects.length} proyek terdata (${activeProjects.length} sedang berjalan) dengan akumulasi portofolio kontrak sebesar ${fmtMiliar(totalBudget)}.`;
        action = { label: "Lihat Manajemen Proyek", to: "/proyek" };
      } else if (q.includes("dok") || q.includes("dock") || q.includes("drydock") || q.includes("graving")) {
        reply = `Fasilitas drydock Samarinda Yard memiliki ${drydockSlots.length} slot aktif yang terpantau dalam sistem.`;
        action = { label: "Buka Jadwal Drydock", to: "/drydock" };
      } else if (q.includes("stok") || q.includes("baja") || q.includes("gudang") || q.includes("material") || q.includes("plat")) {
        if (lowStock.length > 0) {
          reply = `Perhatian: Ada ${lowStock.length} jenis material di gudang yang mendekati atau di bawah batas minimum (safety stock), misalnya ${lowStock[0]?.name ?? "Plat Baja"}.`;
          action = { label: "Cek Inventori Gudang", to: "/inventori" };
        } else {
          reply = "Seluruh ketersediaan stok material vital galangan (plat baja, kawat las, cat marine) dalam batas aman.";
          action = { label: "Buka Inventori", to: "/inventori" };
        }
      } else if (q.includes("kapal") || q.includes("vessel") || q.includes("tugboat") || q.includes("tongkang")) {
        const vesselCount = (data.vessels ?? []).length;
        reply = `Database armada galangan mencatat ${vesselCount} kapal aktif (Tugboat, Barge/Tongkang, & Support Vessel).`;
        action = { label: "Lihat Data Kapal", to: "/kapal" };
      } else if (q.includes("keuangan") || q.includes("kas") || q.includes("margin") || q.includes("uang")) {
        reply = `Portofolio kontrak galangan mencapai ${fmtMiliar(totalBudget)}. Laporan arus kas dan piutang siap ditinjau di modul Keuangan.`;
        action = { label: "Buka Dashboard Keuangan", to: "/keuangan" };
      } else {
        reply = `Saya mengerti, Pak. Anda dapat memantau indikator operasional galangan, memfilter armada, atau meminta saya memeriksa metrik spesifik proyek kapan saja.`;
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
    }, 450);
  }, [activeProjects.length, data.vessels, delayedProjects, drydockSlots.length, lowStock, projects.length, totalBudget]);

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
      {/* Interactive Floating Assistant Pill & Bubble */}
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
                onClick={() => setHasUnread(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-medium">
              {delayedProjects.length > 0
                ? `Halo! Ada ${delayedProjects.length} proyek terlambat yang perlu Anda tinjau hari ini.`
                : `Halo! Semua operasional galangan Samarinda berjalan lancar.`}
            </p>
            <button
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
                  className={`rounded-lg p-1.5 transition-colors ${
                    speechEnabled ? "bg-rose-50 text-rose-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                  title={speechEnabled ? "Suara Aktif" : "Aktifkan Suara"}
                >
                  {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized((v) => !v)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title={isMinimized ? "Perbesar" : "Kecilkan"}
                >
                  {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Briefing Operasional</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Samarinda Yard</span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50/80 p-2 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 font-medium">Proyek Aktif</span>
                        <span className="text-sm font-bold text-slate-800">{activeProjects.length}</span>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-2 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 font-medium">Terlambat</span>
                        <span className={`text-sm font-bold ${delayedProjects.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {delayedProjects.length}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-2 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 font-medium">Slot Dok</span>
                        <span className="text-sm font-bold text-slate-800">{drydockSlots.length}</span>
                      </div>
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
                            onClick={() => {
                              navigate(m.action!.to);
                              setIsOpen(false);
                            }}
                            className="mt-2 inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors"
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
                      onClick={() => handleUserQuery("Cek proyek yang terlambat")}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      <Clock className="h-3 w-3 text-rose-500" />
                      <span>Proyek Terlambat</span>
                    </button>
                    <button
                      onClick={() => handleUserQuery("Bagaimana stok material di gudang?")}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span>Stok Menipis</span>
                    </button>
                    <button
                      onClick={() => handleUserQuery("Berapa total nilai kontrak aktif?")}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      <Wallet className="h-3 w-3 text-emerald-500" />
                      <span>Nilai Kontrak</span>
                    </button>
                    <button
                      onClick={() => handleUserQuery("Status fasilitas drydock hari ini?")}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      <Ship className="h-3 w-3 text-sky-500" />
                      <span>Drydock</span>
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 text-white shadow-xs disabled:opacity-40 transition-all"
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
