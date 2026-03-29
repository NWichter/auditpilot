"use client";

import {
  Shield,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload-zone";
import { parseCSV } from "@/lib/parser";

interface CompanyCard {
  id: string;
  name: string;
  ticker: string;
  type: string;
  years: string;
  description: string;
  riskLevel: "high" | "critical" | "clean";
}

const COMPANIES: CompanyCard[] = [
  {
    id: "enron",
    name: "Enron Corporation",
    ticker: "ENE",
    type: "Energy",
    years: "1997–2001",
    description: "Revenue manipulation & off-balance-sheet entities",
    riskLevel: "critical",
  },
  {
    id: "apple",
    name: "Apple Inc.",
    ticker: "AAPL",
    type: "Technology",
    years: "2019–2023",
    description: "Reference benchmark — clean financial profile",
    riskLevel: "clean",
  },
  {
    id: "worldcom",
    name: "WorldCom Inc.",
    ticker: "WCOM",
    type: "Telecommunications",
    years: "1999–2002",
    description: "Expense capitalization & accounting fraud",
    riskLevel: "high",
  },
];

const FEATURE_STATS = [
  { value: "30+", label: "Financial Ratios" },
  { value: "15", label: "Red Flag Detectors" },
  { value: "8-var", label: "Beneish M-Score" },
  { value: "9-digit", label: "Benford Analysis" },
];

function riskAccent(level: CompanyCard["riskLevel"]) {
  if (level === "critical") return "border-red-500/20 hover:border-red-500/40";
  if (level === "high") return "border-amber-500/20 hover:border-amber-500/40";
  return "border-emerald-500/20 hover:border-emerald-500/40";
}

function riskDot(level: CompanyCard["riskLevel"]) {
  if (level === "critical") return "bg-red-400/70";
  if (level === "high") return "bg-amber-400/70";
  return "bg-emerald-400/70";
}

function riskLabel(level: CompanyCard["riskLevel"]) {
  if (level === "critical") return "Critical Risk";
  if (level === "high") return "Elevated Risk";
  return "Low Risk";
}

export default function HomePage() {
  const router = useRouter();

  function handleFileSelect(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") return;
      const companyName = file.name.replace(/\.csv$/i, "");
      const data = parseCSV(text, companyName);
      sessionStorage.setItem("auditpilot_custom", JSON.stringify(data));
      router.push("/dashboard?company=custom");
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-3xl space-y-16">
        {/* Hero */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
              AuditPilot
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gradient leading-tight">
            Forensic Financial
            <br />
            Intelligence
          </h1>

          <p className="max-w-lg text-[15px] text-muted-foreground leading-relaxed">
            Quantitative analysis of financial statements using Beneish M-Score,
            Benford&apos;s Law, ratio benchmarking, and systematic red-flag
            detection.
          </p>

          {/* Feature stats */}
          <div className="flex items-center gap-px mt-2 rounded-lg border border-white/6 overflow-hidden bg-white/[0.02]">
            {FEATURE_STATS.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center px-5 py-3 border-r border-white/6 last:border-r-0"
              >
                <span className="text-base font-bold text-foreground tabular-nums">
                  {stat.value}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Case studies */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Case Studies
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPANIES.map((company) => (
              <button
                key={company.id}
                onClick={() => router.push(`/dashboard?company=${company.id}`)}
                className={`group card-glass rounded-lg border p-5 text-left transition-all duration-200 hover:bg-white/[0.04] ${riskAccent(company.riskLevel)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {company.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {company.ticker} &middot; {company.type}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-muted-foreground/70 leading-relaxed mb-3">
                  {company.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                    {company.years}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${riskDot(company.riskLevel)}`}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {riskLabel(company.riskLevel)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Import section */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Import Financial Data
          </p>
          <UploadZone onFileSelect={handleFileSelect} />
        </div>
      </div>
    </main>
  );
}
