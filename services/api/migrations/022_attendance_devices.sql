-- ADR-0025: mesin absensi dikelola dari website (Fingerspot FK realtime).
-- Bukan koleksi CRUD, hanya ditulis rute /fkweb dan /api/attendance/devices/*.
-- Status terakhir tiap mesin (diperbarui setiap mesin menanyakan perintah).
CREATE TABLE IF NOT EXISTS attendance_device_status (device_id VARCHAR(64) PRIMARY KEY, last_seen TEXT NOT NULL, info TEXT, ip VARCHAR(64));
-- User yang terlihat di mesin (ID + nama saja, template biometrik TIDAK disimpan).
CREATE TABLE IF NOT EXISTS attendance_device_users (device_id VARCHAR(64) NOT NULL, user_id VARCHAR(64) NOT NULL, user_name VARCHAR(160), first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, PRIMARY KEY (device_id, user_id));
-- Antrean perintah server -> mesin, diambil saat mesin bertanya (receive_cmd).
CREATE TABLE IF NOT EXISTS attendance_device_commands (id VARCHAR(64) PRIMARY KEY, device_id VARCHAR(64) NOT NULL, cmd_code VARCHAR(64) NOT NULL, param TEXT, status VARCHAR(16) NOT NULL, result TEXT, created_by VARCHAR(160), created_at TEXT NOT NULL, sent_at TEXT, done_at TEXT);
CREATE INDEX idx_att_dev_cmd_queue ON attendance_device_commands(device_id, status);
