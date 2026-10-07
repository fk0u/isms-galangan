# F3-J — Procurement & Alur Material End-to-End

Halaman: `/procurement` (`pages/procurement/Procurement.tsx`, 2.456 baris), teks `i18n/n_proc.ts`. Koleksi: `requisitions` (PR), `rfqs`, `purchaseOrders`, `vendors`, `payables`.
Tab saat ini: PR, RFQ, PO Besar (Kantor), PO Kecil (Workshop), Vendor.
Estimasi: 4–6 HK.

## Alur target (ETC-03, ETC-04)
```
Proyek → Surat BoQ disetujui → BoQ diturunkan ke mekanik (WBS/assign)
  → Mekanik minta barang (material request, F3-D-01)
       ├─ stok cukup  → Barang keluar (movement OUT)
       └─ stok kurang → PR → RFQ (bandingkan harga) → PO ke vendor
                         → vendor memenuhi sebagian/tidak sanggup
                              → sisa qty dialihkan ke vendor lain (PO baru)
                         → semua terpenuhi → Barang masuk (F3-G-04) → otomatis barang keluar ke permintaan
```

---

### F3-J-01 — Material request sebagai penghubung
P0 · 1 HK
Endpoint dari F3-D-01 dipakai juga oleh BoQ/WBS. Tambah halaman/daftar "Permintaan barang" (di Procurement tab PR atau Inventori BOM) dengan status: Menunggu stok · Dipenuhi dari stok · Menunggu PO · Sebagian diterima · Selesai. Setiap PR menyimpan `sourceRequestIds`.

### F3-J-02 — PO terpenuhi sebagian & pengalihan vendor
P0 · 1,5 HK · ETC-04
Baris PO punya `qtyOrdered`, `qtyReceived`, `qtyCancelled`. Aksi "Vendor tidak sanggup" pada baris/PO: tandai qty tidak terpenuhi → tombol "Alihkan ke vendor lain" membuat PO baru (pre-filled sisa qty, pilih vendor berdasarkan riwayat harga F3-J-03). Status PO: Draft · Dikirim · Sebagian diterima · Diterima · Dibatalkan sebagian. Permintaan selesai saat total diterima = total diminta.
**Kriteria.** [ ] Probe: PO 10 unit, vendor A kirim 6, sisa 4 dialihkan ke vendor B, permintaan selesai setelah B menerima 4.

### F3-J-03 — RFQ: perbandingan harga & track record, tanpa tender
P1 · 1 HK · ETC-05, ETC-06
Hapus alur tender (undangan, pemenang tender, dsb.). RFQ = tabel perbandingan penawaran per item per vendor (harga, lead time, catatan) dengan sorotan harga terendah. Panel **riwayat harga**: untuk tiap item, harga dari PO sebelumnya per vendor (tanggal, harga, qty) + grafik kecil tren. Data dari `purchaseOrders` (tanpa koleksi baru).

### F3-J-04 — Approval service oleh procurement
P0 · 3 j · bersama F3-D-02
Daftar "Menunggu persetujuan" di Procurement untuk service & PR proyek; aksi Setujui/Tolak dengan catatan; tercatat di audit.
