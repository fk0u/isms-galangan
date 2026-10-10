# ADR-0017: Akses tanpa login akun — cuti via QR dan alat absensi

- **Status:** Accepted
- **Tanggal:** 2026-10-10
- **Pemutus:** Owner proyek (lewat kartu F3-L-06, F3-L-08; keputusan Q14)

## Konteks
Dua kebutuhan menulis data tanpa sesi login akun:
1. Karyawan lapangan mengajukan cuti/izin dengan memindai QR di bengkel (HR-06). Banyak yang tidak punya akun aplikasi.
2. Alat absensi (fingerprint/face) mengirim tap masuk/pulang (ABS-01). Merk alat belum diputuskan (Q14).

Keduanya membuka endpoint yang bisa dipanggil dari luar sesi, sehingga harus sempit dan tidak bisa dipakai membaca data.

## Opsi
1. Login akun penuh di halaman publik — ditolak: password akun diketik di perangkat bersama, dan sesi penuh terbuka di HP orang lain.
2. Tautan/QR saja tanpa bukti identitas — ditolak: siapa pun bisa mengajukan cuti atas nama orang lain.
3. **Token QR + NIK + PIN khusus cuti; API key per alat** — dipilih.
4. Tidak melakukan apa-apa (HR mengetik semua pengajuan) — beban HR, tidak memenuhi HR-06.

## Keputusan
- Tabel baru `access_secrets (access_key, value, updated_at)`, **bukan** koleksi CRUD, sehingga nilainya tidak pernah keluar lewat `/api/<koleksi>`.
  - `pin:<employeeId>` → hash bcrypt PIN cuti 6 angka (diatur HR, bukan password akun).
  - `qr:token` → token acak 48 hex yang menjadi bagian URL `/f/cuti/:token`; HR bisa menggantinya (QR lama mati seketika).
  - `device:<deviceId>` → hash SHA-256 API key alat (key 256-bit acak, ditampilkan sekali).
- `POST /api/public/leave` hanya membuat baris `leaves` berstatus `Diajukan` dengan `source: "QR"`. Tidak ada endpoint publik yang membaca.
  - Gagal karena NIK tak dikenal, belum punya PIN, atau PIN salah → jawaban identik (401 "NIK atau PIN salah"); bcrypt tetap dijalankan terhadap hash palsu agar waktu respons tidak membedakan.
  - Rate limit 10 percobaan / 10 menit per IP dan 5 / 15 menit per NIK.
  - Lampiran berkas **tidak** diterima dari halaman publik (unggah anonim = permukaan serangan); lampiran menyusul lewat HR.
- `POST /api/attendance/ingest` menerima `{deviceId, punches: [{employeeNo, timestamp, type}]}` dengan header `x-device-key`. `POST /api/attendance/import` menerima isi yang sama dengan login biasa (impor CSV).
  - Tap digabung menjadi satu baris per karyawan per hari WITA: masuk = tap `in` paling awal, pulang = tap `out` paling akhir.
- Semua jalur dicatat di audit (`public_leave_create`, `public_leave_denied`, `attendance_ingest`, …).

## Konsekuensi
- PIN 6 angka lemah bila berdiri sendiri; keamanannya bergantung pada rate limit dan pada dampak yang kecil (pengajuan tetap harus disetujui HR). Jangan memakai PIN ini untuk hal lain.
- Rate limiter di memori = satu instans API. Bila diskalakan, pindahkan ke penyimpanan bersama.
- Ingest memuat seluruh tabel absensi tiap batch; beri indeks/kolom tanggal bila data membesar.
- Adaptor merk alat nanti cukup menerjemahkan format alat ke bentuk generik di atas.
- Membalik keputusan: hapus tiga route + tabel `access_secrets`; data `leaves`/`attendance` yang sudah masuk tetap sah.
