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



