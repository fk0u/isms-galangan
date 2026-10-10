-- Membersihkan tabel sisa: 016_leave_access.sql ikut ter-commit tanpa sengaja saat
-- tabelnya diganti nama menjadi access_secrets (016_access_secrets.sql)
-- Tabel leave_access tidak pernah dipakai kode mana pun
DROP TABLE IF EXISTS leave_access;
