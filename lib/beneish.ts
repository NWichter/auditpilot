import type { FinancialData, BeneishResult } from "./types";

function safe(numerator: number, denominator: number): number {
  if (!isFinite(denominator) || denominator === 0) return 1;
  const result = numerator / denominator;
  return isFinite(result) ? result : 1;
}

export function analyzeBeneish(data: FinancialData): BeneishResult | null {
  if (data.statements.length < 2) return null;

  const curr = data.statements[data.statements.length - 1];
  const prev = data.statements[data.statements.length - 2];

  // DSRI — Days Sales Receivables Index
  // (AR_t / Rev_t) / (AR_{t-1} / Rev_{t-1})
  const dsri = safe(
    safe(curr.accountsReceivable, curr.revenue),
    safe(prev.accountsReceivable, prev.revenue),
  );

  // GMI — Gross Margin Index
  // ((Rev_{t-1} - COGS_{t-1}) / Rev_{t-1}) / ((Rev_t - COGS_t) / Rev_t)
  const grossMarginPrev = safe(prev.revenue - prev.costOfRevenue, prev.revenue);
  const grossMarginCurr = safe(curr.revenue - curr.costOfRevenue, curr.revenue);
  const gmi = safe(grossMarginPrev, grossMarginCurr);

  // AQI — Asset Quality Index
  // (1 - (CA_t + PPE_t) / TA_t) / (1 - (CA_{t-1} + PPE_{t-1}) / TA_{t-1})
  const aqiCurr = 1 - safe(curr.currentAssets + curr.ppe, curr.totalAssets);
  const aqiPrev = 1 - safe(prev.currentAssets + prev.ppe, prev.totalAssets);
  const aqi = safe(aqiCurr, aqiPrev);

  // SGI — Sales Growth Index
  // Rev_t / Rev_{t-1}
  const sgi = safe(curr.revenue, prev.revenue);

  // DEPI — Depreciation Index
  // (Dep_{t-1} / (Dep_{t-1} + PPE_{t-1})) / (Dep_t / (Dep_t + PPE_t))
  const depiPrev = safe(prev.depreciation, prev.depreciation + prev.ppe);
  const depiCurr = safe(curr.depreciation, curr.depreciation + curr.ppe);
  const depi = safe(depiPrev, depiCurr);

  // SGAI — SG&A Expense Index
  // (SGA_t / Rev_t) / (SGA_{t-1} / Rev_{t-1})
  const sgai = safe(
    safe(curr.sgaExpenses, curr.revenue),
    safe(prev.sgaExpenses, prev.revenue),
  );

  // TATA — Total Accruals to Total Assets
  // (NI_t - OCF_t) / TA_t
  const tata = safe(curr.netIncome - curr.operatingCashFlow, curr.totalAssets);

  // LVGI — Leverage Index
  // ((LTD_t + CL_t) / TA_t) / ((LTD_{t-1} + CL_{t-1}) / TA_{t-1})
  const lvgiCurr = safe(
    curr.longTermDebt + curr.currentLiabilities,
    curr.totalAssets,
  );
  const lvgiPrev = safe(
    prev.longTermDebt + prev.currentLiabilities,
    prev.totalAssets,
  );
  const lvgi = safe(lvgiCurr, lvgiPrev);

  // M-Score formula
  const mScore =
    -4.84 +
    0.92 * dsri +
    0.528 * gmi +
    0.404 * aqi +
    0.892 * sgi +
    0.115 * depi -
    0.172 * sgai +
    4.679 * tata -
    0.327 * lvgi;

  let verdict: BeneishResult["verdict"];
  if (mScore < -2.22) {
    verdict = "unlikely";
  } else if (mScore < -1.78) {
    verdict = "possible";
  } else {
    verdict = "likely";
  }

  const variables: BeneishResult["variables"] = [
    {
      name: "Days Sales Receivables Index",
      abbreviation: "DSRI",
      value: dsri,
      contribution: 0.92 * dsri,
      description:
        "Ratio of receivables to revenue this year vs. last year. Values >1 suggest accelerated revenue recognition.",
    },
    {
      name: "Gross Margin Index",
      abbreviation: "GMI",
      value: gmi,
      contribution: 0.528 * gmi,
      description:
        "Ratio of prior year gross margin to current year gross margin. Values >1 indicate deteriorating margins.",
    },
    {
      name: "Asset Quality Index",
      abbreviation: "AQI",
      value: aqi,
      contribution: 0.404 * aqi,
      description:
        "Change in the ratio of non-current, non-physical assets to total assets. Values >1 signal increasing intangible asset load.",
    },
    {
      name: "Sales Growth Index",
      abbreviation: "SGI",
      value: sgi,
      contribution: 0.892 * sgi,
      description:
        "Current year revenue divided by prior year revenue. High growth companies have naturally higher scores.",
    },
    {
      name: "Depreciation Index",
      abbreviation: "DEPI",
      value: depi,
      contribution: 0.115 * depi,
      description:
        "Prior year depreciation rate vs. current year rate. Values >1 suggest slowed depreciation (possible manipulation).",
    },
    {
      name: "SG&A Expense Index",
      abbreviation: "SGAI",
      value: sgai,
      contribution: -0.172 * sgai,
      description:
        "Change in SG&A expenses relative to revenue. Disproportionate growth may signal structural issues.",
    },
    {
      name: "Total Accruals to Total Assets",
      abbreviation: "TATA",
      value: tata,
      contribution: 4.679 * tata,
      description:
        "Accruals as a proportion of total assets. High positive accruals are a strong earnings manipulation signal.",
    },
    {
      name: "Leverage Index",
      abbreviation: "LVGI",
      value: lvgi,
      contribution: -0.327 * lvgi,
      description:
        "Change in leverage ratio year-over-year. Increasing leverage may incentivize earnings management.",
    },
  ];

  return { mScore, verdict, variables };
}
