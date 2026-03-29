import type { FinancialData, RatioResult, YearStatement } from "./types";

type Sector = "energy" | "tech" | "finance" | "general";

interface RatioDefinition {
  name: string;
  category: RatioResult["category"];
  calculate: (curr: YearStatement, prev?: YearStatement) => number;
  benchmarks: Record<Sector, number>;
  yellowThreshold: number;
  redThreshold: number;
  higherIsBetter: boolean;
  explanation: string;
}

function safe(numerator: number, denominator: number): number {
  if (!isFinite(denominator) || denominator === 0) return 0;
  const result = numerator / denominator;
  return isFinite(result) ? result : 0;
}

const RATIO_DEFINITIONS: RatioDefinition[] = [
  // ─── LIQUIDITY ───────────────────────────────────────────────────────────────
  {
    name: "Current Ratio",
    category: "liquidity",
    calculate: (curr) => safe(curr.currentAssets, curr.currentLiabilities),
    benchmarks: { energy: 1.5, tech: 2.0, finance: 1.2, general: 1.5 },
    yellowThreshold: 1.0,
    redThreshold: 0.8,
    higherIsBetter: true,
    explanation:
      "Measures the ability to cover short-term liabilities with short-term assets. Below 1.0 signals liquidity risk.",
  },
  {
    name: "Quick Ratio",
    category: "liquidity",
    calculate: (curr) =>
      safe(curr.currentAssets - curr.inventory, curr.currentLiabilities),
    benchmarks: { energy: 1.0, tech: 1.5, finance: 1.0, general: 1.0 },
    yellowThreshold: 0.8,
    redThreshold: 0.5,
    higherIsBetter: true,
    explanation:
      "Like current ratio but excludes inventory. More conservative measure of immediate liquidity.",
  },
  {
    name: "Cash Ratio",
    category: "liquidity",
    calculate: (curr) => safe(curr.cash, curr.currentLiabilities),
    benchmarks: { energy: 0.3, tech: 0.5, finance: 0.2, general: 0.3 },
    yellowThreshold: 0.2,
    redThreshold: 0.1,
    higherIsBetter: true,
    explanation:
      "Most conservative liquidity measure — only cash and equivalents vs. current liabilities.",
  },
  {
    name: "Working Capital Ratio",
    category: "liquidity",
    calculate: (curr) =>
      safe(curr.currentAssets - curr.currentLiabilities, curr.totalAssets),
    benchmarks: { energy: 0.15, tech: 0.2, finance: 0.1, general: 0.15 },
    yellowThreshold: 0.05,
    redThreshold: 0.0,
    higherIsBetter: true,
    explanation:
      "Net working capital as a share of total assets — indicates operational buffer relative to asset base.",
  },
  {
    name: "Operating CF Ratio",
    category: "liquidity",
    calculate: (curr) => safe(curr.operatingCashFlow, curr.currentLiabilities),
    benchmarks: { energy: 0.4, tech: 0.5, finance: 0.3, general: 0.4 },
    yellowThreshold: 0.2,
    redThreshold: 0.1,
    higherIsBetter: true,
    explanation:
      "Operating cash flow divided by current liabilities. Shows ability to service short-term debt from operations.",
  },

  // ─── PROFITABILITY ───────────────────────────────────────────────────────────
  {
    name: "Gross Margin",
    category: "profitability",
    calculate: (curr) => safe(curr.grossProfit, curr.revenue),
    benchmarks: { energy: 0.35, tech: 0.55, finance: 0.5, general: 0.35 },
    yellowThreshold: 0.15,
    redThreshold: 0.05,
    higherIsBetter: true,
    explanation:
      "Gross profit as a percentage of revenue. Low gross margin may indicate pricing pressure or high input costs.",
  },
  {
    name: "Operating Margin",
    category: "profitability",
    calculate: (curr) => safe(curr.operatingIncome, curr.revenue),
    benchmarks: { energy: 0.12, tech: 0.2, finance: 0.25, general: 0.1 },
    yellowThreshold: 0.05,
    redThreshold: 0.0,
    higherIsBetter: true,
    explanation:
      "Operating income as a share of revenue. Reflects core business profitability before interest and taxes.",
  },
  {
    name: "Net Margin",
    category: "profitability",
    calculate: (curr) => safe(curr.netIncome, curr.revenue),
    benchmarks: { energy: 0.07, tech: 0.15, finance: 0.18, general: 0.07 },
    yellowThreshold: 0.02,
    redThreshold: 0.0,
    higherIsBetter: true,
    explanation:
      "Bottom-line profit as a percentage of revenue after all expenses, interest, and taxes.",
  },
  {
    name: "Return on Equity (ROE)",
    category: "profitability",
    calculate: (curr) => safe(curr.netIncome, curr.totalEquity),
    benchmarks: { energy: 0.1, tech: 0.2, finance: 0.12, general: 0.12 },
    yellowThreshold: 0.05,
    redThreshold: 0.0,
    higherIsBetter: true,
    explanation:
      "Net income divided by shareholders equity. Measures profitability relative to equity investment.",
  },
  {
    name: "Return on Assets (ROA)",
    category: "profitability",
    calculate: (curr) => safe(curr.netIncome, curr.totalAssets),
    benchmarks: { energy: 0.05, tech: 0.1, finance: 0.01, general: 0.05 },
    yellowThreshold: 0.02,
    redThreshold: 0.0,
    higherIsBetter: true,
    explanation:
      "Net income relative to total assets. Indicates how efficiently assets are used to generate profit.",
  },
  {
    name: "EBITDA Margin",
    category: "profitability",
    calculate: (curr) => safe(curr.ebitda, curr.revenue),
    benchmarks: { energy: 0.2, tech: 0.28, finance: 0.3, general: 0.18 },
    yellowThreshold: 0.08,
    redThreshold: 0.03,
    higherIsBetter: true,
    explanation:
      "EBITDA as a percentage of revenue. Widely used to compare profitability across capital structures.",
  },

  // ─── LEVERAGE ────────────────────────────────────────────────────────────────
  {
    name: "Debt-to-Equity",
    category: "leverage",
    calculate: (curr) => safe(curr.totalLiabilities, curr.totalEquity),
    benchmarks: { energy: 1.2, tech: 0.5, finance: 3.0, general: 1.0 },
    yellowThreshold: 2.0,
    redThreshold: 3.0,
    higherIsBetter: false,
    explanation:
      "Total liabilities relative to equity. High values indicate reliance on debt financing and elevated financial risk.",
  },
  {
    name: "Debt-to-Assets",
    category: "leverage",
    calculate: (curr) => safe(curr.totalLiabilities, curr.totalAssets),
    benchmarks: { energy: 0.55, tech: 0.35, finance: 0.7, general: 0.5 },
    yellowThreshold: 0.65,
    redThreshold: 0.8,
    higherIsBetter: false,
    explanation:
      "Proportion of assets financed by liabilities. Values above 0.8 are generally considered distressed.",
  },
  {
    name: "Interest Coverage",
    category: "leverage",
    calculate: (curr) => safe(curr.operatingIncome, curr.interestExpense),
    benchmarks: { energy: 4.0, tech: 10.0, finance: 3.0, general: 4.0 },
    yellowThreshold: 2.0,
    redThreshold: 1.0,
    higherIsBetter: true,
    explanation:
      "Operating income divided by interest expense. Below 1.5x signals potential inability to service debt.",
  },
  {
    name: "Equity Multiplier",
    category: "leverage",
    calculate: (curr) => safe(curr.totalAssets, curr.totalEquity),
    benchmarks: { energy: 2.5, tech: 1.8, finance: 8.0, general: 2.5 },
    yellowThreshold: 3.5,
    redThreshold: 5.0,
    higherIsBetter: false,
    explanation:
      "Total assets divided by equity — component of DuPont analysis. Higher values mean more financial leverage.",
  },
  {
    name: "Long-term Debt Ratio",
    category: "leverage",
    calculate: (curr) => safe(curr.longTermDebt, curr.totalAssets),
    benchmarks: { energy: 0.3, tech: 0.15, finance: 0.4, general: 0.25 },
    yellowThreshold: 0.45,
    redThreshold: 0.6,
    higherIsBetter: false,
    explanation:
      "Long-term debt as a fraction of total assets. Indicates long-term financial obligation burden.",
  },

  // ─── EFFICIENCY ──────────────────────────────────────────────────────────────
  {
    name: "Asset Turnover",
    category: "efficiency",
    calculate: (curr) => safe(curr.revenue, curr.totalAssets),
    benchmarks: { energy: 0.6, tech: 0.7, finance: 0.1, general: 0.8 },
    yellowThreshold: 0.3,
    redThreshold: 0.15,
    higherIsBetter: true,
    explanation:
      "Revenue generated per dollar of assets. Low values may suggest inefficient use of assets.",
  },
  {
    name: "Inventory Turnover",
    category: "efficiency",
    calculate: (curr) => safe(curr.costOfRevenue, curr.inventory),
    benchmarks: { energy: 10.0, tech: 8.0, finance: 0.0, general: 6.0 },
    yellowThreshold: 3.0,
    redThreshold: 1.5,
    higherIsBetter: true,
    explanation:
      "Cost of goods sold divided by average inventory. High turnover indicates efficient inventory management.",
  },
  {
    name: "Receivables Turnover",
    category: "efficiency",
    calculate: (curr) => safe(curr.revenue, curr.accountsReceivable),
    benchmarks: { energy: 8.0, tech: 7.0, finance: 5.0, general: 7.0 },
    yellowThreshold: 4.0,
    redThreshold: 2.0,
    higherIsBetter: true,
    explanation:
      "Revenue divided by accounts receivable. Low values may indicate collection problems.",
  },
  {
    name: "Days Sales Outstanding (DSO)",
    category: "efficiency",
    calculate: (curr) => safe(curr.accountsReceivable, curr.revenue) * 365,
    benchmarks: { energy: 45, tech: 52, finance: 72, general: 52 },
    yellowThreshold: 75,
    redThreshold: 90,
    higherIsBetter: false,
    explanation:
      "Average days to collect revenue. High DSO signals slow collections or aggressive revenue recognition.",
  },
  {
    name: "Days Inventory Outstanding (DIO)",
    category: "efficiency",
    calculate: (curr) => safe(curr.inventory, curr.costOfRevenue) * 365,
    benchmarks: { energy: 35, tech: 50, finance: 0, general: 60 },
    yellowThreshold: 90,
    redThreshold: 120,
    higherIsBetter: false,
    explanation:
      "Average days to sell inventory. High DIO may indicate obsolete inventory or slow-moving goods.",
  },
  {
    name: "Days Payable Outstanding (DPO)",
    category: "efficiency",
    calculate: (curr) =>
      safe(curr.currentLiabilities * 0.4, curr.costOfRevenue) * 365,
    benchmarks: { energy: 45, tech: 40, finance: 30, general: 45 },
    yellowThreshold: 90,
    redThreshold: 120,
    higherIsBetter: false,
    explanation:
      "Estimated days to pay suppliers. Extremely high DPO can signal cash flow stress or supplier disputes.",
  },
  {
    name: "Cash Conversion Cycle",
    category: "efficiency",
    calculate: (curr) => {
      const dso = safe(curr.accountsReceivable, curr.revenue) * 365;
      const dio = safe(curr.inventory, curr.costOfRevenue) * 365;
      const dpo = safe(curr.currentLiabilities * 0.4, curr.costOfRevenue) * 365;
      return dso + dio - dpo;
    },
    benchmarks: { energy: 35, tech: 60, finance: 40, general: 65 },
    yellowThreshold: 100,
    redThreshold: 150,
    higherIsBetter: false,
    explanation:
      "DSO + DIO − DPO. Measures days from cash outlay to cash collection. Negative values are favorable.",
  },

  // ─── OTHER ───────────────────────────────────────────────────────────────────
  {
    name: "Revenue Growth",
    category: "other",
    calculate: (curr, prev) => {
      if (!prev || prev.revenue === 0) return 0;
      return safe(curr.revenue - prev.revenue, prev.revenue);
    },
    benchmarks: { energy: 0.05, tech: 0.15, finance: 0.07, general: 0.07 },
    yellowThreshold: -0.05,
    redThreshold: -0.15,
    higherIsBetter: true,
    explanation:
      "Year-over-year revenue growth rate. Persistent negative growth warrants further investigation.",
  },
  {
    name: "Earnings Quality",
    category: "other",
    calculate: (curr) => safe(curr.operatingCashFlow, curr.netIncome),
    benchmarks: { energy: 1.0, tech: 1.0, finance: 1.0, general: 1.0 },
    yellowThreshold: 0.5,
    redThreshold: 0.2,
    higherIsBetter: true,
    explanation:
      "Operating cash flow divided by net income. Values below 1 suggest earnings may be inflated relative to cash.",
  },
  {
    name: "Accruals Ratio",
    category: "other",
    calculate: (curr) =>
      safe(curr.netIncome - curr.operatingCashFlow, curr.totalAssets),
    benchmarks: { energy: 0.0, tech: 0.0, finance: 0.0, general: 0.0 },
    yellowThreshold: 0.05,
    redThreshold: 0.1,
    higherIsBetter: false,
    explanation:
      "Net income minus operating cash flow divided by total assets. High accruals suggest earnings manipulation risk.",
  },
  {
    name: "Altman Z-Score",
    category: "other",
    calculate: (curr) => {
      const wc = curr.currentAssets - curr.currentLiabilities;
      const ta = curr.totalAssets;
      const re = curr.netIncome; // proxy for retained earnings
      const ebit = curr.operatingIncome;
      const equity = curr.totalEquity;
      const tl = curr.totalLiabilities;
      const rev = curr.revenue;
      if (ta === 0) return 0;
      return (
        1.2 * safe(wc, ta) +
        1.4 * safe(re, ta) +
        3.3 * safe(ebit, ta) +
        0.6 * safe(equity, tl) +
        1.0 * safe(rev, ta)
      );
    },
    benchmarks: { energy: 3.0, tech: 4.0, finance: 2.5, general: 3.0 },
    yellowThreshold: 1.81,
    redThreshold: 1.23,
    higherIsBetter: true,
    explanation:
      "Multi-factor bankruptcy predictor. Below 1.81 indicates distress zone; above 2.99 is safe zone.",
  },
  {
    name: "Sloan Ratio",
    category: "other",
    calculate: (curr) =>
      safe(curr.netIncome - curr.operatingCashFlow, curr.totalAssets),
    benchmarks: { energy: 0.0, tech: 0.0, finance: 0.0, general: 0.0 },
    yellowThreshold: 0.05,
    redThreshold: 0.1,
    higherIsBetter: false,
    explanation:
      "Accrual component of earnings relative to assets (Sloan 1996). High values correlate with future earnings reversals.",
  },
  {
    name: "Capex to Revenue",
    category: "other",
    calculate: (curr) => safe(Math.abs(curr.capitalExpenditures), curr.revenue),
    benchmarks: { energy: 0.12, tech: 0.07, finance: 0.03, general: 0.06 },
    yellowThreshold: 0.2,
    redThreshold: 0.3,
    higherIsBetter: false,
    explanation:
      "Capital expenditures as a fraction of revenue. Very high capex relative to revenue can strain free cash flow.",
  },
  {
    name: "Free Cash Flow Margin",
    category: "other",
    calculate: (curr) =>
      safe(
        curr.operatingCashFlow - Math.abs(curr.capitalExpenditures),
        curr.revenue,
      ),
    benchmarks: { energy: 0.05, tech: 0.12, finance: 0.1, general: 0.07 },
    yellowThreshold: 0.0,
    redThreshold: -0.05,
    higherIsBetter: true,
    explanation:
      "Free cash flow (OCF − CapEx) divided by revenue. Persistent negative FCF margin requires financing to sustain operations.",
  },
];

