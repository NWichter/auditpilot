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
  Shield,
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
  { label: "Report", icon: FileText, href: "/dashboard/report" },
];

function getRiskColor(score: number) {
  if (score < 30) return "text-emerald-400";
  if (score < 60) return "text-amber-400";
  if (score < 80) return "text-orange-400";
  return "text-red-400";
}

function getRiskDotColor(score: number) {
  if (score < 30) return "bg-emerald-400/70";
  if (score < 60) return "bg-amber-400/70";
  if (score < 80) return "bg-orange-400/70";
  return "bg-red-400/70";
}

function getRiskLabel(score: number) {
  if (score < 30) return "Low Risk";
  if (score < 60) return "Medium Risk";
  if (score < 80) return "High Risk";
  return "Critical";
}

export function Sidebar({ companyName, riskScore }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-card border-r border-white/[0.06] flex-col z-40">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground tracking-wide">
              AuditPilot
            </span>
          </div>
        </div>

        {/* Company info */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Active Subject
          </p>
          <p className="text-sm font-medium text-foreground truncate leading-snug">
            {companyName}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                getRiskDotColor(riskScore),
              )}
            />
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                getRiskColor(riskScore),
              )}
            >
              {getRiskLabel(riskScore)}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">
              {riskScore}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
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
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative",
                  isActive
                    ? "text-foreground bg-white/[0.06]"
                    : "text-muted-foreground hover:text-foreground/80 hover:bg-white/[0.03]",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                )}
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <p className="text-[11px] text-muted-foreground/40">
            v1.0 &middot; Forensic Intelligence
          </p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-white/[0.06] z-40">
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
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium leading-none hidden sm:block">
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
