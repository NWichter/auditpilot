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
  const min = -4;
  const max = 0;
  const clampedScore = Math.max(min, Math.min(max, score));
  const pct = ((clampedScore - min) / (max - min)) * 100;
  const thresholdPct = ((-1.78 - min) / (max - min)) * 100;

  const isManipulator = score > -1.78;
  const isPossible = score > -2.5 && !isManipulator;

  const scoreColor = isManipulator
    ? "#f87171"
    : isPossible
      ? "#fbbf24"
      : "#4ade80";

  const verdictText = isManipulator
    ? "Likely Manipulator"
    : isPossible
      ? "Possible Manipulation"
      : "Unlikely Manipulator";

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="text-center">
        <span
          className="font-mono text-5xl font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {score.toFixed(2)}
        </span>
        <p className="mt-1.5 text-xs font-medium" style={{ color: scoreColor }}>
          {verdictText}
        </p>
      </div>

      {/* Gauge bar */}
      <div className="relative pt-6">
        {/* Threshold label */}
        <div
          className="absolute top-0 text-xs text-slate-600 -translate-x-1/2"
          style={{ left: `${thresholdPct}%` }}
        >
          −1.78
        </div>

        <div className="relative h-2 w-full rounded-full bg-white/[0.04]">
          {/* Track gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 via-amber-500/30 to-red-500/30" />
          {/* Progress */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(to right, rgba(74,222,128,0.5), rgba(251,191,36,0.5), rgba(248,113,113,0.5))`,
            }}
          />
          {/* Threshold marker */}
          <div
            className="absolute inset-y-0 w-px bg-white/30"
            style={{ left: `${thresholdPct}%` }}
          />
          {/* Score needle */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 shadow-lg transition-all duration-700"
            style={{
              left: `${pct}%`,
              backgroundColor: scoreColor,
              opacity: 0.9,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-slate-600">
          <span>−4.0 Safe</span>
          <span>0.0 Risk</span>
        </div>
      </div>
    </div>
  );
}

export function BeneishGauge({ data }: BeneishGaugeProps) {
  if (!data) {
    return (
      <div className="card-glass flex h-48 items-center justify-center rounded-xl">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-400">
            Insufficient Data
          </p>
          <p className="mt-1 text-xs text-slate-600">
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
    <div className="space-y-4">
      {/* Gauge card */}
      <div className="card-glass rounded-xl p-6">
        <p className="mb-5 text-xs font-medium uppercase tracking-wider text-slate-500">
          M-Score
        </p>
        <GaugeMeter score={data.mScore} />
      </div>

      {/* Variables table */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Variable Contributions
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.02]">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-600">
                Abbr.
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-600">
                Name
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-600">
                Value
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-600">
                Contrib.
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-600 w-28">
                Bar
              </th>
            </tr>
          </thead>
          <tbody>
            {data.variables.map((v, i) => {
              const isRisk = v.contribution > 0;
              const barWidth = (Math.abs(v.contribution) / maxContrib) * 100;
              const barColor = isRisk
                ? "rgba(248,113,113,0.5)"
                : "rgba(74,222,128,0.5)";
              const textColor = isRisk ? "text-red-400" : "text-emerald-400";

              return (
                <tr
                  key={v.abbreviation}
                  className={`border-t border-white/[0.04] transition-colors duration-200 hover:bg-white/[0.02] ${
                    i % 2 === 0 ? "" : "bg-white/[0.01]"
                  }`}
                >
                  <td className="px-5 py-2.5 font-mono text-xs font-medium tabular-nums text-slate-300">
                    {v.abbreviation}
                  </td>
                  <td className="px-5 py-2.5 text-xs text-slate-500">
                    {VARIABLE_NAMES[v.abbreviation] ?? v.name}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-slate-300">
                    {v.value.toFixed(3)}
                  </td>
                  <td
                    className={`px-5 py-2.5 text-right font-mono tabular-nums ${textColor}`}
                  >
                    {v.contribution > 0 ? "+" : ""}
                    {v.contribution.toFixed(3)}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
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
