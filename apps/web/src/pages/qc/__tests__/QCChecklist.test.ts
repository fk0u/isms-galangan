import { describe, it, expect } from "vitest";
import { scoreChecklist, normalizedValue, type ScTemplate } from "../../../utils/scoring";

describe("QC & Safety Single Branch Default and Questionnaire Logic (#96)", () => {
  describe("Default Cabang Samarinda Resolution", () => {
    const resolveBranch = (activeBranch?: string, userBranch?: string) => {
      const defaultBranch = (activeBranch && activeBranch !== "SEMUA") ? activeBranch : (userBranch || "Samarinda");
      return defaultBranch;
    };

    it("resolves to Samarinda by default when branch is 'SEMUA' or unset", () => {
      expect(resolveBranch(undefined, undefined)).toBe("Samarinda");
      expect(resolveBranch("SEMUA", undefined)).toBe("Samarinda");
      expect(resolveBranch("", "")).toBe("Samarinda");
    });

    it("resolves to user branch if specific user session branch is provided", () => {
      expect(resolveBranch("SEMUA", "Banjarmasin")).toBe("Banjarmasin");
      expect(resolveBranch(undefined, "Samarinda")).toBe("Samarinda");
    });

    it("resolves to active global branch if selected specifically", () => {
      expect(resolveBranch("Samarinda", "Banjarmasin")).toBe("Samarinda");
      expect(resolveBranch("Balikpapan", "Samarinda")).toBe("Balikpapan");
    });
  });

  describe("Questionnaire Scoring and Threshold Flow", () => {
    const sampleTemplate: ScTemplate = {
      sections: [
        {
          title: "Pemeriksaan Visual Las",
          items: [
            { id: "q1", type: "ya_tidak", weight: 2 },
            { id: "q2", type: "skala_1_5", weight: 1 },
            {
              id: "q3",
              type: "pilihan",
              weight: 2,
              options: [
                { label: "Sempurna", score: 1 },
                { label: "Cukup", score: 0.5 },
                { label: "Cacat", score: 0 },
              ],
            },
            { id: "q4", type: "teks" }, // teks tidak dihitung dalam pembobotan
          ],
        },
      ],
    };

    it("correctly normalizes values across different question types", () => {
      expect(normalizedValue({ id: "1", type: "ya_tidak" }, "ya")).toBe(1);
      expect(normalizedValue({ id: "1", type: "ya_tidak" }, "tidak")).toBe(0);
      expect(normalizedValue({ id: "1", type: "ya_tidak" }, "na")).toBeNull();

      expect(normalizedValue({ id: "2", type: "skala_1_5" }, 5)).toBe(1);
      expect(normalizedValue({ id: "2", type: "skala_1_5" }, 3)).toBe(0.5);
      expect(normalizedValue({ id: "2", type: "skala_1_5" }, 1)).toBe(0);

      const choiceItem = {
        id: "3",
        type: "pilihan",
        options: [{ label: "Baik", score: 1 }, { label: "Buruk", score: 0.2 }],
      };
      expect(normalizedValue(choiceItem, "Baik")).toBe(1);
      expect(normalizedValue(choiceItem, "Buruk")).toBe(0.2);
    });

    it("computes inspection score accurately and checks threshold", () => {
      const threshold = 70;

      // Skenario 1: Semua jawaban sempurna (skor 100) -> Lolos
      const perfectAnswers = {
        q1: "ya",
        q2: 5,
        q3: "Sempurna",
        q4: "Kondisi las bersih tanpa porosity",
      };
      const perfectScore = scoreChecklist(sampleTemplate, perfectAnswers);
      expect(perfectScore.total).toBe(3);
      expect(perfectScore.answered).toBe(3);
      expect(perfectScore.score).toBe(100);
      expect(perfectScore.score >= threshold).toBe(true);

      // Skenario 2: Sebagian jawaban bernilai rendah -> Di bawah ambang batas (memicu penawaran NCR)
      const flawedAnswers = {
        q1: "tidak", // 0 * 2 = 0
        q2: 2,       // 0.25 * 1 = 0.25
        q3: "Cukup", // 0.5 * 2 = 1.0
        // Total = 1.25 / 5 = 25%
      };
      const flawedScore = scoreChecklist(sampleTemplate, flawedAnswers);
      expect(flawedScore.answered).toBe(3);
      expect(flawedScore.score).toBe(25);
      expect(flawedScore.score < threshold).toBe(true);

      // Skenario 3: Belum semua butir dijawab
      const partialAnswers = {
        q1: "ya", // 1 * 2 = 2 (dari total bobot terjawab 2 -> 100%)
      };
      const partialScore = scoreChecklist(sampleTemplate, partialAnswers);
      expect(partialScore.answered).toBe(1);
      expect(partialScore.total).toBe(3);
      expect(partialScore.total - partialScore.answered).toBe(2);
    });
  });
});
