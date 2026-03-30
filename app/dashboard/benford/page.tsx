"use client";

import { useState } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { BenfordChart } from "@/components/benford-chart";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const VERDICT_CONFIG = {
  conforming: {
    label: "Conforming",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  suspicious: {
    label: "Suspicious",
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  non_conforming: {
    label: "Non-Conforming",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-7 w-64 rounded-md bg-white/5" />
      <div className="h-96 rounded-xl bg-white/[0.03]" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03]" />
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
  const confidenceClass =
    confidence === "High"
      ? "text-emerald-400"
      : confidence === "Medium"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Benford&apos;s Law Analysis
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            First-digit frequency distribution
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium tracking-wide ${verdict.className}`}
        >
          {verdict.label}
        </span>
      </div>

      {/* Non-conforming alert */}
      {benford.verdict === "non_conforming" && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span className="text-sm text-red-400">
            Significant deviation from expected distribution detected
          </span>
        </div>
      )}

      {/* Chart */}
      <div className="card-glass rounded-xl p-5">
        <div className="h-96 w-full">
          <BenfordChart data={benford} />
        </div>
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Chi² Value",
            value: benford.chiSquared.toFixed(3),
            valueClass: "text-slate-100",
          },
          {
            label: "p-Value",
            value: pFormatted,
            valueClass: "text-slate-100",
          },
          {
            label: "Sample Size",
            value: benford.sampleSize.toLocaleString(),
            valueClass: "text-slate-100",
          },
          {
            label: "Confidence Level",
            value: confidence,
            valueClass: confidenceClass,
          },
        ].map(({ label, value, valueClass }) => (
          <div key={label} className="card-glass rounded-xl p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${valueClass}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Collapsible explainer */}
      <div className="card-glass rounded-xl overflow-hidden">
        <button
          onClick={() => setExplainerOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
        >
          <span className="text-sm font-medium text-slate-300">
            What is Benford&apos;s Law?
          </span>
          {explainerOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            explainerOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-white/[0.06] px-5 py-4 text-sm leading-relaxed text-slate-400 space-y-2">
            <p>
              Benford&apos;s Law states that in many naturally occurring
              datasets, the leading digit is 1 about 30% of the time, digit 2
              about 17.6%, and so on — decreasing logarithmically. This pattern
              emerges in financial figures, population numbers, and river
              lengths.
            </p>
            <p>
              When a company&apos;s financial figures deviate significantly from
              this expected distribution, it may indicate manipulation,
              rounding, or fabrication of numbers — since fabricated data tends
              to use digits more uniformly. The Chi-squared test measures how
              far the observed distribution diverges from the expected one; a
              low p-value (below 0.05) suggests the deviation is statistically
              significant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
