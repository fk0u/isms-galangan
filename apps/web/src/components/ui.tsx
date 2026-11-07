import { fmtRupiahShort } from "../utils/format";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState, Component, type ErrorInfo } from "react";
import { useT } from "../i18n/LanguageContext";
import { n_misc } from "../i18n/n_misc";
import { statusLabel } from "../i18n/status";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, X, Loader2, Search, Upload as UploadIcon } from "lucide-react";
import { toast } from "./Toast";

import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

/* ============ M O T I O N   H E L P E R S ============ */

export function Stagger({
  children,
  className = "",
  id,
  animate: withMotion = true,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /* false = div biasa tanpa framer-motion. Dipakai saat elemen ini jadi
     target export PDF: motion.div menyimpan inline transform/opacity
     hasil animasi, dan html2canvas memotret apa adanya - transform sisa
     membuat konten bergeser atau transparan di dalam PDF. */
  animate?: boolean;
}) {
  if (!withMotion) return <div id={id} className={className}>{children}</div>;
  return (
    <motion.div
      id={id}
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============ C A R D / L A Y O U T ============ */

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <div id={id} className={`card ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-steel-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function GlowCard({
  children,
  gradient = "gradient-hero",
  className = "",
}: {
  children: ReactNode;
  gradient?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${gradient} text-white shadow-lift ${className}`}>
      <div className="relative p-5">{children}</div>
    </div>
  );
}

/* ============ B A D G E / P I L L ============ */

/* Nada badge: satu warna per makna, dan tiap makna harus berbeda jelas
   (permintaan 14 Okt: "color cue diperjelas, jangan nyaru").
   hijau = selesai/OK, kuning = menunggu/perlu tindakan, merah = bahaya/
   terlambat/ditolak, biru = sedang berjalan/proses, ungu = kategori/jenis,
   abu = netral/draf/nonaktif. Sebelumnya biru/navy/ungu/cyan semua jatuh ke
   abu yang nyaris sama dengan "netral", sehingga "berjalan" tak terbedakan. */
const toneMap: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  teal: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/30",
  orange: "bg-amber-50 text-amber-800 ring-amber-600/30",
  red: "bg-red-50 text-red-700 ring-red-600/25",
  ocean: "bg-red-50 text-red-700 ring-red-600/25",
  blue: "bg-blue-50 text-blue-800 ring-blue-600/25",
  navy: "bg-blue-50 text-blue-800 ring-blue-600/25",
  cyan: "bg-blue-50 text-blue-800 ring-blue-600/25",
  violet: "bg-violet-50 text-violet-800 ring-violet-600/25",
  gray: "bg-steel-100 text-steel-700 ring-steel-500/20",
  slate: "bg-steel-100 text-steel-700 ring-steel-500/20",
};

/* Titik warna di depan label: status terbaca dari bentuk + teks, bukan warna saja. */
const toneDot: Record<string, string> = {
  green: "bg-emerald-500",
  teal: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-amber-500",
  red: "bg-red-600",
  ocean: "bg-red-600",
  blue: "bg-blue-600",
  navy: "bg-blue-600",
  cyan: "bg-blue-600",
  violet: "bg-violet-600",
  gray: "bg-steel-400",
  slate: "bg-steel-400",
};

