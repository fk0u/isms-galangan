// F3-L-08: impor tap absensi dari CSV dan pendaftaran alat absensi.
// CSV: kolom employeeNo,timestamp,type (type = in/out; timestamp ISO berzona
// atau "YYYY-MM-DD HH:MM" yang dianggap WITA). Butuh server.
import { useRef, useState } from "react";
import { Upload, Cpu } from "lucide-react";
import { Modal, toast } from "../../components/ui";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch, isBackendConfigured } from "../../services/http";

interface Punch { employeeNo: string; timestamp: string; type: "in" | "out" }

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
  const [device, setDevice] = useState<{ deviceId: string; apiKey: string } | null>(null);
  if (!isBackendConfigured()) return null;

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

  const register = async (): Promise<void> => {
    const deviceId = window.prompt(E.ingDevicePrompt)?.trim();
    if (!deviceId) return;
    try {
      setDevice(await apiFetch<{ deviceId: string; apiKey: string }>("/api/attendance/devices", { method: "POST", body: JSON.stringify({ deviceId }) }));
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary text-xs" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> {E.ingCsv}</button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label={E.ingCsv}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ""; }} />
      <button type="button" className="btn-secondary text-xs" onClick={() => void register()}><Cpu className="h-3.5 w-3.5" /> {E.ingDevice}</button>
      <span className="text-xs text-steel-400">{E.ingHint}</span>
      <Modal open={device !== null} onClose={() => setDevice(null)} title={E.ingKeyTitle.replace("{n}", device?.deviceId ?? "")} subtitle={E.ingKeyHint}>
        <p className="break-all rounded-xl bg-surface p-3 font-mono text-xs text-navy-900">{device?.apiKey}</p>
        <p className="mt-3 text-xs text-steel-500">POST /api/attendance/ingest · header <span className="font-mono">x-device-key</span></p>
      </Modal>
    </div>
  );
}
