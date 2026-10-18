import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* K17-UMUM-01: satu sesi kedaluwarsa = satu pemberitahuan "Sesi berakhir".
   Lingkungan test = node, jadi sessionStorage/window/fetch diganti tiruan. */

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

let expired = 0;

beforeEach(() => {
  expired = 0;
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "http://api.test");
  vi.stubGlobal("sessionStorage", memoryStorage());
  vi.stubGlobal("window", {
    location: { origin: "http://app.test" },
    dispatchEvent: (e: Event) => { if (e.type === "isms:auth-expired") expired += 1; return true; },
    setTimeout,
    clearTimeout,
  });
  vi.stubGlobal("CustomEvent", class extends Event {});
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 })));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("401 → pemberitahuan sesi berakhir", () => {
  it("request paralel yang sama-sama 401 hanya memicu satu pemberitahuan", async () => {
    const http = await import("../http");
    http.setJwt("token-lama");
    const results = await Promise.allSettled([http.apiFetch("/api/a"), http.apiFetch("/api/b"), http.apiFetch("/api/c")]);
    expect(results.every((r) => r.status === "rejected")).toBe(true);
    expect(expired).toBe(1);
    expect(http.getJwt()).toBeNull();
  });

  it("401 tanpa token (belum login) bukan 'sesi berakhir'", async () => {
    const http = await import("../http");
    await expect(http.apiFetch("/api/auth/login", { method: "POST", body: "{}" })).rejects.toBeInstanceOf(http.ApiError);
    expect(expired).toBe(0);
  });
});
