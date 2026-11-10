# Deploy otomatis (server produksi)

**Push ke branch `prod` (repo fk0u/isms-galangan) = deploy.** Cron di server
menjalankan `deploy.sh` (root repo) tiap 2 menit: bila `origin/prod` berubah,
`git reset --hard origin/prod`, build `services/api` + `apps/web`, lalu
`pm2 restart isms-galangan-api`.

- Folder: `/srv/www/production/galangan` (= `/home/prod/www/production/galangan`).
- Log: `.isms-data/deploy.log`.
- Alur rilis: kerjakan di branch fitur → merge ke `main` → merge `main` ke `prod` → push.
- Jangan menyalin/mengubah file langsung di server: `reset --hard` berikutnya akan menimpanya.
