# ADR-0018: Persetujuan gudang sebelum material keluar

- **Status:** Accepted (menggantikan aturan "stok cukup → langsung keluar" di ADR-0015)
- **Tanggal:** 2026-10-12
- **Pemutus:** Owner proyek (issue #73; daftar revisi 12 Okt: "mengambil barang dari inventori harus masuk ke permintaan barang keluar terlebih dahulu, melalui proses persetujuan")

## Konteks
ADR-0015 membuat server langsung mengeluarkan barang saat proyek meminta material dan stok cukup. Klien meminta setiap pengambilan melewati persetujuan gudang, walau stok tersedia, untuk mencegah salah komunikasi antar-divisi.

PR #78 menerapkan ini **hanya di browser untuk mode lokal**. Pada aplikasi yang tersambung server, `POST /api/projects/:id/material-requests` tetap memotong stok seketika, dan tombol setuju/tolak menulis lewat CRUD yang justru ditolak guard `materialRequests`. Akibatnya aturan itu tidak berlaku di server dan issue #73 tertutup tanpa benar-benar selesai.

## Opsi
1. Biarkan (aturan hanya di UI lokal) — tidak memenuhi kebutuhan; aturan bisnis wajib ditegakkan server.
2. Simpan pemotongan stok seketika, tambah status "perlu konfirmasi" setelahnya — barang sudah telanjur keluar dari catatan sebelum disetujui.
3. **Permintaan tidak memotong stok; gudang memutuskan lewat endpoint khusus** — dipilih.

## Keputusan
- `POST /api/projects/:id/material-requests` hanya mencatat permintaan: `status: "Menunggu Approval Gudang"`, `approvalStatus: "Menunggu ACC"`, `issued: 0`. Tidak ada movement. Bila stok kurang dari permintaan, selisihnya langsung menjadi PR (pengadaan boleh berjalan paralel dengan persetujuan).
- `POST /api/material-requests/:id/approval` `{decision: "approve" | "reject", note?}`:
  - hanya peran dengan izin tulis `inventory` (gudang, direktur, developer). Peminta barang (izin `movements`) tidak bisa menyetujui permintaannya sendiri.
  - **approve** → `approvalStatus: "Disetujui"`, lalu barang keluar sebanyak stok yang ada dalam transaksi yang sama (movement OUT). Sisa menunggu PO.
  - **reject** → alasan wajib; `status: "Ditolak Gudang"`; tidak ada pergerakan stok; PR yang masih terbuka dibatalkan.
  - keputusan kedua pada permintaan yang sama → 409.
- `POST /api/material-requests/:id/fulfill` dan pemenuhan otomatis saat barang PO diterima hanya berlaku untuk permintaan yang sudah `Disetujui`. Permintaan lama tanpa `approvalStatus` (dibuat sebelum ADR ini) tetap bisa dipenuhi.
- Klien: hook setuju/tolak memanggil endpoint di atas saat tersambung server; jalur lokal (demo tanpa server) tetap meniru aturan yang sama.

## Konsekuensi
- Barang tidak pernah tercatat keluar tanpa keputusan gudang. Biaya: satu langkah tambahan untuk setiap pengambilan, termasuk yang stoknya jelas ada.
- Stok tidak dicadangkan selama menunggu persetujuan: dua permintaan atas stok yang sama bisa sama-sama tampak "cukup"; yang disetujui lebih dulu yang mendapat barang, sisanya menunggu PO. Bila ini mengganggu, tambahkan reservasi stok.
- Permintaan yang belum disetujui saat barang PO-nya datang tidak ikut terpenuhi otomatis; barang keluar saat disetujui.
- Probe `material-flow` (27 pemeriksaan) dan `po-partial` diperbarui untuk alur ini.
- Membalik keputusan: kembalikan pemotongan stok di `requestMaterial` dan hapus guard `NOT_APPROVED`; data `approvalStatus` yang sudah ada tidak mengganggu.
