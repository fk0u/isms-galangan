> **Digantikan** oleh [`docs/product/requirements-2026-10.md`](requirements-2026-10.md) (revisi klien terbaru) untuk perencanaan Fase 3. File ini disimpan sebagai pemetaan dari daftar lama `todo5`.

# 05 — Backlog Fungsional (Revisi Klien)

Sumber: `legacy/todo5.md` @ `805e636`. Ringkasan upstream: 34 Selesai, 13 Sebagian, 22 Belum, 4 Ambigu (72).
Tabel per-item di sumber **belum sinkron** — kolom "Verifikasi" di bawah diisi di Fase 1.
Legenda Verifikasi: `?` belum dicek · `OK` selesai terbukti · `KURANG` ada tapi belum memenuhi · `NOL` tidak ada.

## A. Lintas modul & sinkronisasi (prioritas tertinggi)
| Item | Permintaan | Status upstream | Verifikasi | Catatan |
|---|---|---|---|---|
| C1 | Delay sinkronisasi antar-device | Sebagian | ? | Sisa: last-writer-wins pada PATCH; tergantung S-01 |
| C2 | Sinkronisasi offline/online tanpa overrun | Sebagian | ? | |
| C3 | Export PDF langsung download, dari data | Sebagian | ? | |
| A1 | Seeder harga realistis, tidak ada 0 | Sebagian | ? | Gabung dengan seed sintetis Fase 0 |
| A2 | Search di semua tabel | Sebagian | ? | |
| B1 | Filter cabang di top bar dihapus | Belum | ? | **Butuh keputusan** (07-Q1), konflik dengan K-02 |
| B2 | Format titik pada input harga | Belum→dikerjakan | ? | `MoneyInput` sudah dipasang di 6 modul; cek sisa ±150 input |

## B. Proyek
| Item | Permintaan | Status upstream | Verifikasi |
|---|---|---|---|
| P1 | Notifikasi warning maks 3, "tampilkan semua" | Belum | ? |
| P2 | Nomor pada kolom tabel | Belum | ? |
| P3 | Label card total/berjalan/tertunda | Belum | ? |
| P4 | Card gradient, grafik di card dihapus | Belum | ? |
| P5 | Filter popup jadi deret + animasi slide | Belum | ? |
| P6 | "Kelola detail" jadi tombol Detail di kolom Aksi | Belum | ? |
| P7 | Default 25 baris | Belum | ? |
| P9 | Proyek terbaru di atas | Belum | ? |
| P10 | Field cabang → rencana lokasi docking | Belum | ? (07-Q1) |
| P11 | Select searchable kapal/klien/PM | Belum | ? |
| P12 | Status dihapus dari form proyek baru | Sebagian | ? |
| P13 | Hapus teks "(otomatis)" | Belum | ? |
| P14 | Detail keterlambatan di card progres | Belum | ? |
| D2 | Milestone 1 bulan, list | Sebagian | ? |
| D3 | WBS: material ↔ inventori, histori, foto | Belum→dikerjakan | ? |
| D4 | Gantt mini detail bulan | Sebagian | ? |
| D5 | **BoQ per nomor surat, multi pekerjaan** (krusial) | Belum | ? — ubah skema + API + PDF |
| D6 | Dokumen BoQ ke tab Dokumen & Laporan | Sebagian | ? |
| D7 | Change Order lewat approval + terhubung BoQ | Sebagian | ? — tergantung D5 |
| D9 | Rename "Commissioning & Trial" | Belum | ? |
| D10 | Trial checklist dari WBS | Belum→dikerjakan | ? |
| D11 | Garansi per pekerjaan WBS | Belum→dikerjakan | ? |
| D12 | Service dari WBS, teknisi pilihan, biaya BoQ | Belum→dikerjakan | ? |
| D13 | Sparepart **wajib** via PO/stok; service wajib approval | Belum→sebagian | ? — commit hanya referensi PO |
| D14 | Tab Tim terhubung SDM | Sebagian | ? |
| D15 | Section subkon | Belum→dikerjakan | ? |

## C. Equipment, Subkon, QC, Dokumen, SDM
| Item | Permintaan | Status upstream | Verifikasi |
|---|---|---|---|
| E1 | "Catat servis" buka modal catatan dulu | Sebagian | ? |
| E2 | Input jam 24H di semua browser | Belum | ? — buat komponen `TimeInput` bersama |
| E5 | Card biaya per proyek + tombol detail | Belum | ? |
| S3 | Milestone per WO via modal | Sebagian | ? |
| Q2 | Sub-tipe dokumen ↔ tab Sertifikat QC | Sebagian | ? |
| H1a | Preview lampiran tidak dikunci saat diajukan | Sebagian | ? |
| H1c | Surat persetujuan cuti otomatis | Sebagian | ? |
| PD2 | Ikon view → modal dengan download | Belum | ? |

## D. Analitik, Inventori, Finance
| Item | Permintaan | Status upstream | Verifikasi |
|---|---|---|---|
| AN1 | Export Excel Analytics lengkap | Sebagian | ? |
| AN2 | PDF tidak terpotong, garis lebih tebal | Sebagian | ? |
| I2 | Filter Inventori 2 tingkat [jumlah][kategori] | Belum | ? (07-Q4) |
| F1 | Semua tabel Finance: tanggal, sort, tanggal hapus | Sebagian | ? |
| F2 | Kas Bank, BB, Neraca, L/R: filter tanggal | Sebagian | ? |

## E. Ambigu (4 item)
Lihat `legacy/todo5.md`; dibawa ke klien lewat `07`.

## Urutan pengerjaan (Fase 3)
1. **C1/C2** — paling sering dikomplain klien.
2. **D5 → D7** — krusial, mengubah skema.
3. **Proyek UX** (P1–P14) — banyak tapi kecil; satu batch.
4. **Finance** (F1, F2) + **B2 sisa**.
5. **D13 penuh, D2, D4, D6, D14**.
6. Sisanya (E*, S3, Q2, H1*, PD2, AN*, I2).
