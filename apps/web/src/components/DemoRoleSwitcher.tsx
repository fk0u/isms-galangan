/* Bagian "Lihat sebagai peran" di panel demo. Hanya tampil bila server
 * mengizinkan (DEMO_ROLE_SWITCH) dan akun asal direktur/developer. */
import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { useAuth } from "../auth/auth";
import { fetchDemoRoles, isImpersonating, restoreOriginal, switchToRole, type DemoRole } from "../auth/demoSwitch";
import { getJwt, isBackendConfigured } from "../services/http";
import { useT } from "../i18n/LanguageContext";
import { n_demo } from "../i18n/n_demo";
import { toast } from "./ui";

export default function DemoRoleSwitcher() {
  const { locale } = useT();
  const T = n_demo[locale];
  const { user } = useAuth();
  const [roles, setRoles] = useState<DemoRole[]>([]);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const impersonating = isImpersonating();

  useEffect(() => {
    if (!isBackendConfigured() || !getJwt()) return;
    let alive = true;
    fetchDemoRoles().then((r) => { if (alive) setRoles(r); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (roles.length === 0) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "info");
      setBusy(false);
    }
  };

  return (
    <div className="mx-1 mb-2 rounded-xl border border-steel-200 bg-steel-50/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-900">
        <UserCog className="h-3.5 w-3.5" /> {T.roleTitle}
      </p>
      <p className="mt-0.5 text-[12px] text-steel-500">
        {T.roleNow.replace("{name}", user?.name ?? "-").replace("{role}", user?.role ?? "-")}
      </p>
      <div className="mt-2 flex gap-1.5">
        <select className="input h-8 flex-1 py-0 text-xs" value={pick} onChange={(e) => setPick(e.target.value)} aria-label={T.roleTitle}>
          <option value="">{T.rolePick}</option>
          {roles.filter((r) => r.role !== user?.role).map((r) => (
            <option key={r.role} value={r.role}>{r.name} ({r.role})</option>
          ))}
        </select>
        <button type="button" className="btn-primary h-8 px-3 text-xs" disabled={!pick || busy} onClick={() => run(() => switchToRole(pick))}>
          {T.roleSwitch}
        </button>
      </div>
      {impersonating && (
        <button type="button" className="mt-2 w-full rounded-lg border border-steel-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-steel-50" disabled={busy} onClick={() => run(restoreOriginal)}>
          {T.roleBack}
        </button>
      )}
      <p className="mt-2 text-[11px] text-steel-400">{T.roleHint}</p>
    </div>
  );
}
