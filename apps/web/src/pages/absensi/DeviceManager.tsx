// ADR-0025: tab "Mesin" di Absensi - status mesin, pencocokan ID mesin ↔
// karyawan (ID di mesin tidak bisa diubah, jadi karyawan yang memegang "ID
// mesin"), dan konsol perintah ke mesin lewat server (developer/direktur).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cpu, Link2, Unlink, RefreshCw, Send, X, Clock, Power, Users, Trash2, Activity } from "lucide-react";
import { AsyncButton, Badge, ConfirmModal, EmptyState, Field, Modal, SearchBox, toast } from "../../components/ui";
import { SearchSelect } from "../../components/SearchSelect";
import DevicePanel from "./DevicePanel";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";
import { apiFetch } from "../../services/http";
import { fmtTanggalJam } from "../../utils/format";

interface DeviceStats { user_count?: number; user_max?: number; fp_count?: number; face_count?: number; pv_count?: number; idcard_count?: number; all_log_count?: number; at?: string }
interface DeviceRow { deviceId: string; lastSeen: string | null; ip: string | null; info: { firmware?: string; fk_name?: string } | null; stats: DeviceStats | null }
type HrAction = "status" | "sync_time" | "restart" | "pull_users";
interface DeviceUser {
  deviceId: string; userId: string; userName: string; lastSeen: string; pending: number;
  employee: { id: string; name: string; via: "devicePin" | "nik" } | null;
  suggestion: { id: string; name: string; score: number } | null;
}
interface EmpOpt { id: string; name: string; nik: string; devicePin: string }
interface Overview { devices: DeviceRow[]; users: DeviceUser[]; employees: EmpOpt[]; canRaw: boolean }
interface Command { id: string; cmdCode: string; param: unknown; status: string; result: unknown; createdBy: string; createdAt: string; sentAt: string | null; doneAt: string | null; meta?: { action?: string; userId?: string; userName?: string } | null }

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
  const [empQ, setEmpQ] = useState("");
  const [onlyUnlinked, setOnlyUnlinked] = useState(false);
  const [consoleDev, setConsoleDev] = useState<string | null>(null);
  const [cmds, setCmds] = useState<Record<string, Command[]>>({});
  const [restartDev, setRestartDev] = useState<string | null>(null);
  const [removeUser, setRemoveUser] = useState<DeviceUser | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const ov = await apiFetch<Overview>("/api/attendance/device-users");
      setData(ov);
      // Riwayat aksi per mesin (HR boleh membaca) - menampilkan status antre/terkirim/selesai.
      const entries = await Promise.all(ov.devices.map(async (d) => {
        try { return [d.deviceId, (await apiFetch<{ commands: Command[] }>(`/api/attendance/devices/${encodeURIComponent(d.deviceId)}/commands`)).commands] as const; } catch { return [d.deviceId, [] as Command[]] as const; }
      }));
      setCmds(Object.fromEntries(entries));
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); } finally { setLoading(false); }
  }, [E.ingFail]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 5_000);
    return () => window.clearInterval(t);
  }, [load]);

  const runAction = async (deviceId: string, body: Record<string, unknown>, okMsg: string): Promise<boolean> => {
    try {
      await apiFetch(`/api/attendance/devices/${encodeURIComponent(deviceId)}/actions`, { method: "POST", body: JSON.stringify(body) });
      toast(okMsg, "success");
      await load();
      return true;
    } catch (e) { toast(e instanceof Error ? e.message : E.ingFail, "info"); return false; }
  };
  const quick = (deviceId: string, action: HrAction): Promise<boolean> => runAction(deviceId, { action }, E.devActQueued);
  const actionLabel = (c: Command): string => {
    const a = c.meta?.action ?? "";
    const map: Record<string, string> = {
      settings: E.pnlSetBtn, pull_logs: E.pnlPull,
      status: E.devActStatus, sync_time: E.devActTime, restart: E.devActRestart, pull_users: E.devActPull,
      pull_name: E.devActPullName.replace("{n}", c.meta?.userId ?? ""), push_check: E.devActPushCheck.replace("{n}", c.meta?.userId ?? ""),
      push: E.devActPush.replace("{a}", c.meta?.userName ?? "").replace("{n}", c.meta?.userId ?? ""), remove: E.devActRemove.replace("{n}", c.meta?.userId ?? ""),
    };
    return map[a] ?? c.cmdCode;
  };
  const resultNote = (c: Command): string => {
    const r = c.result as { returnCode?: string } | null;
    if (c.status === "error" && r?.returnCode === "ID_TAKEN") return E.devIdTaken;
    if (c.status === "done" && c.meta?.action === "push_check") return E.devIdFree;
    if (c.status === "sent" && c.meta?.action === "restart") return E.devRestartSent;
    const imp = (c.result as { imported?: { total: number; added: number } } | null)?.imported;
    if (imp) return E.pnlPullDone.replace("{a}", String(imp.total)).replace("{b}", String(imp.added));
    return "";
  };

  const empName = useMemo(() => new Map((data?.employees ?? []).map((e) => [e.id, e])), [data]);

  const link = async (userId: string, employeeId: string | null): Promise<void> => {
    try {
      const r = await apiFetch<{ reprocessed: number; previousEmployeeId: string | null }>("/api/attendance/device-users/link", { method: "POST", body: JSON.stringify({ userId, employeeId }) });
      if (employeeId) {
        const name = empName.get(employeeId)?.name ?? employeeId;
        toast(E.devLinked.replace("{a}", userId).replace("{b}", name) + (r.reprocessed > 0 ? ` · ${E.devReprocessed.replace("{n}", String(r.reprocessed))}` : ""), "success");
        if (r.reprocessed > 0) await resyncCollections(["attendance"]);
      } else {
        toast(E.devUnlinked.replace("{a}", userId), "success");
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
  // ID mesin yang belum dipegang karyawan mana pun = pilihan di kolom kanan.
  const freeIds = data.users.filter((u) => !u.employee);
  const idOptions = freeIds.map((u) => ({ value: u.userId, label: `ID ${u.userId}${u.userName ? ` · ${u.userName}` : ""}`, subLabel: u.pending > 0 ? E.devPending.replace("{n}", String(u.pending)) : undefined }));
  const needle = empQ.trim().toLowerCase();
  const empRows = data.employees
    .map((emp) => ({ emp, user: data.users.find((u) => u.employee?.id === emp.id) }))
    .filter(({ emp, user }) => (!onlyUnlinked || (!user && !emp.devicePin))
      && (!needle || emp.name.toLowerCase().includes(needle) || emp.nik.includes(needle) || (user?.userId ?? emp.devicePin).toLowerCase().includes(needle)))
    .sort((a, b) => Number(Boolean(a.user || a.emp.devicePin)) - Number(Boolean(b.user || b.emp.devicePin)) || a.emp.name.localeCompare(b.emp.name));

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
              {d.stats && (
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {([[E.devStatUsers, d.stats.user_count], [E.devStatFp, d.stats.fp_count], [E.devStatFace, d.stats.face_count], [E.devStatPalm, d.stats.pv_count], [E.devStatCard, d.stats.idcard_count], [E.devStatLogs, d.stats.all_log_count]] as const).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-surface px-2 py-1.5"><dd className="text-sm font-semibold tabular-nums text-navy-900">{v ?? "-"}</dd><dt className="text-[11px] text-steel-500">{k}</dt></div>
                  ))}
                </dl>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <AsyncButton className="btn-secondary text-xs" onAction={() => quick(d.deviceId, "status")}><Activity className="h-3.5 w-3.5" /> {E.devBtnStatus}</AsyncButton>
                <AsyncButton className="btn-secondary text-xs" onAction={() => quick(d.deviceId, "sync_time")}><Clock className="h-3.5 w-3.5" /> {E.devBtnTime}</AsyncButton>
                <AsyncButton className="btn-secondary text-xs" onAction={() => quick(d.deviceId, "pull_users")}><Users className="h-3.5 w-3.5" /> {E.devBtnPull}</AsyncButton>
                <button type="button" className="btn-secondary text-xs" onClick={() => setRestartDev(d.deviceId)}><Power className="h-3.5 w-3.5" /> {E.devBtnRestart}</button>
                {data.canRaw && (
                  <button type="button" className="btn-secondary text-xs" onClick={() => setConsoleDev(d.deviceId)}><Send className="h-3.5 w-3.5" /> {E.devConsole}</button>
                )}
              </div>
              {(cmds[d.deviceId] ?? []).length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-steel-100 pt-2">
                  {(cmds[d.deviceId] ?? []).slice(0, 4).map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-2 text-xs">
                      <span className="min-w-0 text-steel-600"><span className="block truncate">{actionLabel(c)}</span>{resultNote(c) && <span className="block text-[11px] text-steel-400">{resultNote(c)}</span>}</span>
                      <span className="shrink-0"><Badge tone={STATUS_TONE[c.status] ?? "gray"}>{E.devStatus[c.status as keyof typeof E.devStatus] ?? c.status}</Badge></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {data.devices.map((d) => (
        <section key={`p-${d.deviceId}`} aria-label={E.pnlTitle.replace("{n}", d.deviceId)}>
          <h3 className="mb-2 text-[15px] font-semibold text-navy-900">{E.pnlTitle.replace("{n}", d.deviceId)}</h3>
          <DevicePanel deviceId={d.deviceId} onAction={(body, msg) => runAction(d.deviceId, body, msg)} />
        </section>
      ))}

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-navy-900">{E.devUsersTitle}</h3>
            <p className="text-xs text-steel-500">{E.devUsersSub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unlinked > 0 && <Badge tone="amber">{E.devUnlinkedCount.replace("{n}", String(unlinked))}</Badge>}
            <AsyncButton className="btn-secondary text-xs" onAction={load}><RefreshCw className="h-3.5 w-3.5" /> {E.devRefresh}</AsyncButton>
          </div>
        </div>
        {/* Dibalik (permintaan 19 Nov): SEMUA karyawan di kiri, ID mesin dipilih
            di kanan - HR menghubungkan karyawan ke ID mesin, bukan sebaliknya. */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1"><SearchBox value={empQ} onChange={setEmpQ} placeholder={E.mapSearch} ariaLabel={E.mapSearch} /></div>
          <label className="flex items-center gap-2 text-xs text-steel-600">
            <input type="checkbox" checked={onlyUnlinked} onChange={(e) => setOnlyUnlinked(e.target.checked)} /> {E.mapOnlyUnlinked}
          </label>
        </div>
        {freeIds.length > 0 && (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{E.mapFreeIds.replace("{n}", freeIds.map((u) => u.userName ? `${u.userId} (${u.userName})` : u.userId).join(", "))}</p>
        )}
        <div className="overflow-x-auto rounded-xl border border-steel-200">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">{E.devUsersTitle}</caption>
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th scope="col" className="px-3 py-2">{E.devColEmp}</th>
                <th scope="col" className="px-3 py-2">{E.devColId}</th>
                <th scope="col" className="w-32 px-3 py-2 text-right">{E.devColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {empRows.map(({ emp, user }) => {
                const suggested = data.users.find((u) => !u.employee && u.suggestion?.id === emp.id)?.userId ?? "";
                const chosen = pick[emp.id] ?? suggested;
                return (
                  <tr key={emp.id} className="align-top">
                    <td className="px-3 py-2.5">
                      <p className="text-navy-900">{emp.name}</p>
                      {emp.nik && <p className="text-xs text-steel-500">NIK {emp.nik}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      {user ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-navy-900">{user.userId}</span>
                          {user.userName && <span className="text-xs text-steel-500">{user.userName}</span>}
                          <Badge tone="green">{user.employee?.via === "nik" ? E.devViaNik : E.devViaPin}</Badge>
                        </div>
                      ) : emp.devicePin ? (
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-navy-900">{emp.devicePin}</span><Badge tone="amber">{E.mapNotSeen}</Badge></div>
                      ) : (
                        <div className="min-w-[180px] max-w-[260px]">
                          <SearchSelect value={chosen} onChange={(v) => setPick((p) => ({ ...p, [emp.id]: v }))} options={idOptions}
                            placeholder={E.mapPickId} ariaLabel={E.mapPickIdFor.replace("{n}", emp.name)} emptyText={E.mapNoFreeId} />
                          {suggested && chosen === suggested && <p className="mt-1 text-xs text-steel-500">{E.mapSuggested}</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {user || emp.devicePin ? (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {(emp.devicePin || user?.employee?.via === "devicePin") && (
                            <AsyncButton className="btn-secondary text-xs" onAction={() => link(emp.devicePin || user!.userId, null)}><Unlink className="h-3.5 w-3.5" /> {E.devUnlink}</AsyncButton>
                          )}
                          {user && <button type="button" className="btn-secondary text-xs text-red-600" onClick={() => setRemoveUser(user)} aria-label={E.devRemoveFor.replace("{n}", user.userId)}><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      ) : (
                        <AsyncButton className="btn-primary text-xs" disabled={!chosen} onAction={() => link(chosen, emp.id)}><Link2 className="h-3.5 w-3.5" /> {E.devLink}</AsyncButton>
                      )}
                    </td>
                  </tr>
                );
              })}
              {empRows.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-sm text-steel-400">{E.devNoEmp}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {consoleDev && <CommandConsole deviceId={consoleDev} onClose={() => setConsoleDev(null)} />}

      <ConfirmModal open={restartDev !== null} title={E.devRestartTitle} desc={E.devRestartDesc} confirmLabel={E.devBtnRestart} danger
        onCancel={() => setRestartDev(null)}
        onConfirm={async () => { if (restartDev) await quick(restartDev, "restart"); setRestartDev(null); }} />
      <ConfirmModal open={removeUser !== null} title={E.devRemoveTitle.replace("{n}", removeUser?.userId ?? "")}
        desc={E.devRemoveDesc.replace("{a}", removeUser?.employee?.name ?? removeUser?.userName ?? "").replace("{n}", removeUser?.userId ?? "")}
        confirmLabel={E.devRemoveBtn} danger onCancel={() => setRemoveUser(null)}
        onConfirm={async () => { if (removeUser) await runAction(removeUser.deviceId, { action: "remove_user", userId: removeUser.userId }, E.devActQueued); setRemoveUser(null); }} />

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
