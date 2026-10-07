-- Tambahkan kolom token_version ke tabel users untuk pencabutan token (F2-04).
-- Setiap user login memiliki token_version yang di-embed ke dalam token JWT (claim `v`).
-- Saat logout, nonaktif, ganti peran/karyawan, atau reset password, token_version bertambah.
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
