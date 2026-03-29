"use client";

import { useAnalysis } from "@/lib/analysis-context";
import { BeneishGauge } from "@/components/beneish-gauge";
import { RedflagsList } from "@/components/redflags-list";

const RISK_BADGE = {
  low: {
    label: "Low Risk",
    className: "bg-green-900 text-green-300 border border-green-700",
  },
  medium: {
    label: "Medium Risk",
    className: "bg-yellow-900 text-yellow-300 border border-yellow-700",
  },
  high: {
    label: "High Risk",
    className: "bg-red-900 text-red-300 border border-red-700",
  },
};

function riskLevel(score: number): keyof typeof RISK_BADGE {
  if (score >= 66) return "high";
  if (score >= 33) return "medium";
  return "low";
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-200">{value}/25</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${(value / 25) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-80 rounded bg-slate-700" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-72 rounded bg-slate-800" />
        <div className="h-72 rounded bg-slate-800" />
      </div>
      <div className="h-96 rounded bg-slate-800" />
    </div>
  );
}

export default function RedflagsPage() {
  const { result } = useAnalysis();

  if (!result) return <LoadingSkeleton />;

  const { redFlags, beneish, riskScore } = result;
  const level = riskLevel(riskScore.overall);
  const badge = RISK_BADGE[level];

  const scoreBarColor = (v: number) => {
    const pct = v / 25;
    if (pct >= 0.66) return "#ef4444";
    if (pct >= 0.33) return "#eab308";
    return "#22c55e";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Fraud Risk Assessment
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-400">
        <span className="font-semibold text-slate-200">
          {redFlags.triggeredCount} of {redFlags.flags.length} indicators
          triggered
        </span>
        {redFlags.criticalCount > 0 && (
          <span className="text-red-400">
            {" "}
            — {redFlags.criticalCount} critical
          </span>
        )}
        {redFlags.warningCount > 0 && (
          <span className="text-yellow-400">
            , {redFlags.warningCount} warning
          </span>
        )}
      </p>

      {/* Top section: 2-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Beneish Gauge */}
        <div>
          <BeneishGauge data={beneish} />
        </div>

        {/* Risk score breakdown */}
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 space-y-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Risk Score Breakdown
          </p>

          <div className="text-center mb-4">
            <span
              className="text-5xl font-bold font-mono"
              style={{
                color:
                  level === "high"
                    ? "#ef4444"
                    : level === "medium"
                      ? "#eab308"
                      : "#22c55e",
              }}
            >
              {riskScore.overall}
            </span>
            <p className="text-sm text-slate-400 mt-1">Overall Score / 100</p>
          </div>

          <div className="space-y-3">
            <ScoreBar
              label="Benford's Law"
              value={riskScore.benfordScore}
              color={scoreBarColor(riskScore.benfordScore)}
            />
            <ScoreBar
              label="Beneish M-Score"
              value={riskScore.beneishScore}
              color={scoreBarColor(riskScore.beneishScore)}
            />
            <ScoreBar
              label="Red Flags"
              value={riskScore.redFlagScore}
              color={scoreBarColor(riskScore.redFlagScore)}
            />
            <ScoreBar
              label="Financial Ratios"
              value={riskScore.ratioScore}
              color={scoreBarColor(riskScore.ratioScore)}
            />
          </div>
        </div>
      </div>

      {/* Red flags list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Indicator Checklist
        </h2>
        <RedflagsList flags={redFlags.flags} />
      </div>
    </div>
  );
}
