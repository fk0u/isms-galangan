-- Catatan CTO 12-14 Okt / ADR-0020: BOM per proyek. Satu baris = satu material
-- inventori yang dibutuhkan satu proyek (kebutuhan, satuan, catatan). Pengadaan
-- (PR -> PO) dan permintaan barang mengacu ke baris ini lewat projectId + itemId.
CREATE TABLE IF NOT EXISTS bomItems (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_bomItems_branch ON bomItems(branch);
