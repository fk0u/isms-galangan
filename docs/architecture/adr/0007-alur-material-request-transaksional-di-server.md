# ADR-0007: Alur material request transaksional di server

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
ETC-03/04, PRJ-27/30: mekanik minta barang → stok/PR/PO; stok tidak boleh negatif.

## Opsi
1. Logika di frontend (sekarang).
2. **Endpoint server tunggal dalam transaksi.**

## Keputusan
Opsi 2: `POST /api/projects/:id/material-requests` + `withTx`; PO mendukung terima sebagian & pengalihan vendor.

## Konsekuensi
Frontend tidak lagi menulis movement/PR langsung untuk alur ini.
