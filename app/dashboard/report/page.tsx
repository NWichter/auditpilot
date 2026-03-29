"use client";

import { useState } from "react";
import { useAnalysis } from "@/lib/analysis-context";

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
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-64 rounded bg-slate-700" />
      <div className="h-32 rounded bg-slate-800" />
      <div className="h-64 rounded bg-slate-800" />
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

  const levelColor =
    level === "HIGH"
      ? "text-red-400"
      : level === "MEDIUM"
        ? "text-yellow-400"
        : "text-green-400";

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
        <h1 className="text-2xl font-bold text-slate-100">
          Forensic Audit Report
        </h1>
        <button
          onClick={generateAI}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-900/40 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-800/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              Generating...
            </>
          ) : (
            "Generate AI Report"
          )}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300">
          Error: {error}
        </div>
      )}

      {/* AI Report (replaces fallback when available) */}
      {aiReport ? (
        <div className="rounded-lg border border-blue-700 bg-slate-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full border border-blue-700 bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300">
              AI Generated
            </span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {aiReport.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    className="mt-6 mb-2 text-lg font-semibold text-slate-100"
                  >
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h3
                    key={i}
                    className="mt-4 mb-1 text-base font-medium text-slate-200"
                  >
                    {line.slice(4)}
                  </h3>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <p
                    key={i}
                    className="ml-4 text-slate-300 before:mr-2 before:content-['•']"
                  >
                    {line.slice(2)}
                  </p>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <p key={i} className="font-semibold text-slate-200">
                    {line.slice(2, -2)}
                  </p>
                );
              }
              if (line.trim() === "") return <div key={i} className="h-2" />;
              return (
                <p key={i} className="text-slate-300 leading-relaxed">
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      ) : (
        /* Algorithmic fallback report */
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-200">
              Executive Summary
            </h2>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Risk Level:</span>
              <span className={`text-sm font-bold ${levelColor}`}>{level}</span>
              <span className="text-xs text-slate-500">
                ({result.riskScore.overall}/100)
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{summary}</p>
          </div>

          {/* Key Findings */}
          {findings.length > 0 && (
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
              <h2 className="mb-3 text-base font-semibold text-slate-200">
                Key Findings
              </h2>
              <ul className="space-y-2">
                {findings.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-0.5 text-red-400">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Assessment */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-200">
              Risk Assessment
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
                const color =
                  pct >= 0.66 ? "#ef4444" : pct >= 0.33 ? "#eab308" : "#22c55e";
                return (
                  <div key={label} className="rounded-lg bg-slate-800 p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p
                      className="text-xl font-bold font-mono"
                      style={{ color }}
                    >
                      {score}/25
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Click "Generate AI Report" above for a detailed forensic analysis
            powered by Claude.
          </p>
        </div>
      )}
    </div>
  );
}
