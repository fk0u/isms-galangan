# F3-G — Inventori & Material

Halaman: `/inventori` (`pages/inventori/Inventory.tsx`, 3.699 baris — **pecah per tab** ke `pages/inventori/tabs/*.tsx` saat diubah), `/inventori/bom/:id` (`BomDetail.tsx`), teks `i18n/n_inv.ts`. Koleksi: `inventory`, `movements`, `warehouses`.
Tab saat ini: Katalog, Stok per Gudang, BOM, Pergerakan, Tonase & Surat Jalan, Analisis.
Estimasi: 6–8 HK.

---

### F3-G-01 — Katalog dirapikan
P1 · 4 j · INV-02
**Langkah.** Kategori sebagai badge berwarna (peta warna tetap per kategori di satu konstanta). Hapus teks "impor", kolom Kelas (ABC), kolom Bin. Toolbar: selector [Katalog | IN | OUT], Template Excel, Impor CSV dipindah ke sebelah tombol Scan. Kolom status: hanya badge (hapus teks detail di bawahnya; detail bisa di tooltip).

### F3-G-02 — Tambah material + konversi satuan
P0 · 1,5 HK · INV-03
**Konteks.** Material dibeli dalam satu satuan (drum, lembar plat, galon) tapi dipakai dalam satuan lain (liter, potongan, kg).
**Langkah.**
1. Label "Dijual eceran" → "Eceran"; hapus "Min stok gudang ini".
2. Form bertahap: (1) identitas — nama, kode, kategori; (2) satuan — satuan beli, apakah eceran; (3) **konversi** muncul otomatis sesuai kategori: Cat/Cairan → isi per kemasan (liter); Plat → panjang × lebar × tebal (mm) & berat (kg); Pipa/Besi → panjang & berat per batang; Tonase → kg per satuan. (4) stok awal & gudang.
3. Simpan `conversion: { baseUnit, perUnit, dims? }` di `inventory.data`; definisi aturan per kategori di `utils/unitConversion.ts` + probe.
**Kriteria.** [ ] 1 drum cat 200 L tersimpan dan tampil "1 drum = 200 L".

### F3-G-03 — Barang keluar: eceran & potongan
P0 · 1,5 HK · INV-08 · Bergantung: F3-G-02
**Langkah.** Form barang keluar: bila item eceran → qty dalam satuan dasar (liter/kg) dengan sisa kemasan terhitung (mis. 1 drum terbuka sisa 150 L). Plat → input ukuran potongan (p × l); sistem menghitung luas & berat terpakai dan sisa plat (sisa disimpan sebagai item "sisa potongan" atau catatan sisa — tentukan di PR, usulan: catatan sisa per lembar). Server memvalidasi stok dalam satuan dasar.
**Kriteria.** [ ] Stok tampil dalam satuan beli + satuan dasar (mis. "3 drum (550 L)").

### F3-G-04 — BOM terima & keluar barang
P0 · 1,5 HK · INV-04, INV-05, INV-06 · Bergantung: F3-J-01
**Langkah.** Terima barang: tabel checklist baris PO yang belum diterima (sumber procurement) + section **Additional** (barang masuk tanpa procurement, wajib alasan). Barang keluar: list permintaan (dari proyek/procurement, F3-D) dengan checklist + section additional untuk barang baru. Retur: hapus field vendor; label "Retur ke vendor" → "Retur".
**Kriteria.** [ ] Centang baris PO ⇒ movement IN + status PO terupdate (partial/full).

### F3-G-05 — Pergerakan: 2 grafik tren, kolom Dari/Ke, slow & dead stock
P1 · 4 j · INV-07, INV-10
**Langkah.** Ganti grafik nilai stok dengan 2 grafik tren (barang masuk, barang keluar) per bulan. Kolom "Dari gudang/Ke gudang" → "Dari/Ke". Pindahkan card Slow moving & Dead stock ke tab ini; hapus tab Analisis.

### F3-G-06 — Sembunyikan surat jalan
P2 · 1 j · INV-09
Tab "Tonase & Surat Jalan" → "Tonase"; bagian surat jalan disembunyikan via setting `SHOW_SURAT_JALAN=0` (jangan hapus kode PDF surat jalan).

### F3-G-07 — Auto-refresh tanpa tombol Muat ulang
P1 · 3 j · INV-01 · Bergantung: F4-03
**Konteks.** Tombol `Muat ulang` di `Inventory.tsx` (~baris 1841) memanggil `resync()`.
**Langkah.** Hapus tombol. Berlangganan event realtime koleksi `inventory`/`movements`/`warehouses` (F4-03); saat event datang, tarik ulang koleksi tersebut saja. Fallback: polling 30 detik bila realtime tidak tersambung.
