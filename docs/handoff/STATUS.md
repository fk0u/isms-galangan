# STATUS — Papan Task

Perbarui baris saat mulai/selesai. Status: `todo` · `jalan` · `review` · `sebagian` · `selesai` · `terblokir` · `verifikasi saja`.

| Task | Judul | Prioritas | File | PIC | Status | Catatan |
|---|---|---|---|---|---|---|
| F0-01 | Repo git & remote | P0 | F0-setup.md | Kou | selesai | repo publik, commit awal |
| F0-02 | Generator data sintetis untuk seed bulk | P0 | F0-setup.md | agent | selesai | PR #2 |
| F0-03 | `.env` benar-benar dimuat | P0 | F0-setup.md | agent | selesai | PR #1 |
| F0-04 | README & quickstart | P1 | F0-setup.md | | selesai | README quickstart ditulis ulang tanpa password |
| F1-01 | Verifikasi revisi klien item per item | P0 | F1-verifikasi.md | | ditunda | diganti verifikasi per kartu (sprint plan) |
| F1-02 | ESLint minimal | P1 | F1-verifikasi.md | agent | selesai | PR #5 |
| F1-03 | Vitest untuk logika murni | P1 | F1-verifikasi.md | | selesai | vitest di web & api, masuk check |
| F1-04 | CI GitHub Actions | P0 | F1-verifikasi.md | | selesai | CI dibuat saat inisialisasi repo |
| F1-05 | Baseline security probe | P0 | F1-verifikasi.md | agent | selesai | PR #3 |
| F2-01 | Akun seed & demo login | P0 | F2-keamanan.md | agent | selesai | PR #6 |
| F2-02 | Konfigurasi default aman | P0 | F2-keamanan.md | agent | selesai | PR #7 |
| F2-03 | Hierarki peran di manajemen user | P0 | F2-keamanan.md | agent | selesai | PR #8 |
| F2-04 | Token bisa dicabut | P0 | F2-keamanan.md | agent | selesai | PR #9 |
| F2-05 | `policy.ts`: enum peran + izin baca/tulis | P0 | F2-keamanan.md | agent | selesai | PR #10 |
| F2-06 | Scope cabang di server | P0/P1 | F2-keamanan.md | agent | selesai | PR #11 |
| F2-07 | Login mengirim cabang & cache offline aman | P0 | F2-keamanan.md | agent | selesai | PR #12 |
| F2-08 | Audit trail wajib & terbatas | P1 | F2-keamanan.md | agent | selesai | PR #13 |
| F2-09 | Security probe jadi gate CI | P0 | F2-keamanan.md | agent | selesai | PR #23 merged (0d067ed); riwayat di-squash atas izin owner, GitGuardian + semua check hijau |
| F3-A-01 | Hapus filter cabang di top bar | P0 | F3-A-lintas-modul.md | agent | selesai | PR #15 |
| F3-A-02 | Format titik untuk semua input harga | P0 | F3-A-lintas-modul.md | agent | selesai | PR #16 |
| F3-A-03 | Pagination tabel diperbaiki | P1 | F3-A-lintas-modul.md | | selesai | komponen Pager bersama, default 25 |
| F3-A-04 | Komponen bersama untuk task berikutnya | P0 | F3-A-lintas-modul.md | agent | selesai | PR #14 |
| F3-B-01 | Banner notifikasi maks 3 | P1 | F3-B-proyek.md | agent | review | PR #34; branch feat/F3-B-01-alert-preview-3; P2 ekspansi >200 diperbaiki; probe alert 250 dan UI lulus; gate root berhenti di API probe keamanan (`no such table: projects`), area API tidak diubah |
| F3-B-02 | Tabel: nomor, tombol Detail, urutan terbaru | P0 | F3-B-proyek.md | agent | selesai | PR #17 |
| F3-B-03 | Card status gradient + label | P1 | F3-B-proyek.md | | selesai | PR batch P1 (10 Okt) |
| F3-B-04 | Filter jadi deret chip | P1 | F3-B-proyek.md | | selesai | PR batch P1 (10 Okt) |
| F3-B-05 | Form proyek baru | P0 | F3-B-proyek.md | agent | selesai | PR #18 |
| F3-B-06 | Rumus progres proyek | P0 | F3-B-proyek.md | agent | selesai | PR #19 |
| F3-B-07 | Header & card progres | P1 | F3-B-proyek.md | agent | review | branch `feat/F3-B-07-header-progress` |
| F3-B-08 | Ringkasan: Log Penawaran & Tagihan, milestone | P1 | F3-B-proyek.md | | selesai | PR batch P1 (10 Okt) |
| F3-B-09 | WBS: progres, material, histori, foto, assign | P0 | F3-B-proyek.md | agent | selesai | PR #20 |
| F3-B-10 | Gantt mini dengan label bulan | P2 | F3-B-proyek.md | | selesai | PR batch P1 (10 Okt) |
| F3-B-11 | Perubahan & Risiko: hapus tabel risiko | P1 | F3-B-proyek.md | | selesai | PR batch P1 (10 Okt) |
| F3-B-12 | Terkait: Trial & Garansi | P1 | F3-B-proyek.md | | selesai | label + cetak PDF kartu garansi (kind garansi) |
| F3-B-13 | Tab Tim terhubung SDM | P1 | F3-B-proyek.md | | selesai | PR batch P1 (10 Okt) |
| F3-B-14 | Verifikasi tab Subkon | P2 | F3-B-proyek.md | | selesai | terverifikasi; ditambah nilai WO + tautan ke modul Subkon |
| F3-C-01 | Migrasi & API boqDocs | P0 | F3-C-boq-change-order.md | agent | selesai | PR (lihat progress) |
| F3-C-02 | Migrasi data lama | P0 | F3-C-boq-change-order.md | agent | selesai | PR #22 merged ke main via squash commit `33816fc`; re-review PENGUJI dan semua checks lulus |
| F3-C-03 | UI list & detail surat BoQ | P0 | F3-C-boq-change-order.md | Claude | review | feat/F3-C-03-boq-ui-material-demo |
| F3-C-04 | PDF & dokumen | P1 | F3-C-boq-change-order.md | | selesai | PDF boq, arsip dokumen otomatis, tab Dokumen dikelompokkan per tipe |
| F3-C-05 | Change Order lewat owner & terhubung BoQ | P0 | F3-C-boq-change-order.md | Claude | review | feat/F3-C-05-change-order — keputusan owner & apply lewat endpoint; apply membuat revisi BoQ + memperbarui anggaran (`probe:change-order` 9/9) |
| F3-D-01 | Tambah sparepart dari inventori | P0 | F3-D-service-sparepart.md | Claude | review | feat/F3-C-03-boq-ui-material-demo |
| F3-D-02 | Service: dari WBS, teknisi, biaya BoQ, approval | P0 | F3-D-service-sparepart.md | Claude | review | feat/F3-D-02-service-approval-mr (`probe:service` 14/14, ADR-0015) |
| F3-D-03 | Probe alur material | P1 | F3-D-service-sparepart.md | Claude | review | feat/F3-C-03-boq-ui-material-demo (`probe:material` 10/10) |
| F3-E-01 | Feed update pekerjaan dengan foto | P0 | F3-E-monitoring.md | Claude | review | feat/F3-E-monitoring — feed WBS+WO dengan foto, filter proyek & tanggal |
| F3-E-02 | Tampilan per peran | P0 | F3-E-monitoring.md | Claude | sebagian | server menyaring /api/projects untuk peran proyek & mekanik (probe team-scope); subkon & viewer klien belum, koleksi turunan (wbs/boq) belum disaring |
| F3-E-03 | Label "Perhatian khusus" | P1 | F3-E-monitoring.md | Claude | review | feat/F3-E-monitoring — "Perhatian Khusus" kartu merah |
| F3-E-04 | Tombol Kembali ke asal | P0 | F3-E-monitoring.md | Claude | review | feat/F3-E-monitoring — Kembali ke Monitoring/Dashboard/Proyek, tahan refresh |
| F3-E-05 | Highlight menu aktif di sidebar | P1 | F3-E-monitoring.md | agent | review | Branch `feat/F3-E-05-sidebar-active`; root `npm run check` lulus; uji visual Dashboard, Monitoring, detail proyek, dan submenu Roles & Access |
| F3-F-01 | Batas maksimal kapal per dock | P1 | F3-F-drydock.md | | selesai | PR batch P1 (10 Okt) |
| F3-F-02 | Sederhanakan halaman: Mapping slot area | P0 | F3-F-drydock.md | agent | review | Branch `feat/F3-F-02-drydock-mapping`; P2 status search ID/EN dan P3 SSR EN diperbaiki lokal; `npm run check` 37/37; re-review independen lokal pending; PR #24 masih di e21f8fe, fix belum dipush/merge |
| F3-F-03 | Waiting list dock | P1 | F3-F-drydock.md | | selesai | waiting list = proyek aktif tanpa slot |
| F3-F-04 | Form booking slot | P0 | F3-F-drydock.md | agent | review | PR #29 OPEN; branch `feat/F3-F-04-drydock-booking-form`; pada head `d9a5ff2`, P1 rollover dan dua P2 sebelumnya tertutup (probe tanggal 21/21, checks 5/5). P2 reschedule baru diperbaiki: modal pindah memakai `DateInput` ISO tanpa batas 0–90; validasi tanggal/bentrok/kapasitas dipertahankan; probe menambah kasus sebelum hari ini dan >90. Root `npm run check` lulus pada SQLite sementara dimigrasi/seed dengan `JWT_SECRET` uji sementara; web production build lulus (warning chunk >500 kB dan warning lint yang sudah ada). Semua checks GitHub lulus 5/5 pada head kode `43f48b8`. Smoke test UI manual ID/EN belum dilakukan karena preview menolak host yang dicoba; `allowedHosts` tidak diubah dan tidak ada screenshot. Setelah head final dilaporkan, pemilik task akan meneruskan re-review read-only Benson via Group; jangan tetapkan reviewer resmi GitHub dan jangan merge ke `main` |
| F3-F-05 | Jadwalkan maintenance | P1 | F3-F-drydock.md | | selesai | PR batch P1 (10 Okt) |
| F3-G-01 | Katalog dirapikan | P1 | F3-G-inventori.md | | selesai | badge kategori, kolom Kelas/Bin dihapus, impor/template sebaris dengan Scan |
| F3-G-02 | Tambah material + konversi satuan | P0 | F3-G-inventori.md | agent | review | Branch `feat/F3-G-02-material-unit-conversion`; gate penuh dan preview UI lulus |
| F3-G-03 | Barang keluar: eceran & potongan | P0 | F3-G-inventori.md | Claude | review | feat/F3-G-inventori — eceran (kemasan terbuka/openBase) & potongan plat; server `POST /api/inventory/:id/issue` (probe 5/5), util `probe:stock-issue` 9/9; stok tampil "6 drum (1.150 L)" |
| F3-G-04 | BOM terima & keluar barang | P0 | F3-G-inventori.md | Claude | review | feat/F3-G-inventori — tab Terima & Keluar: checklist PO → receive transaksional, checklist permintaan proyek, Additional wajib alasan; retur tanpa vendor |
| F3-G-05 | Pergerakan: 2 grafik tren, kolom Dari/Ke, slow & dead stock | P1 | F3-G-inventori.md | | selesai | PR batch P1 (10 Okt) |
| F3-G-06 | Sembunyikan surat jalan | P2 | F3-G-inventori.md | | selesai | PR batch P1 (10 Okt) |
| F3-G-07 | Auto-refresh tanpa tombol Muat ulang | P1 | F3-G-inventori.md | | selesai | realtime SSE (F4-03) + polling 30 dtk sebagai cadangan |
| F3-H-01 | Form & tabel equipment | P0 | F3-H-equipment.md | agent | review | branch `feat/F3-H-01-equipment-form-table`; PR #33 tetap terbuka/tanpa merge; Cubic P2 ekspor umur pakai dan P3 comparator bersama ditangani; P3 notifikasi kini reset pencarian/filter lalu mengatur paginator setelah hasil filter baru; probe regresi lulus; `npm run check` lulus (DB sementara bermigrasi + seed sintetis); UI demo diperiksa |
| F3-H-02 | Tab & kartu ringkasan | P0 | F3-H-equipment.md | Claude | review | feat/F3-H-equipment — tab Daftar Equipment + Utilisasi; kartu Total · Sedang terpakai · Dalam maintenance |
| F3-H-03 | Delegasi peminjaman | P0 | F3-H-equipment.md | Claude | review | feat/F3-H-equipment — panel Delegasi (peminjaman → bookings, maintenance → maintenances), status turunan, server 409 bila bentrok (`probe:equipment-loan` 7/7) |
| F3-I-01 | Bersihkan modul | P1 | F3-I-subkon.md | Claude | selesai | evaluasi kinerja & rating dihapus dari UI, filter = StatusChips status |
| F3-I-02 | Work Order rinci | P0 | F3-I-subkon.md | Claude | review | feat/F3-I-subkon — tabel WO (No WO · Subkon · Kapal · Proyek · Pekerjaan · Nilai · Progres · Status), Nilai SPK & WBS di form |
| F3-I-03 | Update progres WO dengan foto & histori | P0 | F3-I-subkon.md | Claude | review | feat/F3-I-subkon — modal progres + foto + riwayat (progressLog), tampil di feed Monitoring |
| F3-I-04 | SPK terkunci kecuali procurement | P0 | F3-I-subkon.md | Claude | review | feat/F3-I-subkon — server menolak ubah field SPK selain procurement (`probe:wo-spk` 4/4) |
| F3-I-05 | Termin: tabel, skema, pajak | P0 | F3-I-subkon.md | Claude | review | feat/F3-I-subkon — skema Kontan/Persentase/DP → termin otomatis, Pajak pilihan %, kolom Proyek (`probe:termin` 8/8) |
| F3-J-01 | Material request sebagai penghubung | P0 | F3-J-procurement.md | Claude | review | koleksi `materialRequests` + tab Procurement "Permintaan Barang" + fulfill (`probe:material` 17/17) |
| F3-J-02 | PO terpenuhi sebagian & pengalihan vendor | P0 | F3-J-procurement.md | Claude | review | feat/F3-J-02-po-partial-rbac-demo — level PO (qty/receivedQty/cancelledQty/reassignedQty), `probe:po-partial` 13/13 |
| F3-J-03 | RFQ: perbandingan harga & track record, tanpa tender | P1 | F3-J-procurement.md | | selesai | PR batch P1 (10 Okt) |
| F3-J-04 | Approval service oleh procurement | P0 | F3-J-procurement.md | Claude | review | tab Procurement "Persetujuan Service" + `POST /api/services/:id/approval` (audit `service_approval`) |
| F3-K-01 | Hapus tab Drawing | P1 | F3-K-qc-safety.md | agent | review | Branch `feat/F3-K-01-hide-drawing-tab`; gate penuh + build web/API lulus; cek browser dilewati sesuai arahan; menunggu re-review independen Benson |
| F3-K-02 | Mesin kuesioner & skoring | P0 | F3-K-qc-safety.md | Claude | review | feat/F3-K-qc — koleksi checklistTemplates/checklistResponses (migrasi 015), skor dihitung server (`probe:checklist` 8/8), editor template |
| F3-K-03 | Inspeksi per proyek | P0 | F3-K-qc-safety.md | Claude | review | feat/F3-K-qc — tab Inspeksi Proyek: proyek → WBS → kuesioner → skor & riwayat; skor < ambang → tawaran NCR |
| F3-K-04 | HSE: kuesioner pekerja | P1 | F3-K-qc-safety.md | | sebagian | isi per pekerja oleh petugas; link/QR mandiri & rekap per subkon belum |
| F3-L-01 | Tabel karyawan & tab | P1 | F3-L-sdm-absensi.md | agent | jalan | |
| F3-L-02 | Data karyawan lengkap | P0 | F3-L-sdm-absensi.md | Claude | review | feat/F3-L-sdm — tipe, pendidikan, jenis kelamin, status kawin, tanggungan → PTKP otomatis (utils/ptkp.ts), kontrak, foto/KTP/ijazah; `probe:hr-rules` |
| F3-L-03 | Skill matriks dengan persentase | P1 | F3-L-sdm-absensi.md | | selesai | PR batch P1 (10 Okt) |
| F3-L-04 | Sertifikat lengkap | P1 | F3-L-sdm-absensi.md | | selesai | PR batch P1 (10 Okt) |
| F3-L-05 | Surat: kontrak, perpanjangan, SP, preview & kop | P0 | F3-L-sdm-absensi.md | | selesai | form kop surat di Pengaturan (setting COMPANY_KOP); logo gambar belum |
| F3-L-06 | Cuti/izin mandiri via QR | P1 | F3-L-sdm-absensi.md | | sebagian | QR + NIK tanpa PIN, pratinjau identitas, lampiran opsional, token QR ber-hash 90 hari (ADR-0019 menggantikan bagian cuti ADR-0017) |
| F3-L-07 | Absensi: rekap bulanan, tanpa shift, lembur otomatis | P0 | F3-L-sdm-absensi.md | Claude | review | feat/F3-L-sdm — rekap bulanan karyawan × tanggal (filter bulan & tahun), tanpa shift, lembur otomatis dengan batas harian/mingguan (utils/overtime.ts) |
| F3-L-08 | Integrasi alat absensi | P2 | F3-L-sdm-absensi.md | | selesai | ingest per alat (API key) + impor CSV; adaptor merk menunggu Q14 |
| F3-M-01 | Detail data kapal | P1 | F3-M-lainnya.md | agent | review | Branch feat/F3-M-01-detail-data-kapal; basis origin/main e984be5; PR #38; root check + build lulus; UI diverifikasi |
| F3-M-02 | Analitik: date picker, hapus prediktif & preskriptif | P1 | F3-M-lainnya.md | | selesai | tab & kode prediktif/preskriptif dihapus; rentang bulan dari-sampai (input month) |
| F3-M-03 | Dashboard: report perlu perhatian per kategori | P1 | F3-M-lainnya.md | agent | review | branch feat/F3-M-03-dashboard-attention-categories; `npm run check` hijau; review independen bersih |
| F3-M-04 | Keuangan: tanggal & sort (sisa F1/F2 lama) | P2 | F3-M-lainnya.md | | selesai | terverifikasi: semua tabel sudah SortTh; ditambah mode Rentang tanggal di filter periode (Kas & Bank, Buku Besar, Neraca, Laba Rugi) |
| F4-01 | Concurrency atomik | P0 | F4-integritas.md | Claude | review | feat/F4-F5-production-readiness — PATCH bersyarat (updated_at + data), 409 STALE dengan data terbaru (`probe:concurrency` 3/3); baseUpdatedAt wajib per koleksi belum |
| F4-02 | Transaksi untuk operasi multi-langkah | P0 | F4-integritas.md | agent | selesai | PR #4 |
| F4-03 | Realtime perubahan data | P1 | F4-integritas.md | | selesai | SSE /api/events + hook useRealtime; satu instans (lihat komentar ponytail) |
| F4-04 | Relasi baru di `refs.ts` | P0 | F4-integritas.md | Claude | review | relasi baru: services.boqRef, spareparts.inventoryItemId, requisitions.itemId/projectId, materialRequests.*, checklistResponses.*, changeOrders.boqDocId, bookings.equipId |
| F4-05 | File upload terkontrol | P1 | F4-integritas.md | | sebagian | KTP/ijazah hanya HR di GET /files (probe files-privacy); tabel metadata files belum |
| F4-06 | Kinerja frontend | P1 | F4-integritas.md | | sebagian | lazy per rute, chunk awal ~1 MB mentah (dari 3,1 MB); model-viewer sudah chunk terpisah; kompresi glb belum |
| [#104](https://github.com/fk0u/isms-galangan/issues/104) | Kurangi fetch data pada Procurement dan Finance | P1 | GitHub #104 | Cue (NAKHODA) | selesai | PR #105 merged; probe:fetch-performance lulus (pengurangan request 66,67% dan payload 99,99%); exact-name & listPaged terintegrasi; root check exit 0 |
| F4-07 | Lain-lain audit | P1 | F4-integritas.md | | sebagian | S-04 ipapi dihapus, S-07 migrasi gagal keras, S-08 seed admin mati di produksi; R-02 font & R-06 npm audit belum |
| F5-01 | Docker & deploy | P0 | F5-demo.md | agent | selesai | PR #25; pilot di isms.85-211-245-134.sslip.io (nginx host varian) |
| F5-02 | Backup & restore teruji | P0 | F5-demo.md | Claude | review | `probe:backup` (backup → restore ke DB kosong, 68 tabel identik), `deploy/backup-cron.sh` harian + retensi 14 hari, `docs/runbook/backup.md`; uji MySQL belum (pilot SQLite) |
| F5-03 | Data demo yang bercerita | P0 | F5-demo.md | Claude | selesai | 20 karyawan lengkap PTKP, proyek tahap Trial & Handover + garansi |
| F5-04 | Skenario demo per modul | P0 | F5-demo.md | Claude | review | `docs/demo/` 13 alur (langkah klik, data, hasil) + panel Demo di aplikasi; uji kering 2× oleh presenter belum |
| F5-05 | Audit ulang | P0 | F5-demo.md | Claude | review | `docs/log/audit-ulang.md` — security probe 0 VULN K/T; T20/T21/T26/T27 ditutup; Lighthouse belum |
| F6-01 | Deteksi kode mati dengan knip | P1 | F6-cleanup.md | PEMBERSIH | selesai | knip di apps/web (npm run knip); laporan 11 Okt: 1 file, 42 export, 19 tipe tak terpakai; api belum |
| F6-02 | Hapus file, export, dan dependensi tak terpakai | P1 | F6-cleanup.md | PEMBERSIH | sebagian | dihapus: services/index.ts + 7 seri data demo mati; export tak terpakai lain belum (banyak dipakai internal) |
| F6-03 | Kunci i18n yang tidak dipakai | P1 | F6-cleanup.md | PEMBERSIH | sebagian | probe simetri ID/EN masuk check; penghapusan kunci mati belum |
| F6-04 | Lint nol error, warning turun | P1 | F6-cleanup.md | PEMBERSIH | selesai | --max-warnings 74 (web) / 29 (api) |
| F6-05 | Pecah file raksasa yang disentuh sprint | P2 | F6-cleanup.md | PEMBERSIH | todo | |
| #67 #82 #93 | Guard server: hapus tahapan WBS, Project Manager, transfer gudang | P1 | GitHub issue | Claude | review | `services/api/src/domainGuards.ts` + `probe:domain-guards` (25 cek, termasuk #77 foto wajib saat progres berubah); #93 dijaga di pencatatan pergerakan, endpoint transfer atomik belum |
| #98 | Upload PDF sertifikat karyawan | P1 | GitHub issue | Claude | selesai | pemindai PDF menerima PDF hasil pindai/Word (/OpenAction, /AA); upload sertifikat karyawan terlindungi RBAC data pribadi HR (isPrivateFile); UI modal tervalidasi accept, aksi hapus lampiran, reset pembatalan; probe:files-privacy + vitest regresi |
| #99 #100 | Cuti mandiri: token QR ber-hash + kedaluwarsa, tanpa PIN, pratinjau NIK, dokumen pendukung | P1 | GitHub issue | Claude | review | ADR-0019; `probe:public-leave` 22 cek; QR tampil sekali saat dibuat |
| #101 | Riwayat & nomor kontrak otomatis di modal Buat Surat | P1 | GitHub issue | Claude | review | nomor diisi dari kontrak terakhir, berganti karyawan memuat ulang |
| #79 | Aktivitas Terkini dashboard tidak terpotong | P2 | GitHub issue | Claude | review | teks dibungkus, badge modul tidak menutupi isi |
| #90 | Monitoring: peran updater + feed tabel di bawah kartu tahapan | P1 | GitHub issue | Claude | review | peran dicap server dari token pada entri baru (WBS & WO); update lama tanpa label peran |
| #95 #111 | Posisi daftar stabil setelah edit; simpan progres WO menunggu upload foto | P1 | GitHub issue | Claude | selesai | urutan daftar dari server stabil menurut tanggal buat (repositories.ts); tie-breaker deterministik pada sortRows (ui.tsx); utilitas listPersistence (reconcile, findItemPage, preserveScroll); test regresi 2 pola daftar (#111) |
| #94 | PDF SPK: NPWP, alamat, nilai kontrak dari relasi yang benar | P1 | GitHub issue | Claude | review | subkon dicari lewat nama di WO; nilai hanya dari WO (kosong = "Belum ditetapkan"); isian NPWP & alamat di registrasi dan tombol profil subkon |
| #91 | Drydock: batas dimensi dock tervalidasi dan bisa dihapus dengan konfirmasi | P1 | GitHub issue | Claude | review | server menolak nilai negatif (422) dan penghapusan batas selama dock punya booking selain MAINT, termasuk slot lama (409); tombol "Hapus batas dimensi" + konfirmasi |
| #80 | Dashboard: Lengkapi konten dan tata letak ekspor PDF | P1 | GitHub #80 | agent | selesai | Konten ekspor PDF mencakup target vs aktual cabang, metrik KPI portofolio, ringkasan operasional terpadu (stok, sea trial, CRM, AR outstanding), tabel status proyek aktif dengan baris total, serta chart dan analisa risiko; layout landscape multi-halaman rapi dengan nomor halaman konsisten; probe & vitest passing |
| CTO-14Okt-BOM | BOM per proyek + barang masuk/keluar additional lewat server | P0 | catatan CTO 14 Okt | Claude | review | ADR-0020; koleksi `bomItems` (migrasi 018); `POST /api/inventory/:id/additional`; `probe:domain-guards` 45 cek |
| CTO-15Okt-DOCK | Drydock & Kapasitas jadi pencatatan saja (tarif disembunyikan) | P1 | catatan CTO 15 Okt | Claude | review | saklar `SHOW_DOCK_BILLING` (default 0): sembunyikan konsumsi tercatat s.d. docking report, tombol invoice slot, tarif/hari & estimasi biaya di form booking, kolom biaya di ekspor; data tarif lama tetap tersimpan |
| CTO-15Okt-DOC-INV | Klik notifikasi Dokumen tidak berbuat apa-apa; hapus teks rumus ABC di Katalog | P1 | catatan CTO 15 Okt | Claude | review | tampilan bawaan Dokumen = pohon, tabel `hidden` sehingga scroll ke baris diabaikan; klik notifikasi kini pindah ke Tabel lalu scroll + kedip. Teks rumus ABC di tab Katalog dihapus |
| CTO-15Okt-AUDIT | Audit Trail: aktor = username, waktu lengkap tanggal + jam | P1 | catatan CTO 15 Okt | Claude | review | jejak baru menyimpan username sesi + `createdAt` ISO; kolom Waktu/Dibuat/Diubah tampil "15 Okt 2026, 08.50.58 WITA"; jejak lama "Anda" ditampilkan sebagai username akun aktif (store aktivitas per akun); hint saklar Drydock di Pengaturan dibetulkan |
| CTO-17Okt | Catatan klien 17 Okt: 37 issue + dokumen rencana; pasang RUAS | P1 | `docs/planning/catatan-klien-17-oktober.md` | Claude | selesai | issue #164–#200 berlabel `catatan-17okt` (fase 1–3, 8 butir perlu konfirmasi klien); RUAS 1.4.0 via npx dipin + `.mcp.json` (ADR-0021) |
| K17-PM-02 | Label Project Manager → Pimpinan Proyek (#165) | P1 | catatan klien 17 Okt | Antigravity + Claude | selesai | PR #202: form proyek baru & detail proyek. Susulan: kolom & filter daftar proyek, form serah terima CRM → proyek (ID: Pimpinan Proyek, EN: Project Lead). Aturan server jabatan PM (`isProjectManagerTitle`) tidak diubah |
| K17-PM-04 | "Riwayat Perubahan Server" → "Riwayat Progress" (#167) | P1 | catatan klien 17 Okt | Claude | selesai | judul + teks muat/galat/offline riwayat tahapan WBS (ID + EN) |
| K17-PM-06 | Urutan tab detail proyek: BoQ sebelum WBS (#169) | P1 | catatan klien 17 Okt | Claude | selesai | Ringkasan → BoQ → WBS & Anggaran → …; kunci tab tidak berubah sehingga deep link `?tab=` lama tetap berfungsi |
| K17-PM-09 | Form "Tahap Awal" → "Progress" (#172) | P1 | catatan klien 17 Okt | Claude | selesai | label field tahap di form Proyek Baru (ID + EN). Label tahap pipeline penawaran di CRM sengaja tidak diubah (bukan form proyek) |
| K17-PM-11 | Hapus field Prioritas dari form proyek baru (#174) | P1 | catatan klien 17 Okt | Claude | selesai | field dihapus dari form; proyek baru tetap disimpan prioritas "Sedang" karena daftar proyek, Monitoring, dan detail masih memakai prioritas (bisa diubah di detail) |
| K17-PROC-03 | PO Besar: hapus field Spesifikasi (#183) | P1 | catatan klien 17 Okt | Claude | selesai | input Spesifikasi dihapus dari baris item PO Besar (tak lagi diisi otomatis dari katalog); kolom dibagi ulang (nama 5, jumlah 2, satuan 2, harga 2). Spesifikasi di PO lama tetap tampil di daftar |
| K17-FIN-04 | Tipe Billing: DP 1–5 + Pelunasan (#189) | P1 | catatan klien 17 Okt | Claude | selesai | form invoice baru hanya DP 1–5/Pelunasan; DP = uang muka (tanpa retensi, tandai proyek ber-DP, nomor INV/DP-SMD), Pelunasan = invoice akhir (retensi + potong DP, nomor INV/PL-SMD). Tipe lama tetap dikenali di filter/daftar & invoice otomatis (BAST, retensi) |
| K17-FIN-05 | Hapus field NSFP (#190) | P1 | catatan klien 17 Okt | Claude | selesai | input NSFP dihapus dari form invoice baru & form edit; NSFP invoice lama tetap tampil di daftar, detail, ekspor CSV e-Faktur dan tetap terjaga saat invoice diedit |
| K17-UMUM-01 | Toast jelas saat token login kedaluwarsa (#199) | P1 | catatan klien 17 Okt | Claude | selesai | 401 paralel kini satu toast "Sesi berakhir" (sebelumnya satu per request + toast kedua dari sinkronisasi); 401 tanpa token tidak lagi dianggap sesi berakhir; 403 saat sinkronisasi diberi pesan "Akses ditolak…" sendiri (ID + EN). Unit test `authExpired.test.ts` |
| K17-KPL-01 | Penyesuaian form pendaftaran kapal (#198) | P1 | catatan klien 17 Okt | Claude | selesai | form tambah/edit kapal: Nama, Tipe, Owner, Class (BKI/RINA), LOA, LBP (baru), Breadth, Depth (baru), Draft. IMO/MMSI/tahun bangun/mesin/GT ("OT")/DWT/NT/BHP ("DHP")/bendera/status tidak lagi diisi; nilai lama tetap tersimpan (edit = patch field form). `draft` tetap Draft (dipakai cek kapasitas Drydock); Depth & LBP field baru, opsional. Form proyek baru tidak lagi meminta IMO kapal baru |
| K17-FIN-06 | Buku Besar: total debit/kredit, status seimbang, pencarian (#191) | P1 | catatan klien 17 Okt | Claude | selesai | kartu Total Debit, Total Kredit (nominal penuh) & Status Keseimbangan (+selisih); satu kotak cari di atas menyaring akun, mutasi live, dan voucher; baris Total di tabel mutasi live |
| K17-FIN-07 | Laba Rugi: grafik detail (#192) | P1 | catatan klien 17 Okt | Claude | selesai | grafik tren bulanan (batang pendapatan/beban proyek/gaji + garis laba, juta Rp, ikut filter periode) dan kartu komposisi periode berjalan (porsi beban & laba terhadap pendapatan + margin laba bersih) |
| K17-HR-02 | Cuti sakit tidak mengurangi saldo cuti tahunan (#195) | P1 | catatan klien 17 Okt | Claude | selesai | perilaku sudah benar di kode (hanya Tahunan yang Disetujui memotong saldo; cek saldo kurang hanya untuk Tahunan; form QR menyimpan jenis apa adanya). Dikunci dengan helper `utils/leaveBalance.ts` + unit test, dan hint jenis cuti di form ("Tidak memotong saldo cuti tahunan") |
| K17-FIN-03 | Nama PT dan nama kapal di seluruh invoice (#188) | P1 | catatan klien 17 Okt | Claude | selesai | invoice baru (manual, BAST, Drydock) menyimpan `vessel` dari proyek; detail invoice menampilkan baris Kapal (fallback ke proyek); PDF invoice selalu memuat baris Kapal, invoice lama tanpa `vessel` mengambil kapal dari proyeknya. Nama PT: kop PT Syukur Bersaudara + nama PT klien (Kepada) sudah ada |
| K17-FIN-01 | Tab Pajak: input nominal pajak manual (#186) | P1 | catatan klien 17 Okt | Claude | selesai | kartu "Nominal Pajak Manual" per periode (PPN Keluaran/Masukan, PPh 23, PPh 21; kosong = otomatis, angka otomatis tampil sebagai pembanding, terkunci saat Lapor). Nilai efektif dipakai di kartu (+label Manual), dialog Lapor, snapshot kunci, dan hutang pajak. Perbaikan ikutan: hutang PPN saat kunci kini memakai override PPN terutang |
| K17-SUB-01 | Pajak subkon perorangan: input nominal manual (#197) | P1 | catatan klien 17 Okt | Claude | selesai | opsi "Nominal manual (subkon perorangan)" di Ajukan Termin → isian PPh (Rp); disimpan `pphManual` dan dipakai di rincian estimasi, tabel termin, pelunasan (pphAmt, hutang neto, catatan), petunjuk bukti potong, dan kwitansi PDF ("nominal manual"). Termin lama tetap memakai tarif % |
| K17-HR-01 | QR cuti/izin berlaku 1 tahun (#194) | P1 | catatan klien 17 Okt | Claude | selesai | `QR_TTL_MS` 90 → 365 hari; ADR-0019 diamandemen (risiko & mitigasi); probe public-leave menguji masa berlaku 1 tahun (23/23). QR lama tetap pakai kedaluwarsa lamanya — HR perlu membuat QR baru sekali |
| K17-PM-13 | Impor Excel Ruang Lingkup Pekerjaan (#176) | P1 | catatan klien 17 Okt | Claude | selesai | tombol Template + Impor Excel (.xlsx/.csv) di tab Ringkasan; kolom Jenis pekerjaan · Lokasi · Deskripsi; baris judul dilewati, baris tanpa jenis pekerjaan dilaporkan nomornya. Pembaca .xlsx tanpa dependensi baru: `utils/readSheet.ts` (DecompressionStream bawaan) + unit test terhadap .xlsx asli |
| K17-PM-05 | Impor Excel daftar BoQ di detail proyek (#168) | P1 | catatan klien 17 Okt | Claude | selesai | Template + Impor Excel (.xlsx/.csv) di surat BoQ yang belum terkunci; kolom Nama · Deskripsi · Volume · Satuan · Harga satuan · Kategori; satuan & kategori dicocokkan ke daftar baku (alias m2/ls/lot), baris bermasalah dilaporkan dengan alasan; memakai `utils/readSheet.ts` |
| K17-INV-01 | Satuan pembelian sak 25 kg & sak 40 kg (#179) | P1 | catatan klien 17 Okt | Claude | selesai | satuan "sak 25 kg"/"sak 40 kg" di form material; konversi ke kg otomatis dari nama satuan; server menolak konversi sak yang tidak sesuai |
| K17-INV-02 | Konversi satuan pengeluaran material (#180) | P1 | catatan klien 17 Okt | Claude | selesai | pengeluaran per satuan dasar (buka kemasan + sisa terbuka) sudah ada (F3-G-03, divalidasi server). Ditambah: sak N kg → kg otomatis, roll → meter & drum → liter sebagai satuan dasar bawaan bila dikosongkan; probe web + api diperluas |
| K17-PM-12 | Pimpinan Proyek mengisi rencana docking di tab WBS (#175) | P1 | catatan klien 17 Okt | Claude | selesai | kartu "Rencana Docking" di awal tab WBS: lokasi docking (drydock), rencana mulai, estimasi selesai; bisa diubah akun dengan izin tulis projects (server menegakkan; plannedDockId divalidasi refs.ts), read-only untuk lainnya; validasi selesai ≥ mulai; tercatat di log |
| K17-PM-08 | Penugasan SDM/subkon di WBS tampil otomatis di tab Tim (#171) | P1 | catatan klien 17 Okt | Claude | selesai | penugasan karyawan di tahapan WBS otomatis menambahkannya ke team_by_project (akses tim ikut); kartu anggota menampilkan tahapan WBS-nya; penugasan lama yang belum tercatat di tim tampil berlabel "Dari penugasan WBS"; bagian Subkontraktor (dari penugasan WBS) dengan tahapan & WO |
| K17-PM-07 | Equipment digabung ke tab WBS (#170) | P1 | catatan klien 17 Okt | Claude | selesai | tab Equipment detail proyek dihapus (`?tab=Equipment` → WBS); bagian Equipment di bawah WBS memuat semua booking proyek dengan kolom Tahap WBS (pilih langsung bila berizin ubah booking), urut per tahapan; form booking di modul Equipment punya isian Tahap WBS (opsional) → `bookings.wbsTask` |
