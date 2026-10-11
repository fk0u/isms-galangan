# Handoff ke AI engineer berikutnya — 10 Okt 2026 (malam)

Dokumen ini untuk agent yang melanjutkan pekerjaan (mis. Gemini di Antigravity).
Baca `AGENTS.md` dulu; dokumen ini hanya menambah konteks yang **tidak** ada di sana.
Repo ini publik: jangan menulis kredensial, alamat server, atau data nyata di sini.

## 1. Posisi sekarang

- `main` = PR #56 (semua P0 + batch P1 pertama) — **sudah ter-deploy**.
- Branch `feat/p1-batch-2` berisi batch kedua (tabel "Batch 2" di bawah). Lihat PR terkait untuk status merge/deploy terakhir.
- Sumber status per task: `docs/handoff/STATUS.md`.

### Batch 2 (branch `feat/p1-batch-2`)

| Task | Status | Yang dikerjakan | File utama |
|---|---|---|---|
| F4-03 | selesai | SSE `GET /api/events`: setiap tulis DB memancarkan nama koleksi (di `db.ts` `exec`), disaring per izin baca; klien `useRealtime` menarik ulang koleksi terkait | `services/api/src/db.ts`, `routes/events.ts`, `apps/web/src/data/useRealtime.ts`, probe `events-probe.ts` |
| F4-06 | sebagian | Semua halaman `React.lazy` + muat ulang sekali bila chunk basi; chunk awal ±1 MB (dari 3,1 MB) | `apps/web/src/main.tsx` |
| F4-07 | sebagian | IP watermark dari `/api/auth/me` (ipapi.co dihapus); migrasi gagal keras bila checksum berubah (`MIGRATE_ALLOW_DRIFT=true` untuk darurat); `/api/admin/seed` 404 di produksi | `security/watermark.tsx`, `migrate.ts`, `routes/admin.ts` |
| F4-05 | sebagian | `GET /files/*`: berkas yang dipakai sebagai `ktpUrl`/`ijazahUrl` karyawan hanya untuk peran dengan izin tulis `employees` | `routes/files.ts`, probe `files-privacy-probe.ts` |
| F3-C-04 | sebagian | PDF `kind: "boq"`; surat Disetujui otomatis membuat `documents` (`DOC-<boqDocId>`, type BoQ) | `pdf/documents/boq.ts`, `pdf/registry.ts`, `boqDocs.ts`, `BoqDocsSection.tsx` |
| F3-B-12 | selesai | PDF `kind: "garansi"` + tombol "Cetak kartu" | `pdf/documents/boq.ts`, `ProjectDetail.tsx` |
| F3-L-06 | sebagian | Cuti via QR: `/f/cuti/:token` (publik), NIK + PIN 6 angka (hash bcrypt), rate limit; HR: modal QR + ganti token, tombol "Atur PIN cuti" | `routes/publicLeave.ts`, `pages/publik/CutiQr.tsx`, `HR.tsx`, `KaryawanDetail.tsx`, ADR-0017, migrasi 016 |
| F3-L-08 | selesai | `POST /api/attendance/ingest` (API key per alat), `/api/attendance/import` (CSV), `/api/attendance/devices` | `routes/attendanceIngest.ts`, `pages/absensi/DeviceImport.tsx` |
| F3-E-02 | sebagian | `/api/projects` (list & by id) disaring per tim untuk peran `proyek` dan `mekanik` | `services/api/src/teamScope.ts`, probe `team-scope-probe.ts` |
| F3-L-05 | selesai | Kop PDF dari setting `COMPANY_KOP` (JSON di Pengaturan); logo gambar belum | `pdf/documents/shared.ts`, `routes/pdf.ts` |
| F5-03 | selesai | 12 karyawan sintetis baru (total 20), TRIAL-002, `seedWarranties`, tahap Trial/Handover diisi saat seed | `data/index.ts`, `data/seeds.ts`, `services/api/src/seed.ts` |
| F0-04 | selesai | README quickstart | `README.md` |
| F1-03 | selesai | Vitest di kedua paket (`npm test`, masuk `check`) | `src/utils/__tests__/`, `services/api/src/__tests__/` |
| F6-03 | sebagian | Probe simetri ID/EN semua `n_*.ts` (masuk `check`); kunci mati belum dihapus | `apps/web/scripts/i18n-probe.ts` |
| F6-04 | selesai | `eslint --max-warnings` = 74 (web) / 29 (api) | `package.json` |

