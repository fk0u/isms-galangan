-- F3-L-06 & F3-L-08 / ADR-0017: rahasia akses di luar login akun.
-- Bukan koleksi CRUD: nilainya (hash) tidak boleh terbaca lewat /api/<koleksi>.
-- access_key = "pin:<employeeId>" (hash bcrypt PIN cuti), "qr:token" (token halaman cuti publik),
-- atau "device:<deviceId>" (hash SHA-256 API key alat absensi)
CREATE TABLE IF NOT EXISTS access_secrets (access_key VARCHAR(160) PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
