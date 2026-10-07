# Sprint 3 Hari — Prototype Demo-Ready

## Hasil yang mengikat
**Akhir hari 3:** aplikasi berjalan dari clone bersih; semua kartu **P0** yang tercantum di bawah merged dengan CI hijau; security probe 0 VULN untuk temuan Kritis; alur demo inti (proyek → BoQ → material → procurement → monitoring) bisa diperagakan.

**Di luar sprint (buffer hari 4–5, bila perlu):** semua kartu P1/P2, F1-01 verifikasi penuh, F2-08, F4-03 realtime, F4-05…07, F3-L-06/08.

**Kriteria hentikan/ubah rencana** (dicek tiap checkpoint):
- Akhir hari 1 < 70% target hari 1 → potong lingkup hari 3 (OWNER memilih dari daftar "boleh dipotong").
- `main` merah > 2 jam → semua jalur berhenti, perbaiki dulu.
- PR rework > 35% → kurangi paralelisme menjadi 3 jalur, perkecil task.

## Kenapa 3 hari mungkin, dan risikonya
Estimasi manusia 59–87 HK turun karena: (1) 4 jalur agent paralel, (2) hanya P0 (58 kartu, sebagian sudah kecil), (3) kartu task sudah berisi file & langkah. Risiko utama: kualitas model Flash pada task besar, konflik file antar-jalur, dan owner sebagai satu-satunya reviewer. Mitigasi ada di register risiko.

## Alokasi nomor migrasi (hindari bentrok)
| No | Task | Jalur |
|---|---|---|
| 008 | F2-04 `token_version` | ARSITEK |
| 009 | F3-C-01 `boqDocs` | JURU-DATA |
| 010 | F3-D-01 / F3-J-01 material request & PO baris | JURU-DATA |
| 011 | F3-K-02 `checklistTemplates`, `checklistResponses` | JURU-DATA |
| 012 | F3-H-03 / F3-I-05 delegasi & skema termin (bila perlu kolom) | JURU-DATA |
| 013 | F2-05 migrasi peran / F2-06 branch default | ARSITEK |

## Rencana per jalur
Urutan dalam satu sel = urutan pengerjaan. ★ = boleh dipotong bila terlambat.

| Hari | A · ARSITEK | B · JURU-DATA | C · JURU-RUPA-1 | D · JURU-RUPA-2 |
|---|---|---|---|---|
| **1** | F0-03 → F1-05 → F4-02 → F2-01 → F2-02 → F2-03 | F0-02 → F3-C-01 → F3-C-02 | F3-A-04 → F3-A-01 → F3-A-02 → F3-B-02 → F3-B-05 | F1-02 → F3-H-01 → F3-H-02 → F3-H-03 → F3-F-02 |
| **2** | F2-04 → F2-05 → F2-06 (Jalur A) → F2-07 | F3-D-01 → F3-J-01 → F3-J-02 → F3-K-02 | F3-C-03 → F3-C-05 → F3-B-06 → F3-B-09 | F3-F-04 → F3-G-02 → F3-G-03 → F3-G-04 → F3-I-02 |
| **3** | F2-09 → F4-01 → F4-04 → F5-01 | F3-D-02 → F3-J-04 → F5-03 | F3-E-01 → F3-E-02 → F3-E-04 → F3-D-03★ | F3-I-03 → F3-I-04 → F3-I-05 → F3-L-02 → F3-L-07 → F3-K-03★ |
| **3 malam** | PEMBERSIH: F6-01…F6-05 · PENGUJI: F5-05 · NAKHODA: F5-04, CHANGELOG | | | |

Tidak masuk sprint (P0 tapi bisa didemokan tanpa): F0-01 (selesai), F1-01 (diganti: setiap kartu memverifikasi item-nya sendiri), F1-04 (CI sudah ada), F3-I-04 ★ bila F2-05 terlambat, F5-02.

## Checkpoint harian
| Waktu | Yang dicek |
|---|---|
| H1 22:00 | A: probe baseline ada, seed login aman. B: seed sintetis jalan di clone bersih, boqDocs ada. C: komponen bersama + daftar proyek. D: equipment selesai. |
| H2 22:00 | A: token bisa dicabut, viewer tak bisa baca payroll. B: alur material stok/PR/PO jalan. C: BoQ surat + CO. D: inventori konversi & barang keluar. |
| H3 20:00 | Semua P0 merged, CI hijau, demo kering 1×. 22:00 cleanup selesai, laporan akhir. |

## Register risiko
| Risiko | Kemungkinan | Dampak | Pemilik | Mitigasi |
|---|---|---|---|---|
| Model Flash salah paham task besar (F2-05, F3-C-03, F3-G-03) | Tinggi | Tinggi | NAKHODA | Pecah jadi sub-langkah per commit; PENGUJI wajib; prompt "rencana dulu, kode kemudian" |
| Konflik merge di file bersama | Sedang | Sedang | NAKHODA | Tabel kepemilikan file; rebase sebelum PR; merge batch per checkpoint |
| Owner jadi bottleneck review | Tinggi | Tinggi | OWNER | PENGUJI pra-review; merge batch 3×/hari; PR kecil |
| CI tidak bisa jalan karena izin GitHub `workflow` | Tinggi (saat ini) | Sedang | OWNER | `gh auth refresh -h github.com -s workflow` sebelum hari 1 |
| Regresi tak terdeteksi (probe tak mencakup fitur baru) | Sedang | Tinggi | PENGUJI | Setiap kartu yang meminta probe wajib menambahkannya ke `check` |
| Kode mati menumpuk karena fitur dihapus revisi klien | Tinggi | Rendah | PEMBERSIH | F6 di malam hari 3 |
