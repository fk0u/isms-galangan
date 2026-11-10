# Deploy otomatis (server produksi)

Server menarik `origin/main` tiap 5 menit lewat cron dan menjalankan
`scripts/deploy-server.sh`. Jadi: **merge/push ke `main` = deploy**, kira-kira 5 menit kemudian.

- Folder: `/srv/www/production/galangan` (sama dengan `/home/prod/www/production/galangan`).
- Log: `~/galangan-deploy.log` milik user deploy.
- Web dibangun ke `dist.new` lalu ditukar; build gagal → situs lama tetap tayang, `dist.prev` = versi sebelumnya.
- API: `npm run build`, `npm run migrate` bila ada migrasi baru, lalu `sudo -n systemctl restart galangan-api`.
- Perubahan lokal di server disimpan ke `git stash` sebelum merge (tidak dibuang).

Cron (user deploy, `crontab -e`):

```
*/5 * * * * bash /srv/www/production/galangan/scripts/deploy-server.sh
```

## Restart API tanpa password

Agar restart API ikut otomatis, admin server menambahkan sekali (`sudo visudo -f /etc/sudoers.d/galangan-deploy`):

```
istanadev ALL=(root) NOPASSWD: /usr/bin/systemctl restart galangan-api
```

Tanpa baris ini, perubahan API tetap dibangun tetapi log mencatat bahwa restart harus manual.

## Deploy paksa / rollback

```
FORCE=1 bash scripts/deploy-server.sh                       # build ulang
cd apps/web && rm -rf dist && mv dist.prev dist              # kembalikan web sebelumnya
```