**Jebakan baru dari batch 2**
- Event realtime dipancarkan sebelum transaksi commit; ada jeda 400 ms di server + 500 ms di klien untuk menutupinya. Bila ada laporan "data tidak ikut berubah", periksa ini dulu.
- `teamScope` hanya menyaring koleksi `projects`. WBS/BoQ/WO proyek di luar tim masih bisa dibaca lewat endpoint masing-masing. Peran `subkon` dan `viewer` belum dibatasi karena akunnya belum tertaut ke karyawan/klien.
- Bila proyek hasil saringan kosong, store klien menolak tarikan kosong dan tetap menampilkan data seed lokal (bukan kebocoran server, tapi membingungkan saat demo).
- Kolom tabel `access_secrets` bernama `access_key` karena `key` kata tercadang di MySQL.
- Migrasi yang sudah diterapkan **tidak boleh diedit** lagi (S-07): API menolak start. Tambah migrasi baru.
- Halaman publik cuti tidak menerima lampiran (keputusan ADR-0017).

**Temuan yang perlu keputusan pemilik (tidak saya ubah)**
- Repo publik ini memuat identitas yang tampak nyata, bertentangan dengan AGENTS.md butir 9: kop perusahaan + alamat + telepon + nama direktur di `services/api/src/pdf/documents/shared.ts` dan `apps/web/src/utils/sb.ts`, nama perusahaan klien di `apps/web/src/data/index.ts` (komentar "RawData CONTOH INVOICE"), dan di model `scripts/pdf-probe.ts`. Menggantinya menyentuh probe kesetaraan KOP dan mirror seed; riwayat git tetap menyimpannya.

### Batch 1 (sudah di `main`, PR #56)

