"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ShieldAlert,
} from "lucide-react";
import { useAnalysis } from "@/lib/analysis-context";
import { KpiCard } from "@/components/kpi-card";
import { RiskGauge } from "@/components/risk-gauge";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function severityBadge(severity: "critical" | "warning" | "info") {
  if (severity === "critical")
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (severity === "warning")
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
}

function statusDot(status: "green" | "yellow" | "red") {
  if (status === "green") return "bg-green-500";
  if (status === "yellow") return "bg-yellow-500";
  return "bg-red-500";
}

function beneishVerdictBadge(verdict: string) {
  if (verdict === "unlikely")
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (verdict === "possible")
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

function benfordVerdictBadge(verdict: string) {
  if (verdict === "conforming")
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (verdict === "suspicious")
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

function formatMillions(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}T`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}B`;
  return `$${n.toFixed(1)}M`;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded", className)} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { result, isAnalyzing } = useAnalysis();

  if (isAnalyzing || !result) return <LoadingSkeleton />;

  const { benford, beneish, redFlags, riskScore, ratios, company } = result;

  // Benford chart data
  const benfordData = benford.observed.map((obs, i) => ({
    digit: String(i + 1),
    observed: parseFloat((obs * 100).toFixed(1)),
    expected: parseFloat((benford.expected[i] * 100).toFixed(1)),
  }));

  // Top 5 triggered red flags
  const topFlags = redFlags.flags
    .filter((f) => f.triggered)
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 5);

  // Ratio dots grouped by category
  const ratioCategories = [
    "liquidity",
    "profitability",
    "leverage",
    "efficiency",
    "other",
  ] as const;
  const ratioByCategory = ratioCategories.map((cat) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    items: ratios.filter((r) => r.category === cat),
  }));

  // Revenue + Net Income sparkline (last 5 years)
  const last5 = company.statements.slice(-5);
  const sparkData = last5.map((s) => ({
    year: String(s.year),
    revenue: s.revenue,
    netIncome: s.netIncome,
  }));

  // KPI status helpers
  const benfordStatus =
    benford.verdict === "conforming"
      ? "green"
      : benford.verdict === "suspicious"
        ? "yellow"
        : "red";
  const beneishStatus = !beneish
    ? undefined
    : beneish.verdict === "unlikely"
      ? "green"
      : beneish.verdict === "possible"
        ? "yellow"
        : "red";
  const flagStatus =
    redFlags.criticalCount === 0
      ? "green"
      : redFlags.criticalCount <= 2
        ? "yellow"
        : "red";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {company.companyName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fraud risk analysis overview
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Risk Score */}
        <Link
          href="/dashboard/redflags"
          className="bg-card rounded-lg border border-border p-4 flex flex-col items-center hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 hover:scale-[1.02]"
        >
          <RiskGauge score={riskScore.overall} size={160} />
          <p className="text-xs text-muted-foreground mt-1">
            Overall Risk Score
          </p>
        </Link>

        {/* Beneish M-Score */}
        <KpiCard
          title="Beneish M-Score"
          value={beneish ? beneish.mScore.toFixed(2) : "N/A"}
          subtitle={
            beneish
              ? beneish.verdict === "unlikely"
                ? "Manipulation unlikely"
                : beneish.verdict === "possible"
                  ? "Possible manipulation"
                  : "Likely manipulation"
              : "Insufficient data"
          }
          status={beneishStatus}
          icon={AlertTriangle}
          href="/dashboard/redflags"
        />

        {/* Benford Chi² */}
        <KpiCard
          title="Benford Chi²"
          value={benford.chiSquared.toFixed(2)}
          subtitle={
            benford.verdict === "conforming"
              ? "Digit distribution normal"
              : benford.verdict === "suspicious"
                ? "Minor deviations detected"
                : "Significant deviations"
          }
          status={benfordStatus as "green" | "yellow" | "red"}
          icon={BarChart3}
          href="/dashboard/benford"
        />

        {/* Red Flags */}
        <KpiCard
          title="Red Flags"
          value={`${redFlags.triggeredCount}/15`}
          subtitle={`${redFlags.criticalCount} critical, ${redFlags.warningCount} warnings`}
          status={flagStatus}
          icon={ShieldAlert}
          href="/dashboard/redflags"
        />
      </div>

      {/* Bottom 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Mini Benford bar chart */}
        <Link href="/dashboard/benford" className="block">
          <div className="bg-card rounded-lg border border-border p-4 h-64 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Benford Distribution
              </h3>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  benfordVerdictBadge(benford.verdict),
                )}
              >
                {benford.verdict}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={benfordData} barGap={2}>
                <XAxis
                  dataKey="digit"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(v) => [`${v}%`]}
                />
                <Bar
                  dataKey="expected"
                  fill="#334155"
                  radius={[2, 2, 0, 0]}
                  name="Expected"
                />
                <Bar
                  dataKey="observed"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                  name="Observed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Link>

        {/* 2. Top 5 red flags */}
        <Link href="/dashboard/redflags" className="block">
          <div className="bg-card rounded-lg border border-border p-4 h-64 overflow-hidden hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Top Red Flags
              </h3>
              <span className="text-xs text-muted-foreground">
                {redFlags.triggeredCount} triggered
              </span>
            </div>
            {topFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-6 text-center">
                No red flags triggered
              </p>
            ) : (
              <ul className="space-y-2">
                {topFlags.map((flag) => (
                  <li key={flag.id} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5",
                        severityBadge(flag.severity),
                      )}
                    >
                      {flag.severity}
                    </span>
                    <span className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                      {flag.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Link>

        {/* 3. Ratio status dots */}
        <Link href="/dashboard/ratios" className="block">
          <div className="bg-card rounded-lg border border-border p-4 h-64 overflow-auto hover:border-primary/40 transition-colors cursor-pointer">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Financial Ratios Summary
            </h3>
            <div className="space-y-3">
              {ratioByCategory
                .filter((cat) => cat.items.length > 0)
                .map(({ label, items }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((ratio) => (
                        <div
                          key={ratio.name}
                          className="flex items-center gap-1.5"
                          title={`${ratio.name}: ${ratio.value.toFixed(2)}`}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              statusDot(ratio.status),
                            )}
                          />
                          <span className="text-xs text-foreground/70 truncate max-w-[100px]">
                            {ratio.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Link>

        {/* 4. Revenue + Net Income sparkline */}
        <Link href="/dashboard/timeline" className="block">
          <div className="bg-card rounded-lg border border-border p-4 h-64 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Revenue & Net Income
              </h3>
              <span className="text-xs text-muted-foreground">
                Last 5 years
              </span>
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400 inline-block" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-green-400 inline-block" />
                <span className="text-xs text-muted-foreground">
                  Net Income
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="75%">
              <LineChart data={sparkData}>
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(v) => [formatMillions(v as number)]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="netIncome"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Net Income"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Link>
      </div>
    </div>
  );
}
