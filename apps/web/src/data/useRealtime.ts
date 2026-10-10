// F4-03: satu koneksi SSE ke /api/events untuk seluruh aplikasi.
// Event hanya membawa nama koleksi yang berubah; hook ini menarik ulang
// koleksi itu lewat resyncCollections (izin & cabang tetap ditegakkan API).
// fetch + ReadableStream dipakai (bukan EventSource) karena EventSource
// tidak bisa mengirim header Authorization.
import { useEffect, useRef } from "react";
import { useStore, type CollectionKey } from "./store";
import { BASE, getJwt, isBackendConfigured } from "../services/http";

const DEBOUNCE_MS = 500;
const MAX_BACKOFF_MS = 30000;

export function useRealtime(enabled: boolean): void {
  const { resyncCollections, data } = useStore();
  const resyncRef = useRef(resyncCollections);
  resyncRef.current = resyncCollections;
  // Hanya koleksi yang dikenal store; nama lain dari server diabaikan.
  const knownRef = useRef<Set<string>>(new Set());
  knownRef.current = new Set(Object.keys(data));

  useEffect(() => {
    if (!enabled || !isBackendConfigured()) return;
    let stopped = false;
    let ctl: AbortController | null = null;
    let retry = 1000;
    let timer: number | null = null;
    const pending = new Set<string>();
    const flush = (): void => {
      timer = null;
      const cols = [...pending].filter((t) => knownRef.current.has(t)) as CollectionKey[];
      pending.clear();
      if (cols.length > 0 && document.visibilityState === "visible") void resyncRef.current(cols).catch(() => {});
    };
    const run = async (): Promise<void> => {
      while (!stopped) {
        const jwt = getJwt();
        if (!jwt) return;
        try {
          ctl = new AbortController();
          const res = await fetch(`${BASE}/api/events`, { headers: { Authorization: `Bearer ${jwt}` }, signal: ctl.signal });
          if (res.status === 401 || res.status === 403) return; // sesi habis: jangan memutar ulang
          if (!res.ok || !res.body) throw new Error(String(res.status));
          retry = 1000;
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                for (const t of (JSON.parse(line.slice(6)) as { tables?: string[] }).tables ?? []) pending.add(t);
              } catch { /* baris rusak dilewati */ }
              timer ??= window.setTimeout(flush, DEBOUNCE_MS);
            }
          }
        } catch { /* putus: coba lagi dengan backoff */ }
        if (stopped) return;
        await new Promise((r) => window.setTimeout(r, retry));
        retry = Math.min(retry * 2, MAX_BACKOFF_MS);
      }
    };
    void run();
    return () => {
      stopped = true;
      ctl?.abort();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [enabled]);
}
