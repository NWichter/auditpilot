"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Calculator,
  AlertTriangle,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  companyName: string;
  riskScore: number;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Benford's Law", icon: BarChart3, href: "/dashboard/benford" },
  { label: "Financial Ratios", icon: Calculator, href: "/dashboard/ratios" },
  { label: "Red Flags", icon: AlertTriangle, href: "/dashboard/redflags" },
  { label: "Timeline", icon: TrendingUp, href: "/dashboard/timeline" },
  { label: "AI Report", icon: FileText, href: "/dashboard/report" },
];

function getRiskBadgeColor(score: number) {
  if (score < 30)
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (score < 60)
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  if (score < 80)
    return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

function getRiskLabel(score: number) {
  if (score < 30) return "Low";
  if (score < 60) return "Medium";
  if (score < 80) return "High";
  return "Critical";
}

export function Sidebar({ companyName, riskScore }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex-col z-40">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Audit Pilot
          </h2>
          <p className="text-base font-semibold text-foreground truncate">
            {companyName}
          </p>
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                getRiskBadgeColor(riskScore),
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Risk: {riskScore} — {getRiskLabel(riskScore)}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, href }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            AuditPilot v1.0
          </p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40">
        <div className="grid grid-cols-6 h-full">
          {navItems.map(({ label, icon: Icon, href }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none hidden sm:block">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
