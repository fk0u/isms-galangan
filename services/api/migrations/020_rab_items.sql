-- Notulen 23 Okt (#285): RAB belanja rutin. Satu baris = anggaran satu akun
-- beban (kode COA) untuk satu bulan. Realisasi dihitung dari jurnal debit
-- akun itu pada bulan yang sama, jadi tidak disimpan di sini.
CREATE TABLE IF NOT EXISTS rabItems (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_rabItems_branch ON rabItems(branch);
