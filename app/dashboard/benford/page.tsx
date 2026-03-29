"use client";

import { useState } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { BenfordChart } from "@/components/benford-chart";

const VERDICT_CONFIG = {
  conforming: {
    label: "Conforming",
    className: "bg-green-900 text-green-300 border border-green-700",
  },
  suspicious: {
    label: "Suspicious",
    className: "bg-yellow-900 text-yellow-300 border border-yellow-700",
  },
  non_conforming: {
    label: "Non-Conforming",
    className: "bg-red-900 text-red-300 border border-red-700",
  },
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-64 rounded bg-slate-700" />
      <div className="h-96 rounded bg-slate-800" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

export default function BenfordPage() {
  const { result } = useAnalysis();
  const [explainerOpen, setExplainerOpen] = useState(false);

  if (!result) return <LoadingSkeleton />;

  const { benford } = result;
  const verdict = VERDICT_CONFIG[benford.verdict];
  const pFormatted =
    benford.pValue < 0.0001 ? "<0.0001" : benford.pValue.toFixed(4);
  const confidence =
    benford.pValue > 0.05 ? "High" : benford.pValue > 0.01 ? "Medium" : "Low";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Benford's Law Analysis
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${verdict.className}`}
        >
          {verdict.label}
        </span>
      </div>

      {/* Non-conforming alert */}
      {benford.verdict === "non_conforming" && (
        <div className="flex items-center gap-3 rounded border border-red-700 bg-red-950 px-4 py-3 text-red-300">
          <span className="text-lg">⚠</span>
          <span className="font-medium">
            Significant deviation from expected distribution
          </span>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="h-96 w-full">
          <BenfordChart data={benford} />
        </div>
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Chi² Value</p>
          <p className="mt-1 text-xl font-bold text-slate-100">
            {benford.chiSquared.toFixed(3)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">p-Value</p>
          <p className="mt-1 text-xl font-bold text-slate-100">{pFormatted}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Sample Size</p>
          <p className="mt-1 text-xl font-bold text-slate-100">
            {benford.sampleSize.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Confidence Level</p>
          <p
            className={`mt-1 text-xl font-bold ${confidence === "High" ? "text-green-400" : confidence === "Medium" ? "text-yellow-400" : "text-red-400"}`}
          >
            {confidence}
          </p>
        </div>
      </div>

      {/* Collapsible explainer */}
      <div className="rounded-lg border border-slate-700 bg-slate-900">
        <button
          onClick={() => setExplainerOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-300 hover:text-slate-100"
        >
          <span>What is Benford's Law?</span>
          <span className="text-slate-500">{explainerOpen ? "▲" : "▼"}</span>
        </button>
        {explainerOpen && (
          <div className="border-t border-slate-700 px-4 py-4 text-sm leading-relaxed text-slate-400">
            <p>
              Benford's Law states that in many naturally occurring datasets,
              the leading digit is 1 about 30% of the time, digit 2 about 17.6%,
              and so on — decreasing logarithmically. This pattern emerges in
              financial figures, population numbers, and river lengths.
            </p>
            <p className="mt-2">
              When a company's financial figures deviate significantly from this
              expected distribution, it may indicate manipulation, rounding, or
              fabrication of numbers — since fabricated data tends to use digits
              more uniformly. The Chi-squared test measures how far the observed
              distribution diverges from the expected one; a low p-value (below
              0.05) suggests the deviation is statistically significant.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
