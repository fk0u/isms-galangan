# F3-B — Manajemen Proyek

Halaman: `/proyek` (`pages/proyek/Projects.tsx`), `/proyek/:id` (`pages/proyek/ProjectDetail.tsx`, 2.570 baris), modal `components/ProjectAddModal.tsx`, banner `components/AlertBanner.tsx`. Teks: `i18n/n_prj.ts`.
Estimasi fase: 6–8 HK.

**Aturan khusus file ini:** `ProjectDetail.tsx` terlalu besar. Setiap task yang mengubah satu tab **memindahkan tab itu** ke `pages/proyek/tabs/<NamaTab>.tsx` (props: `project`, data yang dibutuhkan). Jangan mengubah perilaku tab lain.

## Daftar proyek (`Projects.tsx`)

### F3-B-01 — Banner notifikasi maks 3
P1 · 2 j · PRJ-01
**Konteks.** `AlertBanner.tsx` memakai `PREVIEW_N` per level sehingga bisa tampil hingga 15 item; tombol berlabel "Perkecil".
**Langkah.** Total pratinjau 3 item (urut level: kritis → peringatan → info). Tombol "Tampilkan semua (n)" membuka/menutup sisanya; saat terbuka label "Sembunyikan". Teks via i18n.
**Kriteria.** [ ] Maks 3 item saat tertutup di semua modul yang memakai banner.

### F3-B-02 — Tabel: nomor, tombol Detail, urutan terbaru
P0 · 3 j · PRJ-02, PRJ-06, PRJ-07, PRJ-09
**Langkah.** Kolom "No" pertama = `(page-1)*size + i + 1`. Pindahkan link detail dari sel Tahap ke kolom Aksi sebagai tombol "Detail". Default sort `createdAt` **desc**; proyek tanpa `createdAt` di bawah. Default 25 baris (verifikasi `usePager(list.length, 25)`).
**Kriteria.** [ ] Proyek yang baru dibuat muncul di baris 1. [ ] Nomor berlanjut di halaman 2.

### F3-B-03 — Card status gradient + label
P1 · 4 j · PRJ-03, PRJ-04
**Konteks.** Card memakai `KpiCard`/`.card` (`ui.tsx`, `index.css`) dengan sparkline `spark`.
**Langkah.** Varian `KpiCard` `tone` gradient (biru, hijau, oranye, merah) tanpa sparkline. Card **Total**: sub-label "Selesai n · Berjalan n". Card **Sedang berjalan**: sub-label "Tertunda n". Perbaiki hitungan: "Berjalan" = status bukan Selesai/Batal (lihat catatan `todo5` bahwa Batal ikut terhitung).
**Kriteria.** [ ] Angka sub-label + total konsisten (uji dengan seed).

### F3-B-04 — Filter jadi deret chip
P1 · 3 j · PRJ-05 · Bergantung: F3-A-04 (`StatusChips`)
**Konteks.** `components/FilterPopover.tsx` dipakai 14 modul. Ubah **hanya** halaman proyek (modul lain menyusul bila diminta).
**Langkah.** Ganti popover di Projects dengan baris chip (status, tahap, tipe) yang muncul dengan animasi slide saat tombol Filter diklik.

### F3-B-05 — Form proyek baru
P0 · 4 j · PRJ-10, PRJ-11, PRJ-12
**Konteks.** `ProjectAddModal.tsx`: `branchOptions` hardcode (baris 14), validasi cabang (75–76), kapal `<input list>`, klien & PM `<select>`, select status.
**Langkah.** Ganti field cabang dengan "Rencana lokasi docking" = `SearchSelect` dari koleksi `drydocks` (simpan `plannedDockId`); `branch` diisi otomatis dari sesi (lihat F2-06). Kapal, klien, PM pakai `SearchSelect` (PM = karyawan berjabatan manager/PM). Hapus select status; simpan `status: "Dalam Proses"`.
**Kriteria.** [ ] Proyek baru tersimpan dengan `plannedDockId`, status Dalam Proses. [ ] Validasi API (`REQUIRED_DATA` vessel, client) tetap lolos.

