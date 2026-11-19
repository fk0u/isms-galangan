// F3-L-08: impor tap absensi dari CSV dan pendaftaran alat absensi.
// CSV: kolom employeeNo,timestamp,type (type = in/out; timestamp ISO berzona
// atau "YYYY-MM-DD HH:MM" yang dianggap WITA). Butuh server.
import { useRef, useState } from "react";
import { Upload, Cpu, Copy, CheckCircle2 } from "lucide-react";
import { AsyncButton, Field, Modal, toast } from "../../components/ui";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch, isBackendConfigured } from "../../services/http";
import { Select } from "../../components/inputs/Select";

interface Punch { employeeNo: string; timestamp: string; type: "in" | "out" }

/* Jenis alat menentukan ID yang diisi & cara mesin mengirim data:
   fk   = Fingerspot Revo (protokol FK realtime), ID = "No Mesin" (dev_id);
   adms = ZKTeco dkk. (iclock), ID = nomor seri (SN);
   api  = integrasi JSON sendiri, memakai API key (header x-device-key). */
export type DeviceKind = "fk" | "adms" | "api";
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
/** Port nginx khusus mesin absensi (lihat docs/ops); bisa diganti lewat env build. */
const DEVICE_PORT = String(import.meta.env.VITE_ATTENDANCE_DEVICE_PORT || "8013");

/** Baris CSV → tap; baris header/rusak dilewati. Murni. */
export function parsePunchCsv(text: string): Punch[] {
  return text.split(/\r?\n/).flatMap((line) => {
    const [no, ts, ty] = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const type = /^(in|masuk)$/i.test(ty ?? "") ? "in" : /^(out|keluar|pulang)$/i.test(ty ?? "") ? "out" : null;
    if (!no || !ts || !type) return [];
    // Tanpa zona → WITA (+08:00), sesuai jam dinding galangan.
    const local = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(ts);
    const timestamp = local ? `${local[1]}T${local[2]}${local[3] ?? ":00"}+08:00` : ts;
    return Number.isNaN(Date.parse(timestamp)) ? [] : [{ employeeNo: no, timestamp, type }];
  });
}