function getStatus(value: number, def: RatioDefinition): RatioResult["status"] {
  if (def.higherIsBetter) {
    if (value >= def.yellowThreshold) return "green";
    if (value >= def.redThreshold) return "yellow";
    return "red";
  } else {
    if (value <= def.yellowThreshold) return "green";
    if (value <= def.redThreshold) return "yellow";
    return "red";
  }
}

export function analyzeRatios(data: FinancialData): RatioResult[] {
  const results: RatioResult[] = [];
  const stmts = data.statements;
  if (stmts.length === 0) return results;

  const latest = stmts[stmts.length - 1];
  const prev = stmts.length >= 2 ? stmts[stmts.length - 2] : undefined;

  for (const def of RATIO_DEFINITIONS) {
    const value = def.calculate(latest, prev);
    const benchmark = def.benchmarks[data.sector];
    const status = getStatus(value, def);

    // Build year-over-year array
    const yearOverYear: number[] = stmts.map((stmt, idx) => {
      const prevStmt = idx > 0 ? stmts[idx - 1] : undefined;
      return def.calculate(stmt, prevStmt);
    });

    results.push({
      name: def.name,
      value,
      benchmark,
      status,
      category: def.category,
      explanation: def.explanation,
      yearOverYear,
    });
  }

  return results;
}
