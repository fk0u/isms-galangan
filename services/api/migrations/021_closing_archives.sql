-- #314 / ADR-0023: arsip tutup buku. Satu baris = snapshot immutable kondisi keuangan
-- pada saat satu periode (bulan/tahun) ditutup. Ditulis hanya oleh rute /api/closing.
CREATE TABLE IF NOT EXISTS closingArchives (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_closingArchives_branch ON closingArchives(branch);
