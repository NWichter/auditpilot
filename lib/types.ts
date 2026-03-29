export interface FinancialData {
  companyName: string;
  ticker?: string;
  sector: "energy" | "tech" | "finance" | "general";
  years: number[];
  statements: YearStatement[];
}

export interface YearStatement {
  year: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  netIncome: number;
  depreciation: number;
  sgaExpenses: number;
  ebitda: number;
  cash: number;
  accountsReceivable: number;
  inventory: number;
  currentAssets: number;
  totalAssets: number;
  ppe: number;
  currentLiabilities: number;
  longTermDebt: number;
  totalLiabilities: number;
  totalEquity: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  capitalExpenditures: number;
}

export interface BenfordResult {
  observed: number[];
  expected: number[];
  chiSquared: number;
  pValue: number;
  verdict: "conforming" | "suspicious" | "non_conforming";
  sampleSize: number;
}

export interface RatioResult {
  name: string;
  value: number;
  benchmark: number;
  status: "green" | "yellow" | "red";
  category: "liquidity" | "profitability" | "leverage" | "efficiency" | "other";
  explanation: string;
  yearOverYear: number[];
}

export interface BeneishResult {
  mScore: number;
  verdict: "unlikely" | "possible" | "likely";
  variables: {
    name: string;
    abbreviation: string;
    value: number;
    contribution: number;
    description: string;
  }[];
}

export interface RedFlag {
  id: number;
  name: string;
  description: string;
  severity: "critical" | "warning" | "info";
  triggered: boolean;
  details: string;
  metric?: number;
  threshold?: number;
}

export interface RedFlagResult {
  flags: RedFlag[];
  triggeredCount: number;
  criticalCount: number;
  warningCount: number;
}

export interface RiskScore {
  overall: number;
  benfordScore: number;
  ratioScore: number;
  beneishScore: number;
  redFlagScore: number;
}

export interface AnalysisResult {
  company: FinancialData;
  benford: BenfordResult;
  ratios: RatioResult[];
  beneish: BeneishResult | null;
  redFlags: RedFlagResult;
  riskScore: RiskScore;
}

export interface AIReport {
  executiveSummary: string;
  keyFindings: string[];
  detailAnalysis: string;
  riskAssessment: string;
  recommendations: string[];
  generatedAt: string;
}
