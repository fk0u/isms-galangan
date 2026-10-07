# 08 — Revisi Klien 5–6 Oktober 2026 (Master List)

Sumber: catatan revisi klien "NEW REVISION 5-6 OKTOBER GALANGAN" (diterima 7 Okt 2026).
Ini **sumber kebenaran fungsional** untuk Fase 3. Daftar lama (`legacy/todo5.md`, item A1…F2) dipetakan ke ID baru di kolom "Lama".

Setiap item punya ID tetap. ID dipakai di nama branch, commit, dan task handoff.
Kolom **Upstream**: kondisi di commit `805e636` menurut klaim developer asal — `✓` dikerjakan, `~` sebagian, `–` belum. Semua wajib diverifikasi di task F1-01.
Kolom **Task**: file handoff yang mengerjakannya.

## ETC — Lintas modul
| ID | Permintaan | Lama | Upstream | Task |
|---|---|---|---|---|
| ETC-01 | Filter "semua cabang" di top bar dihapus | B1 | – | F3-A |
| ETC-02 | Semua input harga memakai format titik (1.000.000) | B2 | ~ (`MoneyInput` di 6 modul) | F3-A |
| ETC-03 | Alur material: proyek → BoQ → BoQ keluar → mekanik dapat BoQ → minta barang (barang keluar) → stok kosong ⇒ procurement, stok ada ⇒ barang keluar | – | – | F3-J |
| ETC-04 | Alur procurement: PO ke vendor → vendor tidak sanggup sebagian/semua ⇒ sisa ke vendor lain → semua terpenuhi ⇒ barang masuk | – | – | F3-J |
| ETC-05 | RFQ: track record harga per barang/vendor | – | – | F3-J |
| ETC-06 | RFQ: sistem tender vendor dihapus, perbandingan harga tetap | – | – | F3-J |
| ETC-07 | Perbaiki pagination di bawah tabel (semua modul) | – | – | F3-A |

## 1. Manajemen Proyek
| ID | Permintaan | Lama | Upstream | Task |
|---|---|---|---|---|
| PRJ-01 | Notifikasi warning maks 3; "Perkecil" → "Tampilkan semua" | P1 | – | F3-B |
| PRJ-02 | Kolom nomor urut di tabel | P2 | – | F3-B |
| PRJ-03 | Card Total: label Selesai & Sedang Berjalan; card Sedang Berjalan: label Tertunda | P3 | – | F3-B |
| PRJ-04 | Semua card status gradient; grafik di card dihapus | P4 | – | F3-B |
| PRJ-05 | Filter: dari popup → tampil deret dengan animasi slide | P5 | – | F3-B |
| PRJ-06 | "Kelola detail" pindah ke kolom Aksi sebagai tombol "Detail" | P6 | – | F3-B |
| PRJ-07 | Default 25 baris | P7 | – | F3-B |
| PRJ-08 | Progres proyek disesuaikan lagi (rumus progres) | P8? | ~ (override Terlambat) | F3-B · butuh klarifikasi Q11 |
| PRJ-09 | Proyek terbaru di atas | P9 | – | F3-B |
| PRJ-10 | Field cabang → "Rencana lokasi docking" | P10 | – | F3-B |
| PRJ-11 | Select searchable: nama kapal, klien, PM | P11 | – | F3-B |
| PRJ-12 | Form proyek baru tanpa status; default "Dalam Proses" | P12 | ~ | F3-B |
| PRJ-13 | Detail: hapus teks "(otomatis)" pada Terlambat | P13 | – | F3-B |
| PRJ-14 | Detail: card progres tampilkan alasan bila Terlambat dll | P14 | – | F3-B |
| PRJ-15 | Ringkasan: Desain & Class Approval → Log Penawaran & Tagihan | D1 | ✓ | F3-B (verifikasi) |
| PRJ-16 | Ringkasan: milestone horizon 1 bulan, bentuk list | D2 | ~ | F3-B |
| PRJ-17 | WBS: update progres → material ikut inventori; histori perubahan + foto tampil | D3 | ✓? | F3-B |
| PRJ-18 | WBS: Gantt mini dengan label bulan di bawah indikator | D4 | ~ | F3-B |
| PRJ-19 | **BoQ per nomor surat** (1 surat = banyak pekerjaan; list hanya total/status/dokumen/aksi; klik → detail; **status revisi krusial**) | D5 | – | F3-C |
| PRJ-20 | Dokumen BoQ ikut di tab Dokumen & Laporan; rapikan tampilan | D6 | ~ | F3-C |
| PRJ-21 | Change Order wajib persetujuan **owner** dulu, terhubung BoQ | D7 | ~ | F3-C |
| PRJ-22 | Hapus tabel Risiko di tab Perubahan & Risiko | – | – (upstream malah menambah risiko auto D8) | F3-B · lihat Q12 |
| PRJ-23 | Rename "Commissioning & Sea Trial" → "Commisioning & Trial" | D9 | – | F3-B |
| PRJ-24 | Trial: checklist pekerjaan dari WBS + catatan + kondisi (Sesuai / Tidak sesuai / Perlu diperbaiki) | D10 | ✓? | F3-B |
| PRJ-25 | Garansi per pekerjaan WBS, kartu garansi keluar saat pekerjaan selesai | D11 | ✓? | F3-B |
| PRJ-26 | Service: list dari WBS; teknisi = pilihan karyawan; biaya terkait BoQ | D12 | ~ | F3-D |
| PRJ-27 | Service & Sparepart: mekanik hanya lewat PO ke stok; service wajib approval procurement | D13 | ~ | F3-D |
| PRJ-28 | Tab Tim terhubung SDM & karyawan | D14 | ~ | F3-B |
| PRJ-29 | Section Subkontraktor di detail proyek | D15 | ✓? | F3-B (verifikasi) |
| PRJ-30 | Tambah sparepart: pilih dari inventori, tampil stok; stok kosong ⇒ PO, ada ⇒ barang keluar (tab Pergerakan) | – | – | F3-D |
| PRJ-31 | WBS: tombol Assign pengerja (internal karyawan / eksternal subkon) | – | – | F3-B |

