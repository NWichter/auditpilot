"use client";

import { useState } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { RatioTable } from "@/components/ratio-table";
import type { RatioResult } from "@/lib/types";

type Filter = "all" | "red" | "yellow" | "green";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-7 w-72 rounded-md bg-white/5" />
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white/[0.03]" />
    </div>
  );
}

function CategoryCard({
  category,
  ratios,
}: {
  category: string;
  ratios: RatioResult[];
}) {
  const red = ratios.filter((r) => r.status === "red").length;
  const yellow = ratios.filter((r) => r.status === "yellow").length;
  const green = ratios.filter((r) => r.status === "green").length;
  const total = ratios.length;

  return (
    <div className="card-glass rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.05]">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </p>
      <p className="mb-3 text-lg font-semibold tabular-nums text-slate-100">
        {total}
        <span className="ml-1 text-xs font-normal text-slate-500">ratios</span>
      </p>
      <div className="flex h-1 rounded-full overflow-hidden gap-px">
        {red > 0 && (
          <div
            className="bg-red-500/60 rounded-full"
            style={{ width: `${(red / total) * 100}%` }}
          />
        )}
        {yellow > 0 && (
          <div
            className="bg-amber-500/60 rounded-full"
            style={{ width: `${(yellow / total) * 100}%` }}
          />
        )}
        {green > 0 && (
          <div
            className="bg-emerald-500/60 rounded-full"
            style={{ width: `${(green / total) * 100}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {red > 0 && <span className="text-red-400/80">{red} critical</span>}
        {yellow > 0 && (
          <span className="text-amber-400/80">{yellow} warning</span>
        )}
        {green > 0 && <span className="text-emerald-400/80">{green} ok</span>}
      </div>
    </div>
  );
}

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "red", label: "Critical" },
  { key: "yellow", label: "Warning" },
  { key: "green", label: "Normal" },
];

export default function RatiosPage() {
  const { result } = useAnalysis();
  const [filter, setFilter] = useState<Filter>("all");

  if (!result) return <LoadingSkeleton />;

  const { ratios } = result;
  const critical = ratios.filter((r) => r.status === "red").length;
  const warning = ratios.filter((r) => r.status === "yellow").length;
  const normal = ratios.filter((r) => r.status === "green").length;

  const categories = Array.from(new Set(ratios.map((r) => r.category)));
  const byCategory = Object.fromEntries(
    categories.map((cat) => [cat, ratios.filter((r) => r.category === cat)]),
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Financial Ratio Analysis
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {ratios.length} ratios across {categories.length} categories
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-red-500/20 bg-red-500/[0.08] px-3 py-1 text-xs font-medium text-red-400">
            {critical} critical
          </span>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-xs font-medium text-amber-400">
            {warning} warning
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1 text-xs font-medium text-emerald-400">
            {normal} normal
          </span>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <CategoryCard key={cat} category={cat} ratios={byCategory[cat]} />
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              filter === tab.key
                ? "bg-white/[0.08] text-slate-100 border border-white/[0.12]"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <RatioTable ratios={ratios} filter={filter} />
    </div>
  );
}
