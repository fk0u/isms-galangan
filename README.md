# ISMS — Integrated Shipyard Management System

Sistem manajemen terintegrasi untuk galangan kapal tugboat (new build, repair, modification): proyek, BoQ, inventori, procurement, keuangan, SDM & payroll, QC & safety, drydock, equipment, subkontraktor, dan analitik.

> **Status: Prototype (pre-pilot).** Belum untuk data produksi. Lihat [roadmap](docs/planning/roadmap.md) dan [papan task](docs/handoff/STATUS.md).

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

---

## Isi repo

```
.
├── apps/
│   └── web/                 Frontend — React 19, Vite 8, TypeScript, Tailwind 4
├── services/
│   └── api/                 Backend — Fastify 5, TypeScript, SQLite (dev) / MySQL (server)
├── docs/                    Dokumentasi produk, arsitektur, rencana, handoff task
├── .github/                 CI, template PR & issue
├── AGENTS.md                Aturan untuk AI agent (Antigravity, Claude Code)
├── CONTEXT.md               Konteks bisnis & domain galangan (baca pertama)
├── DESIGN.md                Design system & aturan UI
├── CONTRIBUTING.md          Alur kontribusi, branch, commit, review
├── SECURITY.md              Kebijakan keamanan & pelaporan
└── CHANGELOG.md
```

## Mulai cepat

Prasyarat: **Node.js 22** (`.nvmrc`), npm 10.

```bash
npm run setup
```
Perintah di atas meng-install dependensi kedua paket dan menyalin `.env.example` → `.env` bila belum ada.

**Backend** (port 3000):
```bash
cd services/api && npm run migrate && npm run seed && npm run dev
```
Isi `JWT_SECRET` di `services/api/.env` dulu (≥ 32 karakter acak). Akun dev dibuat oleh `npm run seed` — lihat output terminal.

> Sampai task [F0-03](docs/handoff/F0-setup.md) selesai, `.env` belum dimuat otomatis; jalankan dengan `node --env-file=.env` atau export variabelnya manual.

**Frontend** (port 5173):
```bash
cd apps/web && npm run dev
```
Isi `VITE_API_URL=http://localhost:3000` di `apps/web/.env` agar tersambung ke backend; kosong = mode lokal (data seed di browser).

**Cek kualitas** (wajib hijau sebelum merge):
```bash
npm run check
```
Menjalankan type-check + probe render 28 halaman + probe domain (frontend) dan type-check + probe PDF + probe pagination (backend).

## Modul

| Modul | Route | Ringkas |
|---|---|---|
| Dashboard & Analitik | `/dashboard`, `/analytics`, `/laporan` | KPI, laporan PDF/Excel |
| Manajemen & Monitoring Proyek | `/proyek`, `/proyek/monitoring` | WBS, BoQ, change order, trial, garansi, service, sparepart |
| CRM | `/crm` | Request → quotation → kontrak |
| Procurement | `/procurement` | PR → RFQ → PO → vendor |
| Inventori | `/inventori` | Katalog, stok per gudang, BOM, pergerakan |
| Keuangan | `/keuangan` | Invoice, hutang, kas-bank, jurnal, neraca, L/R |
| SDM, Absensi, Payroll | `/sdm`, `/absensi`, `/payroll` | Karyawan, cuti, surat, rekap, gaji |
| QC & Safety | `/qc-safety` | Inspeksi, NCR, HSE, insiden, sertifikat |
| Drydock | `/drydock` | Slot, booking, maintenance dock |
| Equipment | `/equipment` | Daftar alat, delegasi, maintenance |
| Subkontraktor | `/subkontraktor` | Work order, termin |
| Kapal & Dokumen | `/kapal`, `/dokumen` | Rekam jejak kapal, arsip dokumen |

## Dokumentasi

Mulai dari [`docs/README.md`](docs/README.md). Jalur baca yang disarankan:

1. [CONTEXT.md](CONTEXT.md) — domain & istilah galangan
2. [docs/product/scope.md](docs/product/scope.md) — lingkup prototype & definition of done
3. [docs/architecture/overview.md](docs/architecture/overview.md) + [ADR](docs/architecture/adr/README.md)
4. [docs/planning/roadmap.md](docs/planning/roadmap.md) → [docs/handoff/](docs/handoff/README.md)

## Bekerja dengan AI agent

Repo ini dikerjakan bersama AI agent berbasis kartu task. Agent wajib membaca [AGENTS.md](AGENTS.md); manusia memberi satu ID task per sesi memakai template prompt di [docs/handoff/README.md](docs/handoff/README.md).

## Asal kode

Diturunkan dari `github.com/Ichsanul21/galangan` commit `805e636` (7 Okt 2026) dan dikembangkan terpisah sejak itu. Lihat [docs/UPSTREAM.txt](docs/UPSTREAM.txt) dan [ADR-0001](docs/architecture/adr/0001-fork-terpisah-dari-upstream-repo-publik-tanpa-data-riil.md).

## Lisensi

Hak cipta dilindungi. Kode dipublikasikan untuk keperluan kolaborasi dan review; tidak ada lisensi penggunaan ulang yang diberikan kecuali disepakati tertulis.
