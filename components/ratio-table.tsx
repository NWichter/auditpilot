"use client";

import { useState } from "react";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import type { RatioResult } from "@/lib/types";

interface RatioTableProps {
  ratios: RatioResult[];
  filter?: "all" | "red" | "yellow" | "green";
}

const STATUS_ORDER = { red: 0, yellow: 1, green: 2 };
const STATUS_COLOR = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
const CATEGORY_LABELS: Record<string, string> = {
  liquidity: "Liquidity",
  profitability: "Profitability",
  leverage: "Leverage",
  efficiency: "Efficiency",
  other: "Other",
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2)
    return <span className="text-slate-600 text-xs">—</span>;
  const data = values.map((v, i) => ({ i, v }));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const color = values[values.length - 1] >= values[0] ? "#22c55e" : "#ef4444";
  return (
    <ResponsiveContainer width={60} height={24}>
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
          className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden"
        >
          <button
            onClick={() => toggleCategory(category)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800 transition-colors"
          >
            <span className="font-medium text-slate-200 text-sm">
              {CATEGORY_LABELS[category] ?? category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {items.length} ratios
              </span>
              <span className="text-slate-500 text-xs">
                {collapsed[category] ? "▼" : "▲"}
              </span>
            </div>
          </button>

          {!collapsed[category] && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">
                    Value
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">
                    Benchmark
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-400">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((ratio) => {
                  const rowId = `${category}-${ratio.name}`;
                  return (
                    <tr
                      key={ratio.name}
                      className="border-t border-slate-800 hover:bg-slate-800/40 cursor-default transition-colors"
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setTooltip({ id: rowId, x: rect.left, y: rect.bottom });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <td className="px-4 py-2 text-slate-300">{ratio.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-100">
                        {ratio.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">
                        {ratio.benchmark.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: STATUS_COLOR[ratio.status] + "22",
                            color: STATUS_COLOR[ratio.status],
                            border: `1px solid ${STATUS_COLOR[ratio.status]}44`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: STATUS_COLOR[ratio.status],
                            }}
                          />
                          {ratio.status.charAt(0).toUpperCase() +
                            ratio.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 flex justify-center items-center">
                        <Sparkline values={ratio.yearOverYear} />
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
              className="fixed z-50 max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 shadow-xl pointer-events-none"
              style={{
                top: tooltip.y + 4,
                left: Math.min(tooltip.x, window.innerWidth - 280),
              }}
            >
              <p className="font-semibold text-slate-100 mb-1">{ratio.name}</p>
              <p>{ratio.explanation}</p>
            </div>
          );
        })()}
    </div>
  );
}
