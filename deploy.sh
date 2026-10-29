#!/bin/bash
# deploy.sh — Auto Pull & Sync VPS dari branch prod
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1

mkdir -p .isms-data

# Pastikan berada di branch prod
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "prod" ]; then
    git checkout prod > /dev/null 2>&1 || git checkout -b prod origin/prod > /dev/null 2>&1
fi

git fetch origin prod > /dev/null 2>&1

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/prod 2>/dev/null)

if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] New commits detected on origin/prod. Auto-syncing..."
    git reset --hard origin/prod
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building services/api..."
    npm --prefix services/api run build
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building apps/web..."
    npm --prefix apps/web run build
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting isms-galangan-api via PM2..."
    pm2 restart isms-galangan-api --update-env
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-sync to branch prod finished successfully!"
fi
