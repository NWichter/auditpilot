"use client";

import { useState } from "react";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { RatioResult } from "@/lib/types";

interface RatioTableProps {
  ratios: RatioResult[];
  filter?: "all" | "red" | "yellow" | "green";
}

const STATUS_ORDER = { red: 0, yellow: 1, green: 2 };
const STATUS_COLOR = {
  green: "#4ade80",
  yellow: "#fbbf24",
  red: "#f87171",
};
const CATEGORY_LABELS: Record<string, string> = {
  liquidity: "Liquidity",
  profitability: "Profitability",
  leverage: "Leverage",
  efficiency: "Efficiency",
  other: "Other",
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2)
    return <span className="text-slate-700 text-xs">—</span>;
  const data = values.map((v, i) => ({ i, v }));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const color =
    values[values.length - 1] >= values[0]
      ? "rgba(74,222,128,0.6)"
      : "rgba(248,113,113,0.6)";
  return (
    <ResponsiveContainer width={72} height={28}>
      <LineChart data={data}>
        <YAxis domain={[min, max]} hide />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TooltipState {
  id: string;
  x: number;
  y: number;
}

export function RatioTable({ ratios, filter = "all" }: RatioTableProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const filtered =
    filter === "all" ? ratios : ratios.filter((r) => r.status === filter);
  const sorted = [...filtered].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );

  const grouped: Record<string, RatioResult[]> = {};
  for (const r of sorted) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="relative space-y-3">
      {Object.entries(grouped).map(([category, items]) => (
        <div
          key={category}
          className="card-glass rounded-xl overflow-hidden transition-all duration-200"
        >
          <button
            onClick={() => toggleCategory(category)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.02]"
          >
            <span className="text-sm font-medium text-slate-300">
              {CATEGORY_LABELS[category] ?? category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {items.length} ratios
              </span>
              {collapsed[category] ? (
                <ChevronDown className="h-4 w-4 text-slate-600" />
              ) : (
                <ChevronUp className="h-4 w-4 text-slate-600" />
              )}
            </div>
          </button>

          {!collapsed[category] && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-600">
                    Name
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-600">
                    Value
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-600">
                    Benchmark
                  </th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-600">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((ratio, i) => {
                  const rowId = `${category}-${ratio.name}`;
                  const dotColor = STATUS_COLOR[ratio.status];
                  return (
                    <tr
                      key={ratio.name}
                      className={`border-t border-white/[0.04] transition-colors duration-200 hover:bg-white/[0.02] cursor-default ${
                        i % 2 === 0 ? "" : "bg-white/[0.01]"
                      }`}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setTooltip({ id: rowId, x: rect.left, y: rect.bottom });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <td className="px-5 py-3 text-slate-400">{ratio.name}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-100">
                        {ratio.value.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-600">
                        {ratio.benchmark.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: dotColor, opacity: 0.7 }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: dotColor, opacity: 0.8 }}
                          >
                            {ratio.status.charAt(0).toUpperCase() +
                              ratio.status.slice(1)}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center items-center">
                          <Sparkline values={ratio.yearOverYear} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {/* Floating tooltip */}
      {tooltip &&
        (() => {
          const ratio = ratios.find(
            (r) => `${r.category}-${r.name}` === tooltip.id,
          );
          if (!ratio) return null;
          return (
            <div
              className="fixed z-50 max-w-xs rounded-xl border border-white/[0.08] bg-[#0f1117] px-3 py-2.5 text-xs text-slate-400 shadow-2xl pointer-events-none"
              style={{
                top: tooltip.y + 6,
                left: Math.min(tooltip.x, window.innerWidth - 280),
              }}
            >
              <p className="mb-1 font-medium text-slate-200">{ratio.name}</p>
              <p className="leading-relaxed">{ratio.explanation}</p>
            </div>
          );
        })()}
    </div>
  );
}
