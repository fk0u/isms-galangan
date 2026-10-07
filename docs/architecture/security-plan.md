# 04 — Rencana Perbaikan Keamanan

Sumber temuan: `audit/audit-final-project-galangan.pdf` (baseline `96b65fd`; tidak ada perubahan backend sampai `805e636`, jadi semua masih berlaku).
Setiap perbaikan wajib disertai kasus di security probe yang sebelumnya VULN lalu menjadi OK.

## Urutan kerja (Fase 2)

| # | ID | Tugas | File utama | HK |
|---|---|---|---|---|
| 1 | K-01 | Seed sintetis, hapus data riil (di Fase 0) | `seed-data/`, `seedFeMirror.ts` | 1 |
| 2 | K-05 | Akun seed: password acak saat seed / wajib ganti; hapus `demoUsers` dari build bila `VITE_API_URL` terisi; blokir seed login kecuali `ALLOW_SEED_LOGIN=true` | `auth.ts`, `app.ts`, `web/auth/auth.tsx` | 1 |
| 3 | T-06 | Default aman: `NODE_ENV` wajib, `WEB_ORIGINS` wajib, `JWT_SECRET` ≥ 32 & ≠ contoh, `SETUP_TOKEN` ≥ 32 | `env.ts`, `app.ts` | 0,5 |
| 4 | K-04 | Hierarki peran; larang ubah peran sendiri; larang buat/ubah ke peran ≥ pelaku; reset password akun lebih tinggi ditolak | `routes/users.ts` | 1,5 |
| 5 | T-01 | Kolom `token_version` (migrasi 008); claim `v` di JWT; cek di `requireAuth` (cache 30 dtk); naikkan saat logout/nonaktif/ubah peran/reset password; cek `is_active` | `auth.ts`, `app.ts`, `users.ts` | 2–3 |
| 6 | T-04 + K-03 | `policy.ts`: enum peran + matriks read/write/delete; migrasi peran lama → enum; GET list/id pakai izin read; `/api/audit` hanya auditor/direksi; frontend baca matriks dari `/api/auth/me` | `rbac.ts`→`policy.ts`, `crud.ts`, `audit.ts`, web | 4–5 |
| 7 | K-02 | `req.scope.branches`; helper `scopedWhere()` di list/get/patch/delete; create/patch tolak cabang di luar scope; WBS/team/PDF/file mewarisi cabang proyek; fail-closed; daftar koleksi global | `crud.ts`, `wbs.ts`, `pdf.ts`, `files.ts`, `app.ts` | 4–5 |
| 8 | K-02 data | Skrip backfill cabang untuk ±72% baris kosong (aturan: ikut proyek/karyawan induk; sisanya karantina + laporan) | `scripts/backfill-branch.ts` | 1–2 |
| 9 | T-03 | Login mengembalikan `branch`; sesi FE terisi benar | `app.ts`, `auth.tsx` | 0,5 |
| 10 | T-02 | Hapus IndexedDB/localStorage saat logout & 401; cache dikunci per user id; tanpa fallback demo bila backend dikonfigurasi | `auth.tsx`, `store.tsx`, `idb.ts` | 1–2 |
| 11 | T-05 | Audit wajib (transaksi) untuk koleksi sensitif; `activities` append-only + actor dari token; audit WBS/team/upload | `audit.ts`, `crud.ts`, `wbs.ts`, `files.ts` | 2 |
| 12 | T-07 | `--env-file`, CI, Dockerfile (sebagian di Fase 0/5) | `package.json`, `.github/` | 1 |

## Tingkat Sedang/Rendah (Fase 4)
| ID | Tugas |
|---|---|
| S-01 | UPDATE atomik + `baseUpdatedAt` wajib untuk koleksi keuangan |
| S-02 | bcrypt dummy saat user tidak ada; lookup NIK via kolom terindeks |
| S-03 | Izin upload per peran; metadata pemilik/cabang/entitas; audit upload |
| S-04 | Ganti ipapi.co dengan IP dari backend |
| S-05 | Header keamanan; Expose-Headers di respons aktual; `/health` publik minimal |
| S-07 | Migrasi gagal keras bila checksum berubah |
| S-08 | `/api/admin/seed` mati di production |
| S-09 | 404/422 dibedakan dari 500; pesan generik |
| R-01…R-06 | Lihat roadmap Fase 4 |

## Security probe di CI
1. Port `docs/audit/probe.py` ke `services/api/scripts/security-probe.ts` (menjalankan app via `buildApp()` + `inject`, tanpa port).
2. Masuk `npm run check` API.
3. Setiap kasus menyatakan ekspektasi aman; CI gagal bila ada yang VULN.
