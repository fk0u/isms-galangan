# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/). Versi mengikuti `package.json` api/web.

## [Unreleased]

### Added
- **Procurement & Pengadaan:**
  - Form Minta Barang (PR) terhubung langsung ke katalog Inventori dengan pencarian real-time dan kartu detail stok barang (#113).
  - Deep-link penambahan material baru (`/inventori?tab=Katalog&action=tambah&name=...`) saat barang belum terdaftar di inventori (#113).
  - Fitur unggah dan pratinjau lampiran bukti transaksi (struk/nota/kuitansi/faktur) untuk PO Kecil / Workshop (#107).
  - Form PO Besar diperbarui dengan alur penerimaan barang per-item (partial receive) dan alokasi gudang (#106).
  - Filter lazy-sync data pada Procurement dan Finance untuk meningkatkan efisiensi pemuatan jaringan (#105).
- **Proyek & BoQ:**
  - Tampilan dokumen BoQ mencakup semua status dokumen (Draft, Diajukan, Disetujui, Ditolak) beserta identitas assigner (#76).
  - Mode tampilan WBS baru, pemicu approval dokumen otomatis, dan penegasan foto wajib saat pembaruan progres WBS (#78, #114).
  - Pilihan Project Manager (PM), kondisi Trial, dan subtotal BoQ (#114).
- **Drydock:**
  - Aturan batas dimensi dock (panjang, lebar, draft) di backend server dan modal konfirmasi saat menghapus limitasi (#91).
- **SDM & Cuti:**
  - Pengajuan cuti mandiri karyawan tanpa verifikasi PIN (ADR-0019) (#117).
  - Pelacakan riwayat kontrak kerja karyawan dan peningkatan kompatibilitas upload sertifikat PDF hasil scan (#117).
- **Monitoring & Aktivitas:**
  - Feed pemantauan real-time pekerjaan dengan foto dan peran updater (#118).
  - Komponen aktivitas terkini dan stabilitas posisi urutan daftar berdasarkan waktu pembuatan (#118).

### Fixed & Changed
- **Persetujuan Gudang di Server (ADR-0018):** Validasi izin gudang dan otorisasi mutasi stok ditegakkan di sisi API (#116).
- **Guard Validasi Server:** Pengetatan validasi server untuk WBS, peran PM, dan transfer material (#117).
- **Hardening Keamanan & Data:** Perbaikan temuan review audit data pada modul pengadaan & keuangan (#115).
- **UI & UX:**
  - Tombol aksi dibatasi sesuai izin tulis (RBAC) pada katalog inventori dan procurement (#113).
  - Penyesuaian modal HR yang lebih lebar dan responsif (#78).
  - Penyempurnaan label "Perhatian Khusus", tarif BPJS, dan feedback kepuasan klien (#114).

### Security
- `services/api/seed-data/` dan laporan audit tidak di-track (ADR-0001).
- Akses mutasi stok dan endpoint gudang divalidasi ketat di sisi server (ADR-0018).
- Otentikasi dan hak akses RBAC granular diterapkan di seluruh endpoint transaksi baru.
