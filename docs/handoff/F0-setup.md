# F0 — Setup & Pengamanan Data

Tujuan: siapa pun (manusia atau agent) bisa clone repo → install → login dalam < 15 menit, tanpa data riil di repo.
Estimasi fase: 2–3 HK.

---

### F0-01 — Repo git & remote
P0 · 1 j · Bergantung: — · Revisi: —

**Konteks.** Kode disalin dari upstream `Ichsanul21/galangan@805e636` tanpa riwayat. Repo lokal sudah `git init`, file sudah di-stage, `.gitignore` sudah mengecualikan `services/api/seed-data/`, `docs/audit/`, `.impeccable/`.
**Langkah.**
1. (Selesai 7 Okt 2026.) Periksa staged file: `git status`; pastikan tidak ada `seed-data/`, `docs/audit/`, `.env`.
2. Commit awal: `chore: impor kode ISMS dari upstream 805e636 + docs plan`.
3. Buat remote GitHub dan push `main`.
**Kriteria terima.**
- [ ] `git ls-files | grep -E "seed-data|docs/audit|\.env$"` kosong.
- [ ] Remote `origin` terpasang, `main` ter-push.
**Jangan.** Push sebelum cek pertama lulus.

---

### F0-02 — Generator data sintetis untuk seed bulk
P0 · 1–1,5 HK · Bergantung: F0-01 · Revisi: (audit K-01)

**Konteks.** `services/api/src/seedBulk.ts` membaca `seed-data/*.json` (gudang 19k transaksi, bank, hutang, piutang, aset, tonase, subkon). File itu berisi data yang tampak riil dan **tidak** ada di repo, sehingga `npm run seed:bulk` gagal pada clone baru. `npm run seed` utama tetap jalan.
**File.** `services/api/src/seedBulk.ts`, `services/api/seed-data/*.json` (lokal saja, untuk melihat **bentuk** field), `services/api/src/seedFeMirror.ts`, `apps/web/src/data/seeds.ts`.
**Langkah.**
1. Catat skema tiap file JSON (nama field, tipe, rentang nilai) — **jangan salin nilainya**.
2. Buat `services/api/scripts/gen-seed-data.ts`: menghasilkan JSON dengan bentuk sama ke `services/api/seed-data-synthetic/` memakai PRNG ber-seed (deterministik). Nama perusahaan/kapal/orang fiktif, nomor rekening format `000-0000-XXX`, nominal acak realistis.
3. `seedBulk.ts`: baca `seed-data/` bila ada, jika tidak pakai `seed-data-synthetic/`.
4. Tambah skrip `"seed:gen": "tsx scripts/gen-seed-data.ts"`; commit hasil sintetis.
5. Audit `seedFeMirror.ts` & `apps/web/src/data/seeds.ts` (contoh: email `@gmail.com` di sekitar `seeds.ts:488`): ganti email/NPWP/nama yang tampak riil dengan fiktif (`*.example`, NPWP `00.000.000.0-000.000`).
**Kriteria terima.**
- [ ] Clone baru: `npm run migrate && npm run seed && npm run seed:bulk` sukses tanpa folder `seed-data/`.
- [ ] `git grep -iE "gmail\.com|@isgalangan|[0-9]{10,}"` di seed tidak menemukan data yang tampak riil.
- [ ] Halaman Inventori, Keuangan menampilkan data sintetis dengan jumlah baris serupa.
**Jangan.** Menyalin nilai riil ke file sintetis, atau menghapus folder `seed-data/` lokal.

---

### F0-03 — `.env` benar-benar dimuat
P0 · 1 j · Bergantung: — · Revisi: (audit T-07)

**Konteks.** `services/api/src/env.ts` hanya membaca `process.env`; README menyuruh menyalin `.env.example` → `.env`, tapi tidak ada yang memuatnya, sehingga API langsung fatal `JWT_SECRET is required`.
**File.** `services/api/package.json`, `services/api/.env.example`, `services/api/README.md`.
**Langkah.** Ubah skrip ke Node `--env-file` (Node ≥ 20.6):
`"dev": "tsx watch --env-file=.env src/index.ts"`, `"start": "node --env-file=.env dist/index.js"`, dan skrip `migrate/seed/backup/restore` serupa (`tsx --env-file=.env …`). Tambah `"engines": {"node": ">=22"}`.
**Kriteria terima.**
- [ ] `cp .env.example .env && npm run migrate && npm run seed && npm run dev` berjalan tanpa export manual.
**Jangan.** Menambah dependensi `dotenv`.

---

### F0-04 — README & quickstart
P1 · 2 j · Bergantung: F0-02, F0-03

**Langkah.** Tulis ulang bagian "Menjalankan" di `README.md` root: prasyarat (Node 22, npm), langkah api (env, migrate, seed, seed:bulk, dev), langkah web (`apps/web/.env` dengan `VITE_API_URL`), akun login dev, link ke `docs/`. Hapus password akun dari README (pindahkan ke `.env.example` sebagai komentar dev-only) dan hapus link `docs/*.md` yang mati.
**Kriteria terima.**
- [ ] Orang baru bisa login mengikuti README saja (uji di folder clone bersih).