## 2. Monitoring Proyek (perhatian khusus)
| ID | Permintaan | Task |
|---|---|---|
| MON-01 | Update proyek dengan foto; monitoring berfungsi sebagai "monitoring pekerjaan" | F3-E |
| MON-02 | Tampilan & aksi berbeda per role (RBAC) | F3-E (bergantung F2) |
| MON-03 | Label "Proyek perlu perhatian" → "Perhatian khusus", merah | F3-E |
| MON-04 | Tombol "Kembali" kembali ke halaman asal (Monitoring atau Manajemen Proyek) | F3-E |
| MON-05 | Highlight menu aktif di sidebar | F3-E |

## 3. Drydock & Kapasitas
| ID | Permintaan | Task |
|---|---|---|
| DRY-01 | Keterangan batas maksimal kapal per dock (panjang, lebar, draft, DWT) | F3-F |
| DRY-02 | Hapus peta kapasitas, utilisasi per fasilitas, peta kapasitas area, slot per area. "Slot docking aktif" jadi detail dari "Mapping slot area" yang bisa diklik | F3-F |
| DRY-03 | "Rencana docking tahunan" → "Waiting list dock" | F3-F |
| DRY-04 | Booking slot: tanggal mulai/selesai via date picker (bukan "mulai ke/selesai ke"); area selectable; pilih proyek ⇒ tanggal otomatis dari jadwal proyek (bisa diubah) | F3-F |
| DRY-05 | "Blokir maintenance" → "Jadwalkan maintenance"; mulai/selesai date picker; alasan di paling bawah | F3-F |

## 4. Inventori & Material
| ID | Permintaan | Task |
|---|---|---|
| INV-01 | Hapus tombol muat ulang; data inventori auto-refresh saat ada perubahan di server | F3-G (bergantung F4-03 realtime) |
| INV-02 | Katalog: kategori diberi warna; hapus teks impor, kolom Kelas ABC, kolom Bin; pindahkan selector (Katalog/IN/OUT), template Excel, impor CSV ke sebelah tombol Scan; hapus teks detail di bawah status | F3-G |
| INV-03 | Tambah material: "Dijual eceran" → "Eceran"; hapus "min stok gudang ini"; alur lebih jelas; **form konversi satuan muncul sesuai kategori** (1 drum = x liter, 1 plat = ukuran & berat) | F3-G |
| INV-04 | BOM terhubung dua arah dengan procurement | F3-G + F3-J |
| INV-05 | BOM — Terima barang: tabel checklist; barang masuk 2 kategori: dari procurement & additional | F3-G |
| INV-06 | BOM — Barang keluar: list permintaan (procurement) + checklist; additional list untuk barang baru; Retur tanpa vendor ("Retur ke vendor" → "Retur") | F3-G |
| INV-07 | Pergerakan: 2 grafik tren (masuk & keluar); kolom "Dari gudang/Ke gudang" → "Dari/Ke" | F3-G |
| INV-08 | Barang keluar: tipe eceran vs pcs; perhitungan khusus (potongan plat dengan ukuran; galon/drum/tonase → liter dll) | F3-G |
| INV-09 | Surat jalan disembunyikan | F3-G |
| INV-10 | Hapus tab Analisis; card slow moving & dead stock pindah ke Pergerakan | F3-G |

