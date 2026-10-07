# 03 — Roadmap

Estimasi dalam hari kerja (HK) untuk kita berdua. Indikatif — direvisi di akhir tiap fase.

**Rincian eksekusi per task ada di [`handoff/`](../handoff/README.md)** (101 kartu task, papan status di `handoff/STATUS.md`). Dokumen ini hanya ringkasan fase.

> Revisi 7 Okt: Fase 3 naik dari 15–25 menjadi 30–45 HK karena revisi klien 5–6 Oktober (±95 item, termasuk modul baru: Monitoring, Drydock, Inventori konversi satuan, Equipment delegasi, Subkon skema termin, QC kuesioner, SDM/Absensi).

| Fase | Fokus | Estimasi | Keluaran |
|---|---|---|---|
| 0 | Setup & pengamanan data | 2–3 HK | Repo git sendiri, seed sintetis, env jalan |
| 1 | Verifikasi & stabilisasi | 3–4 HK | Backlog terverifikasi, baseline test hijau, CI |
| 2 | Gerbang keamanan (K + T) | 15–20 HK | Semua K/T audit tertutup, security probe di CI |
| 3 | Penyelesaian fungsional | 30–45 HK | Revisi klien 5–6 Okt tertutup (lihat `docs/product/requirements-2026-10.md`) |
| 4 | Integritas, kinerja, polish | 6–10 HK | Concurrency, bundle, PDF font, UX |
| 5 | Kesiapan demo & pilot | 3–5 HK | Docker/runbook, skenario demo, audit ulang |
| | **Total** | **59–87 HK** | Prototype lengkap (±3–4 bulan berdua, paralel F2/F3) |

Fase 2 dan 3 bisa paralel (satu orang keamanan/backend, satu orang fungsional/frontend) setelah Fase 1 selesai.

---

## Fase 0 — Setup & pengamanan data
- [ ] `git init` di project ini, commit awal = salinan upstream `805e636`.
- [ ] Ganti `services/api/seed-data/*.json` dan bagian sensitif `seedFeMirror.ts` dengan data sintetis (generator kecil, bentuk field sama). Data asli disimpan di luar repo bila masih dibutuhkan untuk migrasi.
- [ ] Skrip `dev`/`start` memakai `node --env-file=.env`.
- [ ] README: cara install lokal yang benar-benar jalan.
- **Selesai bila:** clone bersih → `npm ci` → migrate → seed → login berhasil, tanpa langkah tersembunyi; `grep` nomor rekening asli = 0 hasil.

## Fase 1 — Verifikasi & stabilisasi
- [ ] Verifikasi 72 item backlog satu per satu di aplikasi; perbarui status di `docs/handoff/STATUS.md`.
- [ ] Tambah ESLint (aturan minimal) + Vitest; jangan refactor besar dulu.
- [ ] CI (GitHub Actions di repo kita): `npm run check` web + api.
- [ ] Jalankan `docs/audit/probe.py` → simpan hasil sebagai baseline.
- **Selesai bila:** status backlog akurat; CI hijau; baseline probe tercatat (target awal: 30 VULN).

## Fase 2 — Gerbang keamanan
Urutan dan rincian di `docs/architecture/security-plan.md`. Ringkasnya: K-05 → T-06 → K-04 → T-01 → K-03/T-04 (policy) → K-02 (scope cabang + backfill) → T-02/T-03 → T-05.
- **Selesai bila:** security probe di CI = 0 VULN untuk K/T; backfill cabang selesai atau koleksi global ditetapkan.

## Fase 3 — Penyelesaian fungsional
Kelompok kerja di `handoff/F3-*.md`. Urutan: F3-A (komponen bersama) → F3-B proyek → F3-C BoQ → F3-G inventori → F3-J procurement → F3-D service/sparepart → F3-E monitoring → sisanya paralel.
- **Selesai bila:** semua item Selesai atau Ditunda dengan persetujuan tertulis.

## Fase 4 — Integritas, kinerja, polish
- [ ] Concurrency atomik (S-01), transaksi untuk operasi multi-baris (S-06).
- [ ] Relasi baru di `refs.ts` (material, sparepart→PO, service→BoQ, garansi→WBS).
- [ ] Code splitting per halaman + model 3D on-demand (R-01).
- [ ] Font PDF Noto Sans (R-02); error 404/500 rapi (S-09); header keamanan (S-05).
- [ ] Pecah `Finance.tsx`, `ProjectDetail.tsx`, `Inventory.tsx` saat disentuh.

## Fase 5 — Kesiapan demo & pilot
- [ ] `docker-compose.yml` (api + mysql + web) + runbook deploy & backup/restore teruji.
- [ ] Skenario demo per modul (`docs/demo/`), data demo yang bercerita.
- [ ] Audit ulang dengan `probe.py` + checklist Definition of Done.
