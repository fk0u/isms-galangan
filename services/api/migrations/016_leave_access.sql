-- F3-L-06 / ADR-0017: akses pengajuan cuti mandiri via QR.
-- Bukan koleksi CRUD: hash PIN tidak boleh ikut terbaca lewat /api/employees.
-- access_key = "pin:<employeeId>" (value = hash bcrypt) atau "qr:token" (token halaman publik)
CREATE TABLE IF NOT EXISTS leave_access (access_key VARCHAR(160) PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
