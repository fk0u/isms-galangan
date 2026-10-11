// F3-L-05: form kop surat PDF. Nilai disimpan sebagai JSON di setting
// COMPANY_KOP; kolom yang dikosongkan memakai kop bawaan server.
import { useEffect, useState } from "react";
import { Card, Field, FormGrid, AsyncButton, toast } from "../../components/ui";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_emp } from "../../i18n/n_emp";

const FIELDS = ["name", "line1", "hq", "addr1", "addr2", "hp"] as const;
type KopField = (typeof FIELDS)[number];
const EMPTY: Record<KopField, string> = { name: "", line1: "", hq: "", addr1: "", addr2: "", hp: "" };

function parseKop(raw: unknown): Record<KopField, string> {
  let obj: unknown = raw;
  if (typeof raw === "string") { try { obj = JSON.parse(raw); } catch { obj = null; } }
  const out = { ...EMPTY };
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const k of FIELDS) out[k] = String((obj as Record<string, unknown>)[k] ?? "");
  }
  return out;
}

export default function KopCard({ canWrite }: { canWrite: boolean }) {
  const { locale } = useT();
  const E = n_emp[locale];
  const { data, update, add, log } = useStore();
  const row = (data.settings ?? []).find((s) => s.key === "COMPANY_KOP");
  const saved = JSON.stringify(parseKop(row?.value));
  const [form, setForm] = useState(() => parseKop(row?.value));
  // Ikuti nilai server bila berubah dari perangkat lain (realtime).
  useEffect(() => { setForm(JSON.parse(saved) as Record<KopField, string>); }, [saved]);

  const save = async (): Promise<void> => {
    const clean = Object.fromEntries(FIELDS.map((k) => [k, form[k].trim()]).filter(([, v]) => v !== ""));
    const value = JSON.stringify(clean);
    try {
      if (row) await update("settings", String(row.id), { value });
      else await add("settings", { id: "SET-KOP", key: "COMPANY_KOP", value, label: E.kopTitle, group: "Perusahaan" });
      log("mengubah kop surat", Object.keys(clean).join(", ") || "-", "Pengaturan");
      toast(E.kopSaved);
    } catch (e) { toast(e instanceof Error ? e.message : E.kopFail, "info"); }
  };

  return (
    <Card className="mb-4 p-4">
      <h3 className="text-sm font-semibold text-navy-900">{E.kopTitle}</h3>
      <p className="mb-3 text-xs text-steel-500">{E.kopHint}</p>
      <FormGrid>
        {FIELDS.map((k) => (
          <Field key={k} label={E.kopFields[k]}>
            <input className="input" maxLength={160} disabled={!canWrite} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </Field>
        ))}
      </FormGrid>
      {canWrite && <div className="mt-3 flex justify-end"><AsyncButton className="btn-primary" onAction={save}>{E.kopSave}</AsyncButton></div>}
    </Card>
  );
}
