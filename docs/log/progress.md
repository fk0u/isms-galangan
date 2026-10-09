# Progress Log

Waktu (WITA) | Task | Status | PR | Catatan
---|---|---|---|---
2026-10-07 19:35 WITA | F0-03 | selesai | PR #1 | load .env via Node --env-file=.env, engines node >= 22
2026-10-07 19:55 WITA | F0-02 | selesai | PR #2 | generator data sintetis seed-data-synthetic, bersihkan data riil di seed
2026-10-07 20:07 WITA | F1-05 | selesai | PR #3 | port baseline security probe ke TS app.inject (35 skenario)
2026-10-07 20:35 WITA | F4-02 | selesai | PR #4 | helper transaksi withTx(fn) atomik sqlite/mysql + savepoints + probe:tx
2026-10-07 20:55 WITA | F1-02 | selesai | PR #5 | setup flat config ESLint minimal, rules-of-hooks error, 0 errors
2026-10-07 21:25 WITA | F2-01 | selesai | PR #6 | amankan akun seed, blokir login demo default, sembunyikan di bundle web
2026-10-07 21:45 WITA | F2-02 | selesai | PR #7 | konfigurasi default aman JWT secret setup token dan CORS, probe T24 T25 OK
2026-10-07 21:55 WITA | F2-03 | selesai | PR #8 | hierarki ROLE_RANK, cegah eskalasi peran & takeover, probe T12-T15 OK
2026-10-07 22:10 WITA | F2-04 | selesai | PR #9 | migrasi 008 token_version, pencabutan token di logout/patch/delete/password, probe T16-T18 OK
2026-10-07 22:40 WITA | F2-05 | selesai | PR #10 | policy.ts matriks izin r/w/d, proteksi GET CRUD, permissions di auth/me & login, skrip migrasi peran
2026-10-07 22:50 WITA | F2-06 | selesai | PR #11 | migrasi 013 backfill Samarinda, paksa default branch di create, proteksi patch branch di crud.ts, probe:branch 9/9 PASS, T06 OK
2026-10-07 23:05 WITA | F2-07 | selesai | PR #12 | respons login branch, purgeOfflineCache idb & localStorage, konfirmasi dirty queue, isolasi per ownerUserId, probe T01 OK
2026-10-08 20:50 WITA | F3-A-04 | selesai | PR #14 | 6 komponen bersama (SearchSelect, DateInput, TimeInput24, PhotoUploader, ChangeHistory, StatusChips) + probe SSR + fix CI fresh seed branch Samarinda
2026-10-08 20:58 WITA | F2-08 | selesai | PR #13 | audit trail wajib & terbatas (tabel audit_log, proteksi penulisan dan pembatasan akses audit)
2026-10-08 21:05 WITA | F3-A-01 | selesai | PR #15 | hapus filter cabang di top bar, cabang dikendalikan oleh sesi user, hapus BRANCH_KEY dari storage
2026-10-08 21:32 WITA | F3-A-02 | selesai | PR #16 | format titik untuk semua input harga di 12 file, parseRupiah, probe:money 15/15 PASS
2026-10-08 21:40 WITA | F3-B-02 | selesai | PR #17 | tabel proyek: nomor urut (page-1)*size+i+1, tombol Detail di kolom aksi, default sort createdAt desc, probe:table pass
2026-10-08 21:55 WITA | F3-B-05 | selesai | PR #18 | form proyek baru: plannedDockId SearchSelect drydocks, SearchSelect kapal/klien/PM, status otomatis Dalam Proses, cabang otomatis dari sesi, probe:project-add pass
2026-10-08 22:12 WITA | F3-B-06 | selesai | PR #19 | rumus progres proyek berbobot (ADR-0011): calcProjectProgress & projectProgressOf di utils/projectProgress.ts, konsisten di Projects/ProjectDetail/Monitoring/Dashboard/Analytics, probe:progress pass
2026-10-08 22:56 WITA | F3-B-09 | selesai | PR #20 | WBS: modal update progres material SearchSelect & alur F3-D stok/PR, integrasi ChangeHistory per task, assign internal & eksternal otomatis buat WO, probe:wbs pass

2026-10-09 07:17 WITA | F3-C-01 | selesai | PR boqDocs | koleksi boqDocs + migrasi 009, POST /api/boqDocs/:id/status & /revise (withTx), kunci item surat Disetujui/Digantikan 409, unik nomor+revisi, refs & policy & store PREFIX BQD, probe:boq 13/13
2026-10-09 07:45 WITA | F3-C-02 | terblokir | belum ada | migrasi boqDocs idempoten (--dry-run/--apply, transaksional), validasi relasi proyek/surat, seed 4 surat/3 proyek/Rev 1; uji salinan DB 6/6 tertaut, npm run check exit 0; commit lokal 55baa30; push/PR menunggu otorisasi GitHub, merge oleh OWNER
2026-10-09 08:12 WITA | F3-C-02 | review | PR #22 | update setelah perbaikan review: legacyTotal menolak qty/unitPrice hilang, kosong, nonnumerik, atau overflow; probe memastikan dry-run dan apply tidak membuat surat/tautan parsial; commit 6554095; npm run check exit 0; menunggu re-review PENGUJI dan hasil GitHub checks
2026-10-09 08:12 WITA | F3-C-02 | review | PR #22 | Benson menyetujui fix fail-closed commit 6554095; tidak ada blocker kode baru; api dan GitGuardian lulus, web dan reviewer otomatis masih berjalan; menunggu semua checks dan keputusan merge OWNER
