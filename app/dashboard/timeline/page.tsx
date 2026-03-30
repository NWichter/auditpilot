"use client";

import { useMemo } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { TimelineChart } from "@/components/timeline-chart";
import { Info } from "lucide-react";

function detectOutliersWithMeta(
  values: number[],
  years: number[],
  metricLabel: string,
  threshold = 2,
): Array<{ year: number; metric: string; value: number; deviation: number }> {
  if (values.length < 3) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
  );
  if (std === 0) return [];
  return values
    .map((v, i) => ({
      year: years[i],
      metric: metricLabel,
      value: v,
      deviation: Math.abs(v - mean) / std,
    }))
    .filter((x) => x.deviation > threshold)
    .sort((a, b) => b.deviation - a.deviation);
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-7 w-72 rounded-md bg-white/5" />
      <div className="h-[500px] rounded-xl bg-white/[0.03]" />
      <div className="h-48 rounded-xl bg-white/[0.03]" />
    </div>
  );
}

export default function TimelinePage() {
  const { result, data } = useAnalysis();

  const anomalies = useMemo(() => {
    if (!data) return [];
    const years = data.statements.map((s) => s.year);
    const checks = [
      { label: "Revenue", values: data.statements.map((s) => s.revenue) },
      { label: "Net Income", values: data.statements.map((s) => s.netIncome) },
      {
        label: "Operating CF",
        values: data.statements.map((s) => s.operatingCashFlow),
      },
      {
        label: "Gross Margin %",
        values: data.statements.map((s) =>
          s.revenue > 0 ? (s.grossProfit / s.revenue) * 100 : 0,
        ),
      },
      {
        label: "DSO",
        values: data.statements.map((s) =>
          s.revenue > 0 ? (s.accountsReceivable / s.revenue) * 365 : 0,
        ),
      },
    ];
    return checks
      .flatMap(({ label, values }) =>
        detectOutliersWithMeta(values, years, label),
      )
      .sort((a, b) => b.deviation - a.deviation);
  }, [data]);

  const inflectionYears = useMemo(() => {
    const yearSet = new Set(anomalies.map((a) => a.year));
    return Array.from(yearSet).sort();
  }, [anomalies]);

  if (!result || !data) return <LoadingSkeleton />;

  const yearRange = `${Math.min(...data.years)} – ${Math.max(...data.years)}`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Trend Analysis
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{yearRange}</p>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="card-glass rounded-xl p-5">
        <div className="h-[500px] w-full">
          <TimelineChart data={data} />
        </div>
      </div>

      {/* Insight */}
      {inflectionYears.length > 0 && (
        <div className="flex items-start gap-3 card-glass rounded-xl px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400/70" />
          <p className="text-sm text-slate-400">
            Key inflection points detected in{" "}
            <span className="font-medium text-slate-200">
              {inflectionYears.join(", ")}
            </span>
          </p>
        </div>
      )}

      {/* Anomaly table */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Detected Anomalies
          </h2>
          <div className="card-glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Year
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Metric
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Value
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Deviation
                  </th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr
                    key={i}
                    className={`border-t border-white/[0.04] transition-colors duration-200 hover:bg-white/[0.02] ${
                      i % 2 === 0 ? "" : "bg-white/[0.01]"
                    }`}
                  >
                    <td className="px-5 py-3 font-mono tabular-nums text-slate-300">
                      {a.year}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{a.metric}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-200">
                      {Math.abs(a.value) >= 1e6
                        ? `$${(a.value / 1e6).toFixed(1)}M`
                        : a.value.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`font-mono tabular-nums text-sm ${
                          a.deviation > 3 ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {a.deviation.toFixed(2)}σ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {anomalies.length === 0 && (
        <p className="text-sm text-slate-600">
          No significant anomalies detected across metrics.
        </p>
      )}
    </div>
  );
}
