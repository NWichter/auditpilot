import type {
  FinancialData,
  BenfordResult,
  BeneishResult,
  RatioResult,
  RedFlag,
  RedFlagResult,
} from "./types";

function getRatio(ratios: RatioResult[], name: string): number {
  return ratios.find((r) => r.name === name)?.value ?? 0;
}

function getRatioYoY(ratios: RatioResult[], name: string): number[] {
  return ratios.find((r) => r.name === name)?.yearOverYear ?? [];
}

export function analyzeRedFlags(
  data: FinancialData,
  benford: BenfordResult,
  beneish: BeneishResult | null,
  ratios: RatioResult[],
): RedFlagResult {
  const stmts = data.statements;
  const curr = stmts[stmts.length - 1];
  const prev = stmts.length >= 2 ? stmts[stmts.length - 2] : null;

  const flags: RedFlag[] = [];

  // ─── Flag 1: Revenue Growth >> CF Growth ─────────────────────────────────────
  {
    let triggered = false;
    let details = "Insufficient data for comparison.";
    let metric: number | undefined;
    const threshold = 0.2;

    if (prev && prev.revenue !== 0 && prev.operatingCashFlow !== 0) {
      const revGrowth = (curr.revenue - prev.revenue) / Math.abs(prev.revenue);
      const cfGrowth =
        (curr.operatingCashFlow - prev.operatingCashFlow) /
        Math.abs(prev.operatingCashFlow);
      metric = revGrowth - cfGrowth;
      triggered = metric > threshold;
      details = triggered
        ? `Revenue grew ${(revGrowth * 100).toFixed(1)}% but operating CF grew only ${(cfGrowth * 100).toFixed(1)}% — divergence of ${(metric * 100).toFixed(1)}%.`
        : `Revenue growth (${(revGrowth * 100).toFixed(1)}%) and CF growth (${(cfGrowth * 100).toFixed(1)}%) are reasonably aligned.`;
    }

    flags.push({
      id: 1,
      name: "Revenue–Cash Flow Divergence",
      description:
        "Revenue growth significantly exceeds operating cash flow growth (>20% gap).",
      severity: "critical",
      triggered,
      details,
      metric,
      threshold,
    });
  }

  // ─── Flag 2: Rising Receivables + Stagnant Revenue ───────────────────────────
  {
    let triggered = false;
    let details = "Insufficient data for comparison.";
    let metric: number | undefined;

    if (prev && prev.revenue !== 0 && prev.accountsReceivable !== 0) {
      const revGrowth = (curr.revenue - prev.revenue) / Math.abs(prev.revenue);
      const arGrowth =
        (curr.accountsReceivable - prev.accountsReceivable) /
        Math.abs(prev.accountsReceivable);
      metric = arGrowth - revGrowth;
      triggered = metric > 0.1 && revGrowth < 0.05;
      details = triggered
        ? `Receivables grew ${(arGrowth * 100).toFixed(1)}% while revenue grew only ${(revGrowth * 100).toFixed(1)}% — possible aggressive revenue recognition.`
        : `Receivables growth (${(arGrowth * 100).toFixed(1)}%) relative to revenue growth (${(revGrowth * 100).toFixed(1)}%) appears normal.`;
    }

    flags.push({
      id: 2,
      name: "Rising Receivables vs. Stagnant Revenue",
      description:
        "Accounts receivable growing significantly faster than revenue.",
      severity: "warning",
      triggered,
      details,
      metric,
      threshold: 0.1,
    });
  }

  // ─── Flag 3: Declining Gross Margin + Rising Revenue ─────────────────────────
  {
    let triggered = false;
    let details = "Insufficient data for comparison.";
    let metric: number | undefined;

    if (prev && prev.revenue !== 0) {
      const revGrowth = (curr.revenue - prev.revenue) / Math.abs(prev.revenue);
      const gmCurr = curr.revenue !== 0 ? curr.grossProfit / curr.revenue : 0;
      const gmPrev = prev.revenue !== 0 ? prev.grossProfit / prev.revenue : 0;
      metric = gmPrev - gmCurr;
      triggered = metric > 0.02 && revGrowth > 0.03;
      details = triggered
        ? `Revenue rose ${(revGrowth * 100).toFixed(1)}% but gross margin fell by ${(metric * 100).toFixed(1)} percentage points — may signal cost pressure or mix shift.`
        : `Gross margin trend is consistent with revenue trajectory.`;
    }

    flags.push({
      id: 3,
      name: "Declining Gross Margin with Rising Revenue",
      description:
        "Revenue growing while gross margins deteriorate — possible price pressure or cost inflation.",
      severity: "warning",
      triggered,
      details,
      metric,
      threshold: 0.02,
    });
  }

  // ─── Flag 4: High Accruals (Sloan > 0.10) ────────────────────────────────────
  {
    const sloanRatio = getRatio(ratios, "Sloan Ratio");
    const triggered = sloanRatio > 0.1;
    flags.push({
      id: 4,
      name: "High Accruals (Sloan Ratio)",
      description:
        "Sloan Ratio above 0.10 indicates earnings driven by accruals rather than cash.",
      severity: "critical",
      triggered,
      details: triggered
        ? `Sloan Ratio is ${sloanRatio.toFixed(3)} — exceeds 0.10 threshold. Accrual-heavy earnings are statistically associated with future earnings declines.`
        : `Sloan Ratio is ${sloanRatio.toFixed(3)} — within acceptable bounds.`,
      metric: sloanRatio,
      threshold: 0.1,
    });
  }

  // ─── Flag 5: Beneish M-Score > -1.78 ─────────────────────────────────────────
  {
    const mScore = beneish?.mScore ?? null;
    const triggered = mScore !== null && mScore > -1.78;
    flags.push({
      id: 5,
      name: "Beneish M-Score Manipulation Signal",
      description:
        "M-Score above -1.78 indicates likely earnings manipulation.",
      severity: "critical",
      triggered,
      details:
        mScore === null
          ? "Beneish M-Score requires at least 2 years of data."
          : triggered
            ? `M-Score of ${mScore.toFixed(2)} exceeds the -1.78 threshold — classified as likely manipulator.`
            : `M-Score of ${mScore.toFixed(2)} is below -1.78 — manipulation unlikely.`,
      metric: mScore ?? undefined,
      threshold: -1.78,
    });
  }

  // ─── Flag 6: Benford Non-Conformity ──────────────────────────────────────────
  {
    const triggered = benford.chiSquared > 15.51;
    flags.push({
      id: 6,
      name: "Benford's Law Non-Conformity",
      description:
        "Chi-squared statistic >15.51 (p<0.05) indicates digit distribution anomaly.",
      severity: "warning",
      triggered,
      details: triggered
        ? `Chi-squared statistic is ${benford.chiSquared.toFixed(2)} (p=${benford.pValue.toFixed(4)}) — financial figures do not conform to Benford's Law. Sample size: ${benford.sampleSize}.`
        : `Chi-squared statistic is ${benford.chiSquared.toFixed(2)} (p=${benford.pValue.toFixed(4)}) — digit distribution conforms to Benford's Law.`,
      metric: benford.chiSquared,
      threshold: 15.51,
    });
  }

  // ─── Flag 7: DSO Increase > 20% YoY ─────────────────────────────────────────
  {
    const dsoYoY = getRatioYoY(ratios, "Days Sales Outstanding (DSO)");
    let triggered = false;
    let details = "Insufficient data for DSO trend analysis.";
    let metric: number | undefined;

    if (dsoYoY.length >= 2) {
      const dsoCurr = dsoYoY[dsoYoY.length - 1];
      const dsoPrev = dsoYoY[dsoYoY.length - 2];
      if (dsoPrev !== 0) {
        metric = (dsoCurr - dsoPrev) / Math.abs(dsoPrev);
        triggered = metric > 0.2;
        details = triggered
          ? `DSO increased ${(metric * 100).toFixed(1)}% YoY (from ${dsoPrev.toFixed(0)} to ${dsoCurr.toFixed(0)} days) — possible collection issues or channel stuffing.`
          : `DSO change of ${(metric * 100).toFixed(1)}% YoY is within normal range.`;
      }
    }

    flags.push({
      id: 7,
      name: "DSO Spike (>20% YoY)",
      description:
        "Days Sales Outstanding increased more than 20% year-over-year.",
      severity: "warning",
      triggered,
      details,
      metric,
      threshold: 0.2,
    });
  }

  // ─── Flag 8: Inventory Growth >> Revenue Growth ───────────────────────────────
  {
    let triggered = false;
    let details = "Insufficient data for comparison.";
    let metric: number | undefined;

    if (prev && prev.inventory !== 0 && prev.revenue !== 0) {
      const invGrowth =
        (curr.inventory - prev.inventory) / Math.abs(prev.inventory);
      const revGrowth = (curr.revenue - prev.revenue) / Math.abs(prev.revenue);
      metric = invGrowth - revGrowth;
      triggered = metric > 0.15;
      details = triggered
        ? `Inventory grew ${(invGrowth * 100).toFixed(1)}% vs. revenue growth of ${(revGrowth * 100).toFixed(1)}% — excess inventory build-up may signal slowing demand.`
        : `Inventory growth (${(invGrowth * 100).toFixed(1)}%) is in line with revenue growth (${(revGrowth * 100).toFixed(1)}%).`;
    }

    flags.push({
      id: 8,
      name: "Inventory Build-up vs. Revenue",
      description: "Inventory growing significantly faster than revenue.",
      severity: "warning",
      triggered,
      details,
      metric,
      threshold: 0.15,
    });
  }

  // ─── Flag 9: D/E > 2x Sector Benchmark ───────────────────────────────────────
  {
    const deRatio = getRatio(ratios, "Debt-to-Equity");
    const deBenchmark =
      ratios.find((r) => r.name === "Debt-to-Equity")?.benchmark ?? 1.0;
    const threshold = deBenchmark * 2;
    const triggered = deRatio > threshold;
    flags.push({
      id: 9,
      name: "Excessive Debt-to-Equity",
      description: "Debt-to-equity ratio exceeds 2x the sector benchmark.",
      severity: "critical",
      triggered,
      details: triggered
        ? `D/E ratio of ${deRatio.toFixed(2)} is more than 2x the sector benchmark of ${deBenchmark.toFixed(2)} — significantly overleveraged.`
        : `D/E ratio of ${deRatio.toFixed(2)} is within 2x of the sector benchmark (${deBenchmark.toFixed(2)}).`,
      metric: deRatio,
      threshold,
    });
  }

  // ─── Flag 10: Interest Coverage < 2x ─────────────────────────────────────────
  {
    const ic = getRatio(ratios, "Interest Coverage");
    const triggered = curr.interestExpense > 0 && ic < 2.0;
    flags.push({
      id: 10,
      name: "Low Interest Coverage",
      description:
        "Interest coverage ratio below 2x signals debt servicing risk.",
      severity: "critical",
      triggered,
      details:
        curr.interestExpense <= 0
          ? "No meaningful interest expense detected — flag not applicable."
          : triggered
            ? `Interest coverage of ${ic.toFixed(2)}x is below the 2.0x minimum threshold — debt servicing is at risk.`
            : `Interest coverage of ${ic.toFixed(2)}x is above the 2.0x threshold.`,
      metric: ic,
      threshold: 2.0,
    });
  }

  // ─── Flag 11: Negative Operating CF + Positive Net Income ────────────────────
  {
    const triggered = curr.operatingCashFlow < 0 && curr.netIncome > 0;
    flags.push({
      id: 11,
      name: "Negative Operating Cash Flow with Positive Net Income",
      description:
        "Positive net income not supported by operating cash flow — earnings quality concern.",
      severity: "critical",
      triggered,
      details: triggered
        ? `Operating CF is ${curr.operatingCashFlow.toLocaleString()} while net income is ${curr.netIncome.toLocaleString()} — net income is not being converted to cash.`
        : `Operating CF (${curr.operatingCashFlow.toLocaleString()}) is consistent with net income (${curr.netIncome.toLocaleString()}).`,
      metric: curr.operatingCashFlow,
      threshold: 0,
    });
  }

  // ─── Flag 12: Revenue Recognition Anomaly ────────────────────────────────────
  {
    let triggered = false;
    let details = "Insufficient data to detect revenue spikes.";
    let metric: number | undefined;

    if (stmts.length >= 3) {
      const revenueHistory = stmts.slice(0, -1).map((s) => s.revenue);
      const avgRevenue =
        revenueHistory.reduce((a, b) => a + b, 0) / revenueHistory.length;
      if (avgRevenue !== 0) {
        metric = (curr.revenue - avgRevenue) / Math.abs(avgRevenue);
        triggered = metric > 0.3;
        details = triggered
          ? `Current revenue is ${(metric * 100).toFixed(1)}% above the historical average — potential revenue recognition anomaly or one-time item.`
          : `Current revenue is ${(metric * 100).toFixed(1)}% vs. historical average — no unusual spike detected.`;
      }
    }

    flags.push({
      id: 12,
      name: "Revenue Recognition Anomaly",
      description:
        "Last year revenue spikes more than 30% above historical trend.",
      severity: "warning",
      triggered,
      details,
      metric,
      threshold: 0.3,
    });
  }

  // ─── Flag 13: Altman Z-Score < 1.81 ──────────────────────────────────────────
  {
    const zScore = getRatio(ratios, "Altman Z-Score");
    const triggered = zScore < 1.81;
    flags.push({
      id: 13,
      name: "Altman Z-Score in Distress Zone",
      description: "Altman Z-Score below 1.81 indicates financial distress.",
      severity: "critical",
      triggered,
      details: triggered
        ? `Altman Z-Score of ${zScore.toFixed(2)} is below 1.81 — company is in the distress zone with elevated bankruptcy risk.`
        : `Altman Z-Score of ${zScore.toFixed(2)} is above the 1.81 distress threshold.`,
      metric: zScore,
      threshold: 1.81,
    });
  }

  // ─── Flag 14: Earnings Quality < 0.5 ─────────────────────────────────────────
  {
    const eq = getRatio(ratios, "Earnings Quality");
    const triggered = curr.netIncome > 0 && eq < 0.5;
    flags.push({
      id: 14,
      name: "Low Earnings Quality",
      description:
        "Earnings quality ratio below 0.5 — less than half of net income backed by cash.",
      severity: "warning",
      triggered,
      details:
        curr.netIncome <= 0
          ? "Net income is not positive — earnings quality ratio not meaningful."
          : triggered
            ? `Earnings quality of ${eq.toFixed(2)} is below 0.5 — only ${(eq * 100).toFixed(0)}% of net income is backed by operating cash flow.`
            : `Earnings quality of ${eq.toFixed(2)} is acceptable — earnings are adequately supported by cash flow.`,
      metric: eq,
      threshold: 0.5,
    });
  }

  // ─── Flag 15: Asset Quality Deterioration (AQI > 1.2) ────────────────────────
  {
    const aqi =
      beneish?.variables.find((v) => v.abbreviation === "AQI")?.value ?? null;
    const triggered = aqi !== null && aqi > 1.2;
    flags.push({
      id: 15,
      name: "Asset Quality Deterioration",
      description:
        "Beneish AQI above 1.2 indicates growing intangible/off-balance-sheet assets.",
      severity: "warning",
      triggered,
      details:
        aqi === null
          ? "AQI requires at least 2 years of data."
          : triggered
            ? `AQI of ${aqi.toFixed(2)} exceeds 1.2 — non-physical asset proportion is increasing, which may signal capitalisation of expenses.`
            : `AQI of ${aqi.toFixed(2)} is below 1.2 — asset quality is stable.`,
      metric: aqi ?? undefined,
      threshold: 1.2,
    });
  }

  const triggeredCount = flags.filter((f) => f.triggered).length;
  const criticalCount = flags.filter(
    (f) => f.triggered && f.severity === "critical",
  ).length;
  const warningCount = flags.filter(
    (f) => f.triggered && f.severity === "warning",
  ).length;

  return { flags, triggeredCount, criticalCount, warningCount };
}
