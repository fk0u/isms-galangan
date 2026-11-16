/* Penerima protokol push "ADMS" (iclock) untuk mesin absensi sekelas
 * ZKTeco/Fingerspot (Revo WFV-208BNC dkk.) tanpa cloud berbayar.
 *
 * Mesin dikonfigurasi Server = host ISMS, Port = port nginx/API, lalu:
 *   GET  /iclock/cdata?SN=..&options=all   handshake → balas konfigurasi
 *   POST /iclock/cdata?SN=..&table=ATTLOG  log scan, satu baris per tap:
 *        PIN \t YYYY-MM-DD HH:MM:SS \t status \t verifikasi \t ...
 *   GET  /iclock/getrequest?SN=..          minta perintah → "OK" (tidak ada)
 *   POST /iclock/devicecmd?SN=..           hasil perintah → "OK"
 *
 * Mesin tidak bisa mengirim API key, jadi otorisasi = nomor seri (SN) harus
 * sudah didaftarkan HR lewat POST /api/attendance/devices (deviceId = SN).
 * Data diteruskan ke applyPunches() yang sama dengan jalur ingest JSON, jadi
 * pencocokan PIN↔NIK karyawan dan penggabungan harian tidak diduplikasi.
 * ponytail: protokol diasumsikan dari mesin sekelas ZKTeco; verifikasi dengan
 * mesin asli sebelum dipakai produksi (lihat scripts/adms-emulator.ts). */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requestIp, writeAudit } from "../audit.js";
import { q } from "../db.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";
import { applyPunches, type PunchInput } from "./attendanceIngest.js";

const admsLimiter = createRateLimiter(240, 60_000);
const SN_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Satu baris ATTLOG → tap; null bila baris tidak terbaca. Murni.
 *  Jam mesin = waktu lokal WITA (TimeZone=8 dikirim saat handshake). */
export function parseAttlogLine(line: string): PunchInput | null {
  const cols = line.split("\t").map((c) => c.trim());
  const pin = cols[0] ?? "";
  const when = cols[1] ?? "";
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(pin)) return null;
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(when)) return null;
  const [d, t] = when.split(" ") as [string, string];
  /* Kebanyakan karyawan tidak menekan tombol status (masuk/pulang) di mesin,
     jadi status 0 di setiap tap. "auto" = tap paling awal hari itu jadi jam
     masuk, paling akhir jadi jam pulang - tidak bergantung status. */
  return { employeeNo: pin, timestamp: `${d}T${t.length === 5 ? `${t}:00` : t}+08:00`, type: "auto" };
}

export function parseAttlog(body: string): { punches: PunchInput[]; bad: number } {
  const punches: PunchInput[] = [];
  let bad = 0;
  for (const line of body.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    const p = parseAttlogLine(line);
    if (p) punches.push(p); else bad += 1;
  }
  return { punches, bad };
}

/** Konfigurasi yang dibalas saat handshake. Murni. */
export function handshakeText(sn: string): string {
  return [
    `GET OPTION FROM: ${sn}`,
    "ATTLOGStamp=None",
    "OPERLOGStamp=9999",
    "ATTPHOTOStamp=None",
    "ErrorDelay=30",
    "Delay=10",
    "TransTimes=00:00;14:05",
    "TransInterval=1",
    "TransFlag=TransData AttLog",
    "TimeZone=8",
    "Realtime=1",
    "Encrypt=None",
  ].join("\n");
}

async function snAllowed(sn: string): Promise<boolean> {
  if (!SN_RE.test(sn)) return false;
  const rows = await q<{ access_key: string }>("SELECT access_key FROM access_secrets WHERE access_key = ?", [`device:${sn}`]);
  return rows.length > 0;
}

function text(reply: FastifyReply, status: number, body: string): FastifyReply {
  return reply.status(status).type("text/plain").send(body);
}

export function registerAdmsRoutes(app: FastifyInstance): void {
  void app.register(async (sub) => {
    /* Mesin mengirim teks polos dengan Content-Type beragam (kadang kosong);
       parser ini hanya berlaku di plugin /iclock, rute JSON lain tidak terpengaruh. */
    const asText = (_req: FastifyRequest, body: string, done: (err: Error | null, body?: unknown) => void): void => done(null, body);
    sub.addContentTypeParser(["text/plain", "application/x-www-form-urlencoded", "application/octet-stream"], { parseAs: "string", bodyLimit: 1024 * 1024 }, asText);
    sub.addContentTypeParser("*", { parseAs: "string", bodyLimit: 1024 * 1024 }, asText);

    const gate = async (req: FastifyRequest, reply: FastifyReply): Promise<string | null> => {
      const lim = admsLimiter(getClientIp(req));
      if (!lim.allowed) { reply.header("Retry-After", String(lim.retryAfterSec)); text(reply, 429, "ERROR: rate limited"); return null; }
      const sn = String((req.query as Record<string, unknown>).SN ?? "").trim();
      if (!(await snAllowed(sn))) { text(reply, 401, "ERROR: device not registered"); return null; }
      return sn;
    };

    sub.get("/iclock/cdata", async (req, reply) => {
      const sn = await gate(req, reply);
      if (sn === null) return reply;
      return text(reply, 200, handshakeText(sn));
    });

    sub.post("/iclock/cdata", async (req, reply) => {
      const sn = await gate(req, reply);
      if (sn === null) return reply;
      const table = String((req.query as Record<string, unknown>).table ?? "").toUpperCase();
      // OPERLOG / ATTPHOTO / USERINFO dll. diterima saja supaya mesin tidak mengulang kirim.
      if (table !== "ATTLOG") return text(reply, 200, "OK");
      const { punches, bad } = parseAttlog(typeof req.body === "string" ? req.body : "");
      const result = punches.length > 0 ? await applyPunches(punches, `device:${sn}`) : { accepted: 0, unknown: [], invalid: 0 };
      await writeAudit({
        actor: `device:${sn}`, action: "attendance_ingest", table: "attendance", rowId: "-",
        diff: { protocol: "adms", lines: punches.length + bad, accepted: result.accepted, unknown: result.unknown, invalid: result.invalid + bad },
        ip: requestIp(req),
      });
      /* Balas jumlah baris yang DITERIMA mesin (termasuk PIN tak dikenal) agar
         mesin tidak mengirim ulang terus; PIN tak dikenal tercatat di audit. */
      return text(reply, 200, `OK: ${punches.length + bad}`);
    });

    sub.get("/iclock/getrequest", async (req, reply) => {
      const sn = await gate(req, reply);
      if (sn === null) return reply;
      return text(reply, 200, "OK");
    });

    sub.post("/iclock/devicecmd", async (req, reply) => {
      const sn = await gate(req, reply);
      if (sn === null) return reply;
      return text(reply, 200, "OK");
    });
  });
}
