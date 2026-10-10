-- F3-J-01: permintaan barang proyek sebagai penghubung stok ↔ procurement.
-- Envelope standar, baris dibuat hanya oleh POST /api/projects/:id/material-requests
-- dan diperbarui oleh POST /api/material-requests/:id/fulfill (lihat src/materialRequests.ts).
CREATE TABLE IF NOT EXISTS materialRequests (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_materialRequests_branch ON materialRequests(branch);
