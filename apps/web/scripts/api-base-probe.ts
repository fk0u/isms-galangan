/* api-base-probe.ts — resolveApiBase (deploy same-origin, F5-01). */
import { resolveApiBase } from "../src/services/http";

declare const process: { exit(code: number): never };

let failed = 0;
function check(name: string, got: string, want: string): void {
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` (dapat "${got}", harap "${want}")`}`);
}

check("same-origin memakai origin halaman", resolveApiBase("same-origin", "https://isms.example.com"), "https://isms.example.com");
check("same-origin buang garis miring akhir", resolveApiBase("same-origin", "https://x.trycloudflare.com/"), "https://x.trycloudflare.com");
check("same-origin tanpa window (SSR) = mode lokal", resolveApiBase("same-origin", undefined), "");
check("URL eksplisit tetap dipakai", resolveApiBase("http://localhost:3000/", "https://other"), "http://localhost:3000");
check("kosong = mode lokal", resolveApiBase("", "https://other"), "");
check("undefined = mode lokal", resolveApiBase(undefined, "https://other"), "");

console.log(`\napi-base-probe: ${6 - failed} lolos, ${failed} gagal.`);
if (failed > 0) process.exit(1);
