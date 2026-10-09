/* Teks panduan demo presentasi (DemoGuide). Skenario disusun mengikuti alur
   bisnis inti di CONTEXT.md supaya presenter bisa bercerita berurutan. */
import type { Locale } from "./types";

export interface DemoStep {
  title: string;
  hint: string;
  to: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  steps: DemoStep[];
}

export const n_demo = {
  id: {
    fab: "Demo",
    fabAria: "Buka panduan demo (Shift + D)",
    title: "Panduan demo",
    subtitle: "Alur presentasi langkah demi langkah",
    shortcut: "Shift + D",
    shortcutHint: "buka/tutup panel",
    scenarios: "Skenario",
    quick: "Akses cepat modul",
    open: "Buka",
    done: "Selesai",
    back: "Semua skenario",
    progress: "{a} dari {b} langkah",
    minutes: "± {n} menit",
    reset: "Ulangi dari awal",
    hide: "Sembunyikan tombol",
    hidden: "Tombol demo disembunyikan. Tekan Shift + D untuk membukanya lagi.",
    show: "Tampilkan tombol",
    close: "Tutup",
    next: "Langkah berikutnya",
  },
  en: {
    fab: "Demo",
    fabAria: "Open demo guide (Shift + D)",
    title: "Demo guide",
    subtitle: "Step-by-step presentation flow",
    shortcut: "Shift + D",
    shortcutHint: "open/close panel",
    scenarios: "Scenarios",
    quick: "Quick module access",
    open: "Open",
    done: "Done",
    back: "All scenarios",
    progress: "{a} of {b} steps",
    minutes: "~{n} min",
    reset: "Start over",
    hide: "Hide button",
    hidden: "Demo button hidden. Press Shift + D to open it again.",
    show: "Show button",
    close: "Close",
    next: "Next step",
  },
};