| Task | Status | Yang dikerjakan | File utama |
|---|---|---|---|
| F3-L-05 | sebagian | Jenis surat Kontrak Baru / Perpanjang Kontrak (nomor, mulai, selesai, `supersedes`, `prevContractNo`), PDF kontrak di `suratHr`, riwayat kontrak di detail karyawan, kontrak terakhir karyawan ikut diperbarui | `pages/sdm/HR.tsx`, `pages/sdm/KaryawanDetail.tsx`, `services/api/src/pdf/documents/hr.ts`, `pdf/registry.ts` |
| F3-L-03 | selesai | Skill dengan level % (slider + angka), tanggal asesmen, penilai; disimpan di `employees.skillLevels` (map nama → `{pct, at, by}`), `skills` tetap array nama | `KaryawanDetail.tsx` |
| F3-L-04 | selesai | Sertifikat: nomor, penerbit, tanggal terbit, berlaku hingga, berkas | `KaryawanDetail.tsx` |
| F3-B-03 | selesai | `KpiCard` prop `tone` (gradient biru/hijau/oranye/merah) + sub-label Selesai/Berjalan/Tertunda; Batal tidak lagi terhitung Berjalan | `components/ui.tsx`, `pages/proyek/Projects.tsx` |
| F3-B-04 | selesai | Filter proyek jadi panel chip beranimasi (status, tahap, tipe, prioritas, PM) | `Projects.tsx` |
| F3-B-08 | selesai | Milestone ringkasan horizon 30 hari (konstanta `MILE_VIEW_DAYS`, terpisah dari `ALERT_MILESTONE_DAYS`) | `ProjectDetail.tsx` |
| F3-B-10 | selesai | Gantt mini: sumbu nama bulan + garis hari ini | `ProjectDetail.tsx` |
| F3-B-11 | selesai | Tabel risiko disembunyikan di balik setting `SHOW_RISK_TABLE` (default 0); tab jadi "Change Order" | `ProjectDetail.tsx`, `i18n/n_prj.ts` |
| F3-B-12 | sebagian | Label "Commisioning & Trial" (ID) / "Commissioning & Trial" (EN) | `i18n/n_prj.ts` |
| F3-B-13 | selesai | Tab Tim: pilih lewat `SearchSelect`, nama menaut ke `/sdm/karyawan/:id`, kontak tampil | `ProjectDetail.tsx` |
| F3-F-01 | selesai | Batas dock `maxLoa`/`maxBeam`/`maxDraft` (modal "Area & batas"); server menolak 409 kecuali direktur/developer | `services/api/src/dockFit.ts`, `routes/crud.ts`, `pages/drydock/Drydock.tsx`, probe `scripts/dock-fit-probe.ts` |
| F3-F-03 | selesai | Waiting list menggantikan rencana tahunan: proyek aktif tanpa slot + perkiraan dock cocok + tombol Jadwalkan | `Drydock.tsx` |
| F3-F-05 | selesai | "Jadwalkan maintenance": tanggal mulai/selesai (`DateInput`), alasan paling bawah | `Drydock.tsx`, `i18n/n_dry.ts` |
| F3-G-01 | sebagian | Badge kategori berwarna, kolom Kelas & Bin dihapus, status hanya badge | `pages/inventori/Inventory.tsx` |
| F3-G-05 | selesai | Dua grafik tren (masuk/keluar, jumlah transaksi per bulan), kolom Dari/Ke, isi tab Analisis dipindah ke Pergerakan | `Inventory.tsx`, `i18n/n_recv.ts` |
| F3-G-06 | selesai | Surat jalan/TT/DO disembunyikan lewat setting `SHOW_SURAT_JALAN` (default 0) | `Inventory.tsx` |
| F3-G-07 | sebagian | Tombol Muat ulang dihapus; polling 30 detik untuk `inventory`, `movements`, `warehouses` | `Inventory.tsx` |
| F3-J-03 | selesai | Panel riwayat harga per item dari PO (tabel + tren kecil) di kartu RFQ; istilah tender/pemenang diganti "vendor terpilih" | `pages/procurement/Procurement.tsx`, `data/usePoActions.ts` (`itemPriceTrack`) |
| F3-K-04 | sebagian | Tampilan "HSE Pekerja" di tab Inspeksi Proyek: isi kuesioner HSE per karyawan, skor terakhir & rata-rata; `checklistResponses.employeeId` didaftarkan di `refs.ts` | `pages/qc/ChecklistTab.tsx`, `services/api/src/refs.ts` |
| F3-M-02 | sebagian | Tab Prediktif & Preskriptif dan sheet ekspornya dihapus dari UI | `pages/Analytics.tsx` |
| F3-A-03 | selesai | Komponen `<Pager>` bersama (info, ukuran, nomor halaman maks 5, responsif), default 25; simbol tombol yang rusak encoding diperbaiki | `components/ui.tsx`, `i18n/n_misc.ts` |

### Batch 3 (uji klik lokal, 11 Okt)

Diuji di browser dengan API + web lokal (DB sementara, token uji): daftar proyek, Drydock (waiting list, booking, jadwal maintenance), Inventori tab Pergerakan, detail karyawan (riwayat kontrak), cuti via QR dari ujung ke ujung, modal QR HR, RFQ, HSE pekerja, Absensi, Analitik, Subkontraktor, form kop surat, dan hasil cetak PDF BoQ / garansi / surat kontrak. Realtime terbukti: tulis lewat API memicu tarik ulang di tab.

