import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card } from "./ui";
import type { WbsItem } from "../data/store";
import { buildSCurve, scheduleDeviation } from "../utils/sCurve";
import { fmtMiliar, fmtTanggal, todayISO } from "../utils/format";
import { n_prj } from "../i18n/n_prj";
import { useT } from "../i18n/LanguageContext";

/* #309: kurva S rencana vs realisasi + deviasi jadwal & anggaran (EV − AC). */
export default function SCurveCard({ wbs, budget, progress, ac }: { wbs: readonly WbsItem[]; budget: number; progress: number; ac: number }) {
  const { locale } = useT();
  const S = n_prj[locale];
  const today = todayISO();
  const points = useMemo(() => buildSCurve(wbs, today), [wbs, today]);
  const sv = scheduleDeviation(points, today);
  const cv = Math.round((budget * progress) / 100) - ac;
  return (
    <Card className="mb-4 p-5 print:break-inside-avoid">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-navy-900">{S.sCurveTitle}</h3>
        {points.length > 0 && (
          <>
            {sv !== null && <Badge tone={sv >= 0 ? "green" : "red"}>{(sv >= 0 ? S.sCurveAhead : S.sCurveBehind).replace("{n}", String(Math.abs(sv)))}</Badge>}
            {ac > 0 && <Badge tone={cv >= 0 ? "green" : "red"}>{(cv >= 0 ? S.sCurveUnder : S.sCurveOver).replace("{n}", fmtMiliar(Math.abs(cv)))}</Badge>}
          </>
        )}
      </div>
      {points.length === 0 ? (
        <p className="text-xs text-steel-500">{S.sCurveEmpty}</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d: string) => fmtTanggal(d)} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(d) => fmtTanggal(String(d))} formatter={(v) => `${String(v)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {/* Garis hari ini hanya bila hari ini ada di rentang kurva. */}
              {today >= points[0].date && today <= points[points.length - 1].date && <ReferenceLine x={points.find((p) => p.date >= today)?.date} stroke="#94A3B8" strokeDasharray="4 4" />}
              <Line type="linear" dataKey="plan" name={S.sCurvePlan} stroke="#94A3B8" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="actual" name={S.sCurveActual} stroke="#0284C7" strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