export default function DeviceImport() {
  const { locale } = useT();
  const E = n_emp[locale];
  const { resyncCollections } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<DeviceKind>("fk");
  const [deviceId, setDeviceId] = useState("");
  const [idError, setIdError] = useState<string | null>(null);
  const [device, setDevice] = useState<{ deviceId: string; apiKey: string; kind: DeviceKind } | null>(null);
  if (!isBackendConfigured()) return null;
  /* Mesin di lapangan mengisi "Server IP" - host aplikasi ini; bila mesin
     menolak nama domain, isi IP server (ditunjukkan di petunjuk). */
  const serverHost = String(import.meta.env.VITE_ATTENDANCE_DEVICE_HOST || window.location.hostname);

  const importCsv = async (file: File): Promise<void> => {
    const punches = parsePunchCsv(await file.text());
    if (punches.length === 0) { toast(E.ingEmpty, "info"); return; }
    try {
      let accepted = 0;
      const unknown = new Set<string>();
      for (let i = 0; i < punches.length; i += 500) {
        const res = await apiFetch<{ accepted: number; unknown: string[] }>("/api/attendance/import", { method: "POST", body: JSON.stringify({ punches: punches.slice(i, i + 500) }) });
        accepted += res.accepted;
        res.unknown.forEach((u) => unknown.add(u));
      }
      await resyncCollections(["attendance"]);
      toast(E.ingDone.replace("{a}", String(accepted)).replace("{b}", String(unknown.size)), unknown.size > 0 ? "info" : "success");
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  const openForm = (): void => { setKind("fk"); setDeviceId(""); setIdError(null); setFormOpen(true); };

  const register = async (): Promise<void> => {
    const id = deviceId.trim();
    if (!id) return; // Field required menampilkan pesannya sendiri.
    if (!ID_RE.test(id)) { setIdError(E.ingIdInvalid); return; }
    try {
      const res = await apiFetch<{ deviceId: string; apiKey: string }>("/api/attendance/devices", { method: "POST", body: JSON.stringify({ deviceId: id }) });
      setFormOpen(false);
      setDevice({ ...res, kind });
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  const copyKey = async (key: string): Promise<void> => {
    try { await navigator.clipboard.writeText(key); toast(E.ingCopied, "success"); } catch { toast(E.ingCopyFail, "info"); }
  };

  const idHint = kind === "fk" ? E.ingIdHintFk : kind === "adms" ? E.ingIdHintAdms : E.ingIdHintApi;
  const setupRows = (k: DeviceKind): [string, string][] => k === "api"
    ? [[E.ingSetupEndpoint, "POST /api/attendance/ingest"], [E.ingSetupHeader, "x-device-key"]]
    : [[E.ingSetupServer, serverHost], [E.ingSetupPort, DEVICE_PORT]];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary text-xs" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> {E.ingCsv}</button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label={E.ingCsv}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ""; }} />
      <button type="button" className="btn-secondary text-xs" onClick={openForm}><Cpu className="h-3.5 w-3.5" /> {E.ingDevice}</button>
      <span className="text-xs text-steel-400">{E.ingHint}</span>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={E.ingRegTitle} subtitle={E.ingRegSub}
        footer={<>
          <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{E.ingCancel}</button>
          <AsyncButton className="btn-primary" onAction={register}>{E.ingRegBtn}</AsyncButton>
        </>}>
        <div className="space-y-4">
          <Field label={E.ingType}>
            <Select className="input" value={kind} onChange={(e) => { setKind(e.target.value as DeviceKind); setIdError(null); }}>
              <option value="fk">{E.ingTypeFk}</option>
              <option value="adms">{E.ingTypeAdms}</option>
              <option value="api">{E.ingTypeApi}</option>
            </Select>
          </Field>
          <Field label={E.ingId} hint={idHint} error={idError} required>
            <input className="input font-mono" value={deviceId} autoFocus spellCheck={false} autoComplete="off"
              placeholder={kind === "fk" ? "C2657C94531E0837" : kind === "adms" ? "66208026030016" : "gudang-01"}
              onChange={(e) => { setDeviceId(e.target.value); setIdError(null); }} />
          </Field>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">{kind === "api" ? E.ingSetupApiTitle : E.ingSetupTitle}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {setupRows(kind).map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-steel-500">{k}</dt><dd className="break-all font-mono text-navy-900">{v}</dd></div>
              ))}
            </dl>
            {kind !== "api" && <p className="mt-2 text-xs text-steel-400">{E.ingSetupDomainNote}</p>}
          </div>
        </div>
      </Modal>

      <Modal open={device !== null} onClose={() => setDevice(null)} title={E.ingDoneTitle.replace("{n}", device?.deviceId ?? "")}
        subtitle={device?.kind === "api" ? E.ingKeyHint : E.ingDoneSub}
        footer={<button type="button" className="btn-primary" onClick={() => setDevice(null)}>{E.ingClose}</button>}>
        {device && (device.kind === "api" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl bg-surface p-3">
              <p className="min-w-0 flex-1 break-all font-mono text-xs text-navy-900">{device.apiKey}</p>
              <button type="button" className="btn-secondary shrink-0 text-xs" onClick={() => void copyKey(device.apiKey)}><Copy className="h-3.5 w-3.5" /> {E.ingCopy}</button>
            </div>
            <p className="text-xs text-steel-500">POST /api/attendance/ingest · header <span className="font-mono">x-device-key</span></p>
          </div>
        ) : (
          <ol className="space-y-3">
            {[
              E.ingStepServer.replace("{h}", serverHost).replace("{p}", DEVICE_PORT),
              E.ingStepPin,
              E.ingStepScan,
            ].map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-steel-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-navy-900">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 pt-1 text-xs text-steel-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {E.ingNoKeyNeeded}</li>
          </ol>
        ))}
      </Modal>
    </div>
  );
}
