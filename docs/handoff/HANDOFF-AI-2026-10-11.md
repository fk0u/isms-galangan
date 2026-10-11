# Handoff ke AI Engineer — 11 Oktober 2026 (Siang)

Dokumen ini disusun untuk Agent AI penerus (mis. Antigravity / Claude Code) guna melanjutkan pengembangan sistem ISMS (Integrated Shipyard Management System).

---

## 1. Status Terakhir & Deployment
- **Branch `main`**: Sudah mencakup **PR #63** (`843d136: perf+fix: cache daftar + ETag, WBS/tim satu permintaan, cache gambar, dedupe GET; foto riwayat tahapan dimuat dengan token`).
- **Status Deploy**: **SUDAH TER-DEPLOY & HEALTHY** di server pilot VPS (`https://isms.85-211-245-134.sslip.io/health` → `ok: true`, DB ok, uploads writable).
- **Integritas CI**: Lolos pemeriksaan build, migrasi, seed, dan smoke test Docker stack di GitHub Actions.

---

## 2. Daftar Pekerjaan Baru (Sprint Request dari Mas Ghani)

Terdapat 4 item pekerjaan utama yang diminta oleh Mas Ghani (11 Okt, 14:32–14:34):

### Task 1: Integrasi Sistem BoQ ke Modul Dokumen
**Deskripsi:**
Sistem BoQ harus terintegrasi dengan modul Dokumen. Ketika dokumen surat BoQ sudah terbit / berstatus Disetujui (atau dibuat), dokumen BoQ tersebut harus otomatis muncul di modul Dokumen dengan section/tab BoQ khusus. Di bagian ini, pengguna dapat melihat daftar surat BoQ dan dapat mengeklik **"Open Detail"** untuk melihat seluruh informasi rinci pekerjaan secara lengkap (daftar item BoQ, volume, satuan, harga satuan, total, revisi, status persetujuan, penandatangan, link ke proyek terkait).

**File Terkait:**
- `apps/web/src/pages/dokumen/Documents.tsx`: Tambahkan tab / filter / section khusus "BoQ" di samping kategori dokumen lainnya, serta modal/drawer/halaman pratinjau detail BoQ lengkap.
- `apps/web/src/utils/docTypes.ts`: Daftarkan tipe `"BoQ"` ke dalam `DOC_TYPES` dan tentukan sub-tipenya (mis. `"BoQ Proyek"`, `"Revisi BoQ"`, `"Addendum BoQ"`).
- `services/api/src/boqDocs.ts`: Periksa sinkronisasi entri ke tabel `documents` saat status surat BoQ berubah. Pastikan data yang dimasukkan mencakup metadata yang cukup (`boqDocId`, `projectId`, `vessel`, `total`, `revision`).
- `apps/web/src/pages/proyek/BoqDocsSection.tsx`: Pastikan saat BoQ dibuat atau disetujui, event/sync ke `documents` terpelihara.

**Kriteria Terima:**
- [ ] Di modul Dokumen (`/dokumen`), terdapat tab/filter atau section khusus untuk **BoQ**.
- [ ] Setiap dokumen BoQ menampilkan nomor surat, proyek, kapal, versi/revisi, tanggal, status, dan nilai total.
- [ ] Tersedia tombol/aksi **"Open Detail"** yang membuka tampilan lengkap seluruh baris pekerjaan BoQ (tabel item pekerjaan, spesifikasi, kuantitas, satuan, unit price, total price, catatan, alur persetujuan, dsb).

---

### Task 2: Output PDF & Excel Enterprise-Grade untuk BoQ (HTML-to-PDF & Layout Sistematis)
**Deskripsi:**
Dokumen BoQ harus dapat diekspor menjadi PDF dan Excel dengan kualitas **Enterprise Grade** yang tertata rapi, sistematis, dan sesuai standar galangan perkapalan.
Untuk PDF: generate dibantu dengan HTML-to-PDF / layout HTML cetak yang elegan (kop surat perusahaan resmi, tabel bergaris presisi, kolom penomoran, format nominal akuntansi, blok catatan/terms, serta kolom tanda tangan pihak galangan dan klien).
Untuk Excel: format file spreadsheet yang terstruktur rapi (header profesional, lebar kolom otomatis proporsional, alignment angka benar, rumus/total yang jelas).

