# ADR-0015: Koleksi `materialRequests` dan persetujuan service lewat field `approval`

- **Status:** Accepted
- **Tanggal:** 2026-10-10
- **Pemutus:** Owner (Kou) bersama agent; menindaklanjuti F3-J-01 dan F3-D-02/F3-J-04

## Konteks
- ADR-0007 memindahkan alur material ke satu endpoint transaksional, tetapi permintaannya sendiri tidak tercatat. Akibatnya procurement tidak punya daftar "permintaan barang" (Menunggu PO, Sebagian diterima, Selesai), dan PR tidak tahu permintaan mana yang menjadi sumbernya.
- Service proyek wajib disetujui procurement sebelum dikerjakan (PRJ-26, PRJ-27, Q2). Status kerja service (`Scheduled → In Progress → Done`) juga dipakai halaman kapal dan data lama.

## Opsi
1. Tidak melakukan apa-apa: status diturunkan dari movement/PR di UI. Ditolak, karena pemenuhan bertahap tidak bisa direkonstruksi dengan andal.
2. Koleksi baru `materialRequests` (envelope standar), plus field `approval` terpisah pada `services`.
3. Mengganti kosakata status service menjadi Diajukan/Disetujui/Dikerjakan/Selesai. Ditolak, karena memaksa migrasi data dan mengubah halaman kapal.

## Keputusan
Opsi 2.
- `materialRequests` (migrasi 014, prefix `MR`):
  - Hanya dibuat oleh `POST /api/projects/:id/material-requests`.
  - Hanya diperbarui oleh `POST /api/material-requests/:id/fulfill`, yang memenuhi sisa dari stok setelah barang masuk.
  - CRUD generik menolak create/patch (422).
  - Status: Dipenuhi dari stok · Menunggu PO · Sebagian diterima · Selesai. "Menunggu stok" diturunkan di UI bila PR sumbernya sudah menjadi PO.
  - PR menyimpan `sourceRequestIds`.
- `services.approval`:
  - Nilainya Diajukan · Disetujui · Ditolak. Baris tanpa field = data lama, dianggap Disetujui.
  - Service baru dari CRUD selalu `Scheduled + Diajukan` dan wajib `wbsTask` bila punya `projectId`.
  - `approval` hanya berubah lewat `POST /api/services/:id/approval`. Approver: procurement, direktur, developer. Penolakan wajib alasan; pengaju bisa mengajukan ulang setelah ditolak.
  - Server menolak `In Progress`/`Done` sebelum Disetujui.
  - Biaya yang berbeda dari `boq.totalPrice` item terkait wajib `costReason`.
- Biaya service berstatus Done masuk biaya proyek (HPP/EVM); yang disetujui tetapi belum selesai ditampilkan sebagai komitmen.

## Konsekuensi
- Probe `probe:material` (17 pemeriksaan) dan `probe:service` (14 pemeriksaan) menjaga aturan ini.
- Mengubah biaya setelah service disetujui belum memicu persetujuan ulang. Bila klien meminta, tambahkan reset `approval` ke Diajukan saat `cost`/`boqRef` berubah.
- Alur PO terpenuhi sebagian dan pengalihan vendor (F3-J-02) belum otomatis memenuhi permintaan. Pemenuhan masih lewat tombol "Penuhi dari stok" setelah stok bertambah.
- Membalik keputusan: hapus guard di `serviceApproval.ts` dan tabel `materialRequests`. Data service lama tetap valid.
