# ADR-0019: Cuti mandiri tanpa PIN, token QR ber-hash dan berkedaluwarsa

- **Status:** Accepted. Menggantikan keputusan cuti di [ADR-0017](0017-akses-tanpa-login-cuti-qr-dan-alat-absensi.md): identifikasi NIK + PIN, penyimpanan token polos, dan larangan lampiran dari halaman publik
- **Tanggal:** 2026-10-12
- **Pemutus:** Owner proyek (issue #99, #100; daftar revisi 12 Okt: "sembunyikan form PIN", "tampilkan nama, jabatan, departemen setelah NIK", "upload dokumen pendukung", "link lama tidak bisa dipakai saat link baru dibuat")

## Konteks
ADR-0017 mengenali karyawan di halaman publik cuti dari NIK + PIN 6 angka yang diatur HR. Di lapangan PIN menjadi hambatan: karyawan tidak mengingatnya dan HR harus mengatur PIN satu per satu. Klien meminta PIN dihilangkan, NIK diverifikasi dengan menampilkan identitas singkat, dan dokumen pendukung (mis. surat dokter) bisa dilampirkan. Token QR sebelumnya disimpan polos dan tidak punya masa berlaku.

## Opsi
1. Pertahankan PIN — paling aman, tetapi tidak dipakai di lapangan (ditolak klien).
2. **Tanpa PIN; token QR + NIK + rate limit, pengajuan tetap menunggu HR** — dipilih.
3. OTP ke nomor HP karyawan — butuh gateway SMS/WA dan dependensi baru; di luar cakupan.

## Keputusan
- `POST /api/public/leave` tidak lagi menerima PIN. Syaratnya: token QR sah, NIK karyawan aktif, tanggal valid, kuota rate limit (10/10 mnt per IP, 5/15 mnt per NIK).
- `POST /api/public/leave/check` `{token, nik?}`: tanpa NIK hanya memeriksa tautan; dengan NIK mengembalikan **nama, jabatan, departemen** saja. NIK tak dikenal dijawab 200 `employee: null`. Kuota terpisah 30/10 mnt per IP.
- Dokumen pendukung dikirim dalam permintaan yang sama (base64, PDF/JPG/PNG, maks 3 MB, diperiksa magic bytes + isi). Berkas ditulis hanya setelah NIK sah dan dihapus bila baris cuti gagal disimpan. Berkas hanya bisa dibuka dengan login.
- Token QR: yang disimpan hanya SHA-256 + pembuat + waktu dibuat + kedaluwarsa (90 hari). Token tidak bisa diambil ulang; QR tampil sekali saat dibuat. Membuat QR baru mencabut yang lama. Token polos lama tetap berlaku sampai HR membuat QR baru.
- Endpoint PIN (`/api/employees/:id/leave-pin`) dibiarkan, tidak dipakai alur ini.

## Konsekuensi
- **Keamanan turun secara sadar:** siapa pun yang memegang QR dan mengetahui NIK seseorang dapat (a) melihat nama, jabatan, departemen orang itu, dan (b) membuat pengajuan cuti atas namanya. Batasnya: pengajuan berstatus `Diajukan` dan tidak berdampak sampai HR menyetujui; pengajuan yang berhasil dan yang ditolak karena NIK tak dikenal tercatat di audit dengan IP (pratinjau NIK dan percobaan dengan token salah tidak diaudit, hanya dibatasi kuota); kuota per IP dan per NIK membatasi penyalahgunaan massal.
- HR tidak bisa menampilkan ulang QR yang sudah dibuat; mencetak ulang berarti membuat QR baru dan QR yang tertempel harus diganti.
- QR harus diperbarui paling lambat tiap 90 hari.
- Membalik keputusan: wajibkan kembali `pin` di `SubmitSchema` dan pemeriksaan hash `pin:<id>`; data token dan pengajuan tidak perlu diubah.
