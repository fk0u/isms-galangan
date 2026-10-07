# Handoff — Panduan Eksekusi Task

Dokumen di folder ini ditulis untuk **dieksekusi oleh AI agent (Antigravity) atau developer**, satu kartu task per sesi. Setiap kartu bisa dibaca berdiri sendiri.

## Urutan fase
| File | Fase | Isi | Prasyarat |
|---|---|---|---|
| [F0-setup.md](F0-setup.md) | 0 | Repo, env, seed sintetis | — |
| [F1-verifikasi.md](F1-verifikasi.md) | 1 | Verifikasi backlog, lint/test, CI, baseline | F0 |
| [F2-keamanan.md](F2-keamanan.md) | 2 | Gerbang keamanan (temuan audit K/T) | F1 |
| [F3-A-lintas-modul.md](F3-A-lintas-modul.md) | 3 | Top bar, format harga, pagination | F1 |
| [F3-B-proyek.md](F3-B-proyek.md) | 3 | Manajemen proyek (list + detail) | F3-A |
| [F3-C-boq-change-order.md](F3-C-boq-change-order.md) | 3 | BoQ per nomor surat + Change Order | F3-B |
| [F3-D-service-sparepart.md](F3-D-service-sparepart.md) | 3 | Service & sparepart via inventori/PO | F3-C, F3-G-03 |
| [F3-E-monitoring.md](F3-E-monitoring.md) | 3 | Monitoring proyek | F3-B, F2-06 |
| [F3-F-drydock.md](F3-F-drydock.md) | 3 | Drydock & kapasitas | F3-A |
| [F3-G-inventori.md](F3-G-inventori.md) | 3 | Inventori & material | F3-A |
| [F3-H-equipment.md](F3-H-equipment.md) | 3 | Equipment | F3-A |
| [F3-I-subkon.md](F3-I-subkon.md) | 3 | Subkontraktor | F3-A |
| [F3-J-procurement.md](F3-J-procurement.md) | 3 | Alur procurement & material end-to-end | F3-G |
| [F3-K-qc-safety.md](F3-K-qc-safety.md) | 3 | QC & Safety | F3-A |
| [F3-L-sdm-absensi.md](F3-L-sdm-absensi.md) | 3 | SDM, karyawan, absensi | F3-A |
| [F3-M-lainnya.md](F3-M-lainnya.md) | 3 | Kapal, analitik, dashboard, keuangan | F3-A |
| [F4-integritas.md](F4-integritas.md) | 4 | Concurrency, realtime, relasi, kinerja | F2 |
| [F5-demo.md](F5-demo.md) | 5 | Docker, runbook, skenario demo, audit ulang | semua |

Fase 2 (backend/keamanan) dan Fase 3 (frontend/fitur) **boleh paralel** oleh dua orang. Task F3 yang ditandai `bergantung F2-xx` menunggu task tersebut.

## Format kartu task
```
### <ID> — <judul>
Prioritas · Estimasi · Bergantung · Revisi klien
Konteks     — kenapa task ini ada, apa yang terjadi sekarang
File        — file yang wajib dibaca/diubah
Langkah     — urutan kerja
Kriteria terima — checklist yang harus benar semua
Verifikasi  — perintah/cek manual
Jangan      — batasan khusus
```
Prioritas: **P0** wajib sebelum demo, **P1** wajib untuk prototype lengkap, **P2** bagus bila sempat.
Estimasi dalam jam kerja (j) atau hari kerja (HK).

## Template prompt untuk Antigravity
Salin, ganti ID task:
```
Kamu bekerja di repo ISMS_Draft. Baca AGENTS.md di root terlebih dahulu.
Kerjakan task <ID> dari docs/handoff/<file>.md — HANYA task itu.
1. Baca semua file di bagian "File" kartu task, pahami alur sebelum mengubah.
2. Buat branch <tipe>/<ID>-<slug>.
3. Ikuti "Langkah". Bila ada yang ambigu atau bertentangan dengan kode, berhenti dan tanyakan.
4. Penuhi semua "Kriteria terima" dan jalankan "Verifikasi".
5. Tutup dengan ringkasan sesuai format di AGENTS.md.
```

## Definition of Done tiap task
- Semua kriteria terima tercentang.
- `npm run check` web dan api exit 0.
- Teks UI baru ada di i18n ID + EN.
- Tidak ada data riil, secret, atau `console.log` debug tertinggal.
- Kartu task diberi status di `docs/handoff/STATUS.md`.
