// F3-L-06 / ADR-0019: halaman publik pengajuan cuti/izin (dibuka dari QR di bengkel).
// Tanpa login akun dan tanpa AppShell. Karyawan mengisi NIK; server hanya
// mengembalikan nama, jabatan, dan departemen untuk verifikasi sebelum kirim.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { BASE } from "../../services/http";
import { todayISO } from "../../utils/format";

const TYPES = ["Izin", "Sakit", "Tahunan"] as const;
const MAX_DOC = 3 * 1024 * 1024;
interface Preview { name: string; role: string; dept: string }

const post = (path: string, body: unknown): Promise<Response> =>
  fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error ?? new Error("read"));
  r.readAsDataURL(file);
});

export default function CutiQr() {
  const { token = "" } = useParams();
  const { locale } = useT();
  const E = n_emp[locale];
  const [f, setF] = useState({ nik: "", type: "Izin", from: todayISO(), to: todayISO(), note: "" });
  const [doc, setDoc] = useState<File | null>(null);
  const [link, setLink] = useState<"checking" | "ok" | "gone">("checking");
  // undefined = belum dicek, null = NIK belum dikenali.
  const [preview, setPreview] = useState<Preview | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState("");

  /* #99: tautan lama/kedaluwarsa langsung diberi tahu saat dibuka, bukan baru
     setelah karyawan selesai mengisi form. Gangguan jaringan tidak dianggap
     kedaluwarsa - form tetap dibuka dan server memutuskan saat kirim. */
  useEffect(() => {
    let alive = true;
    post("/api/public/leave/check", { token })
      .then((res) => { if (alive) setLink(res.status === 404 ? "gone" : "ok"); })
      .catch(() => { if (alive) setLink("ok"); });
    return () => { alive = false; };
  }, [token]);

  const lookup = async (): Promise<void> => {
    const nik = f.nik.trim();
    if (!nik) { setPreview(undefined); return; }
    try {
      const res = await post("/api/public/leave/check", { token, nik });
      if (res.status === 404) { setLink("gone"); return; }
      if (!res.ok) return;
      const json = (await res.json()) as { data?: { employee?: Preview | null } };
      setPreview(json.data?.employee ?? null);
    } catch { /* pratinjau hanya bantuan; kirim tetap divalidasi server */ }
  };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      // Dokumen ikut dalam permintaan yang sama: kirim baru selesai setelah berkas terunggah.
      const attachment = doc ? { name: doc.name, data: await toBase64(doc) } : undefined;
      const res = await post("/api/public/leave", { token, ...f, nik: f.nik.trim(), note: f.note.trim(), attachment });
      const json = (await res.json().catch(() => ({}))) as { data?: { id?: string }; error?: { message?: string } };
      if (res.ok && json.data?.id) setDoneId(json.data.id);
      else if (res.status === 404) setLink("gone");
      else setError(json.error?.message ?? (res.status === 400 || res.status === 413 ? E.qrInvalid : E.qrFail));
    } catch {
      setError(E.qrFail);
    } finally {
      setBusy(false);
    }
  };

  const field = "mt-1 w-full rounded-xl border border-steel-200 bg-white px-3 py-2.5 text-base text-navy-900 focus:border-navy-600 focus:outline-none";
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-surface px-4 py-6">
      <img src="/logo-sb.png" alt="" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-center text-lg font-semibold text-navy-900">{E.qrTitle}</h1>
      {link === "gone" ? (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm font-medium text-amber-800" role="alert">{E.qrGone}</p>
      ) : link === "checking" ? (
        <p className="mt-6 text-center text-sm text-steel-500" role="status">{E.qrChecking}</p>
      ) : doneId ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" role="status">
          <p className="text-sm font-semibold text-emerald-800">{E.qrDone}</p>
          <p className="mt-1 font-mono text-sm text-emerald-900">{doneId}</p>
          <p className="mt-2 text-xs text-emerald-700">{E.qrDoneHint}</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => { setDoneId(""); setDoc(null); setF((x) => ({ ...x, note: "" })); }}>{E.qrAgain}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-steel-600">{E.qrNik}
            <input className={field} inputMode="numeric" autoComplete="off" required value={f.nik}
              onChange={(e) => { setF({ ...f, nik: e.target.value }); setPreview(undefined); }} onBlur={() => void lookup()} />
          </label>
          {preview && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5" role="status">
              <p className="text-sm font-semibold text-emerald-900">{preview.name}</p>
              <p className="text-xs text-emerald-800">{[preview.role, preview.dept].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-xs text-emerald-700">{E.qrNikOk}</p>
            </div>
          )}
          {preview === null && <p className="text-xs text-amber-700" role="status">{E.qrNikUnknown}</p>}
          <label className="block text-sm font-medium text-steel-600">{E.qrType}
            <select className={field} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{E.qrTypes[t]}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-steel-600">{E.qrFrom}
              <input className={field} type="date" required value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: f.to < e.target.value ? e.target.value : f.to })} />
            </label>
            <label className="block text-sm font-medium text-steel-600">{E.qrTo}
              <input className={field} type="date" required min={f.from} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
            </label>
          </div>
          <label className="block text-sm font-medium text-steel-600">{E.qrNote}
            <textarea className={field} rows={3} required minLength={3} maxLength={500} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-steel-600">{E.qrDoc}
            <input className={`${field} text-sm`} type="file" accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > MAX_DOC) { e.target.value = ""; setDoc(null); setError(E.qrDocTooBig); return; }
                setError("");
                setDoc(file);
              }} />
            <span className="mt-1 block text-xs font-normal text-steel-400">{E.qrDocHint}</span>
          </label>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={busy}>{busy ? E.qrSending : E.qrSubmit}</button>
          <p className="text-center text-xs text-steel-400">{E.qrFoot}</p>
        </form>
      )}
    </main>
  );
}
