/* fkweb-emulator.ts — meniru mesin Fingerspot Revo (protokol FK realtime)
 * byte-per-byte seperti hasil tangkapan mesin asli (16 Nov 2026): HTTP/1.0,
 * POST, header request_code/trans_id/dev_id/blk_no/blk_len, body =
 * uint32 LE panjang JSON + JSON (+ biner). Template biometrik di sini dummy (nol).
 *
 *   npm run emulate:fkweb -- --host 157.10.161.42 --port 8013 --dev UJI-EMU-01 --pin 1001
 *   opsi: --path /fkweb (langsung ke API; default "/" seperti mesin lewat nginx)
 *         --time 20261116075800   --out (tambah scan pulang 17:05)   --enroll */
import net from "node:net";

export interface FkFrame { code: string; trans: string; json: Record<string, unknown>; tail?: Buffer }

export const fkBody = (json: Record<string, unknown>, tail: Buffer = Buffer.alloc(0)): Buffer => {
  const js = Buffer.from(JSON.stringify(json) + "\n\0", "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(js.length, 0);
  return Buffer.concat([len, js, tail]);
};

export const glogFrame = (pin: string, ioTime: string): FkFrame => ({
  code: "realtime_glog", trans: "RTLogSendAction",
  json: { fk_bin_data_lib: "FKDataHS103", io_mode: 16777216, io_time: ioTime, log_image: null, user_id: pin, verify_mode: 268435456 },
});
export const cmdFrame = (now: string): FkFrame => ({
  code: "receive_cmd", trans: "ReceiveCommandAction",
  json: { fk_info: { firmware: "EMULATOR v1", fk_bin_data_lib: "FKDataHS103", supported_enroll_data: ["FP", "FACE", "PALMVEIN"] }, fk_name: "Fingerspot", fk_time: now },
});
export const enrollFrame = (pin: string): FkFrame => ({
  code: "realtime_enroll_data", trans: "RTEnrollDataAction",
  json: { enroll_data_array: [{ backup_number: 0, enroll_data: "BIN_1" }], user_id: pin, user_name: "Emulator", user_privilege: "USER" },
  tail: Buffer.alloc(800),
});

/** Header persis seperti mesin (tanpa Host/Content-Length; ditambah pemanggil). */
export function fkHeaders(dev: string, f: FkFrame, bodyLen: number): Record<string, string> {
  return { request_code: f.code, trans_id: f.trans, dev_id: dev, blk_no: "0", blk_len: String(bodyLen), "content-type": "application/octet-stream" };
}

/** Kirim satu frame lewat TCP mentah (HTTP/1.0, seperti mesin). */
function sendRaw(host: string, port: number, path: string, dev: string, f: FkFrame): Promise<string> {
  const body = fkBody(f.json, f.tail);
  const h = fkHeaders(dev, f, body.length);
  const head = [
    `POST ${path} HTTP/1.0`, "User-Agent: Mozilla/4.0", "Connection: close",
    `request_code: ${h.request_code}`, `Content-Type: ${h["content-type"]}`, `Content-Length: ${body.length}`,
    `trans_id: ${h.trans_id}`, `dev_id: ${dev}`, `blk_no: 0`, `blk_len: ${body.length}`, `HOST: ${host}:${port}`, "", "",
  ].join("\r\n");
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, host, () => sock.end(Buffer.concat([Buffer.from(head), body])));
    let out = "";
    sock.setTimeout(15_000, () => { sock.destroy(); reject(new Error("timeout")); });
    sock.on("data", (d) => { out += d.toString("latin1"); });
    sock.on("end", () => resolve(out));
    sock.on("error", reject);
  });
}

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

async function main(): Promise<void> {
  const host = arg("host", "127.0.0.1");
  const port = Number(arg("port", "8013"));
  const path = arg("path", "/");
  const dev = arg("dev", "UJI-EMU-01");
  const pins = arg("pin", "1001").split(",").map((s) => s.trim()).filter(Boolean);
  const now = new Date(Date.now() + 8 * 3600_000).toISOString().replace(/\D/g, "").slice(0, 14);
  const t = arg("time", now);
  const frames: FkFrame[] = [cmdFrame(now)];
  if (process.argv.includes("--enroll")) for (const p of pins) frames.push(enrollFrame(p));
  for (const p of pins) frames.push(glogFrame(p, t));
  if (process.argv.includes("--out")) for (const p of pins) frames.push(glogFrame(p, `${t.slice(0, 8)}170500`));
  console.log(`Emulator Fingerspot FK → ${host}:${port}${path}  dev_id=${dev}`);
  for (const f of frames) {
    const res = await sendRaw(host, port, path, dev, f);
    const status = res.split("\r\n")[0] ?? "";
    const rc = /response_code:\s*(\S+)/i.exec(res)?.[1] ?? "-";
    console.log(`[${f.code}${f.code === "realtime_glog" ? ` ${String(f.json.user_id)} @${String(f.json.io_time)}` : ""}] ${status} | response_code=${rc}`);
  }
}

if (process.argv[1]?.endsWith("fkweb-emulator.ts")) {
  main().catch((e) => { console.error(e); process.exitCode = 1; });
}