**File Terkait:**
- `services/api/src/pdf/documents/boq.ts` dan/atau endpoint HTML-to-PDF cetak browser / fastify:
  - Buat layout HTML cetak enterprise-grade (CSS print media query / stylesheet cetak dengan kop resmi galangan, layout tabel proporsional, pagination footer "Halaman X dari Y", dan blok tanda tangan).
- `apps/web/src/utils/export.ts` / modul export BoQ:
  - Format Excel dengan styling enterprise (kop informasi proyek, header kolom berwarna steel/navy, border sel, format ribuan/mata uang Rp, baris Grand Total bergaris tebal).
- `apps/web/src/pages/proyek/BoqDocsSection.tsx` & `apps/web/src/pages/dokumen/Documents.tsx`:
  - Tombol aksi "Cetak PDF (Enterprise)" dan "Ekspor Excel" yang dapat diakses langsung dari detail BoQ.

**Kriteria Terima:**
- [ ] Terdapat opsi ekspor **PDF** dan **Excel** pada setiap surat BoQ.
- [ ] Hasil cetak PDF memiliki layout Enterprise-Grade yang rapi, tidak terpotong, memiliki kop surat resmi, rincian pekerjaan bertingkat, dan area tanda tangan.
- [ ] Hasil unduhan Excel tersusun sistematis dengan metadata proyek, rincian pekerjaan, dan format angka yang tepat.

---

### Task 3: Perbaikan Typo "Commisioning" → "commissioning" di Detail Management
**Deskripsi:**
Terdapat typo kata `Commisioning` (dengan 1 'm') yang harus diperbaiki menjadi `commissioning` (atau `Commissioning` sesuai konteks kalimat kapitalisasi) pada detail management proyek.

**File Terkait:**
- `apps/web/src/i18n/n_prj.ts` (baris ~276 pada `detTrialTitle`: `"Commisioning & Trial ({n})"`, ganti menjadi `"Commissioning & Trial ({n})"`).
- Periksa seluruh kemunculan kata `Commisioning` di file UI/i18n (`apps/web/src/i18n/`, `apps/web/src/pages/proyek/ProjectDetail.tsx`, dll) agar konsisten menggunakan ejaan baku bahasa Inggris `Commissioning`.

**Kriteria Terima:**
- [ ] String UI di Detail Management Proyek menampilkan kata `Commissioning` (2 huruf 'm').
- [ ] Probe i18n (`npm run check` di `apps/web`) tetap lulus tanpa ada kunci yang hilang atau asimetris.

---

### Task 4: Pembersihan (Clear) WBS Templating untuk Proyek Baru
**Deskripsi:**
Pada bagian WBS Management Proyek, saat membuat proyek baru, template WBS lama yang berisi data statis masa lalu (daftar task hardcoded Jan–Sep 2026 dengan progres 100%, 85%, 70%) harus dibersihkan (clear-kan). Proyek baru tidak boleh secara otomatis diisi data progres dummy lama, melainkan harus mulai dari kondisi bersih (clean / 0% progress / atau kosong sehingga pengguna dapat mendefinisikan tahapan WBS sendiri sesuai kontrak proyek baru).

**File Terkait:**
- `apps/web/src/data/store.tsx`:
  - Periksa `wbsFor: (projectId) => data.wbsByProject[projectId] ?? clone(wbsTemplate)`. Jika proyek baru belum memiliki WBS, jangan berikan fallback task dengan tanggal dan progres masa lalu. Berikan array kosong `[]` atau template bersih tanpa progres (`progress: 0`, tanggal menyesuaikan rentang proyek baru).
- `apps/web/src/pages/proyek/ProjectDetail.tsx` & form pembuatan proyek baru:
  - Pastikan saat user membuat proyek baru di `Projects.tsx`, tahapan WBS tidak langsung terisi riwayat semu.
- `services/api/src/seedData.ts`:
  - Pastikan seed data proyek eksisting tetap memiliki WBS, tetapi proyek baru buatan pengguna tidak terbebani data dummy.