Bug yang ditemukan dan diperbaiki:
- **Risiko otomatis terduplikasi** (sudah ada sebelum sesi ini): efek di `Projects.tsx`/`ProjectDetail.tsx` berjalan ulang saat sinkronisasi awal sehingga tiap risiko dibuat 7-8 kali (115 baris dari 32 unik, ±120 `activities`). Diperbaiki dengan `claimAutoRisk` di `utils/riskAuto.ts`. Pembersihan data lama: `npx tsx scripts/dedupe-risks.ts` (laporan) lalu `--apply` di `services/api`. **Belum dijalankan di server.**
- Stream `/api/events` tanpa header CORS (balasan di-hijack melewati hook `onSend`) - hanya terasa bila web dan API beda origin.
- PDF BoQ: baris tumpang tindih bila sel memuat `\n`; sekarang satu baris yang dibungkus otomatis.
- PDF surat kontrak: NIK/jabatan/unit kosong (nama field karyawan salah); judul diperjelas.
- Panel riwayat harga RFQ kosong di data demo; ditambah 5 PO historis sintetis.

Belum diuji klik: detail proyek (tab Change Order, Tim, Gantt), ingest alat absensi lewat UI, lingkup tim sebagai mekanik, mobile.

## 2. Yang BELUM diverifikasi (jangan diklaim selesai)

- **Tidak ada uji klik manual / screenshot** untuk batch ini. Yang lulus hanya typecheck, lint, probe, dan render SSR 28 halaman. AGENTS.md mewajibkan cek manual + screenshot untuk task UI — ini utang.
- PDF surat kontrak belum dibuka dan dilihat hasilnya.
- Branch belum di-review, belum di-merge, belum di-deploy.
- Gladi bersih alur demo di server live belum pernah dijalankan.

## 3. Sisa dari task "sebagian"

- F3-L-05: kop surat dari setting perusahaan (upload logo/nama/alamat di Pengaturan). Sekarang kop = konstanta `KOP` di `services/api/src/pdf/documents/shared.ts`.
- F3-B-12: cetak PDF kartu garansi (`kind` baru di `pdf/registry.ts`).
- F3-G-01: selector [Katalog | IN | OUT], Template Excel, Impor CSV dipindah ke sebelah tombol Scan; hapus teks "impor".
- F3-G-07: ganti polling dengan event realtime setelah F4-03.
- F3-K-04: pengisian mandiri via link/QR (bergantung mekanisme F3-L-06) dan rekap per subkon.
- F3-M-02: filter rentang bulan (`<input type="month">`); blok render & hitungan Prediktif/Preskriptif di `Analytics.tsx` sekarang kode mati (ada `void [fc, sc, rx]`) — hapus di F6-02.

## 4. Task yang masih `todo` (urutan saran)

1. P1 kecil dan terisolasi: F3-B-14 (verifikasi tab Subkon), F3-C-04 (PDF BoQ + entri dokumen), F3-M-04 (Keuangan tanggal & sort).
2. P1 yang butuh desain: F3-L-06 (cuti via QR — endpoint publik, PIN di-hash, rate limit; wajib ADR), F4-03 (realtime), F4-05 (upload terkontrol), F4-06 (kinerja frontend), F4-07.
3. P2: F3-L-08 (ingest alat absensi), F3-B-14.
4. Penutup: F0-04 (README), F1-03 (Vitest), F6-01..05 (knip, kode mati, kunci i18n tak terpakai, lint, pecah file raksasa).
5. Data demo: karyawan baru 8 dari target 20; belum ada proyek contoh tahap Trial/garansi.

## 5. Jebakan yang sudah pernah menggigit

- `npm run check` butuh DB sementara yang sudah dimigrasi dan di-seed:
  `SQLITE_PATH=/tmp/x.db JWT_SECRET=<acak ≥32 char> npm run migrate && npm run seed` di `services/api`, lalu `npm run check` di root dengan env yang sama. Jangan mengedit file selagi check berjalan.
