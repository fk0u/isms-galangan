# Handoff ke AI agent berikutnya — 11 Okt 2026 (malam)

Dokumen ini adalah **titik masuk terbaru**. Dua dokumen handoff sebelumnya masih berguna sebagai rujukan, tetapi sebagian isinya sudah usang (lihat bagian 6).
Baca `AGENTS.md` dulu. Repo ini publik: jangan menulis kredensial, alamat akses server, atau data nyata.

## 1. Posisi sekarang

- `main` = `8bb2b02` (PR #64), **sudah ter-deploy** di server pilot.
- Semua PR #56–#64 sudah di-merge. Tidak ada PR terbuka selain PR dokumen ini.
- Sumber status per task: `docs/handoff/STATUS.md`. Catatan: PR #61–#64 mengerjakan permintaan langsung pemilik proyek yang **tidak punya kartu task**, jadi tidak tercatat di sana.
- Di mesin kerja pemilik ada branch lokal `feat/wbs-doc-approval-inventory-enhancement` (belum ada commit) dan berkas **belum ter-commit** `docs/handoff/HANDOFF-AI-2026-10-11-BATCH2.md` berisi spesifikasi 8 butir pekerjaan berikutnya (ringkasannya di bagian 4). Bila kamu bekerja di mesin itu, jangan menimpa atau membuang berkas tersebut.

## 2. Yang dikerjakan 11 Okt (setelah handoff 10 Okt)

| PR | Isi | Diuji klik? |
|---|---|---|
| #57 | Realtime SSE (`/api/events`), cuti via QR (ADR-0017), ingest alat absensi + impor CSV, PDF BoQ & kartu garansi, lingkup tim server untuk peran proyek/mekanik, berkas KTP/ijazah hanya HR, lazy route, Vitest, probe simetri i18n | Sebagian (lokal) |
| #58 | Hapus migrasi `016_leave_access` yang ikut ter-commit; `017` membuang tabelnya | – |
| #59 | Perbaikan hasil uji klik: risiko otomatis terduplikasi (`claimAutoRisk`), CORS stream realtime, PDF BoQ tumpang tindih, data karyawan di surat kontrak; form kop surat di Pengaturan; knip | Ya (lokal) |
| #60 | Mode "Rentang tanggal" di filter periode Keuangan, rentang bulan Analitik, toolbar impor katalog, dokumen proyek per tipe | Ya (lokal) |
| #61 | `components/FlowTree.tsx` + tampilan pohon di halaman Dokumen | Ya (lokal) |
| #62 | Pohon WBS berfoto (`pages/proyek/WbsTree.tsx`), pohon BoQ, pohon Permintaan Barang, pohon Dokumen proyek; `routes/readModels.ts` (pasangan GET untuk endpoint tulis) | Tiga dari empat pohon |
| #63 | `listCache.ts` (cache daftar + ETag), `GET /api/project-sides`, cache gambar & dedupe GET di klien, header cache `/files`; foto riwayat tahapan WBS dimuat dengan token | Ya (lokal) |
| #64 | **Dikerjakan agent lain.** BoQ di modul Dokumen (`pages/dokumen/BoqDetailModal.tsx`), cetak BoQ lewat HTML (`utils/printBoqHtml.ts`, `utils/terbilang.ts`), typo "Commissioning", WBS proyek baru kosong (`wbsFor` → `[]`); juga mengubah resolusi `SQLITE_PATH` di `services/api/src/db.ts`, skrip probe di `package.json`, dan `security-probe.ts` | **Tidak diketahui** |

## 3. Yang BELUM diverifikasi (jangan diklaim selesai)

- **PR #64 belum ditinjau maupun diuji oleh penulis dokumen ini.** Yang diketahui hanya: CI lulus, kata "Commissioning" sudah benar di `n_prj.ts`, dan `wbsFor` kini mengembalikan `[]`. Empat tugas di `HANDOFF-AI-2026-10-11.md` masih bercentang kosong; periksa tiap kriteria terimanya di aplikasi.
- Perubahan #64 pada `db.ts` (jalur DB bawaan) dan `security-probe.ts` menyentuh jalur keamanan dan data; baca diff-nya sebelum mengandalkannya.
- Tidak ada uji klik di **server live** dengan login sungguhan untuk pekerjaan mana pun sejak 10 Okt. Semua uji klik dilakukan di lingkungan lokal.
- Belum diuji klik sama sekali: pohon Dokumen di detail proyek, perbesar foto, pendaftaran alat absensi lewat UI, login sebagai mekanik (lingkup tim), tampilan mobile.

## 4. Pekerjaan berikutnya

### 4a. Spesifikasi 8 butir (dari `HANDOFF-AI-2026-10-11-BATCH2.md`, belum ter-commit)
Konfirmasikan dulu ke pemilik proyek bahwa daftar ini masih berlaku, lalu ikuti rincian di berkas itu bila tersedia.
1. WBS: tabel tahapan sebagai tampilan bawaan; pohon (`WbsTree`) di balik toggle Tampilkan/Sembunyikan, bawaan tersembunyi.
2. WBS: hapus tahapan dengan konfirmasi; bobot bawaan 0; info sisa bobot menuju 100%.
3. Toast dan konfirmasi sepenuhnya berbasis state React.
4. Istilah "Desain" → "Perencanaan" (EN "Planning & Design").
5. Modul Dokumen: lencana dan filter "butuh cek/approval".
6. Status Class dan subclass (BKI) per item pada fase Perencanaan + ringkasan di proyek.
7. Pengambilan material wajib lewat persetujuan gudang walau stok cukup. **Ini mengubah alur ADR-0015** (stok cukup = langsung keluar): tulis ADR baru dan sesuaikan `services/api/src/materialRequests.ts` beserta probe `material-flow`.
8. Modal Tambah Karyawan dilebarkan, 2–3 kolom.

### 4b. Sisa task berkartu
- `todo`: F6-05 (pecah file raksasa, P2).
- `sebagian` (rincian di STATUS.md): F3-E-02 (subkon & viewer klien belum dibatasi; WBS/BoQ proyek lain masih terbaca lewat endpoint masing-masing), F3-K-04 (HSE mandiri via QR, rekap per subkon), F3-L-06 (lampiran sengaja tidak ada), F4-05 (tabel metadata files), F4-06 (kompres model glb), F4-07 (font PDF, `npm audit`), F6-02 (export tak terpakai), F6-03 (hapus kunci i18n mati).

### 4c. Risiko terbuka
- **Antrean offline mengirim ulang seluruh koleksi.** Saat uji lokal, satu tab mengirim >4.500 permintaan (POST lalu PATCH tiap baris `invoices`) sampai kena 429. Itu perilaku bawaan antrean `isms.dirty` di `data/store.tsx`, diperparah tarik ulang oleh realtime. Server live tenang saat diperiksa, tetapi akar masalah belum diperbaiki.
- **Muat halaman masih ±100 permintaan berbeda**: aplikasi menarik semua koleksi saat mulai. Belum diubah.
- **Identitas yang tampak nyata di repo publik** (bertentangan dengan AGENTS.md butir 9): kop perusahaan, alamat, telepon, nama direktur di `services/api/src/pdf/documents/shared.ts` dan `apps/web/src/utils/sb.ts`; nama perusahaan klien di `apps/web/src/data/index.ts` dan `services/api/scripts/pdf-probe.ts`. Menunggu keputusan pemilik; jangan diubah sendiri.
- Kunci SSH server sempat terbaca ke dalam satu percakapan agent; pemilik disarankan menggantinya.

## 5. Jebakan (tambahan dari handoff 10 Okt)

- `npm run check` butuh DB sementara yang sudah dimigrasi dan di-seed, dengan env yang sama untuk ketiga perintah: `SQLITE_PATH=/tmp/x.db JWT_SECRET=<acak ≥32 karakter>` → di `services/api`: `npm run migrate && npm run seed`; di root: `npm run check`. Butuh 10–15 menit; jangan mengedit file selagi berjalan. Catatan: sejak #64 skrip probe memuat `.env` (`--env-file-if-exists`) dan `db.ts` mencari `data/isms.db` bila `SQLITE_PATH` kosong — pastikan env di atas benar-benar terpasang supaya probe tidak menyentuh DB kerja.
- Migrasi yang sudah diterapkan **tidak boleh diedit** (API menolak start bila checksum berubah; darurat: `MIGRATE_ALLOW_DRIFT=true`). Selalu tambah berkas baru. Migrasi terakhir: `017_drop_leave_access.sql`.
- `listCache.ts` meng-cache respons daftar 5 detik dan menggugurkannya lewat `dbEvents` (dipancarkan dari `exec()` di `db.ts`). Tulis lewat jalur lain (mis. koneksi SQLite terpisah) tidak menggugurkan cache.
- Event realtime dipancarkan sebelum transaksi commit; ada jeda 400 ms di server dan 500 ms di klien untuk menutupinya.
- `FlowTree` menerima `content` (isi di bawah simpul) dan `trailing`; simpul tingkat teratas tanpa anak tampil tanpa garis.
- Berkas di `/files/*` butuh token. Jangan pakai `<img src>` atau `<a href>` polos; pakai `SecureImg` / `DocumentPreviewCell`.
- Skrip probe web (`apps/web/scripts`) tidak punya tipe node: jangan pakai `process`, gagal dengan `throw`.
- Mengubah `apps/web/src/data/seeds.ts` atau `data/index.ts` → `TZ=UTC npm run seed:mirror` di `services/api`. Seed bersifat insert-if-missing: field baru tidak sampai ke baris lama di server.
- File halaman besar (`ProjectDetail`, `Inventory`, `HR`, `Finance`): edit dengan penggantian string unik lalu `npx tsc --noEmit`; `noUnusedLocals` aktif. Lint dibatasi `--max-warnings` 74 (web) / 29 (api).
- Tunggu **semua** cek CI selesai sebelum merge.

## 6. Dokumen handoff lain dan apa yang usang

- `HANDOFF-AI-2026-10-10.md`: tabel batch 1–3 dan daftar jebakan masih benar. **Usang:** bagian "Posisi sekarang" (menyebut `feat/p1-batch-2` belum di-merge) dan daftar `todo`.
- `HANDOFF-AI-2026-10-11.md`: spesifikasi 4 tugas yang kemudian dikerjakan di PR #64. **Usang:** menyebut `main` di PR #63 dan menyajikan keempat tugas sebagai belum dikerjakan. Kriteria terimanya tetap berguna sebagai daftar periksa untuk memverifikasi #64.

## 7. Prompt siap pakai

```
Kamu melanjutkan proyek ISMS Galangan (monorepo React 19 + Vite di apps/web, Fastify 5 di
services/api; repo publik). Balas dalam bahasa Indonesia.

Sebelum mengubah apa pun, baca berurutan:
1. AGENTS.md (aturan wajib dan format ringkasan akhir)
2. docs/handoff/HANDOFF-AI-2026-10-11-MALAM.md (posisi terbaru, risiko, jebakan)
3. docs/handoff/STATUS.md
4. CONTEXT.md dan DESIGN.md
5. Bila ada di mesin ini: docs/handoff/HANDOFF-AI-2026-10-11-BATCH2.md (spesifikasi 8 butir;
   berkas itu mungkin belum ter-commit, jangan ditimpa atau dibuang)

Keadaan: main = 8bb2b02 (PR #64), sudah ter-deploy. PR #64 dikerjakan agent lain dan BELUM
ditinjau maupun diuji klik.

Kerjakan berurutan:
A. Verifikasi PR #64. Jalankan aplikasi lokal, lalu periksa satu per satu kriteria terima di
   docs/handoff/HANDOFF-AI-2026-10-11.md (BoQ di modul Dokumen + buka detail, cetak PDF dan
   ekspor Excel BoQ, ejaan "Commissioning", WBS proyek baru kosong). Baca juga diff #64 pada
   services/api/src/db.ts dan services/api/scripts/security-probe.ts. Laporkan apa adanya
   yang lolos dan yang tidak, perbaiki yang rusak, lampirkan screenshot.
B. Tanyakan ke pemilik proyek apakah 8 butir di bagian 4a handoff masih berlaku, lalu kerjakan
   per tahap. Butir 7 mengubah alur ADR-0015: wajib ADR baru, perubahan di sisi server, dan
   probe material-flow yang diperbarui.
C. Lanjutkan sisa task `sebagian` dan `todo` di bagian 4b.

Aturan yang tidak boleh dilanggar:
- Buat branch baru dari main terbaru. Jangan bekerja di branch yang sedang dipakai agent lain,
  dan jangan membuang berkas yang belum ter-commit milik orang lain.
- Semua teks UI di src/i18n/n_*.ts untuk ID dan EN. Tanpa `any` baru. Tanpa dependensi baru
  kecuali disebut kartu task atau disetujui pemilik.
- Relasi baru → services/api/src/refs.ts. Koleksi baru → migrasi baru + COLLECTIONS/PREFIX di
  crud.ts dan PREFIX di store.tsx. Keputusan arsitektural → ADR. Migrasi lama tidak diedit.
- Aturan bisnis ditegakkan di server (guard di routes/crud.ts atau endpoint khusus) dengan
  probe yang didaftarkan di skrip `check`; UI saja tidak cukup.
- Data sintetis saja. Jangan commit .env, services/api/seed-data/, docs/audit/, deploy/.env.
  Jangan mengetik, menyimpan, atau menulis password/token/kunci di mana pun.
- `npm run check` (root) harus exit 0 sebelum menyatakan selesai; cara menjalankannya ada di
  bagian 5 handoff. Untuk perubahan UI, uji klik di browser dan lampirkan screenshot.
- Tunggu semua cek CI selesai sebelum merge. Jangan merge, deploy, atau force-push tanpa
  persetujuan eksplisit pemilik proyek. Akses server tidak ada di repo.
- Bila task bertentangan dengan dokumen lain: berhenti dan tanyakan.
- Laporkan hasil apa adanya, termasuk yang gagal atau belum diuji. Tutup dengan format
  ringkasan di AGENTS.md dan perbarui STATUS.md untuk task berkartu.

Mulai dengan melaporkan: branch aktif, hasil `git status`, dan rencana tiga langkah pertamamu.
```
