# Frontend ISMS: build statis Vite lalu disajikan nginx.
# VITE_API_URL di-bake saat build (Vite), isi dengan origin publik aplikasi,
# mis. https://isms.example.com — nginx meneruskan /api, /files, /health ke API.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL wajib diisi (build arg)" && exit 1)
RUN npx vite build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
