# F3-D — Service & Sparepart via Inventori/PO

Estimasi: 3–4 HK. Bergantung: F3-C (BoQ), F3-J-01 (alur permintaan barang).
Halaman: tab Service & Sparepart di detail proyek (`pages/proyek/SparepartServiceSection.tsx`), koleksi `services`, `spareparts`, `inventory`, `movements`, `requisitions`, `purchaseOrders`.

## Konteks
Sekarang sparepart & service ditulis langsung tanpa memeriksa stok atau approval. Upstream menambah referensi PO di form sparepart (D13) dan referensi BoQ di service (D12) — hanya referensi teks, belum alur.

Kebutuhan klien (PRJ-26, PRJ-27, PRJ-30):
- Mekanik hanya menambah sparepart lewat permintaan ke stok inventori: pilih item → lihat stok → stok cukup ⇒ **barang keluar** (movement OUT, tampil di tab Pergerakan inventori); stok kurang ⇒ **PR/PO** ke procurement.
- Service wajib persetujuan procurement (termasuk bila memakai PO inventori).
- List service dari pekerjaan WBS; teknisi dipilih dari karyawan; biaya terkait item BoQ.

---

### F3-D-01 — Tambah sparepart dari inventori
P0 · 1,5 HK · PRJ-30, PRJ-27
**Langkah.**
1. Form: `SearchSelect` item inventori (label nama, sublabel "Stok: 12 pcs @Gudang A"), qty, WBS terkait.
2. Simpan memanggil endpoint server **`POST /api/projects/:id/material-requests`** (baru, satu transaksi): bila stok ≥ qty → buat `movements` OUT (`ref: {projectId, wbsId, sparepartId}`) dan kurangi stok; bila kurang → buat `requisitions` (PR) status Diajukan untuk sisa qty, sparepart berstatus "Menunggu PO".
3. Saat PO diterima (barang masuk, F3-J), sparepart "Menunggu PO" otomatis jadi barang keluar.
**Kriteria.** [ ] Stok tidak bisa negatif (server). [ ] Sparepart tanpa movement/PR tidak bisa dibuat lewat API.

### F3-D-02 — Service: dari WBS, teknisi, biaya BoQ, approval
P0 · 1,5 HK · PRJ-26, PRJ-27
**Langkah.** Form service: pilih pekerjaan WBS (wajib), teknisi = `SearchSelect` karyawan, item BoQ terkait (biaya mengikuti harga item BoQ; bisa override dengan alasan). Status: Diajukan → **Disetujui procurement** → Dikerjakan → Selesai. Peran procurement (Q2) yang bisa menyetujui; server menolak transisi lain.
**Kriteria.** [ ] Service tidak bisa "Dikerjakan" tanpa persetujuan. [ ] Biaya service masuk perhitungan biaya proyek.

### F3-D-03 — Probe alur material
P1 · 3 j
`services/api/scripts/material-flow-probe.ts`: stok cukup → movement; stok kurang → PR; PR→PO→terima → movement otomatis; stok tidak negatif. Masuk `check`.
