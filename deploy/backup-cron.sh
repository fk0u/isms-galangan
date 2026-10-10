#!/bin/sh
# Backup harian ISMS (F5-02): snapshot database + uploads ke volume data,
# retensi 14 hari. Dipasang lewat crontab pengguna deploy (lihat docs/runbook/backup.md):
#   15 2 * * * /home/<user>/isms/deploy/backup-cron.sh >> /home/<user>/isms-backup.log 2>&1
set -eu
cd "$(dirname "$0")/.."
STAMP=$(date +%Y-%m-%d)
COMPOSE="docker compose -p isms --env-file deploy/.env -f docker-compose.yml -f deploy/compose.host-nginx.yml"
$COMPOSE exec -T api npx tsx src/backup.ts "/data/backups/$STAMP"
# Buang backup yang lebih tua dari 14 hari.
$COMPOSE exec -T api sh -c 'find /data/backups -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +'
echo "[backup-cron] $STAMP selesai"
