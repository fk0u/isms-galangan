# Audit ulang (F5-05) — 2026-10-10

## Ringkasan
| Pemeriksaan | Hasil |
|---|---|
| `npm run check` (web + API, SQLite baru: migrate + seed) | **exit 0** |
| Security probe (42 skenario) | **0 VULN Kritis/Tinggi** |
| Backup → restore ke DB kosong | 68 tabel, jumlah baris identik (`probe:backup`) |
| Lighthouse halaman utama | **belum dijalankan** |
| Uji kering skenario demo 2× | **belum dijalankan** oleh presenter |

## Security probe
Sebelum perbaikan hari ini: `TOTAL 42 SKENARIO | VULN: 5 | K/T VULN: 0 | OK: 33 | N/A: 4`.

| ID | Temuan (tingkat Sedang) | Tindakan |
|---|---|---|
| T19 | PATCH tanpa `baseUpdatedAt` diterima | **Sebagian.** Server kini menulis bersyarat (updated_at + isi data), jadi dua tulis pada versi yang sama menghasilkan tepat satu 200 dan satu 409 (`probe:concurrency`). `baseUpdatedAt` belum diwajibkan karena sebagian layar belum mengirimnya. |
| T20 | Waktu login membedakan akun ada/tidak ada | **Ditutup.** Username tak dikenal tetap menjalankan satu perbandingan hash. |
| T21 | Viewer dapat upload file | **Ditutup.** Upload hanya untuk peran yang punya hak tulis di minimal satu modul. |
| T26 | Header keamanan HTTP tidak ada di API | **Ditutup.** API mengirim nosniff, X-Frame-Options, Referrer-Policy, HSTS, CSP. Nginx web juga mengirim header S-05 (sempat hilang, dipulihkan di PR #43). |
| T27 | `/health` publik membuka versi & dialek | **Ditutup.** Dialek dan versi dihapus dari `/health`; versi kontrak tetap di `/api/version`. |

N/A (T02–T05): isolasi antar-cabang tidak relevan pada mode satu cabang (ADR-0003 Jalur A).

## Probe fungsional yang ditambahkan sprint ini
| Probe | Cakupan |
|---|---|
| `probe:material` (20) | stok tidak pernah minus, PR otomatis, permintaan barang, pemenuhan |
| `probe:service` (17) | service wajib WBS & persetujuan procurement |
| `probe:po-partial` (17) | PO 10 → kirim 6 → alihkan 4 → permintaan selesai |
| `probe:demo-roles` (18) | 14 peran: baca modul sendiri 200, modul lain 403 |
| `probe:wo-spk` (4) | field SPK hanya procurement |
| `probe:inventory-issue` (5) + `probe:stock-issue` (9) | eceran & potongan plat |
| `probe:equipment-loan` (7) | peminjaman bentrok ditolak |
| `probe:checklist` (8) | skor kuesioner dihitung server |
| `probe:change-order` (11) | CO butuh owner; apply membuat revisi BoQ |
| `probe:concurrency` (3) | PATCH atomik |
| `probe:backup` | backup/restore |
| `probe:termin` (8), `probe:hr-rules` | skema termin, PTKP, lembur |

## Hal yang masih terbuka
- **Penyaringan baris per peran di server** (Monitoring F3-E-02): lingkup tim baru di UI.
- **`baseUpdatedAt` wajib** untuk koleksi keuangan/payroll/BoQ (F4-01 lanjutan).
- **Tombol aksi per izin**: belum disembunyikan di semua halaman; server tetap menolak (403).
- **Uji backup/restore di MySQL** (ADR-0010) belum; pilot memakai SQLite.
- **Lighthouse** dan **uji kering demo 2×** belum.
- **Password**: 14 akun demo memakai satu password default dari env server — ganti sebelum dipakai dengan data nyata. Kredensial server yang pernah dibagikan lewat chat perlu dirotasi.
- Task P1/P2 yang belum dikerjakan tercatat `todo` di `docs/handoff/STATUS.md`.

## Hasil akhir
Run terakhir (2026-10-10, SQLite baru): root `npm run check` **exit 0**; security probe `TOTAL 42 SKENARIO | VULN: 1 | K/T VULN: 0 | OK: 37 | N/A: 4` — satu-satunya VULN tersisa adalah T19 (Sedang, lihat tabel).
