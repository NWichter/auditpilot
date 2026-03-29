"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FinancialData, AnalysisResult } from "@/lib/types";
import { analyzeBenford } from "@/lib/benford";
import { analyzeRatios } from "@/lib/ratios";
import { analyzeBeneish } from "@/lib/beneish";
import { analyzeRedFlags } from "@/lib/redflags";
import { calculateRiskScore } from "@/lib/scoring";

interface AnalysisContextType {
  data: FinancialData | null;
  result: AnalysisResult | null;
  setCompany: (data: FinancialData) => void;
  isAnalyzing: boolean;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setCompany = useCallback((financialData: FinancialData) => {
    setIsAnalyzing(true);
    try {
      const benford = analyzeBenford(financialData);
      const ratios = analyzeRatios(financialData);
      const beneish = analyzeBeneish(financialData);
      const redFlags = analyzeRedFlags(financialData, benford, beneish, ratios);
      const riskScore = calculateRiskScore(benford, beneish, redFlags, ratios);

      const analysisResult: AnalysisResult = {
        company: financialData,
        benford,
        ratios,
        beneish,
        redFlags,
        riskScore,
      };

      setData(financialData);
      setResult(analysisResult);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <AnalysisContext.Provider value={{ data, result, setCompany, isAnalyzing }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContextType {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return ctx;
}
