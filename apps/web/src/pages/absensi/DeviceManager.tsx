// ADR-0025: tab "Mesin" di Absensi - status mesin, pencocokan ID mesin ↔
// karyawan (ID di mesin tidak bisa diubah, jadi karyawan yang memegang "ID
// mesin"), dan konsol perintah ke mesin lewat server (developer/direktur).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cpu, Link2, Unlink, RefreshCw, Send, X } from "lucide-react";
import { AsyncButton, Badge, EmptyState, Field, Modal, toast } from "../../components/ui";
import { SearchSelect } from "../../components/SearchSelect";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch } from "../../services/http";
import { fmtTanggalJam } from "../../utils/format";

interface DeviceRow { deviceId: string; lastSeen: string | null; ip: string | null; info: { firmware?: string; fk_name?: string } | null }
interface DeviceUser {
  deviceId: string; userId: string; userName: string; lastSeen: string; pending: number;
  employee: { id: string; name: string; via: "devicePin" | "nik" } | null;
  suggestion: { id: string; name: string; score: number } | null;
}
interface EmpOpt { id: string; name: string; nik: string; devicePin: string }
interface Overview { devices: DeviceRow[]; users: DeviceUser[]; employees: EmpOpt[]; canRaw: boolean }
interface Command { id: string; cmdCode: string; param: unknown; status: string; result: unknown; createdBy: string; createdAt: string; sentAt: string | null; doneAt: string | null }

/** Mesin bertanya perintah tiap ±20 detik; lebih dari 2 menit diam = offline. */
const ONLINE_MS = 2 * 60_000;
const STATUS_TONE: Record<string, "gray" | "blue" | "green" | "red" | "amber"> = { queued: "gray", sent: "blue", done: "green", error: "red", timeout: "amber", cancelled: "gray" };

