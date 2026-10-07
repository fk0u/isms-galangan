# ADR-0003: Satu cabang aktif (Samarinda), struktur siap multi-cabang

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Q1. Revisi klien: filter cabang dihapus (ETC-01), form cabang diganti lokasi docking (PRJ-10), equipment default Samarinda (EQP-01). Audit K-02: isolasi cabang tidak ditegakkan.

## Opsi
1. Multi-cabang penuh dengan scope server + backfill (5–7 HK).
2. **Satu cabang aktif; server mengisi/mengunci `branch`** (1–2 HK).

## Keputusan
Opsi 2 (F2-06 Jalur A). Semua data `branch = "Samarinda"`; create diisi server; PATCH `branch` hanya direktur/developer. Kolom & claim tetap ada.

## Konsekuensi
Menambah cabang kelak = menjalankan Jalur B di F2-06; tidak perlu migrasi skema.
