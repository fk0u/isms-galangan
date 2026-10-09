# API ISMS (Fastify). devDependencies sengaja ikut: skrip seed/migrate/backup
# memakai tsx, dan dibutuhkan saat operasional pilot (npm run seed:demo dll).
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
COPY assets ./assets
COPY seed-data-synthetic ./seed-data-synthetic
RUN npm run build
# Data (SQLite + uploads) di volume /data supaya selamat saat image diganti.
ENV SQLITE_PATH=/data/isms.db UPLOADS_DIR=/data/uploads PORT=3000 HOST=0.0.0.0
VOLUME ["/data"]
EXPOSE 3000
# index.ts menjalankan migrate() sebelum listen, jadi start = migrasi + serve.
CMD ["node", "dist/index.js"]
