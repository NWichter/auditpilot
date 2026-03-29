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
  Brush,
  ReferenceDot,
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
    format: (v) => `$${(v / 1e6).toFixed(1)}M`,
  },
  {
    key: "netIncome",
    label: "Net Income",
    color: "#34d399",
    getValue: (s) => s.netIncome,
    format: (v) => `$${(v / 1e6).toFixed(1)}M`,
  },
  {
    key: "operatingCF",
    label: "Operating CF",
    color: "#a78bfa",
    getValue: (s) => s.operatingCashFlow,
    format: (v) => `$${(v / 1e6).toFixed(1)}M`,
  },
  {
    key: "totalDebt",
    label: "Total Debt",
    color: "#f87171",
    getValue: (s) => s.longTermDebt,
    format: (v) => `$${(v / 1e6).toFixed(1)}M`,
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

function detectOutliers(values: number[], threshold = 2): Set<number> {
  if (values.length < 3) return new Set();
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
  );
  if (std === 0) return new Set();
  const outlierIndices = new Set<number>();
  values.forEach((v, i) => {
    if (Math.abs(v - mean) > threshold * std) outlierIndices.add(i);
  });
  return outlierIndices;
}

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100 shadow-lg min-w-[160px]">
      <p className="font-semibold mb-2 text-slate-300">{label}</p>
      {payload.map((p) => {
        const metric = METRICS.find((m) => m.key === p.dataKey);
        return (
          <div key={p.dataKey} className="flex justify-between gap-4 text-xs">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-mono text-slate-200">
              {metric ? metric.format(p.value) : p.value.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TimelineChart({ data }: TimelineChartProps) {
  const [active, setActive] = useState<Set<string>>(new Set(DEFAULT_ACTIVE));

  const chartData = useMemo(() => {
    return data.statements.map((stmt) => {
      const row: Record<string, number | string> = { year: stmt.year };
      for (const m of METRICS) {
        row[m.key] = m.getValue(stmt);
      }
      return row;
    });
  }, [data]);

  // Outliers per metric
  const outliers = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const m of METRICS) {
      if (!active.has(m.key)) continue;
      const values = data.statements.map((s) => m.getValue(s));
      const normalizedVals = normalize(values);
      const outlierIdxs = detectOutliers(normalizedVals);
      result[m.key] = Array.from(outlierIdxs);
    }
    return result;
  }, [data, active]);

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
      {/* Metric toggles */}
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

      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(0)}`}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{
              value: "Normalized (0-100)",
              angle: -90,
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 10,
              offset: 10,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          <Brush
            dataKey="year"
            height={20}
            stroke="#334155"
            fill="#0f172a"
            travellerWidth={6}
          />

          {activeMetrics.map((m) => {
            const values = data.statements.map((s) => m.getValue(s));
            const norm = normalize(values);
            const normData = chartData.map((row, i) => ({
              ...row,
              [m.key]: norm[i],
            }));

            return (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                dot={{ r: 3, fill: m.color }}
                activeDot={{ r: 5 }}
                animationDuration={800}
                data={normData}
              />
            );
          })}

          {/* Outlier dots */}
          {activeMetrics.flatMap((m) =>
            (outliers[m.key] ?? []).map((idx) => {
              const row = chartData[idx];
              const values = data.statements.map((s) => m.getValue(s));
              const norm = normalize(values);
              return (
                <ReferenceDot
                  key={`${m.key}-outlier-${idx}`}
                  x={row.year as number}
                  y={norm[idx]}
                  r={6}
                  fill="#ef4444"
                  stroke="#fca5a5"
                  strokeWidth={1}
                />
              );
            }),
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
