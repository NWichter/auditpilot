"use client";

import type { BeneishResult } from "@/lib/types";

interface BeneishGaugeProps {
  data: BeneishResult | null;
}

const VARIABLE_NAMES: Record<string, string> = {
  DSRI: "Days Sales in Receivables Index",
  GMI: "Gross Margin Index",
  AQI: "Asset Quality Index",
  SGI: "Sales Growth Index",
  DEPI: "Depreciation Index",
  SGAI: "SGA Expenses Index",
  LVGI: "Leverage Index",
  TATA: "Total Accruals to Total Assets",
};

function GaugeMeter({ score }: { score: number }) {
  // Scale: -4 to 0, threshold at -1.78
  const min = -4;
  const max = 0;
  const clampedScore = Math.max(min, Math.min(max, score));
  const pct = ((clampedScore - min) / (max - min)) * 100;
  const thresholdPct = ((-1.78 - min) / (max - min)) * 100;

  const isManipulator = score > -1.78;
  const scoreColor = isManipulator
    ? "#ef4444"
    : score > -2.5
      ? "#eab308"
      : "#22c55e";

  return (
    <div className="space-y-3">
      {/* Score display */}
      <div className="text-center">
        <span
          className="text-5xl font-bold font-mono"
          style={{ color: scoreColor }}
        >
          {score.toFixed(2)}
        </span>
        <p className="mt-1 text-sm font-medium" style={{ color: scoreColor }}>
          {isManipulator
            ? "Likely Manipulator"
            : score > -2.5
              ? "Possible Manipulation"
              : "Unlikely Manipulator"}
        </p>
      </div>

      {/* Gauge bar */}
      <div className="relative">
        <div className="h-4 w-full rounded-full bg-gradient-to-r from-green-600 via-yellow-500 to-red-600 opacity-30" />
        <div className="absolute inset-0 h-4 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(to right, #16a34a, #ca8a04, #dc2626)`,
            }}
          />
        </div>
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80"
          style={{ left: `${thresholdPct}%` }}
        />
        <div
          className="absolute -top-5 text-xs text-slate-400 -translate-x-1/2"
          style={{ left: `${thresholdPct}%` }}
        >
          -1.78
        </div>

        {/* Score needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-white shadow-lg transition-all duration-700"
          style={{ left: `${pct}%`, backgroundColor: scoreColor }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>-4.0 (Safe)</span>
        <span>0.0 (Risk)</span>
      </div>
    </div>
  );
}

export function BeneishGauge({ data }: BeneishGaugeProps) {
  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
        <div className="text-center">
          <p className="text-slate-400 font-medium">Insufficient Data</p>
          <p className="text-sm text-slate-500 mt-1">
            Need 2+ years of financial data
          </p>
        </div>
      </div>
    );
  }

  const maxContrib = Math.max(
    ...data.variables.map((v) => Math.abs(v.contribution)),
    0.01,
  );

  return (
    <div className="space-y-6">
      {/* Gauge */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">
          M-Score
        </p>
        <GaugeMeter score={data.mScore} />
      </div>

      {/* Variables table */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Variable Contributions
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/30">
              <th className="px-4 py-2 text-left text-xs text-slate-400">
                Abbr.
              </th>
              <th className="px-4 py-2 text-left text-xs text-slate-400">
                Name
              </th>
              <th className="px-4 py-2 text-right text-xs text-slate-400">
                Value
              </th>
              <th className="px-4 py-2 text-right text-xs text-slate-400">
                Contribution
              </th>
              <th className="px-4 py-2 text-left text-xs text-slate-400 w-32">
                Bar
              </th>
            </tr>
          </thead>
          <tbody>
            {data.variables.map((v) => {
              const isRisk = v.contribution > 0;
              const barWidth = (Math.abs(v.contribution) / maxContrib) * 100;
              const barColor = isRisk ? "#ef4444" : "#22c55e";

              return (
                <tr
                  key={v.abbreviation}
                  className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-xs text-slate-300 font-medium">
                    {v.abbreviation}
                  </td>
                  <td className="px-4 py-2 text-slate-400 text-xs">
                    {VARIABLE_NAMES[v.abbreviation] ?? v.name}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-200">
                    {v.value.toFixed(3)}
                  </td>
                  <td
                    className="px-4 py-2 text-right font-mono"
                    style={{ color: barColor }}
                  >
                    {v.contribution > 0 ? "+" : ""}
                    {v.contribution.toFixed(3)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="h-2 w-full rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
