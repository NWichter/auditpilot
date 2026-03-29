"use client";

import { useMemo } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { TimelineChart } from "@/components/timeline-chart";

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
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-72 rounded bg-slate-700" />
      <div className="h-[500px] rounded bg-slate-800" />
      <div className="h-48 rounded bg-slate-800" />
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
          <h1 className="text-2xl font-bold text-slate-100">Trend Analysis</h1>
          <p className="text-sm text-slate-400 mt-0.5">{yearRange}</p>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="h-[500px] w-full">
          <TimelineChart data={data} />
        </div>
      </div>

      {/* Insight */}
      {inflectionYears.length > 0 && (
        <div className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-300">
          Key inflection points detected in years:{" "}
          <span className="font-semibold text-slate-100">
            {inflectionYears.join(", ")}
          </span>
        </div>
      )}

      {/* Anomaly table */}
      {anomalies.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-200">
            Detected Anomalies
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-2 text-left text-xs text-slate-400">
                    Year
                  </th>
                  <th className="px-4 py-2 text-left text-xs text-slate-400">
                    Metric
                  </th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400">
                    Value
                  </th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400">
                    Deviation (σ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-slate-300">
                      {a.year}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{a.metric}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {Math.abs(a.value) >= 1e6
                        ? `$${(a.value / 1e6).toFixed(1)}M`
                        : a.value.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`font-mono text-sm ${a.deviation > 3 ? "text-red-400" : "text-yellow-400"}`}
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
        <p className="text-sm text-slate-500">
          No significant anomalies detected across metrics.
        </p>
      )}
    </div>
  );
}
