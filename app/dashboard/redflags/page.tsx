"use client";

import { useAnalysis } from "@/lib/analysis-context";
import { BeneishGauge } from "@/components/beneish-gauge";
import { RedflagsList } from "@/components/redflags-list";

const RISK_BADGE = {
  low: {
    label: "Low Risk",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  medium: {
    label: "Medium Risk",
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  high: {
    label: "High Risk",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
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
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono tabular-nums text-slate-300">
          {value}
          <span className="text-slate-600">/25</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{
            width: `${(value / 25) * 100}%`,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-7 w-80 rounded-md bg-white/5" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-72 rounded-xl bg-white/[0.03]" />
        <div className="h-72 rounded-xl bg-white/[0.03]" />
      </div>
      <div className="h-96 rounded-xl bg-white/[0.03]" />
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
    if (pct >= 0.66) return "#f87171";
    if (pct >= 0.33) return "#fbbf24";
    return "#4ade80";
  };

  const scoreNumColor =
    level === "high"
      ? "text-red-400"
      : level === "medium"
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Fraud Risk Assessment
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            <span className="text-slate-300">
              {redFlags.triggeredCount} of {redFlags.flags.length}
            </span>{" "}
            indicators triggered
            {redFlags.criticalCount > 0 && (
              <span className="text-red-400/80">
                {" "}
                &mdash; {redFlags.criticalCount} critical
              </span>
            )}
            {redFlags.warningCount > 0 && (
              <span className="text-amber-400/80">
                , {redFlags.warningCount} warning
              </span>
            )}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium tracking-wide ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Top section: 2-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Beneish Gauge */}
        <div>
          <BeneishGauge data={beneish} />
        </div>

        {/* Risk score breakdown */}
        <div className="card-glass rounded-xl p-6 space-y-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Risk Score Breakdown
          </p>

          <div className="text-center py-2">
            <span
              className={`font-mono text-5xl font-semibold tabular-nums ${scoreNumColor}`}
            >
              {riskScore.overall}
            </span>
            <p className="mt-1 text-xs text-slate-500">Overall Score / 100</p>
          </div>

          <div className="space-y-4">
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
      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Indicator Checklist
        </h2>
        <RedflagsList flags={redFlags.flags} />
      </div>
    </div>
  );
}
