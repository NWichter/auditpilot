"use client";

import { useState } from "react";
import { useAnalysis } from "@/lib/analysis-context";
import { RatioTable } from "@/components/ratio-table";
import type { RatioResult } from "@/lib/types";

type Filter = "all" | "red" | "yellow" | "green";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-72 rounded bg-slate-700" />
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded bg-slate-800" />
        ))}
      </div>
      <div className="h-64 rounded bg-slate-800" />
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
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </p>
      <p className="text-lg font-bold text-slate-100 mb-2">{total} ratios</p>
      <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
        {red > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${(red / total) * 100}%` }}
          />
        )}
        {yellow > 0 && (
          <div
            className="bg-yellow-500"
            style={{ width: `${(yellow / total) * 100}%` }}
          />
        )}
        {green > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${(green / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex gap-3 mt-2 text-xs text-slate-400">
        {red > 0 && <span className="text-red-400">{red} critical</span>}
        {yellow > 0 && (
          <span className="text-yellow-400">{yellow} warning</span>
        )}
        {green > 0 && <span className="text-green-400">{green} ok</span>}
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
        <h1 className="text-2xl font-bold text-slate-100">
          Financial Ratio Analysis
        </h1>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-400">Summary:</span>
        <span className="rounded-full border border-red-700 bg-red-900/40 px-3 py-1 text-xs font-medium text-red-300">
          {critical} critical
        </span>
        <span className="rounded-full border border-yellow-700 bg-yellow-900/40 px-3 py-1 text-xs font-medium text-yellow-300">
          {warning} warning
        </span>
        <span className="rounded-full border border-green-700 bg-green-900/40 px-3 py-1 text-xs font-medium text-green-300">
          {normal} normal
        </span>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <CategoryCard key={cat} category={cat} ratios={byCategory[cat]} />
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
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
