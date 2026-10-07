# ADR-0002: Pertahankan arsitektur; tidak rewrite

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Basis kode ±88 ribu baris TS, 28 halaman, probe hijau. Masalah utama ada di lapisan otorisasi, bukan desain umum.

## Opsi
1. Rewrite (mis. Next.js + Postgres + ORM).
2. **Perbaiki bertahap di atas arsitektur sekarang.**

## Keputusan
Opsi 2. Model `(id, branch, data JSON, updated_at)` dipertahankan untuk prototype; kolom nyata + FK hanya bila modul butuh query berat.

## Konsekuensi
Cepat menuju demo. Integritas relasional tetap di kode (`refs.ts`), harus disiplin. Rewrite dievaluasi ulang setelah pilot.