export function Badge({
  children,
  tone = "gray",
  className = "",
  title,
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
  /** Tooltip native. Dipakai badge status yang butuh penjelasan (mis. why this item is low). */
  title?: string;
}) {
  /* Fallback ke abu-abu untuk nada yang tidak dikenal.
     Nilai nada sering datang dari data (`a.tone as never` untuk aktivitas, atau
     kolom enum di store) sehingga tipe bisa lolos ke compile tapi tidak ada
     di toneMap. Tanpa fallback, toneMap[tone] bernilai undefined dan
     className jadi "bg-... undefined" - kelas rusak yang tetap lolos ke DOM
     tanpa error apa pun. */
  /* Badge yang dibiarkan abu-abu tapi teksnya status yang dikenal (mis.
     "Sudah PO", "RFQ") memakai warna status itu, supaya arti warna sama di
     seluruh aplikasi walau tiap halaman lupa memetakannya sendiri. */
  const text = typeof children === "string" ? children.trim() : "";
  const effTone = tone === "gray" && text && statusTone[text] ? statusTone[text] : tone;
  const toneClass = toneMap[effTone] ?? toneMap.gray;
  const dot = toneDot[effTone] ?? toneDot.gray;
  return (
    <span
      title={title ?? TONE_MEANING[effTone]}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

const statusTone: Record<string, keyof typeof toneMap> = {
  Aktif: "teal",
  "Sedang Berjalan": "blue",
  "Dalam Proses": "blue",
  Selesai: "green",
  Disetujui: "green",
  Lunas: "green",
  Berlaku: "green",
  Diterima: "green",
  Terkirim: "green",
  Terkunci: "green",
  Ditutup: "gray",
  Lulus: "green",
  Terbuka: "amber",
  Telat: "red",
  Terlambat: "red",
  Kritis: "red",
  Menipis: "amber",
  Aman: "green",
  Draft: "gray",
  Draf: "gray",
  Diajukan: "amber",
  "Menunggu Approval": "amber",
  "Menunggu Persetujuan": "amber",
  "Belum Dibayar": "amber",
  Ditolak: "red",
  Rejected: "red",
  Pending: "amber",
  Menunggu: "amber",
  Approved: "green",
  Completed: "green",
  "Dalam Pengiriman": "blue",
  Dikirim: "blue",
  Kualifikasi: "violet",
  Blacklist: "red",
  Batal: "gray",
  Kalah: "gray",
  Terkonversi: "teal",
  Menang: "green",
  Negosiasi: "violet",
  Penawaran: "amber",
  Lead: "cyan",
  Maintenance: "amber",
  Terpakai: "blue",
  Tersedia: "green",
  Sedang: "blue",
  Tertunda: "amber",
  Tertutup: "gray",
  "Dalam Perbaikan": "blue",
  Kedaluwarsa: "red",
  Expired: "red",
  "Sudah PO": "green",
  RFQ: "amber",
  Dipenuhi: "green",
  "Dipenuhi dari stok": "green",
  "Dipenuhi Sebagian": "amber",
  "Menunggu PO": "amber",
  "Menunggu Approval Gudang": "amber",
  "Ditolak Gudang": "red",
  "Diterima Sebagian": "blue",
  Terlewat: "red",
  Dibatalkan: "red",
  "Dibatalkan Sebagian": "amber",
  Digantikan: "gray",
  Nonaktif: "gray",
  Cuti: "amber",
  Izin: "amber",
  Hadir: "green",
  Alpa: "red",
  Kurang: "red",
  Cukup: "green",
  "Sudah Sesuai": "green",
  "Tidak Sesuai": "red",
  "Perlu Diperbaiki": "amber",
  Terjadwal: "blue",
  Dijadwalkan: "blue",
  Proses: "blue",
};

/* Arti tiap warna, dipakai sebagai tooltip badge (permintaan 14 Okt: arti warna harus jelas). */
const TONE_MEANING: Partial<Record<keyof typeof toneMap, string>> = {
  green: "Hijau: selesai / aman",
  teal: "Hijau: selesai / aman",
  amber: "Kuning: menunggu / perlu tindakan",
  orange: "Kuning: menunggu / perlu tindakan",
  red: "Merah: bahaya / terlambat / ditolak",
  ocean: "Merah: bahaya / terlambat / ditolak",
  blue: "Biru: sedang berjalan",
  navy: "Biru: sedang berjalan",
  cyan: "Biru: sedang berjalan",
  violet: "Ungu: kategori / tahap penjualan",
  gray: "Abu-abu: netral / draf / nonaktif",
  slate: "Abu-abu: netral / draf / nonaktif",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = statusTone[status] ?? "gray";
  return <Badge tone={tone}>{label ?? <StatusText value={status} />}</Badge>;
}

/** Teks status sesuai locale aktif (nilai data tidak diubah). */
function StatusText({ value }: { value: string }) {
  const { locale } = useT();
  return <>{statusLabel(value, locale)}</>;
}

/* ============ K P I   C A R D   ( P R E M I U M ) ============ */

/* Nada KPI: warna ikon ber-tint lembut dengan ring halus dan kontras tinggi. */
const gradientChip: Record<string, string> = {
  navy: "bg-blue-50 text-blue-600 ring-blue-500/20",
  teal: "bg-emerald-50 text-emerald-600 ring-emerald-500/20",
  rose: "bg-rose-50 text-rose-600 ring-rose-500/20",
  violet: "bg-indigo-50 text-indigo-600 ring-indigo-500/20",
  amber: "bg-amber-50 text-amber-600 ring-amber-500/20",
  ocean: "bg-sky-50 text-sky-600 ring-sky-500/20",
};

/* Varian gradient kartu status (sesuai referensi UI CEO: gradasi lembut bercahaya). */
const kpiTone: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 shadow-blue-500/20",
  green: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-500/20",
  orange: "bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 shadow-orange-500/20",
  red: "bg-gradient-to-br from-red-500 via-rose-500 to-rose-600 shadow-rose-500/25",
};

/* Nominal besar di kartu tidak boleh pecah dua baris ("Rp" di atas, angka di
   bawah). Rp >= 1 juta disingkat (Rb/Jt/M/T, gaya Indonesia); angka lengkap
   tetap ada di tooltip (title) kartu. Nilai non-Rupiah dikembalikan apa adanya. */
function compactMoney(value: string): string {
  const m = /^Rp[\s\u00a0]?(-?[\d.]+)$/.exec(value.trim());
  if (!m) return value;
  const n = Number(m[1].replace(/\./g, ""));
  return Number.isFinite(n) && Math.abs(n) >= 1_000_000 ? fmtRupiahShort(n) : value;
}

export function KpiCard({
  label,
  value,
  delta,
  deltaDirection = "up",
  icon,
  hint,
  spark,
  chip = "navy",
  tone,
}: {
  tone?: keyof typeof kpiTone;
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  icon?: ReactNode;
  hint?: string;
  spark?: { name: string; v: number }[];
  chip?: keyof typeof gradientChip;
}) {
  /* `spark` sengaja tidak dirender lagi: revisi klien PRJ-04 menghapus
     grafik di kartu, dan sistem industri memakai angka besar, bukan dekorasi.
     Prop dipertahankan agar pemanggil lama tetap valid. */
  void spark;
  if (tone) {
    return (
      <div className={`card-hover relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${kpiTone[tone]}`}>
        {/* Subtle decorative background shine */}
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-white/80" title={label}>{label}</p>
            <p className="mt-2 text-[30px] font-extrabold leading-none tracking-tight break-words tabular-nums" title={value}>{compactMoney(value)}</p>
            {(delta ?? hint) && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                  {delta ?? hint}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-xs shadow-xs ring-1 ring-white/30">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <Card className="card-hover relative overflow-hidden rounded-2xl p-5 bg-white border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400" title={label}>{label}</p>
          <p className="mt-2 text-[28px] font-extrabold leading-none tracking-tight text-slate-900 break-words tabular-nums" title={value}>{compactMoney(value)}</p>
          {delta ? (
            <p
              className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                deltaDirection === "up"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/25"
                  : deltaDirection === "down"
                  ? "bg-rose-50 text-rose-700 ring-rose-600/25"
                  : "bg-slate-100 text-slate-700 ring-slate-300/40"
              }`}
            >
              {deltaDirection === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
              {deltaDirection === "down" && <ArrowDownRight className="h-3.5 w-3.5" />}
              {deltaDirection === "flat" && <Minus className="h-3.5 w-3.5" />}
              {delta}
            </p>
          ) : (
            hint && <p className="mt-2.5 text-xs text-slate-400 font-medium truncate">{hint}</p>
          )}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs ring-1 ring-inset ${gradientChip[chip] ?? gradientChip.navy}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ============ M I N I   C H A R T S ============ */

export function Donut({
  data,
  colors = ["#2563EB", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6"],
  size = 140,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number }[];
  colors?: string[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={size / 2 - thickness} outerRadius={size / 2} paddingAngle={3} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold text-navy-900">{centerValue}</span>}
          {centerLabel && <span className="text-[11px] text-steel-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function RadialGauge({
  value,
  label,
  max = 100,
  color = "#B91C1C",
  size = 120,
}: {
  value: number;
  label?: string;
  max?: number;
  color?: string;
  size?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = size / 2 - 8;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EBEBEB" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-bold text-navy-900">{value}%</span>
        {label && <span className="text-[10px] text-steel-500">{label}</span>}
      </div>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }[];
  label?: string;
  formatter?: (value: number | string, name: string) => string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-steel-200 bg-white/95 px-3 py-2 shadow-lift backdrop-blur">
      {label && (
        <p className="mb-1 text-xs font-semibold text-navy-900">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-steel-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-navy-900">
            {formatter ? formatter(p.value as number, p.name ?? "") : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============ A V A T A R / P I L L ============ */

export function Avatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const init = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette = ["bg-navy-900", "bg-steel-600", "bg-navy-700", "bg-ocean-500", "bg-steel-500", "bg-navy-800"];
  const idx = name.length % palette.length;
  return (
    <div className={`flex items-center justify-center rounded-full text-[11px] font-semibold text-white ${palette[idx]} ${className}`}>
      {init}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  /** Dulu judul bergradien; kini diabaikan (ADR-0014), dipertahankan untuk kompatibilitas. */
  gradient?: boolean;
}) {
  return (
    <div className="enter-up mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-steel-200/90 bg-white/95 text-navy-800 shadow-xs ring-1 ring-steel-900/5 sm:flex">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="display text-[26px] sm:text-[28px]">{title}</h1>
            {subtitle && <p className="mt-1 max-w-3xl text-sm text-steel-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto [&>div]:flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}


export function ProgressBar({
  value,
  tone = "navy",
  className = "",
  showLabel,
}: {
  value: number;
  tone?: "navy" | "green" | "amber" | "red" | "ocean" | "teal";
  className?: string;
  showLabel?: boolean;
}) {
  const map = {
    navy: "bg-gradient-to-r from-blue-600 to-indigo-600",
    green: "bg-gradient-to-r from-emerald-500 to-teal-500",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500",
    red: "bg-gradient-to-r from-rose-500 to-red-600",
    ocean: "bg-gradient-to-r from-sky-500 to-blue-600",
    teal: "bg-gradient-to-r from-teal-500 to-emerald-500",
  };
  return (
    <div className={`w-full ${className}`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-steel-100">
        <div
          className={`h-1.5 rounded-full transition-[width] duration-500 ease-out ${map[tone]}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-[11px] font-medium text-steel-500 tabular-nums">{Math.round(value)}%</p>
      )}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  labels,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  /** Label tampil per tab id - id logika tidak berubah (aman untuk state). */
  labels?: Record<string, string>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  /* layoutId unik per daftar tab supaya garis aktif tidak "terbang" antar Tabs. */
  const listId = useId();
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);
  return (
    <div ref={listRef} className="flex gap-1 border-b border-steel-200 overflow-x-auto" role="tablist" aria-label="Navigasi tab">
      {tabs.map((t) => (
        <button
          key={t}
          data-tab={t}
          role="tab"
          aria-selected={active === t}
          onClick={() => onChange(t)}
          className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
            active === t ? "text-navy-900" : "text-steel-500 hover:text-navy-800"
          }`}
        >
          {labels?.[t] ?? t}
          {active === t && (
            <motion.span
              layoutId={`tab-underline-${listId}`}
              className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ocean-500"
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-steel-300">{icon}</div>}
      <h3 className="text-sm font-medium text-steel-700">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-steel-500">{subtitle}</p>}
    </div>
  );
}

/* ============ E R R O R   B O U N D A R Y   &   S K E L E T O N ============ */

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  {
    children: ReactNode;
    title?: string;
    backLabel?: string;
    onBack?: () => void;
    /** Nilai yang, kalau berubah, ME-RESET error yang tersimpan. */
    resetKey?: string;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ISMS ErrorBoundary:", error, info);
  }

  /**
   * Reset error saat `resetKey` berubah.
   *
   * BUG YANG DIPERBAIKI: tanpa ini, satu galat mengunci SELURUH pola rute
   * berikutnya. React Router memakai instance React yang SAMA untuk
   * /proyek/A dan /proyek/B (elemen `<Route path="/proyek/:id">` cuma berubah
   * param), jadi boundary-nya tidak pernah di-unmount dan `state.error`
   * tetap tidak null. Hasilnya proyek kedua yang benar-benar sehat ikut
   * menampilkan layar galat - persis gejala "satu modul rusak, modul lain
   * ikut crash". Tombol "Coba lagi" ada, tapi pengguna seharusnya perlu
   * menemukannya.
   *
   * `componentDidUpdate` (bukan render) dipakai supaya tidak memanggil
   * setState saat render.
   */
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error !== null) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-steel-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-navy-900">{this.props.title ?? "Bagian ini gagal dimuat"}</p>
          <p className="mt-1 max-w-md text-xs text-steel-500">
            Terjadi galat saat merender bagian ini. Data modul lain tidak
            terpengaruh - coba lagi atau pindah modul.
          </p>
          {this.state.error.message && (
            <p className="mt-2 max-w-md break-words font-mono text-[11px] text-steel-400">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {/* Coba lagi dulu tanpa memuat ulang seluruh aplikasi. Dulu satu-satunya
                jalan keluar adalah window.location.reload() yang membuang seluruh
                state in-memory: filter tab, posisi scroll, dan antrean sync. */}
            {this.props.onBack && (
              <button className="btn-primary text-xs" onClick={this.props.onBack}>
                {this.props.backLabel ?? "Kembali"}
              </button>
            )}
            <button
              className="btn-secondary text-xs"
              onClick={() => this.setState({ error: null })}
            >
              Coba lagi
            </button>
            <button className="btn-secondary text-xs" onClick={() => window.location.reload()}>
              Muat ulang halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-steel-100 ${className}`} aria-hidden="true" />;
}

export { Tooltip };

/* #311: modal & input dipisah ke modul fokus; diekspor ulang di sini supaya
   impor lama `from "./ui"` tetap jalan (tanpa breaking change). */
export { Modal, ConfirmModal, VALIDATE_EVENT } from "./modals/Modal";
export { useAsyncAction, AsyncButton } from "./AsyncButton";
export { Field, FormGrid } from "./inputs/Field";
export { EntityPicker, type PickerOption } from "./inputs/EntityPicker";
export { NumInput } from "./inputs/NumInput";
export { TimeInput } from "./inputs/TimeInput";
export { MoneyInput } from "./inputs/MoneyInput";



/**
 * Poin tebakan: seluruh kata harus cocok, di field yang DIMINTAKAN.
 * Sebagian lama memakai `includes` pada satu field gabungan, jadi "INV 001"
 * tidak pernah menemukan "INV-001" dan nomor dokumen tidak bisa dicari sama
 * sekali - search-nya ada tapi tidak berguna.
 */
/* Teks pencarian untuk satu nilai field. Array dan objek ikut diratakan supaya
   field seperti `lines` atau `vendors` tetap bisa dicari isinya, bukan jadi
   "[object Object]". Depth dibatasi supaya data bersarangtak abnormal tidak
   membuat render lambat. */
function searchText(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (depth >= 3) return "";
  if (Array.isArray(value)) return value.map((v) => searchText(v, depth + 1)).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((v) => searchText(v, depth + 1))
      .filter(Boolean)
      .join(" ");
  }
  return String(value);
}

export function rowMatches<T extends Record<string, unknown>>(
  row: T,
  query: string,
  fields: readonly (keyof T & string)[],
): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return q
    .split(/\s+/)
    .every((term) =>
      fields.some((f) => searchText(row[f]).toLowerCase().includes(term)),
    );
}

export function useListSearch(delay = 200) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, delay);
  return {
    query,
    debounced,
    setQuery,
    clear: useCallback(() => setQuery(""), []),
    active: debounced.trim() !== "",
  };
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  id?: string;
}) {
  const { t } = useT();
  return (
    <div className={`relative ${className}`}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400"
      />
      <input
        id={id}
        type="search"
        className="input w-full pl-9"
        placeholder={placeholder ?? t.common.listSearchPh}
        aria-label={ariaLabel ?? t.common.listSearchAria}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value !== "" && (
        <button
          type="button"
          aria-label={t.common.reset}
          onClick={() => {
            onChange("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-steel-400 hover:bg-steel-100 hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}


export type SortDir = "asc" | "desc";
export interface SortState { key: string | null; dir: SortDir }

export function toggleSort(prev: SortState, key: string): SortState {
  if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
  return { key, dir: "asc" };
}

export function cmpVal(a: string | number | null | undefined, b: string | number | null | undefined): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  const an = typeof a === "number" ? a : Number(a);
  const bn = typeof b === "number" ? b : Number(b);
  const aNum = a !== "" && a !== null && a !== undefined && Number.isFinite(an);
  const bNum = b !== "" && b !== null && b !== undefined && Number.isFinite(bn);
  if (aNum && bNum) return an - bn;
  /* Perbandingan teks untuk nilai yang tidak bisa diparse sebagai angka.
     `sortRows` sudah menyingkirkan nilai kosong sebelum memanggil sini,
     jadi `a`/`b` dijamin bukan string kosong. */
  return String(a).localeCompare(String(b), "id-ID");
}

export function sortRows<T>(rows: T[], sort: SortState, get: (row: T, key: string) => string | number | null | undefined): T[] {
  if (!sort.key) return rows;
  const key = sort.key as string;
  const dir = sort.dir === "asc" ? 1 : -1;
  /* "Tidak punya nilai" diperiksa sebelum arah pembalikan, bukan sesudahnya.
     Kalau posisinya ikut dikalikan `dir`, mengurutkan menurun akan memindahkan
     semua baris kosong ke PUNCAK daftar - persis kebalikan dari yang
     diinginkan.

     Sebelumnya nilai kosong jatuh ke `String(a ?? "")` yang dianggap lebih
     kecil dari teks apa pun, jadi baris bertanggal kosong menduduki
     posisi pertama setiap kali kolom tanggal diurutkan. */
  const blank = (v: string | number | null | undefined): boolean => v === null || v === undefined || v === "";
  return [...rows].sort((ra, rb) => {
    const va = get(ra, key);
    const vb = get(rb, key);
    const ba = blank(va);
    const bb = blank(vb);
    if (ba || bb) {
      if (ba && bb) return 0;
      return ba ? 1 : -1;
    }
    return cmpVal(va, vb) * dir;
  });
}

export function SortTh({
  label,
  sortKey,
  sort,
  onSort,
  title,
  rowSpan,
  colSpan,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  title?: string;
  rowSpan?: number;
  colSpan?: number;
}) {
  const active = sort.key === sortKey;
  return (
    <th className="th" title={title ?? `Urutkan: ${label}`} rowSpan={rowSpan} colSpan={colSpan}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        className={`inline-flex items-center gap-1 font-semibold hover:text-navy-900 ${active ? "text-navy-900" : ""}`}
      >
        {label}
        <span className={`text-[10px] ${active ? "text-ocean-600" : "text-steel-300"}`} aria-hidden>
          {active ? (sort.dir === "asc" ? "â–²" : "â–¼") : "⇅"}
        </span>
      </button>
    </th>
  );
}

/* ============ ACCORDION ============ */

export function Accordion({
  title,
  subtitle,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-steel-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface"
      >
        <ChevronRight className={`h-4 w-4 shrink-0 text-steel-400 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy-900">
            {title}
            {typeof count === "number" && <span className="ml-2 rounded-full bg-surface border border-steel-200 px-1.5 py-0.5 text-[11px] font-bold text-steel-600">{count}</span>}
          </span>
          {subtitle && <span className="block truncate text-xs text-steel-400">{subtitle}</span>}
        </span>
        <span className="shrink-0 text-xs font-medium text-ocean-600">{open ? "Tutup" : "Buka"}</span>
      </button>
      {open && <div className="border-t border-steel-100">{children}</div>}
    </div>
  );
}

/* ============ B U S Y   M A P ============ */

/** Guard proses berat: cegah double-submit + disable tombol saat aksi berjalan.
 *  Pola: `const busy = useBusy();` lalu
 *  `onClick={() => void busy.run("saveBig", saveBig)}` + `disabled={busy.isBusy("saveBig")}`. */
export function useBusy(): {
  isBusy: (k: string) => boolean;
  run: <T>(key: string, fn: () => Promise<T> | T) => Promise<T | void>;
} {
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
  /* Guard ref sinkron: dua klik cepat pada tick yang sama membaca state lama
     (false) sehingga guard state saja tetap meloloskan double-submit. */
  const busyRef = useRef<Set<string>>(new Set());
  const run = async <T,>(key: string, fn: () => Promise<T> | T): Promise<T | void> => {
    if (busyRef.current.has(key)) return;
    busyRef.current.add(key);
    setBusyMap((m) => ({ ...m, [key]: true }));
    try {
      return await fn();
    } finally {
      busyRef.current.delete(key);
      setBusyMap((m) => ({ ...m, [key]: false }));
    }
  };
  return { isBusy: (k: string) => !!busyMap[k], run };
}

/* ============ A S Y N C   A C T I O N ============ */

/* ============ P A G E R ============ */

/** Bilah pagination bersama (ETC-07): info "1-25 dari 312", ukuran halaman,
 *  awal / sebelumnya / maks 5 nomor / berikutnya / akhir. Di layar sempit
 *  hanya sebelumnya-berikutnya + info. */
export function Pager({ page, pages, size, total, loading = false, onGo, onSize }: {
  page: number; pages: number; size: number; total: number; loading?: boolean;
  onGo: (p: number) => void; onSize: (n: number) => void;
}) {
  const { locale } = useT();
  const P = n_misc[locale];
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);
  const nav = "btn-secondary px-2 py-1 disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 text-xs text-steel-500">
      <span className="tabular-nums">
        {loading ? P.pagerLoading : P.pagerInfo.replace("{a}", String(total === 0 ? 0 : (page - 1) * size + 1)).replace("{b}", String(Math.min(page * size, total))).replace("{n}", String(total))}
      </span>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-ocean-500" aria-hidden />}
      <nav className="ml-auto flex items-center gap-1" aria-label={P.pagerNav}>
        <button type="button" className={`${nav} hidden sm:inline-flex`} disabled={loading || page <= 1} onClick={() => onGo(1)} aria-label={P.pagerFirst}><ChevronsLeft className="h-3.5 w-3.5" /></button>
        <button type="button" className={nav} disabled={loading || page <= 1} onClick={() => onGo(page - 1)} aria-label={P.pagerPrev}><ChevronLeft className="h-3.5 w-3.5" /></button>
        <span className="hidden items-center gap-1 sm:flex">
          {nums.map((n) => (
            <button key={n} type="button" disabled={loading} aria-current={n === page ? "page" : undefined} onClick={() => onGo(n)}
              className={`min-w-7 rounded-lg px-2 py-1 font-semibold tabular-nums ${n === page ? "bg-navy-900 text-white" : "text-steel-600 hover:bg-steel-100"}`}>{n}</button>
          ))}
        </span>
        <span className="px-1 font-semibold tabular-nums text-navy-900 sm:hidden">{page} / {pages}</span>
        <button type="button" className={nav} disabled={loading || page >= pages} onClick={() => onGo(page + 1)} aria-label={P.pagerNext}><ChevronRight className="h-3.5 w-3.5" /></button>
        <button type="button" className={`${nav} hidden sm:inline-flex`} disabled={loading || page >= pages} onClick={() => onGo(pages)} aria-label={P.pagerLast}><ChevronsRight className="h-3.5 w-3.5" /></button>
        <select className="input ml-1 !w-auto px-1.5 py-1 text-xs" value={size} aria-label={P.pagerSize} disabled={loading} onChange={(e) => onSize(Number(e.target.value))}>
          {[...new Set([10, 25, 50, 100, size])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{P.pagerPer.replace("{n}", String(n))}</option>)}
        </select>
      </nav>
    </div>
  );
}

export function usePager(total: number, defaultSize = 25): {
  page: number;
  size: number;
  pages: number;
  slice: <T>(rows: T[]) => T[];
  reset: () => void;
  go: (p: number) => void;
  bar: ReactNode;
} {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(defaultSize);
  const pages = Math.max(1, Math.ceil(total / size));
  const safe = Math.min(page, pages);
  const slice = <T,>(rows: T[]): T[] => rows.slice((safe - 1) * size, safe * size);
  const reset = () => setPage(1);
  const go = (p: number) => setPage(Math.min(Math.max(1, p), pages));
  const bar = <Pager page={safe} pages={pages} size={size} total={total} onGo={go} onSize={(n) => { setSize(n); setPage(1); }} />;
  return { page: safe, size, pages, slice, reset, go, bar };
}

/* ============ S E R V E R   P A G E R ============ */

/** Satu halaman data dari backend (lihat repositories.listPaged). */
export interface ServerPage<T> {
  rows: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** Pager server-side dengan tampilan bilah yang sama seperti usePager.
 *  `load(page, size)` menutup filter saat ini (boleh closure biasa - hook
 *  memanggilnya lewat ref sehingga identitas closure tak memicu fetch ulang).
 *  `filterKey` (mis. JSON.stringify(filter)) me-reset ke halaman 1 + fetch
 *  ulang; `enabled=false` mematikan fetch (untuk mode ganda lokal/server).
 *  Request basi diabaikan via token monotonik + flag cancel. */
export function useServerPager<T>(
  load: (page: number, size: number) => Promise<ServerPage<T>>,
  filterKey: string,
  defaultSize = 25,
  enabled = true,
): {
  page: number;
  size: number;
  pages: number;
  total: number;
  rows: T[];
  loading: boolean;
  go: (p: number) => void;
  bar: ReactNode;
} {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(defaultSize);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const reqRef = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  /* Filter berubah -> kembali ke halaman 1 sebelum fetch berikutnya. */
  const [fk, setFk] = useState(filterKey);
  if (enabled && fk !== filterKey) {
    setFk(filterKey);
    if (page !== 1) setPage(1);
  }

  const pages = Math.max(1, Math.ceil(total / size));
  const safe = Math.min(Math.max(1, page), pages);

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const id = ++reqRef.current;
    setLoading(true);
    void loadRef.current(safe, size)
      .then((res) => {
        if (!cancelled && id === reqRef.current) {
          setRows(Array.isArray(res.rows) ? res.rows : []);
          setTotal(typeof res.total === "number" ? res.total : 0);
        }
      })
      .catch(() => {
        if (!cancelled && id === reqRef.current) {
          setRows([]);
          toast("Gagal memuat data dari server", "info");
        }
      })
      .finally(() => {
        if (!cancelled && id === reqRef.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, safe, size, filterKey]);

  const go = (p: number) => setPage(Math.min(Math.max(1, p), pages));
  const bar = <Pager page={safe} pages={pages} size={size} total={total} loading={loading} onGo={go} onSize={(n) => { setSize(n); setPage(1); }} />;
  return { page: safe, size, pages, total, rows, loading, go, bar };
}


/** Warna tombol ikon. Satu sumber, dipakai seluruh kolom Aksi. */
const ROW_ACTION_TONE: Record<"neutral" | "danger" | "primary" | "success", string> = {
  neutral: "text-steel-500 hover:bg-steel-100",
  danger: "text-rose-600 hover:bg-rose-50",
  primary: "text-ocean-600 hover:bg-ocean-50",
  success: "text-emerald-600 hover:bg-emerald-50",
};

/**
 * Tombol aksi tabel tanpa teks: ikon saja, label pindah ke `title` +
 * `aria-label`.
 *
 * Dua alasan bentuknya begini. Pertama, lebar: tombol teks `.btn` punya
 * `px-3.5`, jadi "Hapus" saja sudah 66px; kotak ikon ini 28px. Di sel yang
 * punya sembilan aksi (HR daftar cuti) itu selisihnya 594px jadi 252px, dan
 * Finance yang 28 kolomnya yang paling diuntungkan.
 *
 * Kedua, target sentuh: 28px terlalu kecil untuk jari, dan ikon tunggal tidak
 * punya lebar label yang biasanya menopang area kliknya, jadi area klik
 * diperbesar sampai 40px dengan `after` transparan. Visual tetap 28px dan
 * layout tidak bergeser.
 *
 * Baris tabel bisa diklik navigasi, jadi klik defaultnya dihentikan supaya
 * tombol ini tidak ikut memicu navigasi baris.
 */
export function RowAction({
  icon: Icon,
  label,
  ariaLabel,
  tone = "neutral",
  onClick,
  disabled = false,
  stopPropagation = true,
  className = "",
}: {
  icon: LucideIcon;
  /** Wajib: jadi isi tooltip dan (kalau `ariaLabel` kosong) nama terbaca. */
  label: string;
  /** Nama lebih panjang untuk screen reader, mis. "Ubah movement MOV-1". */
  ariaLabel?: string;
  tone?: keyof typeof ROW_ACTION_TONE;
  onClick: () => void;
  disabled?: boolean;
  /** Set false kalau pemanggil memang mau navigasi baris ikut jalan. */
  stopPropagation?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 after:absolute after:-inset-1.5 after:content-[''] ${ROW_ACTION_TONE[tone]} ${className}`}
      title={label}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick();
      }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}


import { uploadFile } from "../services/upload";
import { getJwt } from "../services/http";
import { isBackendUrl, toAbsoluteUrl } from "../services/files";

/** Normalisasi URL lama relatif (/files/...) → absolut terhadap BASE backend.
 *  URL absolut / blob: / object-URL dikembalikan apa adanya. */
export function absUrl(url: unknown): string {
  return toAbsoluteUrl(url);
}

/* Cache gambar ber-JWT per sesi tab: thumbnail, perbesar, dan render ulang
   memakai blob yang sama, tidak mengunduh ulang dari server. Kunci memuat
   token sehingga pergantian akun tidak mewarisi gambar akun sebelumnya.
   Entri tertua dilepas (object URL di-revoke) saat melewati batas. */
const SECURE_IMG_MAX = 150;
const secureImgCache = new Map<string, Promise<string>>();
function loadSecureBlob(raw: string): Promise<string> {
  const jwt = getJwt();
  const key = `${jwt ?? ""}|${raw}`;
  const cached = secureImgCache.get(key);
  if (cached) return cached;
  const p = fetch(raw, { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} }).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return URL.createObjectURL(await res.blob());
  });
  secureImgCache.set(key, p);
  p.catch(() => secureImgCache.delete(key)); // gagal = boleh dicoba lagi
  if (secureImgCache.size > SECURE_IMG_MAX) {
    const oldestKey = secureImgCache.keys().next().value as string;
    const oldest = secureImgCache.get(oldestKey);
    secureImgCache.delete(oldestKey);
    void oldest?.then((u) => URL.revokeObjectURL(u)).catch(() => {});
  }
  return p;
}

/** Gambar dengan inisial bila tanpa foto + loader JWT (fetch blob → object URL).
 *  Cocok untuk foto yang dilindungi auth backend; URL lama relatif dinormalisasi. */
export function SecureImg({
  src,
  alt,
  name,
  className = "",
}: {
  src?: unknown;
  alt: string;
  name?: string;
  className?: string;
}) {
  /* Aset statis frontend (ilustrasi demo, ikon) bukan file backend: muat
     langsung dari origin web, jangan diarahkan ke API ber-JWT. */
  const isPublicAsset = typeof src === "string" && /^\/(demo|icons)\//.test(src);
  const raw = isPublicAsset ? String(src) : absUrl(src);
  const [obj, setObj] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    setObj(null);
    if (!raw || /^(blob:|data:)/i.test(raw)) return;
    // URL absolut same-origin / backend ber-JWT → ambil via fetch blob (ber-cache).
    let cancelled = false;
    // Aset publik dimuat langsung oleh <img> — token tidak dikirim, tanpa fetch ganda.
    const needsJwt = !isPublicAsset && (!/^https?:/i.test(raw) || isBackendUrl(raw));
    if (!needsJwt) return;
    void loadSecureBlob(raw)
      .then((url) => { if (!cancelled) setObj(url); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
    };
  }, [raw]);
  if (!raw) {
    return <Avatar name={name ?? alt} className={className} />;
  }
  if (failed) {
    /* Tanpa tautan tab-baru: pratinjau/unduh file lewat DocumentPreviewCell
       di lokasi pemakaian; thumb dekoratif cukup beri status gagal. */
    return (
      <span title={raw} className={`inline-flex items-center justify-center rounded-xl border border-steel-200 bg-surface px-2 py-1 text-xs font-medium text-steel-400 ${className}`}>
        File tak dapat dimuat
      </span>
    );
  }
  const shown = obj ?? (/^(blob:|data:|https?:)/i.test(raw) ? raw : raw);
  if (!obj && isBackendUrl(raw)) {
    return (
      <span className={`inline-flex items-center justify-center rounded-xl bg-steel-100 text-steel-400 ${className}`} aria-label={`Memuat ${alt}`}>
        <Loader2 className="h-5 w-5 animate-spin" />
      </span>
    );
  }
  return <img src={shown} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

/** Strip alur status generik: langkah selesai / aktif / berikutnya.
 *
 *  Tanpa `onSelect` strip ini murni dekoratif (legenda warna). Dengan
 *  `onSelect` tiap langkah jadi tombol filter sungguhan.
 *
 *  `current` boleh string kosong: itu berarti "tidak ada langkah yang
 *  aktif". Pemakai lama selalu mengoper salah satu langkah sehingga
 *  legenda ikut menyala padahal tidak ada filter yang aktif - pakai `""`
 *  supaya tampilan jujur soal keadaan sebenarnya. */
export function FlowStrip({
  steps,
  current,
  onSelect,
  ariaLabel,
}: {
  steps: string[];
  current: string;
  onSelect?: (step: string) => void;
  ariaLabel?: string;
}) {
  const idx = steps.indexOf(current);
  const interactive = typeof onSelect === "function";
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={ariaLabel ?? "Alur status"}>
      {steps.map((s, i) => {
        const done = idx >= 0 && i < idx;
        const on = s === current;
        const tone = on
          ? "bg-navy-700 text-white"
          : done
            ? "bg-emerald-100 text-emerald-700"
            : "bg-steel-100 text-steel-500";
        return (
          <span key={s} className="flex items-center gap-1.5">
            {interactive ? (
              <button
                type="button"
                onClick={() => onSelect(s)}
                aria-pressed={on}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 ${tone} ${on ? "cursor-default" : "hover:bg-steel-200"}`}
              >
                {i + 1}. {s}
              </button>
            ) : (
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${tone}`} aria-current={on ? "step" : undefined}>
                {i + 1}. {s}
              </span>
            )}
            {i < steps.length - 1 && (
              <span aria-hidden className="text-steel-300">→</span>
            )}
          </span>
        );
      })}
      {idx < 0 && (
        <span className="text-xs text-steel-400">Status “{current}” di luar alur baku</span>
      )}
    </div>
  );
}

/** Tombol upload file generik: spinner saat unggah, toast pesan backend,
 * mode lokal biarkan input URL manual (fallback di luar komponen ini). */

export function FileUploadButton({ accept, onUploaded, label, disabled }: {
  accept?: string;
  onUploaded: (url: string) => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? ".png,.jpg,.jpeg,.pdf,.xlsx,.xls,.csv,.txt"}
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          void (async () => {
            setBusy(true);
            try {
              onUploaded(await uploadFile(f));
            } catch (err) {
              toast(err instanceof Error ? err.message : "Upload gagal", "info");
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <button
        type="button"
        className="btn-secondary text-xs"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadIcon className="h-3.5 w-3.5" />}
        {label}
      </button>
    </>
  );
}

/* ============ T O A S T ============ */

export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return v;
}

export { toast, Toaster } from "./Toast";
export type { ToastTone, ToastOptions, ToastItem, ToastAction } from "./Toast";

export { Alert, AlertModal } from "./Alert";
export type { AlertProps, AlertModalProps, AlertVariant } from "./Alert";

