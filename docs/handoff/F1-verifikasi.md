# F1 — Verifikasi & Stabilisasi

Tujuan: tahu persis kondisi aplikasi sebelum mengubahnya, dan punya jaring pengaman (lint, test, CI).
Estimasi fase: 3–4 HK.

---

### F1-01 — Verifikasi revisi klien item per item
P0 · 1,5 HK · Bergantung: F0 · Revisi: semua di `docs/product/requirements-2026-10.md`

**Konteks.** Developer asal mengklaim sebagian revisi selesai, tapi tabel per-item di `legacy/todo5.md` tidak sinkron dengan ringkasannya. Klaim D13 misalnya hanya menambah referensi PO, bukan mewajibkan PO.
**Langkah.**
1. Jalankan aplikasi dengan seed.
2. Untuk setiap ID di `docs/product/requirements-2026-10.md`, cek di UI + cari kode terkait. Isi status di `docs/handoff/STATUS.md`: `OK` (sesuai kalimat klien), `KURANG` (ada tapi belum memenuhi — tulis apa yang kurang), `NOL`.
3. Untuk item `OK`, beri path file:baris bukti.
**Kriteria terima.**
- [ ] Semua ±95 ID punya status + bukti/kekurangan.
- [ ] Task F3 yang item-nya ternyata `OK` ditandai "verifikasi saja" di STATUS.md.

---

### F1-02 — ESLint minimal
P1 · 3 j · Bergantung: F0

**Langkah.** Tambah ESLint flat config + `typescript-eslint` + `eslint-plugin-react-hooks` di `apps/web` dan `typescript-eslint` di `services/api` (devDependencies). Aturan: recommended, `react-hooks/rules-of-hooks: error`, `exhaustive-deps: warn`, `no-explicit-any: warn`. Skrip `lint`. **Jangan auto-fix massal**; perbaiki hanya error (bukan warning).
**Kriteria terima.** `npm run lint` exit 0 di kedua paket; ditambahkan ke `check`.

---

### F1-03 — Vitest untuk logika murni
P1 · 4 j · Bergantung: F0

**Konteks.** Probe kustom (`apps/web/scripts/*-probe.ts`, `services/api/scripts/*-probe.ts`) tetap dipertahankan — itu gate render & PDF. Vitest untuk test unit baru.
**Langkah.** Pasang `vitest` di kedua paket; contoh test untuk `utils/format.ts` (`parseRupiah`) dan `services/api/src/routes/crudCursor.ts`. Skrip `test`, tambahkan ke `check`.
**Kriteria terima.** `npm test` jalan di kedua paket, minimal 2 test lulus.

---

### F1-04 — CI GitHub Actions
P0 · 2 j · Bergantung: F1-02, F1-03

**Langkah.** `.github/workflows/ci.yml`: trigger push & PR; job `web` (Node 22, `npm ci`, `npm run check`) dan job `api` (`npm ci`, env JWT_SECRET dummy, `npm run migrate`, `npm run seed`, `npm run check`). Cache npm.
**Kriteria terima.** Badge CI hijau di `main`; PR yang merusak check gagal.

---

### F1-05 — Baseline security probe
P0 · 2 j · Bergantung: F0-03

**Konteks.** `docs/audit/probe.py` (lokal, tidak di repo) menguji 35 skenario. Hasil terakhir 30 VULN.
**Langkah.** Port ke `services/api/scripts/security-probe.ts` memakai `buildApp()` + `app.inject()` (tanpa membuka port) dan DB SQLite sementara. Setiap kasus berisi `expectSecure`. Untuk saat ini skrip **melaporkan** tanpa gagal (mode `--report`); F2 mengubahnya jadi gate.
**Kriteria terima.** `npm run probe:security -- --report` mencetak tabel 35 kasus dengan hasil sama seperti `probe.py`.