### F3-B-06 — Rumus progres proyek
P0 · 4 j · PRJ-08 · Keputusan: ADR-0011
**Konteks.** Klien: "progres proyek harus disesuaikan lagi". Upstream menambah override Terlambat (`utils/projectDelay.ts`). Rumus progres saat ini perlu dibaca di `ProjectDetail.tsx`/`Projects.tsx` (cari `progress`).
**Langkah.** Dokumentasikan rumus sekarang di PR. Implementasikan rumus hasil Q11 (usulan: rata-rata progres WBS berbobot nilai BoQ/anggaran tiap task) dalam `utils/projectProgress.ts` + probe; pakai di list, detail, monitoring, dashboard.
**Kriteria.** [ ] Satu fungsi progres dipakai semua halaman (grep tidak menemukan rumus lain).

## Detail proyek (`ProjectDetail.tsx`)

### F3-B-07 — Header & card progres
P1 · 3 j · PRJ-13, PRJ-14
**Langkah.** Hapus "(otomatis)" (sekitar label status, title, toast — 3 lokasi; pindahkan ke i18n). Card progres: bila Terlambat/Tertunda tampilkan detail — hari terlambat, milestone/WBS penyebab, tanggal target (sumber: `projectDelay.ts`).

### F3-B-08 — Ringkasan: Log Penawaran & Tagihan, milestone
P1 · 3 j · PRJ-15, PRJ-16
**Langkah.** Verifikasi PRJ-15 (upstream sudah). Milestone: horizon 30 hari (bukan 7) **khusus tampilan ini** — jangan ubah setting global `ALERT_MILESTONE_DAYS` yang dipakai mesin alert; tampil list (tanggal, nama, status), sudah lewat tidak ditampilkan.

### F3-B-09 — WBS: progres, material, histori, foto, assign
P0 · 1,5 HK · PRJ-17, PRJ-31 · Bergantung: F3-A-04
**Konteks.** Upstream: material WBS terhubung inventori & foto array (commit `68ec10d`, `0a65a8f`) — verifikasi. Histori perubahan belum tampil.
**Langkah.**
1. Modal update progres: material = `SearchSelect` item inventori + qty (membuat `movements` OUT referensi `wbsId`, **lewat alur F3-D** bila stok kurang); foto via `PhotoUploader`; catatan.
2. Panel histori per task WBS: `ChangeHistory` (progres sebelum→sesudah, siapa, kapan, foto).
3. Kolom Aksi WBS: tombol **Assign** → pilih tipe Internal (karyawan) atau Eksternal (subkon → WO). Simpan `assignee: {type, id}`; tampil di tabel.
**Kriteria.** [ ] Update progres membuat histori yang tampil. [ ] Assign subkon membuat/menautkan WO.

### F3-B-10 — Gantt mini dengan label bulan
P2 · 3 j · PRJ-18
**Langkah.** Sumbu bawah gantt mini menampilkan nama bulan (Jan, Feb, …) sesuai rentang proyek; garis hari ini.

### F3-B-11 — Perubahan & Risiko: hapus tabel risiko
P1 · 2 j · PRJ-22 · Keputusan: Q12 (sembunyikan tabel; tab jadi "Change Order")
**Konteks.** Klien minta tabel risiko dihapus, padahal upstream baru menambah risiko otomatis (`utils/riskAuto.ts`, D8).
**Langkah.** Default usulan: sembunyikan tabel di tab ini; risiko otomatis tetap dipakai untuk alert/monitoring. Tab berganti nama "Change Order" bila tabel risiko hilang (konfirmasi di PR).

### F3-B-12 — Terkait: Trial & Garansi
P1 · 4 j · PRJ-23, PRJ-24, PRJ-25
**Langkah.** Rename label "Commisioning & Trial" (ikuti ejaan klien di ID; EN "Commissioning & Trial"). Verifikasi upstream D10 (checklist dari WBS + kondisi 3 pilihan + catatan) dan D11 (garansi per WBS, terbit saat progres 100%). Lengkapi yang kurang: kartu garansi bisa dicetak PDF (tambahkan `kind` di `services/api/src/pdf/registry.ts` bila belum ada).

### F3-B-13 — Tab Tim terhubung SDM
P1 · 3 j · PRJ-28
**Langkah.** Pilih anggota dari `employees` (SearchSelect, filter jabatan); tampil foto/jabatan/kontak dari data karyawan; klik nama → `/sdm/karyawan/:id`. Simpan lewat `PUT /api/projects/:id/team` (sudah ada).

### F3-B-14 — Verifikasi tab Subkon
P2 · 1 j · PRJ-29
Verifikasi upstream D15: daftar WO subkon proyek ini, nilai, progres, termin; tautan ke modul Subkon.
