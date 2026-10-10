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
    roleTitle: "Lihat sebagai peran",
    roleNow: "Sekarang: {name} · {role}",
    rolePick: "Pilih peran…",
    roleSwitch: "Ganti",
    roleBack: "Kembali ke akun asal",
    roleHint: "Menu, tombol, dan akses data mengikuti hak peran. Setiap perpindahan tercatat di audit.",
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
    roleTitle: "View as role",
    roleNow: "Now: {name} · {role}",
    rolePick: "Pick a role…",
    roleSwitch: "Switch",
    roleBack: "Back to original account",
    roleHint: "Menus, buttons, and data access follow the role's rights. Every switch is audited.",
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
      id: "material", title: "Alur material: gudang → procurement", minutes: 4,
      summary: "Mekanik meminta barang; stok kurang otomatis menjadi Purchase Request.",
      steps: [
        { title: "Tambah sparepart dari inventori", hint: "Pilih barang, lihat stok; jumlah melebihi stok → peringatan PR.", to: "/proyek/RP-2026-003?tab=Sparepart" },
        { title: "Daftar permintaan barang", hint: "Semua permintaan proyek: dipenuhi dari stok, menunggu PO, sebagian. MR-2026-002 menunggu PO.", to: "/procurement?tab=Permintaan" },
        { title: "Purchase Request otomatis", hint: "Kekurangan stok muncul sebagai PR berstatus Diajukan, tertaut ke permintaannya.", to: "/procurement?tab=PR" },
        { title: "Penuhi dari stok", hint: "Setelah barang masuk gudang, klik 'Penuhi dari stok' — status jadi Sebagian / Selesai.", to: "/procurement?tab=Permintaan" },
        { title: "Pergerakan stok", hint: "Barang keluar tercatat dengan referensi proyek & WBS.", to: "/inventori?tab=Pergerakan" },
        { title: "Update progres WBS dengan material", hint: "Material WBS memakai alur yang sama — stok tidak pernah minus.", to: "/proyek/RP-2026-003?tab=WBS%20%26%20Anggaran" },
      ],
    },
    {
      id: "service", title: "Service & persetujuan procurement", minutes: 3,
      summary: "Service dari pekerjaan WBS, biaya dari BoQ, wajib disetujui sebelum dikerjakan.",
      steps: [
        { title: "Ajukan service dari WBS", hint: "Tab Service → Tambah: pilih WBS, teknisi dari karyawan, item BoQ (biaya terisi otomatis).", to: "/proyek/RP-2026-003?tab=Service" },
        { title: "Persetujuan procurement", hint: "Setujui, atau tolak dengan alasan. SRV-006 (dan service yang baru diajukan) menunggu di sini.", to: "/procurement?tab=Persetujuan%20Service" },
        { title: "Mulai & selesaikan service", hint: "Tombol Mulai baru muncul setelah disetujui; biaya service Selesai masuk biaya proyek (tab WBS & Anggaran).", to: "/proyek/RP-2026-003?tab=Service" },
      ],
    },
    {
      id: "po", title: "PO sebagian & ganti vendor", minutes: 3,
      summary: "Vendor kirim sebagian, sisanya dialihkan ke vendor lain; permintaan proyek terpenuhi otomatis.",
      steps: [
        { title: "Terima sebagian PO-2026-118", hint: "Tab PO Besar → Terima barang, isi 12 dari 20. Permintaan MR-2026-002 langsung terpenuhi dari stok.", to: "/procurement?tab=PO%20Besar%20(Kantor)" },
        { title: "Vendor tidak sanggup", hint: "Lainnya → Vendor tidak sanggup untuk sisa 8 (wajib alasan). Status jadi Dibatalkan Sebagian.", to: "/procurement?tab=PO%20Besar%20(Kantor)" },
        { title: "Alihkan ke vendor lain", hint: "Pilih vendor dari riwayat harga (termurah ditandai); PO baru masuk alur persetujuan.", to: "/procurement?tab=PO%20Besar%20(Kantor)" },
        { title: "Cek permintaan barang", hint: "Status permintaan & stok terbarui otomatis tanpa input ulang.", to: "/procurement?tab=Permintaan" },
      ],
    },
    {
      id: "rbac", title: "Hak akses per peran", minutes: 3,
      summary: "Satu sistem, 14 peran: tiap peran hanya melihat & mengubah modulnya.",
      steps: [
        { title: "Pindah ke Procurement", hint: "Bagian 'Lihat sebagai peran' di atas → Staff Procurement. Sidebar hanya berisi modul procurement.", to: "/dashboard" },
        { title: "Pindah ke Gudang", hint: "Kepala Gudang menerima barang & memenuhi permintaan, tapi tidak bisa membuat PO.", to: "/inventori" },
        { title: "Pindah ke Viewer (klien)", hint: "Hanya baca: tombol simpan ditolak server (403) dan tercatat.", to: "/proyek" },
        { title: "Kembali ke Direktur", hint: "Tombol 'Kembali ke akun asal'. Semua perpindahan ada di audit log.", to: "/dashboard" },
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
      id: "material", title: "Material flow: warehouse → procurement", minutes: 4,
      summary: "Mechanics request items; shortages become Purchase Requests automatically.",
      steps: [
        { title: "Add a sparepart from inventory", hint: "Pick an item, see its stock; asking for more shows the PR warning.", to: "/proyek/RP-2026-003?tab=Sparepart" },
        { title: "Material request list", hint: "Every project request: from stock, awaiting PO, partial. MR-2026-002 is awaiting PO.", to: "/procurement?tab=Permintaan" },
        { title: "Automatic Purchase Request", hint: "The shortage appears as a Submitted PR linked to its request.", to: "/procurement?tab=PR" },
        { title: "Fulfill from stock", hint: "Once goods arrive, click 'Fulfill from stock' — status becomes Partial / Complete.", to: "/procurement?tab=Permintaan" },
        { title: "Stock movements", hint: "Issued items are logged with project & WBS reference.", to: "/inventori?tab=Pergerakan" },
        { title: "WBS progress with material", hint: "WBS material uses the same flow — stock never goes negative.", to: "/proyek/RP-2026-003?tab=WBS%20%26%20Anggaran" },
      ],
    },
    {
      id: "service", title: "Service & procurement approval", minutes: 3,
      summary: "Services come from WBS work, cost from BoQ, and need approval before work starts.",
      steps: [
        { title: "Submit a service from WBS", hint: "Service tab → Add: pick WBS, technician from employees, BoQ item (cost fills in).", to: "/proyek/RP-2026-003?tab=Service" },
        { title: "Procurement approval", hint: "Approve, or reject with a reason. SRV-006 (and any newly submitted service) waits here.", to: "/procurement?tab=Persetujuan%20Service" },
        { title: "Start & finish the service", hint: "Start appears only after approval; completed service cost goes into project cost (WBS & Budget tab).", to: "/proyek/RP-2026-003?tab=Service" },
      ],
    },
    {
      id: "po", title: "Partial PO & vendor switch", minutes: 3,
      summary: "A vendor ships part, the rest moves to another vendor; project requests are fulfilled automatically.",
      steps: [
        { title: "Receive part of PO-2026-118", hint: "Big PO tab → Receive goods, enter 12 of 20. Request MR-2026-002 is fulfilled from stock right away.", to: "/procurement?tab=PO%20Besar%20(Kantor)" },
        { title: "Vendor cannot supply", hint: "More → Vendor cannot supply for the remaining 8 (reason required). Status becomes Partially cancelled.", to: "/procurement?tab=PO%20Besar%20(Kantor)" },
        { title: "Move to another vendor", hint: "Pick a vendor from price history (cheapest flagged); the new PO goes through approval.", to: "/procurement?tab=PO%20Besar%20(Kantor)" },
        { title: "Check material requests", hint: "Request status and stock update automatically, no re-entry.", to: "/procurement?tab=Permintaan" },
      ],
    },
    {
      id: "rbac", title: "Access by role", minutes: 3,
      summary: "One system, 14 roles: each role sees and changes only its modules.",
      steps: [
        { title: "Switch to Procurement", hint: "'View as role' above → Procurement staff. The sidebar shows only procurement modules.", to: "/dashboard" },
        { title: "Switch to Warehouse", hint: "Warehouse head receives goods and fulfills requests but cannot create POs.", to: "/inventori" },
        { title: "Switch to Viewer (client)", hint: "Read-only: saves are rejected by the server (403) and logged.", to: "/proyek" },
        { title: "Back to Director", hint: "'Back to original account'. Every switch is in the audit log.", to: "/dashboard" },
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
