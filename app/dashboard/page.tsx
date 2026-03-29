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
  Area,
  AreaChart,
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
    return "bg-red-500/10 text-red-400/90 border border-red-500/20";
  if (severity === "warning")
    return "bg-amber-500/10 text-amber-400/90 border border-amber-500/20";
  return "bg-blue-500/10 text-blue-400/90 border border-blue-500/20";
}

function statusDot(status: "green" | "yellow" | "red") {
  if (status === "green") return "bg-emerald-400/70";
  if (status === "yellow") return "bg-amber-400/70";
  return "bg-red-400/70";
}

function beneishVerdictBadge(verdict: string) {
  if (verdict === "unlikely")
    return "bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20";
  if (verdict === "possible")
    return "bg-amber-500/10 text-amber-400/90 border border-amber-500/20";
  return "bg-red-500/10 text-red-400/90 border border-red-500/20";
}

function benfordVerdictBadge(verdict: string) {
  if (verdict === "conforming")
    return "bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20";
  if (verdict === "suspicious")
    return "bg-amber-500/10 text-amber-400/90 border border-amber-500/20";
  return "bg-red-500/10 text-red-400/90 border border-red-500/20";
}

function formatMillions(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}T`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}B`;
  return `$${n.toFixed(1)}M`;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse bg-white/[0.04] rounded-lg", className)}
    />
  );
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

// ── Shared card wrapper ───────────────────────────────────────────────────────

function CardPanel({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={cn(
          "card-glass rounded-lg p-5 h-64 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/10 cursor-pointer",
          className,
        )}
      >
        {children}
      </div>
    </Link>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "rgba(15, 17, 23, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    fontSize: 12,
    backdropFilter: "blur(8px)",
  },
  labelStyle: { color: "#64748b" },
  itemStyle: { color: "#cbd5e1" },
};

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
    <div className="space-y-7">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {company.companyName}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Financial risk analysis &middot; {company.statements.length} fiscal
          years
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Risk Score */}
        <Link
          href="/dashboard/redflags"
          className="card-glass rounded-lg border p-4 flex flex-col items-center hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
        >
          <RiskGauge score={riskScore.overall} size={160} />
          <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Mini Benford bar chart */}
        <CardPanel href="/dashboard/benford">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-foreground">
              Benford Distribution
            </h3>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded font-medium",
                benfordVerdictBadge(benford.verdict),
              )}
            >
              {benford.verdict}
            </span>
          </div>
          <ResponsiveContainer width="100%" height="82%">
            <BarChart data={benfordData} barGap={2}>
              <XAxis
                dataKey="digit"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`]} />
              <Bar
                dataKey="expected"
                fill="rgba(255,255,255,0.06)"
                radius={[2, 2, 0, 0]}
                name="Expected"
              />
              <Bar
                dataKey="observed"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                name="Observed"
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardPanel>

        {/* 2. Top 5 red flags */}
        <CardPanel href="/dashboard/redflags" className="overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-foreground">
              Top Red Flags
            </h3>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {redFlags.triggeredCount} triggered
            </span>
          </div>
          {topFlags.length === 0 ? (
            <p className="text-[13px] text-muted-foreground mt-8 text-center">
              No red flags triggered
            </p>
          ) : (
            <ul className="space-y-2.5">
              {topFlags.map((flag) => (
                <li key={flag.id} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 uppercase tracking-wide",
                      severityBadge(flag.severity),
                    )}
                  >
                    {flag.severity}
                  </span>
                  <span className="text-[12px] text-foreground/70 leading-relaxed line-clamp-2">
                    {flag.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardPanel>

        {/* 3. Ratio status dots */}
        <CardPanel href="/dashboard/ratios" className="overflow-auto">
          <h3 className="text-[13px] font-semibold text-foreground mb-4">
            Financial Ratios
          </h3>
          <div className="space-y-3.5">
            {ratioByCategory
              .filter((cat) => cat.items.length > 0)
              .map(({ label, items }) => (
                <div key={label}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {items.map((ratio) => (
                      <div
                        key={ratio.name}
                        className="flex items-center gap-1.5"
                        title={`${ratio.name}: ${ratio.value.toFixed(2)}`}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            statusDot(ratio.status),
                          )}
                        />
                        <span className="text-[12px] text-foreground/60 truncate max-w-[96px]">
                          {ratio.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardPanel>

        {/* 4. Revenue + Net Income area chart */}
        <CardPanel href="/dashboard/timeline">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-foreground">
              Revenue &amp; Net Income
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Last 5 years
            </span>
          </div>
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-px bg-blue-400/80 inline-block" />
              <span className="text-[11px] text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-px bg-emerald-400/80 inline-block" />
              <span className="text-[11px] text-muted-foreground">
                Net Income
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="70%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="niGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [formatMillions(v as number)]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#revGrad)"
                dot={false}
                name="Revenue"
                strokeOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="netIncome"
                stroke="#4ade80"
                strokeWidth={1.5}
                fill="url(#niGrad)"
                dot={false}
                name="Net Income"
                strokeOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardPanel>
      </div>
    </div>
  );
}
