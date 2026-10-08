-- F3-C-01 / ADR-0006: surat BoQ per nomor surat dengan revisi bertingkat.
-- Bentuk sama dengan koleksi envelope lain (id/branch/data/updated_at) agar
-- routes/crud.ts generik langsung melayani. boq.boqDocId menunjuk ke sini.
CREATE TABLE IF NOT EXISTS boqDocs (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_boqDocs_branch ON boqDocs(branch);
