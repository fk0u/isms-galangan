/* Penerima protokol push "FK realtime" mesin Fingerspot Revo (WFV-208BNC dkk.)
 * tanpa cloud fingerspot.io. Protokol ditangkap & diverifikasi langsung dari
 * mesin asli (firmware A102G2S1K1K1Wbc01 v1.23, 16 Nov 2026):
 *
 *   Mesin: Server IP/Port → selalu POST "/" (nginx port 8013 meneruskan ke
 *   /fkweb). Header: request_code, trans_id, dev_id ("No Mesin"), blk_no, blk_len.
 *   Body : uint32 little-endian panjang JSON, lalu JSON, lalu (opsional) biner.
 *
 *   request_code           isi JSON                               balasan
 *   realtime_glog          user_id, io_time (YYYYMMDDHHmmss WITA) response_code: OK
 *   realtime_enroll_data   template biometrik user                response_code: OK (DIBUANG)
 *   receive_cmd            info firmware; tanya perintah          response_code: ERROR_NO_CMD
 *
 * Balasan WAJIB menyertakan response_code + trans_id yang sama; tanpa itu
 * mesin mengirim ulang log yang sama terus-menerus (terlihat 17x saat uji).
 * nginx WAJIB `underscores_in_headers on` karena semua header memakai "_".
 *
 * Otorisasi: dev_id harus sudah didaftarkan HR lewat POST /api/attendance/devices
 * (deviceId = No Mesin). Template biometrik tidak pernah disimpan/dicatat. */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requestIp, writeAudit } from "../audit.js";
import { q } from "../db.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";
import { applyPunches, type PunchInput } from "./attendanceIngest.js";

const fkLimiter = createRateLimiter(600, 60_000);
const DEV_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Ambil JSON dari body FK (uint32 LE panjang + JSON + biner). Murni. */
export function parseFkBody(buf: Buffer): Record<string, unknown> | null {
  if (buf.length < 4) return null;
  const n = buf.readUInt32LE(0);
  if (n <= 0 || n > buf.length - 4) return null;
  try {
    const v = JSON.parse(buf.subarray(4, 4 + n).toString("utf8").replace(/\0+$/, "")) as unknown;
    return typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/** "20261116114803" (jam mesin = WITA) → ISO +08:00; null bila tidak sah. Murni. */
export function fkTime(ioTime: unknown): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(ioTime ?? ""));
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+08:00`;
}

/** Satu log realtime_glog → tap "auto" (mesin tidak memakai tombol masuk/pulang). Murni. */
export function fkPunch(js: Record<string, unknown>): PunchInput | null {
  const pin = String(js.user_id ?? "").trim();
  const ts = fkTime(js.io_time);
  if (!DEV_RE.test(pin) || !ts) return null;
  return { employeeNo: pin, timestamp: ts, type: "auto" };
}

async function devAllowed(dev: string): Promise<boolean> {
  if (!DEV_RE.test(dev)) return false;
  const rows = await q<{ access_key: string }>("SELECT access_key FROM access_secrets WHERE access_key = ?", [`device:${dev}`]);
  return rows.length > 0;
}

function answer(reply: FastifyReply, status: number, code: string, trans: string): FastifyReply {
  return reply.status(status)
    .header("response_code", code)
    .header("trans_id", trans)
    .type("application/octet-stream")
    .send(Buffer.alloc(0));
}

export function registerFkwebRoutes(app: FastifyInstance): void {
  void app.register(async (sub) => {
    const asBuffer = (_req: FastifyRequest, body: Buffer, done: (err: Error | null, body?: unknown) => void): void => done(null, body);
    sub.addContentTypeParser(["application/octet-stream", "text/plain", "application/x-www-form-urlencoded"], { parseAs: "buffer", bodyLimit: 2 * 1024 * 1024 }, asBuffer);
    sub.addContentTypeParser("*", { parseAs: "buffer", bodyLimit: 2 * 1024 * 1024 }, asBuffer);

    sub.post("/fkweb", async (req, reply) => {
      const h = req.headers;
      const code = String(h.request_code ?? "");
      const trans = String(h.trans_id ?? "");
      const dev = String(h.dev_id ?? "").trim();
      const lim = fkLimiter(getClientIp(req));
      if (!lim.allowed) { reply.header("Retry-After", String(lim.retryAfterSec)); return answer(reply, 429, "ERROR", trans); }
      // Belum terdaftar → tolak; log tetap tersimpan di mesin dan terkirim setelah didaftarkan.
      if (!(await devAllowed(dev))) return answer(reply, 401, "ERROR", trans);

      if (code === "receive_cmd") return answer(reply, 200, "ERROR_NO_CMD", trans);
      // Template biometrik: diakui supaya mesin tidak mengulang, tetapi tidak disimpan.
      if (code !== "realtime_glog") return answer(reply, 200, "OK", trans);

      const js = Buffer.isBuffer(req.body) ? parseFkBody(req.body) : null;
      const punch = js ? fkPunch(js) : null;
      const result = punch ? await applyPunches([punch], `device:${dev}`) : { accepted: 0, unknown: [], invalid: 1 };
      await writeAudit({
        actor: `device:${dev}`, action: "attendance_ingest", table: "attendance", rowId: "-",
        diff: {
          protocol: "fk", userId: js ? String(js.user_id ?? "") : "", ioTime: js ? String(js.io_time ?? "") : "",
          verifyMode: js?.verify_mode ?? null, accepted: result.accepted, unknown: result.unknown, invalid: result.invalid,
        },
        ip: requestIp(req),
      });
      /* Log rusak / PIN tak dikenal tetap dijawab OK: mengirim ulang tidak akan
         memperbaikinya, dan jejaknya ada di audit_log. */
      return answer(reply, 200, "OK", trans);
    });
  });
}