export default function DeviceManager() {
  const { locale } = useT();
  const E = n_emp[locale];
  const { resyncCollections } = useStore();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [consoleDev, setConsoleDev] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try { setData(await apiFetch<Overview>("/api/attendance/device-users")); } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); } finally { setLoading(false); }
  }, [E.ingFail]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 20_000);
    return () => window.clearInterval(t);
  }, [load]);

  const empName = useMemo(() => new Map((data?.employees ?? []).map((e) => [e.id, e])), [data]);
  const options = useMemo(() => (data?.employees ?? []).map((e) => ({
    value: e.id, label: e.name, subLabel: [e.nik && `NIK ${e.nik}`, e.devicePin && E.devPinTaken.replace("{n}", e.devicePin)].filter(Boolean).join(" · "),
  })), [data, E.devPinTaken]);

  const link = async (u: DeviceUser, employeeId: string | null): Promise<void> => {
    try {
      const r = await apiFetch<{ reprocessed: number; previousEmployeeId: string | null }>("/api/attendance/device-users/link", { method: "POST", body: JSON.stringify({ userId: u.userId, employeeId }) });
      if (employeeId) {
        const name = empName.get(employeeId)?.name ?? employeeId;
        toast(E.devLinked.replace("{a}", u.userId).replace("{b}", name) + (r.reprocessed > 0 ? ` · ${E.devReprocessed.replace("{n}", String(r.reprocessed))}` : ""), "success");
        if (r.reprocessed > 0) await resyncCollections(["attendance"]);
      } else {
        toast(E.devUnlinked.replace("{a}", u.userId), "success");
      }
      await resyncCollections(["employees"]);
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  if (loading && !data) return <p className="py-10 text-center text-sm text-steel-400">{E.devLoading}</p>;
  if (!data || data.devices.length === 0) {
    return <EmptyState icon={<Cpu className="h-6 w-6" />} title={E.devNone} subtitle={E.devNoneHint} />;
  }
  const unlinked = data.users.filter((u) => !u.employee).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.devices.map((d) => {
          const online = d.lastSeen !== null && Date.now() - Date.parse(d.lastSeen) < ONLINE_MS;
          return (
            <div key={d.deviceId} className="rounded-xl border border-steel-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-navy-900">{d.deviceId}</p>
                  <p className="mt-0.5 truncate text-xs text-steel-500">{d.info?.firmware ? `${d.info.fk_name ?? ""} ${d.info.firmware}`.trim() : E.devNoInfo}</p>
                </div>
                <span className="shrink-0"><Badge tone={online ? "green" : d.lastSeen ? "amber" : "gray"}>{online ? E.devOnline : d.lastSeen ? E.devOffline : E.devNever}</Badge></span>
              </div>
              <p className="mt-3 text-xs text-steel-500">{d.lastSeen ? E.devLastSeen.replace("{t}", fmtTanggalJam(d.lastSeen)) : E.devNeverHint}</p>
              {data.canRaw && (
                <button type="button" className="btn-secondary mt-3 text-xs" onClick={() => setConsoleDev(d.deviceId)}><Send className="h-3.5 w-3.5" /> {E.devConsole}</button>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-navy-900">{E.devUsersTitle}</h3>
            <p className="text-xs text-steel-500">{E.devUsersSub}</p>
          </div>
          <div className="flex items-center gap-2">
            {unlinked > 0 && <Badge tone="amber">{E.devUnlinkedCount.replace("{n}", String(unlinked))}</Badge>}
            <AsyncButton className="btn-secondary text-xs" onAction={load}><RefreshCw className="h-3.5 w-3.5" /> {E.devRefresh}</AsyncButton>
          </div>
        </div>
        {data.users.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-steel-500">{E.devUsersEmpty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-steel-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-steel-500">
                <tr>
                  <th className="w-20 px-3 py-2">{E.devColId}</th>
                  <th className="px-3 py-2">{E.devColName}</th>
                  <th className="px-3 py-2">{E.devColEmp}</th>
                  <th className="w-32 px-3 py-2 text-right">{E.devColAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {data.users.map((u) => {
                  const key = `${u.deviceId}|${u.userId}`;
                  const chosen = pick[key] ?? u.suggestion?.id ?? "";
                  return (
                    <tr key={key} className="align-top">
                      <td className="px-3 py-2.5 font-mono text-navy-900">{u.userId}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-navy-900">{u.userName || <span className="text-steel-400">{E.devNoName}</span>}</p>
                        {u.pending > 0 && <p className="mt-0.5 text-xs text-amber-700">{E.devPending.replace("{n}", String(u.pending))}</p>}
                      </td>
                      <td className="px-3 py-2.5">
                        {u.employee ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-navy-900">{u.employee.name}</span>
                            <Badge tone="green">{u.employee.via === "nik" ? E.devViaNik : E.devViaPin}</Badge>
                          </div>
                        ) : (
                          <div className="min-w-[180px] max-w-[260px]">
                            <SearchSelect value={chosen} onChange={(v) => setPick((p) => ({ ...p, [key]: v }))} options={options}
                              placeholder={E.devPickEmp} ariaLabel={E.devPickEmpFor.replace("{n}", u.userId)} emptyText={E.devNoEmp} />
                            {u.suggestion && chosen === u.suggestion.id && (
                              <p className="mt-1 text-xs text-steel-500">{E.devSuggested.replace("{n}", String(Math.round(u.suggestion.score * 100)))}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {u.employee ? (
                          u.employee.via === "devicePin" && (
                            <AsyncButton className="btn-secondary text-xs" onAction={() => link(u, null)}><Unlink className="h-3.5 w-3.5" /> {E.devUnlink}</AsyncButton>
                          )
                        ) : (
                          <AsyncButton className="btn-primary text-xs" disabled={!chosen} onAction={() => link(u, chosen)}><Link2 className="h-3.5 w-3.5" /> {E.devLink}</AsyncButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {consoleDev && <CommandConsole deviceId={consoleDev} onClose={() => setConsoleDev(null)} />}
    </div>
  );
}

/** Konsol perintah mentah (developer/direktur): menguji kode perintah tiap firmware. */
function CommandConsole({ deviceId, onClose }: { deviceId: string; onClose: () => void }) {
  const { locale } = useT();
  const E = n_emp[locale];
  const [cmd, setCmd] = useState("GET_USER_ID_LIST");
  const [param, setParam] = useState("");
  const [paramErr, setParamErr] = useState<string | null>(null);
  const [list, setList] = useState<Command[]>([]);
  const url = `/api/attendance/devices/${encodeURIComponent(deviceId)}/commands`;

  const load = useCallback(async (): Promise<void> => {
    try { setList((await apiFetch<{ commands: Command[] }>(url)).commands); } catch { /* diam: dicoba lagi berkala */ }
  }, [url]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(t);
  }, [load]);

  const send = async (): Promise<void> => {
    let p: unknown = null;
    if (param.trim()) {
      try { p = JSON.parse(param) as unknown; } catch { setParamErr(E.devParamInvalid); return; }
      if (typeof p !== "object" || p === null || Array.isArray(p)) { setParamErr(E.devParamInvalid); return; }
    }
    try {
      await apiFetch(url, { method: "POST", body: JSON.stringify({ cmd: cmd.trim().toUpperCase(), param: p }) });
      toast(E.devQueued, "success");
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };
  const cancel = async (id: string): Promise<void> => {
    try { await apiFetch(`${url}/${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); }
  };

  return (
    <Modal open onClose={onClose} title={E.devConsoleTitle.replace("{n}", deviceId)} subtitle={E.devConsoleSub} wide
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>{E.ingClose}</button>
        <AsyncButton className="btn-primary" onAction={send}><Send className="h-4 w-4" /> {E.devSend}</AsyncButton>
      </>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Field label={E.devCmdCode} hint={E.devCmdHint} required>
          <input className="input font-mono" value={cmd} spellCheck={false} onChange={(e) => setCmd(e.target.value)} />
        </Field>
        <Field label={E.devParam} hint={E.devParamHint} error={paramErr}>
          <textarea className="input min-h-[42px] font-mono text-xs" rows={2} value={param} spellCheck={false} placeholder='{"user_id":"1"}'
            onChange={(e) => { setParam(e.target.value); setParamErr(null); }} />
        </Field>
      </div>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-steel-500">{E.devHistory}</h4>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-steel-400">{E.devHistoryEmpty}</p>
      ) : (
        <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto">
          {list.map((c) => (
            <li key={c.id} className="rounded-xl border border-steel-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-navy-900">{c.cmdCode}</span>
                <Badge tone={STATUS_TONE[c.status] ?? "gray"}>{E.devStatus[c.status as keyof typeof E.devStatus] ?? c.status}</Badge>
                <span className="text-xs text-steel-400">{fmtTanggalJam(c.createdAt)} · {c.createdBy}</span>
                {c.status === "queued" && (
                  <button type="button" className="ml-auto inline-flex items-center gap-1 text-xs text-steel-500 hover:text-red-600" onClick={() => void cancel(c.id)}><X className="h-3.5 w-3.5" /> {E.devCancelCmd}</button>
                )}
              </div>
              {c.param !== null && <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-steel-500">param: {JSON.stringify(c.param)}</pre>}
              {c.result !== null && <pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface p-2 text-[11px] text-navy-900">{JSON.stringify(c.result, null, 1)}</pre>}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
