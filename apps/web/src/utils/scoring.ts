/* Skor kuesioner (F3-K-02) untuk pratinjau di klien. Sumber kebenaran tetap
 * server (services/api/src/scoring.ts) — skor yang tersimpan selalu hasil server. */
export interface ScItem { id: string; type: string; weight?: number; options?: { label: string; score: number }[] }
export interface ScTemplate { sections?: { title?: string; items?: ScItem[] }[] }

export function normalizedValue(item: ScItem, answer: unknown): number | null {
  if (answer === undefined || answer === null || answer === "" || answer === "na") return null;
  if (item.type === "ya_tidak") return answer === "ya" ? 1 : answer === "tidak" ? 0 : null;
  if (item.type === "skala_1_5") {
    const v = Number(answer);
    return Number.isFinite(v) && v >= 1 && v <= 5 ? (v - 1) / 4 : null;
  }
  if (item.type === "pilihan") {
    const opt = (item.options ?? []).find((o) => o.label === answer);
    return opt ? Math.max(0, Math.min(1, Number(opt.score) || 0)) : null;
  }
  return null;
}

export function scoreChecklist(template: ScTemplate, answers: Record<string, unknown>): { score: number; answered: number; total: number } {
  let num = 0, den = 0, answered = 0, total = 0;
  for (const section of template.sections ?? []) {
    for (const item of section.items ?? []) {
      if (item.type === "teks") continue;
      total += 1;
      const v = normalizedValue(item, answers[item.id]);
      if (v === null) continue;
      const w = Math.max(0, Number(item.weight ?? 1) || 0);
      num += v * w; den += w; answered += 1;
    }
  }
  return { score: den > 0 ? Math.round((num / den) * 1000) / 10 : 0, answered, total };
}
