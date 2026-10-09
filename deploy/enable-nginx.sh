#!/usr/bin/env bash
# Jalankan: sudo ISMS_WEB_PORT=<port> ISMS_DOMAIN=<domain> ACME_EMAIL=<email> bash deploy/enable-nginx.sh
# Menyambungkan $ISMS_DOMAIN (nginx host yang sudah ada) ke container ISMS di 127.0.0.1:${ISMS_WEB_PORT:-3110}.
set -euo pipefail
D="${ISMS_DOMAIN:?set ISMS_DOMAIN}"
SITE=/etc/nginx/sites-available/isms
EMAIL="${ACME_EMAIL:?set ACME_EMAIL}"
WEB_PORT="${ISMS_WEB_PORT:-3110}"

if [[ ! "$WEB_PORT" =~ ^[0-9]{1,5}$ ]] || (( 10#$WEB_PORT < 1 || 10#$WEB_PORT > 65535 )); then
  echo "ISMS_WEB_PORT harus berupa port TCP antara 1 dan 65535" >&2
  exit 1
fi

# 1) HTTP + jalur ACME webroot (sama seperti situs lain di server ini)
cat > "$SITE" <<NGX
server {
    listen 80;
    listen [::]:80;
    server_name $D;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}
NGX
ln -sf "$SITE" /etc/nginx/sites-enabled/isms
nginx -t && systemctl reload nginx

# 2) Sertifikat TLS (Let's Encrypt, webroot)
certbot certonly --webroot -w /var/www/html -d "$D" --cert-name isms \
  -m "$EMAIL" --agree-tos -n --keep-until-expiring \
  --deploy-hook "systemctl reload nginx"

# 3) HTTPS -> container web
cat >> "$SITE" <<NGX

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $D;
    ssl_certificate /etc/letsencrypt/live/isms/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/isms/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000" always;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
NGX
nginx -t && systemctl reload nginx
curl -fsS "https://$D/health" && echo && echo "ISMS aktif: https://$D"
