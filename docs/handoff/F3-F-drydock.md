# F3-F — Drydock & Kapasitas

Halaman: `/drydock` (`pages/drydock/Drydock.tsx`, 1.305 baris), `components/FacilityMap.tsx`, teks `i18n/n_dry.ts`. Koleksi: `drydocks`, `dockSlots`, `bookings`.
Estimasi: 3–4 HK.

---

### F3-F-01 — Batas maksimal kapal per dock
P1 · 4 j · DRY-01
**Langkah.** Field baru di `drydocks.data`: `maxLoa` (m), `maxBeam` (m), `maxDraft` (m), `maxDwt`/`maxLiftTon`. Tampil di kartu dock & form. Saat booking: bandingkan dengan data kapal (`vessels.data` loa/beam/draft) dan tampilkan peringatan bila melebihi (server menolak bila melebihi, kecuali override direktur).
**Kriteria.** [ ] Booking kapal terlalu besar diblokir dengan pesan jelas.

### F3-F-02 — Sederhanakan halaman: Mapping slot area
P0 · 1 HK · DRY-02
**Langkah.** Hapus section: Peta kapasitas, Utilisasi per fasilitas, Peta kapasitas area, Slot per area (komponen & i18n yang tidak dipakai lagi ikut dihapus; probe facility mungkin perlu diperbarui — `scripts/facility-probe.ts`). Pertahankan **Mapping slot area**: setiap slot bisa diklik → panel detail berisi isi "Slot docking aktif" untuk slot tersebut (kapal, proyek, tanggal, progres).
**Kriteria.** [x] Section terhapus tidak meninggalkan import/i18n mati (lint). [x] Klik slot membuka detail.

### F3-F-03 — Waiting list dock
P1 · 4 j · DRY-03
Ganti "Rencana docking tahunan" dengan **Waiting list**: daftar booking berstatus Menunggu (urut tanggal pengajuan), estimasi tanggal tersedia slot cocok terdekat, aksi "Jadwalkan" (mengubah ke booking terjadwal).

### F3-F-04 — Form booking slot
P0 · 4 j · DRY-04 · Bergantung: F3-A-04 (`DateInput`, `SearchSelect`)
**Langkah.** Ganti field "mulai ke/selesai ke" dengan `DateInput` tanggal mulai & selesai. Area = `SearchSelect` slot/area. Pilih proyek ⇒ tampilkan jadwal proyek dan isi otomatis tanggal mulai/selesai dari jadwal proyek (tetap bisa diubah). Validasi bentrok slot di server (overlap tanggal di slot sama → 409).

### F3-F-05 — Jadwalkan maintenance
P1 · 2 j · DRY-05
"Blokir maintenance" → "Jadwalkan maintenance" (semua label i18n). Field: area/slot, tanggal mulai, tanggal selesai (`DateInput`), alasan/deskripsi **paling bawah**. Slot dalam maintenance tidak bisa dibooking.
