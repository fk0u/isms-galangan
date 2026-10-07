# 01 — Ruang Lingkup Prototype

## Tujuan
Prototype yang bisa **didemokan ke klien dan dipakai pilot terbatas** dengan data sintetis/uji: semua modul inti berfungsi end-to-end, hak akses benar, data konsisten antar-device, dan bisa di-install ulang dari dokumentasi.

Prototype **bukan** produksi: belum ada SLA, HA, integrasi pajak/bank, atau aplikasi mobile.

## Modul dalam lingkup (13)
| # | Modul | Alur end-to-end yang harus bisa didemokan |
|---|---|---|
| 1 | Proyek | Proyek baru → WBS → progres + foto → milestone → trial → BAST → garansi |
| 2 | Inventori | Kode barang → masuk/keluar gudang → stok per gudang → pemakaian di WBS |
| 3 | Keuangan | Invoice/termin → kas-bank → jurnal → buku besar → neraca & laba rugi |
| 4 | SDM & Payroll | Karyawan → absensi/cuti → payroll → slip & surat |
| 5 | CRM | Request → quotation → kontrak → proyek |
| 6 | Procurement | PR → RFQ → PO → penerimaan barang → hutang |
| 7 | QC & Safety | Inspeksi → NCR → tindak lanjut; insiden, toolbox, safety walk |
| 8 | Laporan | PDF resmi dari server + ekspor Excel |
| 9 | Analitik | Dashboard KPI per modul |
| 10 | Drydock | Booking slot → kapasitas → jadwal |
| 11 | Subkontraktor | SOW → WO → milestone → termin |
| 12 | Kapal | Rekam jejak survey/docking & dokumen |
| 13 | Equipment | Booking alat → maintenance → biaya ke proyek |

## Di luar lingkup prototype
- Mobile app (React Native) — rencana setelah prototype.
- Integrasi e-Faktur/DJP, bank, dan WhatsApp/email notifikasi.
- Migrasi ke PostgreSQL (tetap SQLite lokal + MySQL server).
- Multi-tenant (lebih dari satu perusahaan).

## Definition of Done — Prototype
1. **Keamanan:** semua temuan Kritis & Tinggi audit tertutup; `docs/audit/probe.py` menghasilkan 0 VULN pada kategori K/T.
2. **Fungsional:** semua item backlog klien berstatus Selesai atau Ditunda-dengan-persetujuan (lihat `docs/product/requirements-2026-10.md`).
3. **Alur demo:** 13 alur tabel di atas lulus skenario demo tertulis (`docs/demo/` dibuat di Fase 4).
4. **Data:** seed sintetis lengkap, tidak ada data riil di repo.
5. **Operasional:** install bersih dari README dalam < 15 menit; CI menjalankan seluruh check; uji migrasi SQLite & MySQL.
6. **Kualitas:** `npm run check` kedua paket hijau; tidak ada file halaman > 1.500 baris yang baru disentuh tanpa dipecah.