**Kriteria Terima:**
- [ ] Ketika membuat proyek baru, tab WBS di Detail Proyek tidak menampilkan tahapan masa lalu dengan progres semu (100%, 85%, dsb).
- [ ] WBS untuk proyek baru bersih dan siap ditambahkan tahapan baru secara dinamis oleh Project Manager / Engineer.

---

## 3. Aturan Kerja & Quality Gate Wajib
1. **Branching**: Buat branch baru dari `main`, contoh: `feat/boq-docs-commissioning-wbs-clean`.
2. **Standard Kode**: TypeScript strict, tanpa `any` baru. Semua teks UI baru wajib bilingual (ID & EN) di `src/i18n/n_*.ts`.
3. **Pemeriksaan Wajib Sebelum Selesai**:
   ```bash
   npm run check
   ```
   Harus exit 0 di root (menjalankan web check, api check, lint, vitest, dan probe).
4. **Uji Coba Visual**: Jalankan `npm run dev` dan uji langsung di browser.

---

## 4. Prompt Siap Pakai untuk AI Agent Berikutnya

Berikut prompt yang dapat langsung di-copy-paste ke AI agent berikutnya untuk mengeksekusi pekerjaan ini secara langsung:

```text
Halo! Kamu ditugaskan untuk mengerjakan batch tugas baru pada repositori ISMS (Integrated Shipyard Management System) berdasarkan dokumen handoff di docs/handoff/HANDOFF-AI-2026-10-11.md.

Semua pekerjaan sebelumnya di PR #63 sudah berhasil di-merge ke main dan ter-deploy di server pilot.

Sekarang, buat branch baru dari main: `feat/boq-doc-integration-wbs-clean` dan kerjakan 4 tugas berikut:

1. Integrasi Sistem BoQ ke Modul Dokumen:
   - Tambahkan section/tab khusus "BoQ" di modul Dokumen (apps/web/src/pages/dokumen/Documents.tsx).
   - Daftarkan tipe "BoQ" di apps/web/src/utils/docTypes.ts.
   - Sediakan tombol/aksi "Open Detail" di dokumen BoQ yang membuka tampilan detail lengkap seluruh uraian pekerjaan, volume, unit, harga satuan, grand total, status, revisi, dan informasi proyek.
   - Pastikan sinkronisasi dokumen BoQ saat status Disetujui/Diajukan di services/api/src/boqDocs.ts dan web store berjalan mulus.

2. Ekspor BoQ Enterprise-Grade (PDF & Excel):
   - Tambahkan output PDF dengan layout Enterprise Grade (dibantu format HTML/print styling yang rapi, profesional, ber-kop surat resmi, tabel sistematis, format rupiah, dan blok tanda tangan).
   - Tambahkan ekspor Excel yang terstruktur dan rapi untuk data BoQ.
   - Tombol cetak PDF dan unduh Excel dapat diakses dari modal/tampilan detail BoQ.

3. Perbaiki Typo "Commisioning" -> "commissioning":
   - Cari dan perbaiki kata "Commisioning" menjadi "Commissioning" di apps/web/src/i18n/n_prj.ts (mis. detTrialTitle) dan di seluruh halaman detail management proyek terkait, baik dalam bahasa ID maupun EN.

4. Bersihkan (Clear) WBS Templating untuk Proyek Baru:
   - Pada WBS Management Proyek, saat membuat proyek baru, jangan menggunakan fallback template dengan tanggal lampau (Jan-Sep 2026) dan progres semu (100%, 85%, 70%).
   - Buat agar WBS proyek baru berstatus bersih (clean / kosong atau progress 0% dinamis) sehingga user memulai dari kanvas bersih.
   - Periksa apps/web/src/data/store.tsx (fungsi wbsFor dan wbsTemplate) serta ProjectDetail.tsx.

Instruksi Tambahan:
- Wajib bilingual (ID & EN) pada semua string i18n baru.
- Jalankan `npm run check` di root repo dan pastikan EXIT 0 tanpa error TypeScript atau lint.
- Setelah selesai, buat ringkasan perubahan dan siap untuk di-PR.
```
