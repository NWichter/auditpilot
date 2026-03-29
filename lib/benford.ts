import { jStat } from "jstat";
import type { FinancialData, BenfordResult, YearStatement } from "./types";

function extractNumericValues(statements: YearStatement[]): number[] {
  const values: number[] = [];
  for (const stmt of statements) {
    const fields: (keyof YearStatement)[] = [
      "revenue",
      "costOfRevenue",
      "grossProfit",
      "operatingExpenses",
      "operatingIncome",
      "interestExpense",
      "netIncome",
      "depreciation",
      "sgaExpenses",
      "ebitda",
      "cash",
      "accountsReceivable",
      "inventory",
      "currentAssets",
      "totalAssets",
      "ppe",
      "currentLiabilities",
      "longTermDebt",
      "totalLiabilities",
      "totalEquity",
      "operatingCashFlow",
      "investingCashFlow",
      "financingCashFlow",
      "capitalExpenditures",
    ];
    for (const field of fields) {
      const val = stmt[field] as number;
      if (typeof val === "number" && isFinite(val) && val !== 0) {
        values.push(Math.abs(val));
      }
    }
  }
  return values;
}

function getFirstDigit(n: number): number | null {
  if (!isFinite(n) || n === 0) return null;
  const abs = Math.abs(n);
  const str = abs.toExponential();
  const firstChar = str.replace(/^0\./, "").replace("-", "")[0];
  const digit = parseInt(firstChar, 10);
  if (digit >= 1 && digit <= 9) return digit;
  return null;
}

function benfordExpected(digit: number): number {
  return Math.log10(1 + 1 / digit);
}

export function analyzeBenford(data: FinancialData): BenfordResult {
  const values = extractNumericValues(data.statements);
  const digitCounts = new Array(9).fill(0);

  for (const val of values) {
    const d = getFirstDigit(val);
    if (d !== null) {
      digitCounts[d - 1]++;
    }
  }

  const sampleSize = digitCounts.reduce((a, b) => a + b, 0);

  const observed: number[] = digitCounts.map((c) =>
    sampleSize > 0 ? c / sampleSize : 0,
  );
  const expected: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(benfordExpected);

  let chiSquared = 0;
  for (let i = 0; i < 9; i++) {
    const expectedCount = expected[i] * sampleSize;
    if (expectedCount > 0) {
      chiSquared += Math.pow(digitCounts[i] - expectedCount, 2) / expectedCount;
    }
  }

  // Degrees of freedom = 8 (9 digits - 1)
  const pValue = sampleSize > 0 ? 1 - jStat.chisquare.cdf(chiSquared, 8) : 1;

  let verdict: BenfordResult["verdict"];
  if (pValue > 0.05) {
    verdict = "conforming";
  } else if (pValue > 0.01) {
    verdict = "suspicious";
  } else {
    verdict = "non_conforming";
  }

  return {
    observed,
    expected,
    chiSquared,
    pValue,
    verdict,
    sampleSize,
  };
}
