/* adms-emulator.ts — meniru mesin absensi ADMS (Fingerspot/ZKTeco) yang
 * mem-push scan ke server, untuk menguji penerima /iclock tanpa mesin asli.
 *
 *   npm run emulate:adms -- --url http://127.0.0.1:3000 --sn REVO-UJI-01 --pin 1001,1002
 *   opsi: --time "2026-11-16 07:58:00" (satu jam, semua PIN)  --out (tambah tap pulang 17:05)
 *
 * Urutan persis seperti mesin: handshake GET cdata → POST cdata?table=ATTLOG
 * (baris PIN\tjam\tstatus\tverifikasi) → GET getrequest. SN harus sudah
 * didaftarkan HR (menu Absensi → alat, deviceId = SN) supaya tidak ditolak 401. */

export interface Exchange { step: string; status: number; body: string }
export type Sender = (method: "GET" | "POST", path: string, body?: string) => Promise<{ status: number; body: string }>;

/** Satu baris ATTLOG: status 0 = tanpa tombol, verifikasi 1 = sidik jari (15 = wajah). */
export const attlogLine = (pin: string, when: string, status = 0, verify = 1): string =>
  [pin, when, String(status), String(verify), "0", "0", "0", "0", "0", "0"].join("\t");

/** Jalankan satu siklus mesin: handshake, kirim log, tanya perintah. */
export async function emulate(send: Sender, sn: string, lines: string[]): Promise<Exchange[]> {
  const out: Exchange[] = [];
  const q = `SN=${encodeURIComponent(sn)}`;
  const hs = await send("GET", `/iclock/cdata?${q}&options=all&pushver=2.4.1&language=69`);
  out.push({ step: "handshake", ...hs });
  if (hs.status !== 200) return out;
  const log = await send("POST", `/iclock/cdata?${q}&table=ATTLOG&Stamp=9999`, lines.join("\n") + "\n");
  out.push({ step: "attlog", ...log });
  const req = await send("GET", `/iclock/getrequest?${q}`);
  out.push({ step: "getrequest", ...req });
  return out;
}

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

async function main(): Promise<void> {
  const base = arg("url", "http://127.0.0.1:3000").replace(/\/+$/, "");
  const sn = arg("sn", "REVO-UJI-01");
  const pins = arg("pin", "1001").split(",").map((s) => s.trim()).filter(Boolean);
  const now = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
  const when = arg("time", now);
  const lines = pins.map((p) => attlogLine(p, when));
  if (process.argv.includes("--out")) for (const p of pins) lines.push(attlogLine(p, `${when.slice(0, 10)} 17:05:00`, 1));
  const send: Sender = async (method, path, body) => {
    const r = await fetch(base + path, { method, body, headers: body ? { "Content-Type": "text/plain" } : undefined });
    return { status: r.status, body: await r.text() };
  };
  console.log(`Emulator ADMS → ${base}  SN=${sn}  ${lines.length} tap`);
  for (const x of await emulate(send, sn, lines)) console.log(`\n[${x.step}] HTTP ${x.status}\n${x.body}`);
}

if (process.argv[1]?.endsWith("adms-emulator.ts")) {
  main().catch((e) => { console.error(e); process.exitCode = 1; });
}
