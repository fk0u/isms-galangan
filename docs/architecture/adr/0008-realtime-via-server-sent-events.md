# ADR-0008: Realtime via Server-Sent Events

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
INV-01 dan keluhan sinkron antar-device (C1).

## Opsi
1. Polling.
2. WebSocket.
3. **SSE `GET /api/events` + EventEmitter in-process.**

## Keputusan
Opsi 3; polling 30 dtk sebagai fallback.

## Konsekuensi
Ceiling: 1 instans API. Bila diskalakan horizontal → Redis pub/sub.
