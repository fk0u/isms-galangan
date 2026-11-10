#!/usr/bin/env bash
# Auto-deploy ISMS Galangan di server produksi.
# Dipanggil cron tiap 5 menit: bila origin/main punya commit baru, merge ke
# checkout server, build ulang bagian yang berubah, lalu restart API bila perlu.
# Tidak butuh secret di GitHub; server yang menarik (pull), bukan didorong.
#
# Pakai manual:  FORCE=1 bash scripts/deploy-server.sh   (build ulang walau tak ada commit baru)
# Log:           ~/galangan-deploy.log
set -euo pipefail

APP="${APP_DIR:-/srv/www/production/galangan}"
BRANCH="${DEPLOY_BRANCH:-main}"
LOG="${DEPLOY_LOG:-$HOME/galangan-deploy.log}"

# Satu deploy saja dalam satu waktu (cron bisa tumpang tindih saat build lama).
exec 9>/tmp/galangan-deploy.lock
flock -n 9 || exit 0
exec >>"$LOG" 2>&1

cd "$APP"
git fetch -q origin "$BRANCH"
if git merge-base --is-ancestor "origin/$BRANCH" HEAD && [ -z "${FORCE:-}" ]; then
  exit 0
fi

echo "=== $(date '+%F %T') deploy origin/$BRANCH ($(git rev-parse --short "origin/$BRANCH"))"
OLD=$(git rev-parse HEAD)
# Perubahan lokal yang tersisa di server adalah hotfix salinan manual; versi resminya
# datang lewat merge ini. Simpan dulu sebagai stash supaya tidak hilang tanpa jejak.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  git stash push -q -m "auto-deploy $(date +%F-%H%M)" && echo "stash: perubahan lokal disimpan"
fi
git merge -q --no-edit "origin/$BRANCH"
CHANGED=$(git diff --name-only "$OLD" HEAD)
[ -n "${FORCE:-}" ] && CHANGED="apps/web/ services/api/"

if grep -q '^apps/web/' <<<"$CHANGED"; then
  cd "$APP/apps/web"
  grep -q '^apps/web/package-lock.json' <<<"$CHANGED" && npm ci --no-audit --no-fund
  # Build ke folder sementara dulu: bila tsc/vite gagal, situs lama tetap tayang.
  if npx tsc && npx vite build --outDir dist.new --emptyOutDir; then
    rm -rf dist.prev && mv dist dist.prev && mv dist.new dist
    echo "web: OK"
  else
    rm -rf dist.new
    echo "web: BUILD GAGAL, dist lama dipertahankan"
    exit 1
  fi
fi

if grep -q '^services/api/' <<<"$CHANGED"; then
  cd "$APP/services/api"
  grep -q '^services/api/package-lock.json' <<<"$CHANGED" && npm ci --no-audit --no-fund
  npm run build
  grep -q '^services/api/migrations/' <<<"$CHANGED" && npm run migrate
  # Restart butuh izin sudo tanpa password khusus perintah ini (lihat docs/process/deploy.md).
  if sudo -n systemctl restart galangan-api 2>/dev/null; then
    echo "api: OK (restart)"
  else
    echo "api: dibangun, TAPI restart gagal (sudo belum diizinkan) - restart manual: sudo systemctl restart galangan-api"
  fi
fi
echo "=== selesai $(git rev-parse --short HEAD)"
