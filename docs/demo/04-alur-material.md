# 04. Alur material: gudang → procurement

- **Peran:** Proyek, Gudang, Procurement
- **Data yang dipakai:** MR-2026-002 (Anoda Zink), PO-2026-118.

| Langkah | Klik | Hasil yang diharapkan |
|---|---|---|
| 1 | **RP-2026-003 → tab Sparepart → Tambah**; pilih barang, jumlah melebihi stok | Peringatan: sisa otomatis jadi Purchase Request. |
| 2 | **Procurement → Permintaan Barang** | Permintaan tampil dengan status (Menunggu PO / Menunggu stok / Sebagian diterima). |
| 3 | **Procurement → PR** | PR otomatis tertaut ke permintaan. |
| 4 | **Inventori → Terima & Keluar** | Checklist PO dan permintaan; *Additional* wajib alasan. |
