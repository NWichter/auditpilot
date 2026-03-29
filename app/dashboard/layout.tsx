"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisProvider, useAnalysis } from "@/lib/analysis-context";
import { Sidebar } from "@/components/sidebar";
import type { FinancialData } from "@/lib/types";

async function loadCompanyData(company: string): Promise<FinancialData> {
  if (company === "enron") {
    const d = await import("@/data/enron.json");
    return d.default as FinancialData;
  }
  if (company === "apple") {
    const d = await import("@/data/apple.json");
    return d.default as FinancialData;
  }
  if (company === "worldcom") {
    const d = await import("@/data/worldcom.json");
    return d.default as FinancialData;
  }
  return null as unknown as FinancialData;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { result, setCompany } = useAnalysis();

  const company = searchParams.get("company") ?? "enron";

  useEffect(() => {
    async function load() {
      if (company === "custom") {
        try {
          const raw = sessionStorage.getItem("auditpilot_custom_data");
          if (raw) {
            const parsed: FinancialData = JSON.parse(raw);
            setCompany(parsed);
            return;
          }
        } catch {
          // fall through to default
        }
      }

      const data = await loadCompanyData(company);
      if (data) setCompany(data);
    }

    load();
  }, [company, setCompany]);

  const companyName = result?.company.companyName ?? "…";
  const riskScore = result?.riskScore.overall ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar companyName={companyName} riskScore={riskScore} />
      <main className="ml-0 md:ml-56 p-4 md:p-8 pb-20 md:pb-8">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalysisProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-muted-foreground text-sm animate-pulse">
              Loading…
            </div>
          </div>
        }
      >
        <DashboardInner>{children}</DashboardInner>
      </Suspense>
    </AnalysisProvider>
  );
}
