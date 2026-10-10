-- F3-K-02 / ADR-0009: mesin kuesioner generik QC & HSE.
-- checklistTemplates = definisi kuesioner berbobot, checklistResponses = hasil isian
-- (skor 0-100 dihitung server, lihat src/scoring.ts). Envelope standar.
CREATE TABLE IF NOT EXISTS checklistTemplates (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_checklistTemplates_branch ON checklistTemplates(branch);
CREATE TABLE IF NOT EXISTS checklistResponses (id VARCHAR(128) PRIMARY KEY, branch VARCHAR(64), data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX idx_checklistResponses_branch ON checklistResponses(branch);