## 5. Equipment
| ID | Permintaan | Task |
|---|---|---|
| EQP-01 | Form tambah: cabang hidden default Samarinda; Nomor seri → Tahun unit; + Tahun akuisisi; PIC → Penanggung jawab unit; Model → Merk; Utilisasi awal → Estimasi utilisasi saat ini; Umur ekonomis → Estimasi umur pakai (bulan); + Keterangan; Harga perolehan → Harga barang; Tarif pakai & harga BBM disembunyikan | F3-H |
| EQP-02 | Tabel mengikuti form | F3-H |
| EQP-03 | Tab Register → "Daftar Equipment"; hapus tab Alokasi/Booking, Sedang Dipakai, Maintenance, Kalibrasi, Biaya | F3-H |
| EQP-04 | Card analisis: Total, Sedang terpakai, Dalam maintenance (kalibrasi + service) | F3-H |
| EQP-05 | Aksi "Delegasi" peminjaman per equipment; maintenance dijalankan lewat delegasi | F3-H |

## 6. Subkontraktor
| ID | Permintaan | Task |
|---|---|---|
| SUB-01 | Hapus evaluasi kinerja | F3-I |
| SUB-02 | Work order rinci: subkon, kapal yang dikerjakan, proyek | F3-I |
| SUB-03 | Filter hanya status, semua status langsung tampil (chip) | F3-I |
| SUB-04 | Update progres WO dengan foto + histori perubahan | F3-I |
| SUB-05 | SPK tidak bisa diubah kecuali oleh procurement | F3-I (bergantung F2) |
| SUB-06 | Perbaiki tampilan | F3-I |
| SUB-07 | Tabel Termin: proyek, subkon, WO, nilai, retensi, neto, status | F3-I |
| SUB-08 | Skema termin: persentase, DP bertahap (DP1, DP2, …), atau kontan | F3-I |
| SUB-09 | Field PPh → "Pajak" dengan pilihan persentase | F3-I |
| SUB-10 | Hapus tab Timesheet | F3-I |

## 7. QC & Safety
| ID | Permintaan | Task |
|---|---|---|
| QC-01 | Hapus tab Drawing | F3-K |
| QC-02 | Inspeksi: list proyek → klik → pekerjaan, subkon & pekerja → poin cek berbentuk kuesioner + skoring | F3-K |
| QC-03 | Tab HSE: kuesioner untuk pekerja | F3-K |
| QC-04 | Hal lain menunggu diskusi dengan K3 kapal | — (Q13) |

## 8. SDM & Karyawan
| ID | Permintaan | Task |
|---|---|---|
| HR-01 | Urutan tabel stabil: edit tidak memindah posisi; data baru di bawah | F3-L |
| HR-02 | Tipe karyawan: Training, Kontrak, Tetap, Outsourcing; + Kontrak kerja sama & kontrak terakhir | F3-L |
| HR-03 | Skill matriks: tambah skill lebih jelas + persentase | F3-L |
| HR-04 | Kolom "Dibuat" → "Terakhir diupdate" | F3-L |
| HR-05 | Sertifikat: file, nomor, diterbitkan, berlaku hingga | F3-L |
| HR-06 | Cuti/izin diajukan mandiri oleh karyawan via **barcode/QR** ke form | F3-L |
| HR-07 | Hapus tab Mutasi & Org Chart | F3-L |
| HR-08 | Buat surat: kontrak baru, perpanjang kontrak (dengan histori), SP; preview sebelum simpan; kop surat | F3-L |
| HR-09 | Foto karyawan, foto KTP, ijazah terakhir | F3-L |
| HR-10 | Jabatan = dropdown | F3-L |
| HR-11 | Pendidikan terakhir (select), status kawin, tanggungan, jenis kelamin → **PTKP otomatis** | F3-L |

## 9. Absensi
| ID | Permintaan | Task |
|---|---|---|
| ABS-01 | Status hari ini otomatis dari alat absensi | F3-L (Q14) |
| ABS-02 | Langsung rekap bulanan | F3-L |
| ABS-03 | Filter bulan & tahun | F3-L |
| ABS-04 | Hapus shift | F3-L |
| ABS-05 | Lembur otomatis setelah 8 jam kerja, dengan batas maksimal | F3-L |
| ABS-06 | Hapus tren kehadiran | F3-L |

## 10–14. Modul lain
| ID | Permintaan | Task |
|---|---|---|
| VSL-01 | Data kapal: tampilkan detail lengkap | F3-M |
| ANL-01 | Analitik: rentang bulan dengan date picker | F3-M |
| ANL-02 | Hapus analitik prediktif & preskriptif | F3-M |
| DSH-01 | Dashboard "Report perlu perhatian": pilih kategori dulu, tidak tampil semua | F3-M |
| PRC-* | Procurement — lihat ETC-03…06 | F3-J |
| FIN-* | Keuangan — tidak ada revisi baru; sisa F1/F2 lama dibawa | F3-M |

## Item lama todo5 yang tidak muncul lagi di revisi ini
C1/C2 (sinkronisasi), C3 (PDF), A1 (harga seed), A2 (search), E1, E2 (input jam 24H), E5, S3, Q2, H1a, H1c, AN1, AN2, PD2, I2, F1, F2.
Tetap dikerjakan bila tidak bertentangan dengan revisi baru: C1/C2 di F4, E2 di F3-L, F1/F2 di F3-M. Sisanya ditandai **perlu konfirmasi** (Q15).
