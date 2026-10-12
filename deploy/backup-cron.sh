#!/bin/sh
# Backup harian ISMS (F5-02): snapshot database + uploads ke volume data,
# retensi 14 hari. Dipasang lewat crontab pengguna deploy (lihat docs/runbook/backup.md):
#   15 2 * * * /home/<user>/isms/deploy/backup-cron.sh >> /home/<user>/isms-backup.log 2>&1
set -eu
cd "$(dirname "$0")/.."
# Argumen opsional: nama folder lain (mis. cadangan pra-deploy di hari yang sama; backup.ts menolak folder yang sudah ada).
STAMP=${1:-$(date +%Y-%m-%d)}
COMPOSE="docker compose -p isms --env-file deploy/.env -f docker-compose.yml -f deploy/compose.host-nginx.yml"
# Jangan pernah menimpa cadangan yang sudah ada (dump MySQL akan terpotong).
$COMPOSE exec -T api sh -c "[ ! -e '/data/backups/$STAMP' ]" || { echo "[backup-cron] /data/backups/$STAMP sudah ada, dibatalkan"; exit 1; }
$COMPOSE exec -T api npx tsx src/backup.ts "/data/backups/$STAMP"
# Buang backup yang lebih tua dari 14 hari.
$COMPOSE exec -T api sh -c 'find /data/backups -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +'
echo "[backup-cron] $STAMP selesai"
