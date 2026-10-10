# ADR-0016: "Lihat sebagai peran" untuk demo RBAC

- **Status:** Accepted
- **Tanggal:** 2026-10-10
- **Pemutus:** Owner (Kou) bersama agent; permintaan "semua RBAC, roles, modules dapat didemonstrasikan ke klien"

## Konteks
Klien perlu melihat langsung bahwa 14 peran (Q2) memiliki menu, tombol, dan akses data berbeda. Sebelumnya seed hanya punya 5 akun, dan berganti peran berarti logout lalu login dengan password lain di depan klien.

## Opsi
1. Tidak melakukan apa-apa: presenter login/logout berulang. Lambat dan password tampil di layar.
2. Login satu klik untuk semua akun di halaman login. Ditolak, karena URL demo publik dan siapa pun bisa masuk sebagai direktur.
3. Direktur/developer yang **sudah login** bisa berpindah ke akun seed peran lain, dijaga flag env dan dicatat di audit.

## Keputusan
Opsi 3.
- **Akun:** `SEED_ACCOUNTS` mencakup 14 peran Q2 (nama dan email sintetis). Password memakai `SEED_PASSWORD_<ROLE>` atau acak, tidak berubah.
- **Endpoint:**
  - `GET /api/auth/demo-switch` mengembalikan daftar peran (kosong bila tidak berhak).
  - `POST /api/auth/demo-switch {role}` menerbitkan token akun seed peran itu.
- **Syarat:**
  - `DEMO_ROLE_SWITCH=true` **dan** `ALLOW_SEED_LOGIN=true`; bila tidak, endpoint 404.
  - Peran pemanggil (dari DB) direktur atau developer; selain itu 403.
  - Target hanya akun seed.
  - Audit `auth.demo_switch` wajib (`required`); gagal audit berarti token tidak diterbitkan.
- **Klien:**
  - Token dan sesi akun asal disimpan di `sessionStorage` (`isms.demo.origin`). Perpindahan berikutnya dan "Kembali ke akun asal" memakai token itu. Logout membuangnya.
  - Cache offline dibersihkan setiap pindah supaya data peran yang haknya lebih luas tidak terlihat oleh peran lain.
- **Store:** respons 403 saat menarik koleksi dianggap "di luar hak peran" (koleksi dikosongkan), bukan "gagal memuat".
- **Turunan otomatis:** di detail proyek (progres, risiko, status Terlambat) hanya berjalan untuk peran yang boleh menulis proyek.

## Konsekuensi
- Probe `probe:demo-roles` (18 pemeriksaan) menguji flag, penolakan non-direktur, dan matriks baca untuk setiap peran.
- Tombol aksi belum disembunyikan per izin di semua halaman. Server tetap menolak (403) dan UI menampilkan alasannya; menyembunyikan tombol dilakukan bertahap per modul.
- Produksi sebenarnya cukup tidak menyetel `DEMO_ROLE_SWITCH`.
- Membalik keputusan: hapus `routes/demoSwitch.ts` dan `DemoRoleSwitcher`. Akun seed tambahan bisa dinonaktifkan (`is_active=0`).
