# 02 — Arsitektur Target

## Sekarang
```
apps/web (React 19 + Vite SPA)
  ├─ store.tsx: state global + cache IndexedDB + antrean offline
  └─ HTTP → services/api (Fastify 5)
               ├─ CRUD generik 57 koleksi (id, branch, data JSON, updated_at)
               ├─ users / auth (JWT 8 jam) / audit / files / pdf / ocr / wbs
               └─ SQLite (lokal) | MySQL (server)
```

## Target prototype — prinsip
Pertahankan arsitektur (tidak rewrite). Perubahan dipusatkan di beberapa titik:

| Area | Sekarang | Target |
|---|---|---|
| Otorisasi | `requireAuth` + regex peran untuk tulis saja | Satu modul `policy.ts`: enum peran × koleksi × {read, write, delete} + scope cabang. Dipakai backend; frontend membaca matriks yang sama via `/api/auth/me` |
| Sesi | JWT 8 jam, tidak bisa dicabut | JWT + `token_version` di tabel users, dicek per request (cache 30 dtk). Logout/nonaktif/ubah peran menaikkan versi |
| Scope cabang | Claim ada, tidak dipakai | `preHandler` membentuk `req.scope`; semua query CRUD/WBS/PDF/file wajib lewat helper `scopedWhere()`. Koleksi global (coa, settings, branches) didaftar eksplisit |
| Audit | Best-effort, terbuka | Ditulis dalam transaksi yang sama untuk koleksi sensitif; baca hanya peran auditor/direksi; `activities` append-only |
| Concurrency | `baseUpdatedAt` opsional, cek-lalu-update | `UPDATE … WHERE id=? AND updated_at=?` + cek affected rows; wajib untuk keuangan/payroll |
| Relasi | `refs.ts` di kode | Tetap `refs.ts` (prototype), ditambah relasi baru dari commit terbaru (material→inventory, sparepart→PO, service→BoQ, garansi→WBS) |
| Konfigurasi | `.env` tidak terbaca, default fail-open | `node --env-file`, default aman, validasi panjang secret |
| Deploy | Tidak ada | `docker-compose` (api + mysql + web statis via nginx) + runbook |
| Cache offline | Tidak dibersihkan, fallback login demo | Dibersihkan saat logout, dikunci per user, tanpa fallback demo saat backend dikonfigurasi |

## Keputusan teknis (lihat ADR di `docs/architecture/adr/`)
- **Tetap model JSON generik** untuk prototype. Kolom nyata + FK hanya bila suatu modul butuh query berat (kandidat: `movements`, `journals`).
- **Tidak menambah framework baru** di frontend. Yang ditambah: ESLint + Vitest (dev only).
- **Skema peran** disimpan sebagai enum di kode + migrasi data peran lama.
- **Uji keamanan** = `probe.py` dipindah jadi test Node (`services/api/scripts/security-probe.ts`) agar ikut `npm run check`.
