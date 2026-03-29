"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload-zone";
import { parseCSV } from "@/lib/parser";

interface CompanyCard {
  id: string;
  name: string;
  type: string;
  years: string;
  description: string;
  accentClass: string;
}

const COMPANIES: CompanyCard[] = [
  {
    id: "enron",
    name: "Analyze Enron",
    type: "Energy Corp",
    years: "1997–2001",
    description: "Revenue manipulation & off-balance-sheet fraud",
    accentClass: "border-red-500/40 hover:border-red-500/70",
  },
  {
    id: "apple",
    name: "Analyze Apple",
    type: "Tech Giant",
    years: "2019–2023",
    description: "Clean financial benchmark",
    accentClass: "border-green-500/40 hover:border-green-500/70",
  },
  {
    id: "worldcom",
    name: "Analyze WorldCom",
    type: "Telecom",
    years: "1999–2002",
    description: "Expense capitalization fraud",
    accentClass: "border-amber-500/40 hover:border-amber-500/70",
  },
];

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
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl space-y-12">
        {/* Logo + headline */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">AuditPilot</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Forensic Financial Intelligence
          </p>
          <p className="max-w-xl text-sm text-muted-foreground/80 leading-relaxed">
            AuditPilot runs quantitative forensic analysis on company financial
            statements — applying Benford&apos;s Law, the Beneish M-Score, ratio
            benchmarking, and red-flag detection. Upload your own CSV or explore
            one of the pre-loaded case studies below.
          </p>
        </div>

        {/* Company cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMPANIES.map((company) => (
            <button
              key={company.id}
              onClick={() => router.push(`/dashboard?company=${company.id}`)}
              className={`rounded-lg border-2 bg-card p-5 text-left transition-colors ${company.accentClass}`}
            >
              <p className="text-xl font-semibold text-foreground">
                {company.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {company.type} &bull; {company.years}
              </p>
              <p className="mt-3 text-sm text-muted-foreground/80">
                {company.description}
              </p>
            </button>
          ))}
        </div>

        {/* Upload zone */}
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Or upload your own financial statements
          </p>
          <UploadZone onFileSelect={handleFileSelect} />
        </div>
      </div>
    </main>
  );
}