const SCENARIOS: Record<Locale, DemoScenario[]> = {
  id: [
    {
      id: "exec", title: "Ringkasan eksekutif", minutes: 2,
      summary: "Gambaran seluruh galangan dalam satu layar.",
      steps: [
        { title: "Dashboard eksekutif", hint: "Tunjukkan KPI proyek, pendapatan, dan stok kritis.", to: "/dashboard" },
        { title: "Perhatian khusus per kategori", hint: "Pilih kategori di bagian 'Perlu perhatian' — tidak semua ditampilkan sekaligus.", to: "/dashboard" },
        { title: "Monitoring proyek", hint: "Proyek terlambat ditandai merah; klik proyek lalu 'Kembali' kembali ke sini.", to: "/proyek/monitoring" },
      ],
    },
    {
      id: "boq", title: "Proyek & BoQ per surat", minutes: 4,
      summary: "Satu surat BoQ berisi banyak pekerjaan, dengan revisi terkunci.",
      steps: [
        { title: "Daftar proyek", hint: "Nomor urut, proyek terbaru di atas, tombol Detail di kolom aksi.", to: "/proyek" },
        { title: "Buka surat BoQ", hint: "Tab BoQ menampilkan surat, bukan item. Buka BQ/RP-2026-003/001 Rev 1.", to: "/proyek/RP-2026-003?tab=BoQ" },
        { title: "Riwayat revisi", hint: "Klik Rev 0 vs Rev 1 untuk membandingkan total. Surat disetujui terkunci.", to: "/proyek/RP-2026-003?tab=BoQ" },
        { title: "Buat revisi → ajukan → setujui", hint: "Revisi baru (Draft) menyalin item; setelah disetujui, Rev lama menjadi 'Digantikan'.", to: "/proyek/RP-2026-003?tab=BoQ" },
      ],
    },
    {
      id: "material", title: "Alur material: gudang → procurement", minutes: 3,
      summary: "Mekanik meminta barang; stok kurang otomatis menjadi Purchase Request.",
      steps: [
        { title: "Tambah sparepart dari inventori", hint: "Pilih barang, lihat stok; jumlah melebihi stok → peringatan PR.", to: "/proyek/RP-2026-003?tab=Sparepart" },
        { title: "Purchase Request otomatis", hint: "Kekurangan stok muncul sebagai PR berstatus Diajukan.", to: "/procurement?tab=PR" },
        { title: "Pergerakan stok", hint: "Barang keluar tercatat dengan referensi proyek & WBS.", to: "/inventori?tab=Pergerakan" },
        { title: "Update progres WBS dengan material", hint: "Material WBS memakai alur yang sama — stok tidak pernah minus.", to: "/proyek/RP-2026-003?tab=WBS%20%26%20Anggaran" },
      ],
    },
    {
      id: "dock", title: "Drydock & kapasitas", minutes: 2,
      summary: "Mapping slot dan booking berbasis jadwal proyek.",
      steps: [
        { title: "Mapping slot area", hint: "Klik slot untuk melihat kapal, proyek, dan tanggal.", to: "/drydock" },
        { title: "Booking slot", hint: "Pilih proyek → tanggal terisi dari jadwal proyek; bentrok slot ditolak.", to: "/drydock" },
      ],
    },
    {
      id: "ops", title: "Operasional pendukung", minutes: 3,
      summary: "Equipment, subkon, QC, SDM, dan keuangan.",
      steps: [
        { title: "Equipment", hint: "Daftar equipment dengan merk, tahun unit, dan penanggung jawab.", to: "/equipment" },
        { title: "Subkontraktor", hint: "Work order per proyek dan kapal.", to: "/subkontraktor" },
        { title: "QC & Safety", hint: "Inspeksi, NCR, HSE, insiden.", to: "/qc-safety" },
        { title: "SDM & karyawan", hint: "Urutan tabel stabil, kolom terakhir diupdate.", to: "/sdm" },
        { title: "Keuangan & billing", hint: "Invoice, hutang, kas-bank, laporan.", to: "/keuangan" },
      ],
    },
  ],
  en: [
    {
      id: "exec", title: "Executive overview", minutes: 2,
      summary: "The whole shipyard on one screen.",
      steps: [
        { title: "Executive dashboard", hint: "Show project KPIs, revenue, and critical stock.", to: "/dashboard" },
        { title: "Attention by category", hint: "Pick a category under 'Needs attention' — not everything at once.", to: "/dashboard" },
        { title: "Project monitoring", hint: "Late projects are red; open one and 'Back' returns here.", to: "/proyek/monitoring" },
      ],
    },
    {
      id: "boq", title: "Projects & BoQ letters", minutes: 4,
      summary: "One BoQ letter holds many work items, with locked revisions.",
      steps: [
        { title: "Project list", hint: "Row numbers, newest first, Detail button in the action column.", to: "/proyek" },
        { title: "Open a BoQ letter", hint: "The BoQ tab lists letters, not items. Open BQ/RP-2026-003/001 Rev 1.", to: "/proyek/RP-2026-003?tab=BoQ" },
        { title: "Revision history", hint: "Switch Rev 0 / Rev 1 to compare totals. Approved letters are locked.", to: "/proyek/RP-2026-003?tab=BoQ" },
        { title: "Revise → submit → approve", hint: "A new revision copies the items; once approved the old Rev becomes 'Superseded'.", to: "/proyek/RP-2026-003?tab=BoQ" },
      ],
    },
    {
      id: "material", title: "Material flow: warehouse → procurement", minutes: 3,
      summary: "Mechanics request items; shortages become Purchase Requests automatically.",
      steps: [
        { title: "Add a sparepart from inventory", hint: "Pick an item, see its stock; asking for more shows the PR warning.", to: "/proyek/RP-2026-003?tab=Sparepart" },
        { title: "Automatic Purchase Request", hint: "The shortage appears as a Submitted PR.", to: "/procurement?tab=PR" },
        { title: "Stock movements", hint: "Issued items are logged with project & WBS reference.", to: "/inventori?tab=Pergerakan" },
        { title: "WBS progress with material", hint: "WBS material uses the same flow — stock never goes negative.", to: "/proyek/RP-2026-003?tab=WBS%20%26%20Anggaran" },
      ],
    },
    {
      id: "dock", title: "Drydock & capacity", minutes: 2,
      summary: "Slot mapping and bookings driven by project schedules.",
      steps: [
        { title: "Slot area mapping", hint: "Click a slot to see vessel, project, and dates.", to: "/drydock" },
        { title: "Book a slot", hint: "Pick a project → dates fill from its schedule; overlaps are rejected.", to: "/drydock" },
      ],
    },
    {
      id: "ops", title: "Supporting operations", minutes: 3,
      summary: "Equipment, subcontractors, QC, HR, and finance.",
      steps: [
        { title: "Equipment", hint: "Equipment register with brand, unit year, and owner.", to: "/equipment" },
        { title: "Subcontractors", hint: "Work orders per project and vessel.", to: "/subkontraktor" },
        { title: "QC & Safety", hint: "Inspections, NCR, HSE, incidents.", to: "/qc-safety" },
        { title: "HR & employees", hint: "Stable table order, last-updated column.", to: "/sdm" },
        { title: "Finance & billing", hint: "Invoices, payables, cash & bank, reports.", to: "/keuangan" },
      ],
    },
  ],
};

export function demoScenarios(locale: Locale): DemoScenario[] {
  return SCENARIOS[locale] ?? SCENARIOS.id;
}