- Mengubah `apps/web/src/data/seeds.ts` atau `data/index.ts` ⇒ wajib `TZ=UTC npm run seed:mirror` di `services/api` (tanpa `TZ=UTC` tanggal bergeser). ID seed harus unik per tabel.
- Runner migrasi memecah SQL pada `;` — jangan menaruh titik koma di komentar migrasi.
- Semua perubahan status yang punya aturan (BoQ, CO, service, PO, SPK, peminjaman, dock) dijaga server lewat fungsi guard yang dipanggil di `routes/crud.ts`. Aturan baru = guard baru + probe baru yang didaftarkan di skrip `check`.
- PATCH memakai compare-and-set (`409 STALE`); probe konkurensi ada di `scripts/concurrency-probe.ts`.
- `ProjectDetail.tsx`, `Inventory.tsx`, `HR.tsx`, `Finance.tsx` berukuran ribuan baris. Edit dengan penggantian string yang unik, lalu `npx tsc --noEmit` di `apps/web` (noUnusedLocals aktif — variabel sisa langsung jadi error).
- `apps/web/src/data/index.ts` masih memuat teks rusak encoding (`â†’`) di data seed. Memperbaikinya mengubah mirror seed; kerjakan sebagai task tersendiri.
- PR bertumpuk + squash merge menimbulkan konflik. Satu branch dari `main` terbaru per batch.
- Server memakai SQLite pilot; deploy lewat docker compose di server. Detail akses **tidak** ada di repo — minta ke pemilik proyek.

## 6. Prompt siap pakai untuk agent berikutnya

```
Kamu melanjutkan proyek ISMS Galangan (monorepo React 19 + Vite / Fastify 5, repo publik).

Sebelum mengubah apa pun, baca berurutan:
1. AGENTS.md (aturan wajib)
2. docs/handoff/HANDOFF-AI-2026-10-10.md (posisi terakhir, jebakan, sisa pekerjaan)
3. docs/handoff/STATUS.md (status tiap task)
4. CONTEXT.md dan DESIGN.md
5. Kartu task yang akan dikerjakan di docs/handoff/<fase>.md

Keadaan: main berisi semua P0. Branch feat/p1-batch-sdm-proyek-drydock-inventori
berisi batch P1 yang lulus `npm run check` tetapi BELUM diuji manual, BELUM di-merge,
BELUM di-deploy.

Tugasmu sekarang, berurutan:
A. Checkout branch itu, jalankan aplikasi (`npm run dev`), dan uji manual tiap task
   pada tabel bagian 1 handoff. Catat yang rusak, perbaiki, lampirkan screenshot.
B. Selesaikan butir "sebagian" di bagian 3 handoff, mulai dari yang paling kecil.
C. Lanjutkan task `todo` sesuai urutan saran di bagian 4.

Aturan yang tidak boleh dilanggar:
- Satu task ID per branch bila memungkinkan; nama branch <tipe>/<task-id>-<slug>.
- Semua teks UI di src/i18n/n_*.ts untuk ID dan EN. Tanpa `any` baru. Tanpa dependensi baru.
- Relasi baru → services/api/src/refs.ts. Koleksi baru → migrasi + COLLECTIONS/PREFIX di
  crud.ts DAN PREFIX di store.tsx. Keputusan arsitektural → ADR.
- Data sintetis saja. Jangan commit .env, services/api/seed-data/, docs/audit/, deploy/.env.
- Jangan memasukkan password/token ke mana pun; jangan menulis kredensial di repo.
- `npm run check` (root) harus exit 0 sebelum menyatakan selesai; laporkan kegagalan apa adanya.
- Perbarui baris task di docs/handoff/STATUS.md dan tutup dengan format ringkasan di AGENTS.md.
- Jangan merge, deploy, atau force-push tanpa persetujuan eksplisit pemilik proyek.
- Bila kartu task bertentangan dengan dokumen lain: berhenti dan tanyakan.

Mulai dengan melaporkan: branch aktif, hasil `git status`, dan rencana 3 langkah pertamamu.
```
