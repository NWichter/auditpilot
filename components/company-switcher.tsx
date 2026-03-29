"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAnalysis } from "@/lib/analysis-context";
import type { FinancialData } from "@/lib/types";

const COMPANIES = [
  { value: "enron", label: "Enron" },
  { value: "apple", label: "Apple" },
  { value: "worldcom", label: "WorldCom" },
];

async function loadCompanyData(company: string): Promise<FinancialData> {
  const data = await import(`@/data/${company}.json`);
  return data.default as FinancialData;
}

export function CompanySwitcher() {
  const { result, setCompany } = useAnalysis();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCompany = searchParams.get("company") ?? "enron";

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const data = await loadCompanyData(value);
    setCompany(data);
    router.push(`/dashboard?company=${value}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="company-switcher"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Company:
      </label>
      <select
        id="company-switcher"
        value={currentCompany}
        onChange={handleChange}
        className="bg-card border border-border text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 transition-colors"
      >
        {COMPANIES.map(({ value, label }) => (
          <option key={value} value={value} className="bg-card">
            {label}
          </option>
        ))}
        {result?.company.companyName &&
          !COMPANIES.find((c) => c.label === result.company.companyName) && (
            <option value="custom" className="bg-card">
              {result.company.companyName} (Custom)
            </option>
          )}
      </select>
    </div>
  );
}
