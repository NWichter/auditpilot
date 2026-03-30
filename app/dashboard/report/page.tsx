"use client";

import { useState } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { Sparkles, Loader2 } from "lucide-react";

function riskLabel(score: number) {
  if (score >= 66) return "HIGH";
  if (score >= 33) return "MEDIUM";
  return "LOW";
}

function buildAlgorithmicReport(
  result: NonNullable<ReturnType<typeof useAnalysis>["result"]>,
) {
  const { company, benford, beneish, redFlags, riskScore, ratios } = result;
  const level = riskLabel(riskScore.overall);
  const criticalRatios = ratios.filter((r) => r.status === "red");
  const topFlags = redFlags.flags.filter(
    (f) => f.triggered && f.severity === "critical",
  );

  const summary = [
    `${company.companyName} received an overall risk score of ${riskScore.overall}/100, indicating ${level} risk of financial irregularities.`,
    benford.verdict !== "conforming"
      ? `Benford's Law analysis shows ${benford.verdict === "non_conforming" ? "significant" : "potential"} deviations (χ²=${benford.chiSquared.toFixed(2)}, p=${benford.pValue.toFixed(4)}).`
      : `Benford's Law analysis shows no significant deviations (p=${benford.pValue.toFixed(4)}).`,
    beneish
      ? `Beneish M-Score of ${beneish.mScore.toFixed(2)} indicates ${beneish.verdict} manipulation.`
      : "Beneish analysis could not be performed (insufficient years of data).",
    `${redFlags.triggeredCount} of ${redFlags.flags.length} fraud indicators were triggered (${redFlags.criticalCount} critical, ${redFlags.warningCount} warning).`,
  ].join(" ");

  const findings = [
    ...topFlags.map((f) => `[CRITICAL] ${f.name}: ${f.description}`),
    ...criticalRatios.map(
      (r) =>
        `[RATIO] ${r.name} at ${r.value.toFixed(2)} vs. benchmark ${r.benchmark.toFixed(2)}: ${r.explanation}`,
    ),
  ];

  return { summary, findings, level };
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-7 w-64 rounded-md bg-white/5" />
      <div className="h-32 rounded-xl bg-white/[0.03]" />
      <div className="h-64 rounded-xl bg-white/[0.03]" />
    </div>
  );
}

export default function ReportPage() {
  const { result } = useAnalysis();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!result) return <LoadingSkeleton />;

  const { summary, findings, level } = buildAlgorithmicReport(result);

  const levelClass =
    level === "HIGH"
      ? "text-red-400"
      : level === "MEDIUM"
        ? "text-amber-400"
        : "text-emerald-400";

  const levelBadgeClass =
    level === "HIGH"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : level === "MEDIUM"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  const generateAI = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisData: result }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setAiReport(json.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Forensic Audit Report
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {result.company.companyName}
          </p>
        </div>
        <button
          onClick={generateAI}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.07] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-blue-400" />
              Generate AI Report
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* AI Report */}
      {aiReport ? (
        <div className="card-glass rounded-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">
              AI Generated
            </span>
          </div>
          <div className="mx-auto max-w-3xl px-8 py-8">
            {aiReport.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    className="mb-3 mt-8 text-base font-semibold text-slate-100 first:mt-0"
                  >
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h3
                    key={i}
                    className="mb-2 mt-5 text-sm font-semibold text-slate-200"
                  >
                    {line.slice(4)}
                  </h3>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <div
                    key={i}
                    className="mb-1.5 flex items-start gap-2 text-sm text-slate-400"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-600" />
                    <span>{line.slice(2)}</span>
                  </div>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <p key={i} className="mb-2 font-medium text-slate-200">
                    {line.slice(2, -2)}
                  </p>
                );
              }
              if (line.trim() === "") return <div key={i} className="h-3" />;
              return (
                <p
                  key={i}
                  className="mb-2 text-sm leading-relaxed text-slate-400"
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      ) : (
        /* Algorithmic fallback report */
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Executive Summary */}
          <div className="card-glass rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Executive Summary
              </h2>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelBadgeClass}`}
              >
                {level} RISK
              </span>
            </div>
            <div className="mb-3 flex items-baseline gap-2">
              <span
                className={`font-mono text-3xl font-semibold tabular-nums ${levelClass}`}
              >
                {result.riskScore.overall}
              </span>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{summary}</p>
          </div>

          {/* Key Findings */}
          {findings.length > 0 && (
            <div className="card-glass rounded-xl p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Key Findings
              </h2>
              <div className="space-y-2.5">
                {findings.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500/60" />
                    <span className="text-sm text-slate-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          <div className="card-glass rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Component Scores
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Benford's Law",
                  score: result.riskScore.benfordScore,
                },
                { label: "Beneish", score: result.riskScore.beneishScore },
                { label: "Red Flags", score: result.riskScore.redFlagScore },
                { label: "Ratios", score: result.riskScore.ratioScore },
              ].map(({ label, score }) => {
                const pct = score / 25;
                const cls =
                  pct >= 0.66
                    ? "text-red-400"
                    : pct >= 0.33
                      ? "text-amber-400"
                      : "text-emerald-400";
                return (
                  <div
                    key={label}
                    className="rounded-lg bg-white/[0.02] p-4 text-center"
                  >
                    <p className="mb-2 text-xs text-slate-500">{label}</p>
                    <p
                      className={`font-mono text-xl font-semibold tabular-nums ${cls}`}
                    >
                      {score}
                      <span className="text-sm font-normal text-slate-600">
                        /25
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-slate-600">
            Use &ldquo;Generate AI Report&rdquo; above for a detailed forensic
            analysis powered by Claude.
          </p>
        </div>
      )}
    </div>
  );
}
