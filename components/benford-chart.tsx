"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { BenfordResult } from "@/lib/types";

interface BenfordChartProps {
  data: BenfordResult;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const expected = payload.find((p) => p.name === "Expected")?.value ?? 0;
  const observed = payload.find((p) => p.name === "Observed")?.value ?? 0;
  const diff = (observed - expected).toFixed(2);
  const sign = Number(diff) >= 0 ? "+" : "";
  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100 shadow-lg">
      <p className="mb-1 font-semibold">Digit {label}</p>
      <p style={{ color: "#60a5fa" }}>Expected: {expected.toFixed(2)}%</p>
      <p
        style={{
          color:
            observed >= expected * 0.8 && observed <= expected * 1.2
              ? "#22c55e"
              : "#ef4444",
        }}
      >
        Observed: {observed.toFixed(2)}%
      </p>
      <p className="mt-1 text-slate-400">
        Diff: {sign}
        {diff}%
      </p>
    </div>
  );
}

export function BenfordChart({ data }: BenfordChartProps) {
  const chartData = Array.from({ length: 9 }, (_, i) => {
    const digit = i + 1;
    const expected = data.expected[i] ?? 0;
    const observed = data.observed[i] ?? 0;
    return {
      digit: String(digit),
      Expected: parseFloat(expected.toFixed(2)),
      Observed: parseFloat(observed.toFixed(2)),
      isConforming: observed >= expected * 0.8 && observed <= expected * 1.2,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="digit"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          label={{
            value: "Leading Digit",
            position: "insideBottom",
            offset: -2,
            fill: "#94a3b8",
            fontSize: 12,
          }}
        />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          domain={[0, 35]}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
        <Bar
          dataKey="Expected"
          fill="#60a5fa"
          animationBegin={0}
          animationDuration={800}
        />
        <Bar dataKey="Observed" animationBegin={50} animationDuration={800}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isConforming ? "#22c55e" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
