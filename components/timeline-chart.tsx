"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { FinancialData } from "@/lib/types";

interface TimelineChartProps {
  data: FinancialData;
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  getValue: (stmt: FinancialData["statements"][0]) => number;
  format: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: "revenue",
    label: "Revenue",
    color: "#60a5fa",
    getValue: (s) => s.revenue,
    format: (v) => `$${(v / 1e9).toFixed(1)}B`,
  },
  {
    key: "netIncome",
    label: "Net Income",
    color: "#34d399",
    getValue: (s) => s.netIncome,
    format: (v) => `$${(v / 1e9).toFixed(2)}B`,
  },
  {
    key: "operatingCF",
    label: "Operating CF",
    color: "#a78bfa",
    getValue: (s) => s.operatingCashFlow,
    format: (v) => `$${(v / 1e9).toFixed(2)}B`,
  },
  {
    key: "totalDebt",
    label: "Total Debt",
    color: "#f87171",
    getValue: (s) => s.longTermDebt,
    format: (v) => `$${(v / 1e9).toFixed(1)}B`,
  },
  {
    key: "dso",
    label: "DSO",
    color: "#fbbf24",
    getValue: (s) =>
      s.revenue > 0 ? (s.accountsReceivable / s.revenue) * 365 : 0,
    format: (v) => `${v.toFixed(0)} days`,
  },
  {
    key: "grossMargin",
    label: "Gross Margin",
    color: "#fb923c",
    getValue: (s) => (s.revenue > 0 ? (s.grossProfit / s.revenue) * 100 : 0),
    format: (v) => `${v.toFixed(1)}%`,
  },
];

const DEFAULT_ACTIVE = new Set(["revenue", "netIncome", "operatingCF"]);

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

export function TimelineChart({ data }: TimelineChartProps) {
  const [active, setActive] = useState<Set<string>>(new Set(DEFAULT_ACTIVE));

  const sorted = useMemo(
    () => [...data.statements].sort((a, b) => a.year - b.year),
    [data],
  );

  // Build chart data: each row = { year: "1997", revenue: 45.2, netIncome: 12.3, ... }
  // Values are normalized 0-100 so different scales can coexist
  const { chartData, rawLookup } = useMemo(() => {
    const rawByMetric: Record<string, number[]> = {};
    for (const m of METRICS) {
      rawByMetric[m.key] = sorted.map((s) => m.getValue(s));
    }

    const normByMetric: Record<string, number[]> = {};
    for (const m of METRICS) {
      normByMetric[m.key] = normalize(rawByMetric[m.key]);
    }

    const rows = sorted.map((stmt, i) => {
      const row: Record<string, string | number> = { year: String(stmt.year) };
      for (const m of METRICS) {
        row[m.key] = Math.round(normByMetric[m.key][i] * 100) / 100;
      }
      return row;
    });

    return { chartData: rows, rawLookup: rawByMetric };
  }, [sorted]);

  const toggleMetric = (key: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const activeMetrics = METRICS.filter((m) => active.has(m.key));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              active.has(m.key) ? "opacity-100" : "opacity-40 hover:opacity-60"
            }`}
            style={{
              borderColor: m.color,
              backgroundColor: active.has(m.key)
                ? m.color + "22"
                : "transparent",
              color: m.color,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}`}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{
              value: "Normalized (0–100)",
              angle: -90,
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 10,
              offset: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number, name: string) => {
              const metric = METRICS.find((m) => m.label === name);
              if (!metric) return [`${value}`, name];
              // Find the index by looking at the normalized value
              const normVals = normalize(rawLookup[metric.key]);
              const roundedNorm = normVals.map(
                (v) => Math.round(v * 100) / 100,
              );
              const idx = roundedNorm.indexOf(Math.round(value * 100) / 100);
              const raw = idx >= 0 ? rawLookup[metric.key][idx] : value;
              return [metric.format(raw), name];
            }}
          />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />

          {activeMetrics.map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: m.color, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
