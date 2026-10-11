# HANDOFF-AI-2026-10-11-BATCH2.md — Spesifikasi & Rencana Pengerjaan Fitur Lanjutan ISMS

Dokumen ini memuat spesifikasi teknis, rancangan arsitektur, dan pembagian tahapan implementasi untuk 8 butir notulensi perbaikan dan pengembangan sistem ISMS (Integrated Shipyard Management System).

---

## 1. Daftar Kebutuhan (Notulensi Klien & Pengguna)

1. **WBS View Mode & Toggle Worktree (`ProjectDetail.tsx`)**:
   - Default tampilan WBS hanya menampilkan daftar tahapan ringkas (tabel tahapan/milestone).
   - Pohon kerja (Worktree / FlowTree) memiliki toggle switch **Hide / Show Worktree** (default: Hidden).
2. **Hapus Tahapan & Tooltip Kalkulasi Bobot WBS**:
   - Fitur hapus tahapan (delete milestone) dengan konfirmasi aman.
   - Form penambahan/pengeditan tahapan memiliki nilai awal **Default Bobot = 0**.
   - Tooltip / info pembantu di bawah isian bobot yang memperlihatkan kalkulasi sisa bobot menuju 100% serta peringatan bila over/under budget.
3. **Sistematis React Toast & Alert Confirmation**:
   - Toast notifikasi murni berbasis state React (tanpa manipulasi direct DOM / imperative js element).
   - Dialog konfirmasi aksi penting menggunakan modal konfirmasi berbasis state.
4. **Perubahan Terminologi: "Desain" -> "Perencanaan"**:
   - Perbarui terminologi tahapan/kategori proyek dari "Desain" menjadi "Perencanaan" (EN: "Planning & Design") di `n_prj.ts`, filter WBS, dan alur tahapan proyek.
5. **Indikator Dokumen Butuh Cek & Approval (Modul Dokumen)**:
   - Trigger badge & filter khusus di modul Dokumen (`Documents.tsx`) untuk dokumen yang membutuhkan tindakan ("Needs Review / Approval" atau "Pending Submission").
6. **Class & Subclass Status Tracking**:
   - Rincian approval Class (BKI / Biro Klasifikasi) memiliki daftar sub-pekerjaan/subclass item (item yang sudah selesai vs belum selesai dalam fase Perencanaan).
   - Ringkasan status Class ditampilkan secara terstruktur di ringkasan proyek.
7. **Pengendalian Stok & Approval Inventory (Material Request Flow)**:
   - Pengambilan material proyek tidak memotong inventori secara langsung.
   - Wajib melalui Material Request (MR) / PO dengan persetujuan (approval) Kepala Gudang/Inventori, sekalipun stok mencukupi di gudang, untuk mencegah miskomunikasi antar-divisi.
8. **Penyempurnaan Modal Tambah Karyawan (`HR.tsx`)**:
   - Melebarkan ukuran modal (mis. `max-w-4xl` / `max-w-5xl`) dengan layout formulir responsif 2–3 kolom agar semua field terlihat jelas tanpa scrolling sempit.

---

## 2. Pembagian Tahapan Pengerjaan

### Tahap 1: WBS Enhancements & Terminologi Perencanaan
- **Cakupan**:
  - `apps/web/src/pages/proyek/ProjectDetail.tsx`
  - `apps/web/src/i18n/n_prj.ts` & `n_dry.ts`
  - Tambahkan toggle switch Worktree (Default: Hide).
  - Tambahkan tombol aksi Hapus Tahapan dengan modal konfirmasi.
  - Set default bobot = 0 pada penambahan tahapan baru.
  - Pasang live tooltip kalkulasi sisa bobot terhadap 100%.
  - Ubah string dan opsi "Desain" menjadi "Perencanaan" / "Planning & Design".

### Tahap 2: React State Toast & Modal Tambah Karyawan
- **Cakupan**:
  - `apps/web/src/components/ui.tsx` / Store Toast System.
  - `apps/web/src/pages/hr/HR.tsx`
  - Pastikan sistem Toast responsif, berbasis React state murni, otomatis hilang (auto-dismiss).
  - Redesain modal Tambah Karyawan menjadi widescreen multi-kolom yang nyaman tanpa scrolling sempit.

### Tahap 3: Trigger Approval Dokumen & Class / Subclass Planning Summary
- **Cakupan**:
  - `apps/web/src/pages/dokumen/Documents.tsx`
  - `apps/web/src/pages/proyek/ProjectDetail.tsx` (Bagian Statutory & Class)
  - Badge notifikasi "Butuh Review / Approval" di tab Dokumen.
  - Checklist item class & subclass perencanaan yang selesai dan belum selesai.

### Tahap 4: Pengendalian Material & Approval Inventori
- **Cakupan**:
  - `apps/web/src/pages/proyek/SparepartServiceSection.tsx` & `Inventory.tsx`
  - `apps/web/src/data/store.tsx`
  - Penegasan alur Material Issue yang mewajibkan status `Disetujui Gudang` sebelum kuantitas stok terpotong.

### Tahap 5: Verifikasi Komprehensif
- Jalankan `npm run check` di root monorepo (web + api).
- Uji fungsionalitas dan pastikan bilingual (ID & EN).

---

## 3. Standar Kualitas & Aturan
- Mengikuti aturan baku `AGENTS.md`.
- Setiap string baru wajib bilingual ID & EN di file `n_*.ts`.
- `npm run check` wajib exit code 0.
