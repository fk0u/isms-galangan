# AGENTS.md — Aturan untuk AI agent (Antigravity, Claude Code, dll)

Baca file ini **sebelum** mengerjakan task apa pun di repo ini.

## Proyek
ISMS (Integrated Shipyard Management System) untuk galangan kapal tugboat.
Monorepo:
- `apps/web` — React 19 + Vite + TypeScript + Tailwind. State global di `src/data/store.tsx`, komponen bersama di `src/components/ui.tsx`, teks UI di `src/i18n/n_*.ts` (ID + EN).
- `services/api` — Fastify 5 + TypeScript. CRUD generik 57 koleksi di `src/routes/crud.ts`, tabel `(id, branch, data JSON, updated_at)`. SQLite lokal / MySQL server.

## Baca dulu (urutan)
1. `CONTEXT.md` — domain galangan, peran, alur bisnis, glosarium.
2. `DESIGN.md` — token, komponen, pola halaman. UI baru wajib mengikuti ini.
3. Kartu task yang diberikan (`docs/handoff/<fase>.md`).

## Sumber kebenaran
1. Task yang sedang dikerjakan: `docs/handoff/<fase>.md` → kartu task dengan ID (mis. `F3-B-04`).
2. Kebutuhan klien: `docs/product/requirements-2026-10.md`.
3. Rencana keamanan: `docs/architecture/security-plan.md`.
4. Arsitektur & keputusan: `docs/architecture/overview.md`, ADR di `docs/architecture/adr/`, log keputusan `docs/planning/decisions.md`.
5. Semua pertanyaan produk sudah diputuskan (7 Okt 2026) — jangan menunda task dengan alasan "menunggu klien"; ikuti keputusan di `decisions.md`.
Bila task bertentangan dengan dokumen lain, **berhenti dan tanyakan**; jangan menebak.

## Aturan kerja
1. Kerjakan **satu task ID per sesi/branch**. Nama branch: `<tipe>/<task-id>-<slug>` (mis. `feat/F3-B-04-card-gradient`).
2. Baca semua file yang tercantum di bagian "File" kartu task sebelum mengubah apa pun.
3. Jangan mengubah file di luar cakupan task kecuali wajib; sebutkan alasannya di ringkasan.
4. Setiap teks UI baru wajib di `src/i18n/n_*.ts` untuk **ID dan EN**. Jangan hardcode string.
5. Ikuti gaya kode yang ada: TypeScript strict, tanpa `any` baru, komentar menjelaskan *alasan* (bahasa Indonesia).
6. Jangan menambah dependensi npm tanpa disebut di kartu task.
7. Relasi baru antar-koleksi wajib didaftarkan di `services/api/src/refs.ts`.
8. Koleksi baru: migrasi SQL baru di `services/api/migrations/NNN_*.sql` + daftar di `COLLECTIONS`/`PREFIX` (`crud.ts`) **dan** `PREFIX` di `apps/web/src/data/store.tsx` (harus sama).
9. Jangan pernah menulis data riil (rekening, NPWP, nama orang/perusahaan nyata) ke kode atau seed. Pakai data sintetis.
10. Jangan pernah commit `.env`, `services/api/seed-data/`, `docs/audit/`. Repo ini **publik**.
11. Keputusan arsitektural baru (skema, library, pola lintas modul) → tulis ADR dari `docs/architecture/adr/template.md` dalam PR yang sama.
12. Setelah selesai, perbarui baris task di `docs/handoff/STATUS.md`.

## Cek wajib sebelum menyatakan selesai
```bash
npm run check
```
(root; menjalankan check web lalu api) harus exit 0. Bila task menyentuh UI, jalankan `npm run dev` dan cek manual halaman terkait (lampirkan screenshot di ringkasan).
Bila ada probe/test baru yang diminta kartu task, tambahkan ke skrip `check` di `package.json` terkait.

## Format ringkasan akhir task
```
Task: F3-B-04
Status: selesai | sebagian | terblokir
Perubahan: <daftar file + 1 baris alasan>
Verifikasi: <perintah yang dijalankan + hasil>
Kriteria terima: <centang tiap butir dari kartu task>
Catatan/risiko: <apa yang perlu diketahui reviewer>
```
