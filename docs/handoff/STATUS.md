# STATUS — Papan Task

Perbarui baris saat mulai/selesai. Status: `todo` · `jalan` · `review` · `selesai` · `terblokir` · `verifikasi saja`.

| Task | Judul | Prioritas | File | PIC | Status | Catatan |
|---|---|---|---|---|---|---|
| F0-01 | Repo git & remote | P0 | F0-setup.md | Kou | selesai | repo publik, commit awal |
| F0-02 | Generator data sintetis untuk seed bulk | P0 | F0-setup.md | agent | selesai | PR #2 |
| F0-03 | `.env` benar-benar dimuat | P0 | F0-setup.md | agent | selesai | PR #1 |
| F0-04 | README & quickstart | P1 | F0-setup.md | | todo | |
| F1-01 | Verifikasi revisi klien item per item | P0 | F1-verifikasi.md | | ditunda | diganti verifikasi per kartu (sprint plan) |
| F1-02 | ESLint minimal | P1 | F1-verifikasi.md | agent | selesai | PR #5 |
| F1-03 | Vitest untuk logika murni | P1 | F1-verifikasi.md | | todo | |
| F1-04 | CI GitHub Actions | P0 | F1-verifikasi.md | | selesai | CI dibuat saat inisialisasi repo |
| F1-05 | Baseline security probe | P0 | F1-verifikasi.md | agent | selesai | PR #3 |
| F2-01 | Akun seed & demo login | P0 | F2-keamanan.md | agent | selesai | PR #6 |
| F2-02 | Konfigurasi default aman | P0 | F2-keamanan.md | agent | selesai | PR #7 |
| F2-03 | Hierarki peran di manajemen user | P0 | F2-keamanan.md | agent | selesai | PR #8 |
| F2-04 | Token bisa dicabut | P0 | F2-keamanan.md | agent | selesai | PR #9 |
| F2-05 | `policy.ts`: enum peran + izin baca/tulis | P0 | F2-keamanan.md | agent | selesai | PR #10 |
| F2-06 | Scope cabang di server | P0/P1 | F2-keamanan.md | agent | selesai | PR #11 |
| F2-07 | Login mengirim cabang & cache offline aman | P0 | F2-keamanan.md | agent | selesai | PR #12 |
| F2-08 | Audit trail wajib & terbatas | P1 | F2-keamanan.md | agent | selesai | PR #13 |
| F2-09 | Security probe jadi gate CI | P0 | F2-keamanan.md | | todo | |
| F3-A-01 | Hapus filter cabang di top bar | P0 | F3-A-lintas-modul.md | agent | selesai | PR #15 |
| F3-A-02 | Format titik untuk semua input harga | P0 | F3-A-lintas-modul.md | agent | selesai | PR #16 |
| F3-A-03 | Pagination tabel diperbaiki | P1 | F3-A-lintas-modul.md | | todo | |
| F3-A-04 | Komponen bersama untuk task berikutnya | P0 | F3-A-lintas-modul.md | agent | selesai | PR #14 |
| F3-B-01 | Banner notifikasi maks 3 | P1 | F3-B-proyek.md | | todo | |
| F3-B-02 | Tabel: nomor, tombol Detail, urutan terbaru | P0 | F3-B-proyek.md | agent | selesai | PR #17 |
| F3-B-03 | Card status gradient + label | P1 | F3-B-proyek.md | | todo | |
| F3-B-04 | Filter jadi deret chip | P1 | F3-B-proyek.md | | todo | |
| F3-B-05 | Form proyek baru | P0 | F3-B-proyek.md | agent | selesai | PR #18 |
| F3-B-06 | Rumus progres proyek | P0 | F3-B-proyek.md | agent | selesai | PR #19 |
| F3-B-07 | Header & card progres | P1 | F3-B-proyek.md | | todo | |
| F3-B-08 | Ringkasan: Log Penawaran & Tagihan, milestone | P1 | F3-B-proyek.md | | todo | |
| F3-B-09 | WBS: progres, material, histori, foto, assign | P0 | F3-B-proyek.md | agent | selesai | PR #20 |
| F3-B-10 | Gantt mini dengan label bulan | P2 | F3-B-proyek.md | | todo | |
| F3-B-11 | Perubahan & Risiko: hapus tabel risiko | P1 | F3-B-proyek.md | | todo | |
| F3-B-12 | Terkait: Trial & Garansi | P1 | F3-B-proyek.md | | todo | |
| F3-B-13 | Tab Tim terhubung SDM | P1 | F3-B-proyek.md | | todo | |
| F3-B-14 | Verifikasi tab Subkon | P2 | F3-B-proyek.md | | todo | |
| F3-C-01 | Migrasi & API boqDocs | P0 | F3-C-boq-change-order.md | agent | selesai | PR (lihat progress) |
| F3-C-02 | Migrasi data lama | P0 | F3-C-boq-change-order.md | agent | review | PR #22; commit `6554095`; re-review PENGUJI lulus; api & GitGuardian lulus, web & reviewer otomatis masih berjalan; menunggu seluruh checks dan keputusan merge OWNER |
| F3-C-03 | UI list & detail surat BoQ | P0 | F3-C-boq-change-order.md | | todo | |
| F3-C-04 | PDF & dokumen | P1 | F3-C-boq-change-order.md | | todo | |
| F3-C-05 | Change Order lewat owner & terhubung BoQ | P0 | F3-C-boq-change-order.md | | todo | |
| F3-D-01 | Tambah sparepart dari inventori | P0 | F3-D-service-sparepart.md | | todo | |
| F3-D-02 | Service: dari WBS, teknisi, biaya BoQ, approval | P0 | F3-D-service-sparepart.md | | todo | |
| F3-D-03 | Probe alur material | P1 | F3-D-service-sparepart.md | | todo | |
| F3-E-01 | Feed update pekerjaan dengan foto | P0 | F3-E-monitoring.md | | todo | |
| F3-E-02 | Tampilan per peran | P0 | F3-E-monitoring.md | | todo | |
| F3-E-03 | Label "Perhatian khusus" | P1 | F3-E-monitoring.md | | todo | |
| F3-E-04 | Tombol Kembali ke asal | P0 | F3-E-monitoring.md | | todo | |
| F3-E-05 | Highlight menu aktif di sidebar | P1 | F3-E-monitoring.md | | todo | |
| F3-F-01 | Batas maksimal kapal per dock | P1 | F3-F-drydock.md | | todo | |
| F3-F-02 | Sederhanakan halaman: Mapping slot area | P0 | F3-F-drydock.md | agent | review | Branch `feat/F3-F-02-drydock-mapping`; P2 status search ID/EN dan P3 SSR EN diperbaiki lokal; `npm run check` 37/37; re-review independen lokal pending; PR #24 masih di e21f8fe, fix belum dipush/merge |
| F3-F-03 | Waiting list dock | P1 | F3-F-drydock.md | | todo | |
| F3-F-04 | Form booking slot | P0 | F3-F-drydock.md | | todo | |
| F3-F-05 | Jadwalkan maintenance | P1 | F3-F-drydock.md | | todo | |
| F3-G-01 | Katalog dirapikan | P1 | F3-G-inventori.md | | todo | |
| F3-G-02 | Tambah material + konversi satuan | P0 | F3-G-inventori.md | | todo | |
| F3-G-03 | Barang keluar: eceran & potongan | P0 | F3-G-inventori.md | | todo | |
| F3-G-04 | BOM terima & keluar barang | P0 | F3-G-inventori.md | | todo | |
| F3-G-05 | Pergerakan: 2 grafik tren, kolom Dari/Ke, slow & dead stock | P1 | F3-G-inventori.md | | todo | |
| F3-G-06 | Sembunyikan surat jalan | P2 | F3-G-inventori.md | | todo | |
| F3-G-07 | Auto-refresh tanpa tombol Muat ulang | P1 | F3-G-inventori.md | | todo | |
| F3-H-01 | Form & tabel equipment | P0 | F3-H-equipment.md | | todo | |
| F3-H-02 | Tab & kartu ringkasan | P0 | F3-H-equipment.md | | todo | |
| F3-H-03 | Delegasi peminjaman | P0 | F3-H-equipment.md | | todo | |
| F3-I-01 | Bersihkan modul | P1 | F3-I-subkon.md | | todo | |
| F3-I-02 | Work Order rinci | P0 | F3-I-subkon.md | | todo | |
| F3-I-03 | Update progres WO dengan foto & histori | P0 | F3-I-subkon.md | | todo | |
| F3-I-04 | SPK terkunci kecuali procurement | P0 | F3-I-subkon.md | | todo | |
| F3-I-05 | Termin: tabel, skema, pajak | P0 | F3-I-subkon.md | | todo | |
| F3-J-01 | Material request sebagai penghubung | P0 | F3-J-procurement.md | | todo | |
| F3-J-02 | PO terpenuhi sebagian & pengalihan vendor | P0 | F3-J-procurement.md | | todo | |
| F3-J-03 | RFQ: perbandingan harga & track record, tanpa tender | P1 | F3-J-procurement.md | | todo | |
| F3-J-04 | Approval service oleh procurement | P0 | F3-J-procurement.md | | todo | |
| F3-K-01 | Hapus tab Drawing | P1 | F3-K-qc-safety.md | | todo | |
| F3-K-02 | Mesin kuesioner & skoring | P0 | F3-K-qc-safety.md | | todo | |
| F3-K-03 | Inspeksi per proyek | P0 | F3-K-qc-safety.md | | todo | |
| F3-K-04 | HSE: kuesioner pekerja | P1 | F3-K-qc-safety.md | | todo | |
| F3-L-01 | Tabel karyawan & tab | P1 | F3-L-sdm-absensi.md | | todo | |
| F3-L-02 | Data karyawan lengkap | P0 | F3-L-sdm-absensi.md | | todo | |
| F3-L-03 | Skill matriks dengan persentase | P1 | F3-L-sdm-absensi.md | | todo | |
| F3-L-04 | Sertifikat lengkap | P1 | F3-L-sdm-absensi.md | | todo | |
| F3-L-05 | Surat: kontrak, perpanjangan, SP, preview & kop | P0 | F3-L-sdm-absensi.md | | todo | |
| F3-L-06 | Cuti/izin mandiri via QR | P1 | F3-L-sdm-absensi.md | | todo | |
| F3-L-07 | Absensi: rekap bulanan, tanpa shift, lembur otomatis | P0 | F3-L-sdm-absensi.md | | todo | |
| F3-L-08 | Integrasi alat absensi | P2 | F3-L-sdm-absensi.md | | todo | |
| F3-M-01 | Detail data kapal | P1 | F3-M-lainnya.md | | todo | |
| F3-M-02 | Analitik: date picker, hapus prediktif & preskriptif | P1 | F3-M-lainnya.md | | todo | |
| F3-M-03 | Dashboard: report perlu perhatian per kategori | P1 | F3-M-lainnya.md | | todo | |
| F3-M-04 | Keuangan: tanggal & sort (sisa F1/F2 lama) | P2 | F3-M-lainnya.md | | todo | |
| F4-01 | Concurrency atomik | P0 | F4-integritas.md | | todo | |
| F4-02 | Transaksi untuk operasi multi-langkah | P0 | F4-integritas.md | agent | selesai | PR #4 |
| F4-03 | Realtime perubahan data | P1 | F4-integritas.md | | todo | |
| F4-04 | Relasi baru di `refs.ts` | P0 | F4-integritas.md | | todo | |
| F4-05 | File upload terkontrol | P1 | F4-integritas.md | | todo | |
| F4-06 | Kinerja frontend | P1 | F4-integritas.md | | todo | |
| F4-07 | Lain-lain audit | P1 | F4-integritas.md | | todo | |
| F5-01 | Docker & deploy | P0 | F5-demo.md | | todo | |
| F5-02 | Backup & restore teruji | P0 | F5-demo.md | | todo | |
| F5-03 | Data demo yang bercerita | P0 | F5-demo.md | | todo | |
| F5-04 | Skenario demo per modul | P0 | F5-demo.md | | todo | |
| F5-05 | Audit ulang | P0 | F5-demo.md | | todo | |
| F6-01 | Deteksi kode mati dengan knip | P1 | F6-cleanup.md | PEMBERSIH | todo | malam H3 |
| F6-02 | Hapus file, export, dan dependensi tak terpakai | P1 | F6-cleanup.md | PEMBERSIH | todo | malam H3 |
| F6-03 | Kunci i18n yang tidak dipakai | P1 | F6-cleanup.md | PEMBERSIH | todo | malam H3 |
| F6-04 | Lint nol error, warning turun | P1 | F6-cleanup.md | PEMBERSIH | todo | malam H3 |
| F6-05 | Pecah file raksasa yang disentuh sprint | P2 | F6-cleanup.md | PEMBERSIH | todo | |
