# ADR-0020: BOM per proyek sebagai awal rantai pengadaan

- **Status:** Accepted
- **Tanggal:** 2026-10-14
- **Pemutus:** Owner proyek (catatan CTO 14 Okt: "relasi BOM seharusnya mengacu ke procurement, bukan hanya PO, karena BOM merupakan daftar kebutuhan material untuk proyek")

## Konteks
Tab BOM di Inventori memakai satu daftar material tetap di kode (`BOM_NEEDS`) yang sama untuk semua proyek. Checklist penerimaan/pengeluaran (PR #147, #150) sudah memakai PO dan permintaan barang, tetapi kebutuhan proyeknya sendiri tidak pernah tercatat. BoQ tidak bisa dipakai sebagai sumber: barisnya item pekerjaan/jasa (overhaul, coating per m²), bukan material inventori.

## Opsi
1. Turunkan BOM dari BoQ — ditolak: BoQ berisi pekerjaan, bukan material.
2. Simpan BOM di dalam data proyek (array) — menyulitkan relasi ke inventori dan audit per baris.
3. **Koleksi `bomItems`: satu baris per (proyek, material inventori, kebutuhan)** — dipilih.

## Keputusan
- Migrasi `018_bom_items.sql`, prefix `BOM`, relasi `projectId → projects`, `itemId → inventory`.
- Server menolak kebutuhan ≤ 0 dan material ganda dalam satu proyek.
- Izin tulis: gudang (RWD), proyek (RWD), procurement (RW), manager/direktur/developer; mekanik baca.
- Tampilan per baris BOM dihitung dari data nyata: sudah keluar (permintaan barang proyek), stok gudang, dalam pengadaan (PR proyek yang belum jadi PO + sisa PO proyek), dan kekurangan. Kekurangan bisa langsung dibuatkan PR yang membawa proyek, material, jumlah, dan satuan.
- Barang masuk/keluar "additional" (di luar procurement/permintaan) ditulis server lewat `POST /api/inventory/:id/additional` (stok + movement satu transaksi, alasan wajib, stok tidak boleh minus).

## Konsekuensi
- Rantai BOM → PR → PO → penerimaan → pengeluaran bisa ditelusuri lewat `projectId + itemId`. PR lama tanpa `projectId/itemId` tidak terhitung sebagai "dalam pengadaan".
- PO yang memuat beberapa barang (baris `lines`) dihitung lewat `itemId` di tingkat PO saja; baris per item belum ikut dihitung.
- Seed menyertakan BOM sintetis untuk tiga proyek; proyek lain mulai kosong dan diisi pengguna.
