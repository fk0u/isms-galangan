/* Skor kuesioner (F3-K-02, ADR-0009).
 *   skor = Σ(nilai ternormalisasi × bobot) / Σ bobot × 100
 * Nilai ternormalisasi 0..1: ya_tidak (ya=1, tidak=0), skala_1_5 ((v-1)/4),
 * pilihan (score opsi 0..1). Butir "teks" dan jawaban "na"/kosong tidak ikut
 * dihitung (bobotnya dikeluarkan dari penyebut). Dihitung di server supaya
 * klien tidak bisa mengirim skor sendiri. Logika sama: apps/web/src/utils/scoring.ts. */
import { q } from "./db.js";

type Data = Record<string, unknown>;

export interface ChecklistItem { id: string; text?: string; type: string; weight?: number; options?: Array<{ label: string; score: number }> }
export interface ChecklistTemplate { sections?: Array<{ title?: string; items?: ChecklistItem[] }> }

export function normalizedValue(item: ChecklistItem, answer: unknown): number | null {
  if (answer === undefined || answer === null || answer === "" || answer === "na") return null;
  if (item.type === "ya_tidak") return answer === "ya" || answer === true ? 1 : answer === "tidak" || answer === false ? 0 : null;
  if (item.type === "skala_1_5") {
    const v = Number(answer);
    return Number.isFinite(v) && v >= 1 && v <= 5 ? (v - 1) / 4 : null;
  }
  if (item.type === "pilihan") {
    const opt = (item.options ?? []).find((o) => o.label === answer);
    return opt ? Math.max(0, Math.min(1, Number(opt.score) || 0)) : null;
  }
  return null; // teks
}

export function scoreChecklist(template: ChecklistTemplate, answers: Record<string, unknown>): { score: number; answered: number; total: number } {
  let num = 0;
  let den = 0;
  let answered = 0;
  let total = 0;
  for (const section of template.sections ?? []) {
    for (const item of section.items ?? []) {
      if (item.type === "teks") continue;
      total += 1;
      const v = normalizedValue(item, answers[item.id]);
      if (v === null) continue;
      const w = Math.max(0, Number(item.weight ?? 1) || 0);
      num += v * w;
      den += w;
      answered += 1;
    }
  }
  return { score: den > 0 ? Math.round((num / den) * 1000) / 10 : 0, answered, total };
}

/** Hook CRUD: template wajib punya butir; respons diberi skor server. */
export async function checklistHook(table: string, data: Data): Promise<{ data: Data } | { error: string }> {
  if (table === "checklistTemplates") {
    const sections = Array.isArray(data.sections) ? (data.sections as Data[]) : [];
    const rawItems = sections.flatMap((s) => (s && typeof s === "object" && Array.isArray(s.items) ? (s.items as unknown[]) : []));
    if (rawItems.some((i) => i === null || typeof i !== "object")) return { error: "Butir template tidak valid" };
    const items = rawItems as Data[];
    if (String(data.name ?? "").trim() === "") return { error: "Nama template wajib diisi" };
    if (items.length === 0) return { error: "Template wajib punya minimal satu butir" };
    const TYPES = new Set(["ya_tidak", "skala_1_5", "pilihan", "teks"]);
    if (items.some((i) => !TYPES.has(String(i.type)))) return { error: "Tipe butir tidak dikenal" };
    if (items.some((i) => i.type === "pilihan" && !(Array.isArray(i.options) && i.options.length > 0))) return { error: "Butir pilihan wajib punya daftar pilihan" };
    // Tanpa butir bernilai berbobot > 0 setiap inspeksi akan berskor 0 (NCR palsu).
    if (!items.some((i) => i.type !== "teks" && Number(i.weight ?? 1) > 0)) return { error: "Template wajib punya minimal satu butir bernilai berbobot lebih dari 0" };
    const ids = items.map((i) => String(i.id ?? ""));
    if (ids.some((x) => x === "") || new Set(ids).size !== ids.length) return { error: "ID butir template harus unik dan tidak kosong" };
    return { data };
  }
  if (table === "checklistResponses") {
    const rows = await q<{ data: string }>("SELECT data FROM checklistTemplates WHERE id = ?", [String(data.templateId ?? "")]);
    if (!rows[0]) return { error: "Template kuesioner tidak ditemukan" };
    const template = JSON.parse(rows[0].data) as ChecklistTemplate;
    const answers = (data.answers && typeof data.answers === "object" ? data.answers : {}) as Record<string, unknown>;
    const r = scoreChecklist(template, answers);
    // Isian kosong bukan inspeksi gagal — tolak supaya tidak menurunkan skor proyek.
    if (r.answered === 0) return { error: "Kuesioner belum dijawab" };
    return { data: { ...data, answers, score: r.score, answered: r.answered, totalItems: r.total } };
  }
  return { data };
}
