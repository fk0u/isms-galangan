# F3-F — Drydock & Kapasitas

Halaman: `/drydock` (`pages/drydock/Drydock.tsx`), teks `i18n/n_dry.ts`. Koleksi: `drydocks`, `dockSlots`, `bookings`.
Estimasi: 3–4 HK.

---

### F3-F-01 — Batas maksimal kapal per dock
P1 · 4 j · DRY-01
**Langkah.** Field baru di `drydocks.data`: `maxLoa` (m), `maxBeam` (m), `maxDraft` (m), `maxDwt`/`maxLiftTon`. Tampil di kartu dock & form. Saat booking: bandingkan dengan data kapal (`vessels.data` loa/beam/draft) dan tampilkan peringatan bila melebihi (server menolak bila melebihi, kecuali override direktur).
**Kriteria.** [ ] Booking kapal terlalu besar diblokir dengan pesan jelas.

### F3-F-02 — Sederhanakan halaman: Mapping slot area
P0 · 1 HK · DRY-02
**Langkah.** Hapus section: Peta kapasitas, Utilisasi per fasilitas, Peta kapasitas area, Slot per area; hapus juga komponen, utilitas, kunci i18n, dan probe facility yang hanya dipakai oleh section tersebut. Pertahankan **Mapping slot area**: setiap slot bisa diklik → panel detail berisi isi "Slot docking aktif" untuk slot tersebut (kapal, proyek, tanggal, progres).
**Kriteria.** [x] Section terhapus tidak meninggalkan import/i18n mati (lint). [x] Klik slot membuka detail. [x] Pencarian status menerima nilai kanonis dan label locale; probe SSR memeriksa render EN.

### F3-F-03 — Waiting list dock
P1 · 4 j · DRY-03
Ganti "Rencana docking tahunan" dengan **Waiting list**: daftar booking berstatus Menunggu (urut tanggal pengajuan), estimasi tanggal tersedia slot cocok terdekat, aksi "Jadwalkan" (mengubah ke booking terjadwal).

### F3-F-04 — Form booking slot
P0 · 4 j · DRY-04 · Bergantung: F3-A-04 (`DateInput`, `SearchSelect`)
**Langkah.** Ganti field "mulai ke/selesai ke" dengan `DateInput` tanggal mulai & selesai. Area = `SearchSelect` slot/area. Pilih proyek ⇒ tampilkan jadwal proyek dan isi otomatis tanggal mulai/selesai dari jadwal proyek (tetap bisa diubah). Validasi bentrok slot di server (overlap tanggal di slot sama → 409).

**Kriteria.** [x] Form memakai `DateInput` untuk kedua tanggal dan auto-fill jadwal proyek yang tetap dapat diedit. [x] Area memakai `SearchSelect` dengan opsi fasilitas/area yang ada dan input area baru. [x] POST/PATCH rentang yang bertumpang tindih pada fasilitas dan cabang yang sama ditolak server dengan 409, termasuk perubahan branch dan create serentak; data lama berbasis indeks hari tetap ikut diperiksa. [x] UI, status, Gantt, dan overlap lokal menghitung offset dari `startDate`/`endDate` terhadap hari WITA berjalan; `from`/`to` hanya fallback data legacy half-open (`to` exclusive), dengan tanggal akhir tampilan inklusif `to - 1` dan regresi untuk rollover/adjacency. [x] Saat modal booking dibuka, field tanggal yang belum diedit diperbarui dari hari WITA terkini; tanggal yang diubah manual atau diisi dari jadwal proyek dipertahankan saat modal dibuka kembali; flag edit direset setelah booking berhasil disimpan.

**Implementasi.** `startDate`/`endDate` disimpan inklusif sebagai tanggal ISO; server menormalisasi `from`/`to` half-open. Frontend menghitung offset tampilan/status/Gantt/overlap lokal terhadap tanggal WITA terkini dan memakai `from`/`to` hanya untuk baris legacy tanpa tanggal ISO. Saat tanggal legacy ditampilkan, batas akhir-eksklusif `to` dikonversi ke tanggal akhir inklusif dengan `to - 1`; hitung durasi dan overlap tetap memakai offset half-open asli. Pemeriksaan overlap serta penyimpanan diserialisasi per fasilitas dalam transaksi. Saat modal booking dibuka, helper tanggal WITA menyegarkan hanya field yang belum ditandai diedit; input `DateInput` dan auto-fill jadwal proyek menandai field masing-masing, sedangkan save sukses menghapus penanda. Probe menguji transisi edit manual, auto-fill proyek, pembukaan ulang modal, reset setelah simpan, dan tampilan rentang legacy.

**Verifikasi.** Probe tanggal modal/legacy, build web/API, migrasi, seed, dan root `npm run check` lulus pada SQLite sementara; `probe:drydock` API 11/11. Build web memberi warning chunk >500 kB, lint tanpa error. Checks GitHub pada head `2809be3` lulus 5/5; modal P2 telah dipush pada `8f56495`, dan checks remote untuk commit berikutnya akan diverifikasi setelah push. Re-review Benson menunggu username GitHub yang benar; smoke test UI manual ID/EN **belum dilakukan** karena login browser belum selesai, dan tidak ada screenshot atau hasil manual yang diklaim.

### F3-F-05 — Jadwalkan maintenance
P1 · 2 j · DRY-05
"Blokir maintenance" → "Jadwalkan maintenance" (semua label i18n). Field: area/slot, tanggal mulai, tanggal selesai (`DateInput`), alasan/deskripsi **paling bawah**. Slot dalam maintenance tidak bisa dibooking.
