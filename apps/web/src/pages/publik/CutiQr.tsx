// F3-L-06: halaman publik pengajuan cuti/izin (dibuka dari QR di bengkel).
// Tanpa login akun dan tanpa AppShell: karyawan mengisi NIK + PIN cuti.
// Halaman ini tidak membaca data apa pun dari server - hanya mengirim.
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { BASE } from "../../services/http";
import { todayISO } from "../../utils/format";

const TYPES = ["Izin", "Sakit", "Tahunan"] as const;

export default function CutiQr() {
  const { token = "" } = useParams();
  const { locale } = useT();
  const E = n_emp[locale];
  const [f, setF] = useState({ nik: "", pin: "", type: "Izin", from: todayISO(), to: todayISO(), note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState("");

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/public/leave`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...f, nik: f.nik.trim(), note: f.note.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { data?: { id?: string }; error?: { message?: string } };
      if (res.ok && json.data?.id) setDoneId(json.data.id);
      else setError(res.status === 400 ? E.qrInvalid : json.error?.message ?? E.qrFail);
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
      {doneId ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" role="status">
          <p className="text-sm font-semibold text-emerald-800">{E.qrDone}</p>
          <p className="mt-1 font-mono text-sm text-emerald-900">{doneId}</p>
          <p className="mt-2 text-xs text-emerald-700">{E.qrDoneHint}</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => { setDoneId(""); setF((x) => ({ ...x, pin: "", note: "" })); }}>{E.qrAgain}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-steel-600">{E.qrNik}
            <input className={field} inputMode="numeric" autoComplete="off" required value={f.nik} onChange={(e) => setF({ ...f, nik: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-steel-600">{E.qrPin}
            <input className={field} type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="off" required value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} />
          </label>
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
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={busy}>{busy ? E.qrSending : E.qrSubmit}</button>
          <p className="text-center text-xs text-steel-400">{E.qrFoot}</p>
        </form>
      )}
    </main>
  );
}
