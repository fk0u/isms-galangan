# F6 — Kebersihan Kode (dead code, lint, pemecahan file)

Pemilik: PEMBERSIH. Dijalankan setelah fitur sprint merged (malam hari 3), lalu rutin tiap akhir minggu.
**Prinsip:** menghapus hanya yang **terbukti** tidak dipakai. Setiap penghapusan harus lolos `npm run check`. Tidak ada perubahan perilaku dalam PR cleanup.
Estimasi: 0,5–1 HK.

---

### F6-01 — Deteksi kode mati dengan knip
P1 · 2 j
**Langkah.** Tambah devDependency `knip` di `apps/web` dan `services/api` + `knip.json` (entry: `src/main.tsx`, `scripts/*-probe.ts(x)` untuk web; `src/index.ts`, `src/*.ts` skrip CLI, `scripts/*.ts` untuk api). Skrip `"knip": "knip"`. Jalankan dan simpan laporan di deskripsi PR.
**Kriteria.** [ ] Laporan export/file/dependency tidak terpakai tersedia.

### F6-02 — Hapus file, export, dan dependensi tak terpakai
P1 · 2 j · Bergantung: F6-01
**Langkah.** Hapus satu kategori per commit: (1) file tak terpakai, (2) export tak terpakai, (3) dependency tak terpakai. Lewati yang dirujuk dinamis (`import()`, registry PDF, seed CLI) — cek `grep` sebelum hapus. Komponen sisa revisi klien (tab yang dihapus: Analisis inventori, Mutasi/Org Chart, Drawing, Timesheet, tab equipment lama, peta kapasitas, prediktif/preskriptif) termasuk target.
**Kriteria.** [ ] `knip` bersih atau sisa temuan dijelaskan di PR. [ ] Probe render 28 halaman lulus.

### F6-03 — Kunci i18n yang tidak dipakai
P1 · 2 j
**Langkah.** Skrip `apps/web/scripts/i18n-probe.ts`: (a) setiap kunci ID ada pasangan EN dan sebaliknya; (b) laporkan kunci yang tidak dirujuk di `src/`. Hapus kunci mati; masukkan bagian (a) ke `check`.
**Kriteria.** [ ] ID/EN simetris; tidak ada kunci mati.

### F6-04 — Lint nol error, warning turun
P1 · 2 j · Bergantung: F1-02
**Langkah.** `npm run lint -- --max-warnings=<angka sekarang>` di CI agar warning tidak bertambah. Perbaiki `react-hooks/exhaustive-deps` dan `no-unused-vars` di file yang disentuh sprint. Tambahkan Prettier **hanya** bila disepakati owner (hindari diff massal).
**Kriteria.** [ ] Lint error 0; batas warning terpasang di CI.

### F6-05 — Pecah file raksasa yang disentuh sprint
P2 · 0,5–1 HK
**Target.** `ProjectDetail.tsx` (per tab → `pages/proyek/tabs/`), `Inventory.tsx`, `Equipment.tsx`, `Finance.tsx` — hanya bagian yang belum dipecah oleh task fitur. Pindahkan tanpa mengubah logika (move-only commit), lalu commit terpisah untuk perbaikan import.
**Kriteria.** [ ] Tidak ada file halaman > 1.500 baris yang disentuh sprint. [ ] Diff move-only bisa diverifikasi (`git diff -M`).
